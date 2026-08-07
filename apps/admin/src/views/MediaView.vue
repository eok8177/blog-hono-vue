<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { api, ApiError } from '../api/client';
import { uploadMedia, cancelUpload, onUploadProgress, type UploadProgress } from '../api/media';
import AdminPagination from '../components/AdminPagination.vue';
import CatalogueIcon from '../components/CatalogueIcon.vue';

type Media = {
  id: string;
  alt_uk: string;
  alt_en: string | null;
  caption_uk: string | null;
  caption_en: string | null;
  credit: string | null;
  license: string | null;
  source_url: string | null;
  folder: string;
  width: number;
  height: number;
  status: string;
  updated_at: string;
};

const route = useRoute();
const file = ref<File>();
const altUk = ref('');
const uploadFolder = ref('');
const message = ref('');
const selectedId = ref<string>();
const folderFilter = ref('');
const mediaSearch = ref('');
const altFilter = ref(route.query.alt === 'missing' ? 'missing' : '');
const newFolderName = ref('');
const showNewFolderInput = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const batchFolder = ref('');
const activeMetadataLocale = ref<'uk' | 'en'>('uk');

const client = useQueryClient();

const folders = useQuery({
  queryKey: ['media-folders'],
  queryFn: () => api<{ folders: string[] }>('/media/folders'),
});

const mediaPage = ref(1);
const mediaPageSize = 20;
const media = useQuery({
  queryKey: computed(() => [
    'media',
    {
      q: mediaSearch.value,
      folder: folderFilter.value,
      alt: altFilter.value,
      page: mediaPage.value,
    },
  ]),
  queryFn: () => {
    const params: Record<string, string> = {
      page: String(mediaPage.value),
      pageSize: String(mediaPageSize),
    };
    if (mediaSearch.value) params.q = mediaSearch.value;
    if (folderFilter.value) params.folder = folderFilter.value;
    if (altFilter.value) params.alt = altFilter.value;
    const qs = Object.entries(params)
      .map(([key, value]) => `${key}=${window.encodeURIComponent(value)}`)
      .join('&');
    return api<{ items: Media[]; total: number }>(`/media${qs ? `?${qs}` : ''}`);
  },
});

const items = computed(() => media.data.value?.items ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((media.data.value?.total ?? 0) / mediaPageSize)),
);

const form = reactive({
  altUk: '',
  altEn: '',
  captionUk: '',
  captionEn: '',
  credit: '',
  license: '',
  sourceUrl: '',
  folder: '',
  version: '',
});

const uploadProgress = ref<UploadProgress | null>(null);
const keepOriginal = ref(false);

const upload = useMutation({
  mutationFn: async () => {
    if (!file.value) throw new Error('Оберіть файл.');
    uploadProgress.value = null;
    const unsub = onUploadProgress((p) => {
      uploadProgress.value = p;
    });
    try {
      return await uploadMedia(
        file.value,
        altUk.value,
        uploadFolder.value || folderFilter.value,
        keepOriginal.value,
      );
    } finally {
      unsub();
    }
  },
  onSuccess: async () => {
    file.value = undefined;
    altUk.value = '';
    keepOriginal.value = false;
    window.setTimeout(() => {
      uploadProgress.value = null;
    }, 3000);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['media'] }),
      client.invalidateQueries({ queryKey: ['media-folders'] }),
    ]);
  },
  onError: (e) => {
    if (e instanceof window.DOMException && e.name === 'AbortError') {
      // Cancelled by user – keep UI clean
    } else {
      message.value = e instanceof Error ? e.message : 'Upload не вдався.';
    }
  },
});

function retry() {
  uploadProgress.value = null;
  message.value = '';
  upload.mutate();
}

function selected(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0];
}

function edit(item: Media) {
  selectedId.value = item.id;
  Object.assign(form, {
    altUk: item.alt_uk,
    altEn: item.alt_en ?? '',
    captionUk: item.caption_uk ?? '',
    captionEn: item.caption_en ?? '',
    credit: item.credit ?? '',
    license: item.license ?? '',
    sourceUrl: item.source_url ?? '',
    folder: item.folder ?? '',
    version: item.updated_at,
  });
}

const save = useMutation({
  mutationFn: () =>
    api(selectedId.value ? `/media/${selectedId.value}` : '', {
      method: 'PUT',
      body: JSON.stringify(form),
    }),
  onSuccess: async () => {
    message.value = 'Metadata оновлено.';
    selectedId.value = undefined;
    await Promise.all([
      client.invalidateQueries({ queryKey: ['media'] }),
      client.invalidateQueries({ queryKey: ['media-folders'] }),
    ]);
  },
  onError: (e) => {
    message.value = e instanceof ApiError ? e.message : 'Не вдалося оновити metadata.';
  },
});

async function remove(item: Media) {
  if (!confirm(`Повністю видалити «${item.alt_uk}» разом із R2-файлами?`)) return;
  try {
    await api(`/media/${item.id}`, { method: 'DELETE' });
    message.value = 'Файл повністю видалено.';
    selectedIds.value.delete(item.id);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['media'] }),
      client.invalidateQueries({ queryKey: ['media-folders'] }),
    ]);
  } catch (e) {
    message.value = e instanceof ApiError ? e.message : 'Не вдалося повністю видалити файл.';
  }
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  selectedIds.value = next;
}

function selectCardFromKeyboard(event: Event, id: string) {
  if (event.target !== event.currentTarget) return;
  const key = (event as { key?: string }).key;
  if (key !== 'Enter' && key !== ' ') return;
  event.preventDefault();
  toggleSelect(id);
}

function selectAll() {
  if (selectedIds.value.size === items.value.length) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(items.value.map((i) => i.id));
  }
}

const batchMove = useMutation({
  mutationFn: () =>
    api('/media/batch/move', {
      method: 'PATCH',
      body: JSON.stringify({ ids: [...selectedIds.value], folder: batchFolder.value }),
    }),
  onSuccess: async () => {
    message.value = `Переміщено ${selectedIds.value.size} файл(ів) до «${batchFolder.value || '(без папки)'}».`;
    selectedIds.value = new Set();
    batchFolder.value = '';
    await Promise.all([
      client.invalidateQueries({ queryKey: ['media'] }),
      client.invalidateQueries({ queryKey: ['media-folders'] }),
    ]);
  },
  onError: (e) => {
    message.value = e instanceof ApiError ? e.message : 'Не вдалося перемістити файли.';
  },
});

async function createFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;
  // Creating a folder is implicit — just move something there or it shows up after first use.
  // But we can also just add it to the filter list by setting folderFilter.
  folderFilter.value = name;
  newFolderName.value = '';
  showNewFolderInput.value = false;
}

watch([folderFilter, mediaSearch, altFilter], () => {
  selectedIds.value = new Set();
  mediaPage.value = 1;
});
</script>

<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Файли та зображення</p>
        <h1>Медіатека</h1>
        <p>Завантажуйте WebP variants та керуйте описами зображень.</p>
      </div>
    </div>

    <!-- Folder toolbar -->
    <div class="admin-folder-toolbar admin-media-toolbar">
      <label class="admin-search"
        ><span class="sr-only">Пошук медіа</span><CatalogueIcon name="search" /><input
          v-model="mediaSearch"
          type="search"
          placeholder="Alt або підпис"
      /></label>
      <label class="admin-filter media-alt-filter"
        >Alt<select v-model="altFilter">
          <option value="">Усі описи</option>
          <option value="missing">Без українського alt</option>
        </select></label
      >
      <div class="admin-folder-tabs">
        <button
          type="button"
          class="admin-folder-tab"
          :class="{ 'admin-folder-tab-active': !folderFilter }"
          @click="folderFilter = ''"
        >
          Усі
        </button>
        <button
          v-for="f in folders.data.value?.folders ?? []"
          :key="f"
          type="button"
          class="admin-folder-tab"
          :class="{ 'admin-folder-tab-active': folderFilter === f }"
          @click="folderFilter = f"
        >
          {{ f }}
        </button>
      </div>
      <button
        type="button"
        class="admin-secondary-button"
        @click="showNewFolderInput = !showNewFolderInput"
      >
        <CatalogueIcon name="folder" /> Папка
      </button>
    </div>
    <form v-if="showNewFolderInput" class="admin-inline-form" @submit.prevent="createFolder">
      <label class="admin-inline-label">
        Назва папки
        <input v-model="newFolderName" placeholder="Нова папка" maxlength="200" />
      </label>
      <button type="submit">Створити</button>
      <button type="button" class="admin-secondary-button" @click="showNewFolderInput = false">
        Скасувати
      </button>
    </form>

    <!-- Batch actions -->
    <div v-if="selectedIds.size > 0" class="admin-batch-bar">
      <span>Вибрано: {{ selectedIds.size }}</span>
      <select v-model="batchFolder" class="admin-inline-select">
        <option value="">(без папки)</option>
        <option v-for="f in folders.data.value?.folders ?? []" :key="f" :value="f">{{ f }}</option>
      </select>
      <button :disabled="batchMove.isPending.value" @click="batchMove.mutate()">
        {{ batchMove.isPending.value ? 'Переміщення…' : 'Перемістити' }}
      </button>
      <button type="button" class="admin-secondary-button" @click="selectedIds = new Set()">
        Скасувати
      </button>
    </div>

    <!-- Upload form -->
    <form class="admin-upload-card" @submit.prevent="upload.mutate()">
      <div class="admin-upload-heading">
        <div class="admin-upload-icon" aria-hidden="true"><CatalogueIcon name="photo" /></div>
        <div>
          <h2>Додати зображення</h2>
          <p>JPEG, PNG або WebP. Варіанти створюються автоматично.</p>
        </div>
      </div>
      <div class="admin-upload-fields">
        <label class="admin-file-input"
          >Вибрати файл<input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required
            :disabled="upload.isPending.value"
            @change="selected"
        /></label>
        <label class="admin-upload-alt"
          >Alt українською<input v-model="altUk" required placeholder="Опишіть зображення"
        /></label>
        <label class="admin-upload-folder"
          >Папка
          <input
            v-model="uploadFolder"
            placeholder="або тека"
            :list="'folder-options'"
            maxlength="200"
          />
          <datalist id="folder-options">
            <option v-for="f in folders.data.value?.folders ?? []" :key="f" :value="f" />
          </datalist>
        </label>
      </div>
      <div class="admin-upload-footer">
        <label class="admin-checkbox">
          <input v-model="keepOriginal" type="checkbox" :disabled="upload.isPending.value" />
          Зберегти оригінал
        </label>

        <!-- Progress bar -->
        <div v-if="uploadProgress" class="admin-upload-progress">
          <div class="admin-progress-bar">
            <span
              class="admin-progress-fill"
              :class="{
                'admin-progress-error': uploadProgress.stage === 'error',
                'admin-progress-done': uploadProgress.stage === 'done',
              }"
              :style="{ width: uploadProgress.percent + '%' }"
            />
          </div>
          <p class="admin-progress-label">{{ uploadProgress.message }}</p>
        </div>

        <div class="admin-upload-actions">
          <button
            v-if="uploadProgress?.stage === 'converting' || uploadProgress?.stage === 'uploading'"
            type="button"
            class="admin-secondary-button"
            @click="cancelUpload()"
          >
            Скасувати
          </button>

          <button
            v-if="uploadProgress?.stage === 'error'"
            type="button"
            class="button"
            @click="retry"
          >
            Повторити
          </button>

          <button
            v-else-if="
              uploadProgress?.stage !== 'converting' && uploadProgress?.stage !== 'uploading'
            "
            :disabled="upload.isPending.value"
          >
            {{ upload.isPending.value ? 'Конвертація…' : 'Завантажити' }}
          </button>
        </div>
      </div>
    </form>

    <p v-if="message" role="status" aria-live="polite">{{ message }}</p>

    <!-- Edit metadata form -->
    <form v-if="selectedId" class="admin-editor-form" @submit.prevent="save.mutate()">
      <div class="admin-form-heading">
        <div>
          <p class="admin-eyebrow">Metadata</p>
          <h2>Редагування зображення</h2>
        </div>
        <button
          type="button"
          class="admin-close-button"
          aria-label="Закрити редактор метаданих"
          @click="selectedId = undefined"
        >
          <CatalogueIcon name="close" />
        </button>
      </div>
      <section class="admin-language-section" aria-label="Мовні метадані зображення">
        <div class="admin-language-tabs" role="tablist" aria-label="Мова метаданих">
          <button
            id="media-locale-uk-tab"
            class="admin-language-tab"
            :class="{ 'admin-language-tab-active': activeMetadataLocale === 'uk' }"
            type="button"
            role="tab"
            :aria-selected="activeMetadataLocale === 'uk'"
            aria-controls="media-locale-uk-panel"
            @click="activeMetadataLocale = 'uk'"
          >
            Українська
          </button>
          <button
            id="media-locale-en-tab"
            class="admin-language-tab"
            :class="{ 'admin-language-tab-active': activeMetadataLocale === 'en' }"
            type="button"
            role="tab"
            :aria-selected="activeMetadataLocale === 'en'"
            aria-controls="media-locale-en-panel"
            @click="activeMetadataLocale = 'en'"
          >
            English
          </button>
        </div>
        <div
          id="media-locale-uk-panel"
          v-show="activeMetadataLocale === 'uk'"
          class="admin-language-panel"
          role="tabpanel"
          aria-labelledby="media-locale-uk-tab"
        >
          <label>Alt українською <input v-model="form.altUk" required /></label>
          <label>Підпис <input v-model="form.captionUk" /></label>
        </div>
        <div
          id="media-locale-en-panel"
          v-show="activeMetadataLocale === 'en'"
          class="admin-language-panel"
          role="tabpanel"
          aria-labelledby="media-locale-en-tab"
        >
          <label>Alt English <input v-model="form.altEn" /></label>
          <label>Caption <input v-model="form.captionEn" /></label>
        </div>
      </section>
      <fieldset class="admin-editor-section admin-media-details">
        <legend>Джерело та права</legend>
        <label>Credit <input v-model="form.credit" /></label>
        <label>License <input v-model="form.license" /></label>
        <label>Source URL <input v-model="form.sourceUrl" type="url" /></label>
        <label
          >Папка
          <input
            v-model="form.folder"
            :list="'edit-folder-options'"
            placeholder="(без папки)"
            maxlength="200"
          />
          <datalist id="edit-folder-options">
            <option v-for="f in folders.data.value?.folders ?? []" :key="f" :value="f" />
          </datalist>
        </label>
      </fieldset>
      <div class="admin-editor-actions">
        <div class="admin-editor-actions-buttons">
          <button :disabled="save.isPending.value">
            {{ save.isPending.value ? 'Збереження…' : 'Зберегти metadata' }}</button
          ><button type="button" class="admin-secondary-button" @click="selectedId = undefined">
            Скасувати
          </button>
        </div>
      </div>
    </form>

    <!-- State messages -->
    <p v-if="media.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="media.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити медіатеку.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Медіафайлів ще немає.</p>

    <!-- Select all bar -->
    <div v-else class="admin-select-all-bar">
      <label class="admin-checkbox">
        <input type="checkbox" :checked="selectedIds.size === items.length" @change="selectAll" />
        Вибрати всі
      </label>
    </div>

    <!-- Media grid -->
    <div v-if="items.length" class="admin-media-grid">
      <article
        v-for="item in items"
        :key="item.id"
        class="admin-media-card"
        :class="{ 'admin-media-card-selected': selectedIds.has(item.id) }"
        role="group"
        tabindex="0"
        :aria-label="`Медіафайл ${item.alt_uk || item.id.slice(0, 8)}`"
        @keydown="selectCardFromKeyboard($event, item.id)"
      >
        <div class="admin-media-preview">
          <img
            :src="`/media/${item.id}/480`"
            :alt="item.alt_uk"
            width="480"
            height="320"
            loading="lazy"
          />
          <span v-if="item.folder" class="admin-folder-badge">{{ item.folder }}</span>
        </div>
        <div class="admin-media-info">
          <label class="media-select"
            ><input
              type="checkbox"
              :checked="selectedIds.has(item.id)"
              :aria-label="`Вибрати ${item.alt_uk || 'медіафайл'}`"
              @click.stop
              @keydown.stop
              @change="toggleSelect(item.id)"
            />
            Вибрати</label
          >
          <strong>{{ item.alt_uk || 'Без українського alt' }}</strong>
          <div class="media-alt-status">
            <span :class="item.alt_uk.trim() ? 'media-alt-ready' : 'media-alt-missing'"
              >UK: {{ item.alt_uk.trim() ? 'alt є' : 'alt порожній' }}</span
            ><span :class="item.alt_en?.trim() ? 'media-alt-ready' : 'media-alt-missing'"
              >EN: {{ item.alt_en?.trim() ? 'alt є' : 'alt порожній' }}</span
            >
          </div>
          <span
            >#{{ item.id.slice(0, 8) }} · {{ item.width }}×{{ item.height }} · {{ item.status }} ·
            {{ new Date(item.updated_at).toLocaleDateString('uk-UA')
            }}<template v-if="item.folder"> · {{ item.folder }}</template></span
          >
        </div>
        <div class="admin-media-actions" @click.stop @keydown.stop>
          <button type="button" class="admin-secondary-button" @click="edit(item)">
            Редагувати</button
          ><button type="button" class="admin-danger-button" @click="remove(item)">Видалити</button>
        </div>
      </article>
    </div>
    <AdminPagination
      :page="mediaPage"
      :total-pages="totalPages"
      @update:page="mediaPage = $event"
    />
  </section>
</template>
