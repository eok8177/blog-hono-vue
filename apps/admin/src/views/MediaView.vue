<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
import { uploadMedia } from '../api/media';

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

const file = ref<File>();
const altUk = ref('');
const uploadFolder = ref('');
const message = ref('');
const selectedId = ref<string>();
const folderFilter = ref('');
const newFolderName = ref('');
const showNewFolderInput = ref(false);
const selectedIds = ref<Set<string>>(new Set());
const batchFolder = ref('');

const client = useQueryClient();

const folders = useQuery({
  queryKey: ['media-folders'],
  queryFn: () => api<{ folders: string[] }>('/media/folders'),
});

const media = useQuery({
  queryKey: ['media', { folder: folderFilter }],
  queryFn: () => {
    const params = new URLSearchParams();
    if (folderFilter.value) params.set('folder', folderFilter.value);
    params.set('pageSize', '100');
    const qs = params.toString();
    return api<{ items: Media[] }>(`/media${qs ? `?${qs}` : ''}`);
  },
});

const items = computed(() => media.data.value?.items ?? []);

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

const upload = useMutation({
  mutationFn: () => {
    if (!file.value) throw new Error('Оберіть файл.');
    return uploadMedia(file.value, altUk.value, uploadFolder.value || folderFilter.value);
  },
  onSuccess: async () => {
    message.value = 'Файл завантажено.';
    file.value = undefined;
    altUk.value = '';
    await Promise.all([
      client.invalidateQueries({ queryKey: ['media'] }),
      client.invalidateQueries({ queryKey: ['media-folders'] }),
    ]);
  },
  onError: (e) => {
    message.value = e instanceof Error ? e.message : 'Upload не вдався.';
  },
});

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

watch(folderFilter, () => {
  selectedIds.value = new Set();
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
    <div class="admin-folder-toolbar">
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
        + Папка
      </button>
    </div>
    <form
      v-if="showNewFolderInput"
      class="admin-inline-form"
      @submit.prevent="createFolder"
    >
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
      <button
        type="button"
        class="admin-secondary-button"
        @click="selectedIds = new Set()"
      >
        Скасувати
      </button>
    </div>

    <!-- Upload form -->
    <form class="admin-upload-card" @submit.prevent="upload.mutate()">
      <div class="admin-upload-icon">↑</div>
      <div>
        <h2>Додати зображення</h2>
        <p>JPEG, PNG або WebP. Варіанти створюються автоматично.</p>
      </div>
      <label class="admin-file-input"
        >Вибрати файл<input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
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
      <button :disabled="upload.isPending.value">
        {{ upload.isPending.value ? 'Підготовка…' : 'Завантажити' }}
      </button>
    </form>

    <p v-if="message" role="status" aria-live="polite">{{ message }}</p>

    <!-- Edit metadata form -->
    <form v-if="selectedId" class="admin-editor-form" @submit.prevent="save.mutate()">
      <div class="admin-form-heading">
        <div>
          <p class="admin-eyebrow">Metadata</p>
          <h2>Редагування зображення</h2>
        </div>
        <button type="button" class="admin-close-button" @click="selectedId = undefined">×</button>
      </div>
      <div class="admin-form-grid">
        <label>Alt українською <input v-model="form.altUk" required /></label
        ><label>Alt English <input v-model="form.altEn" /></label
        ><label>Credit <input v-model="form.credit" /></label
        ><label>License <input v-model="form.license" /></label
        ><label>Caption <input v-model="form.captionUk" /></label
        ><label>Source URL <input v-model="form.sourceUrl" type="url" /></label
        ><label
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
      </div>
      <div class="admin-form-actions">
        <button :disabled="save.isPending.value">
          {{ save.isPending.value ? 'Збереження…' : 'Зберегти metadata' }}</button
        ><button type="button" class="admin-secondary-button" @click="selectedId = undefined">
          Скасувати
        </button>
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
        @click="toggleSelect(item.id)"
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
          <strong>{{ item.alt_uk }}</strong
          ><span>{{ item.width }}×{{ item.height }} · {{ item.status }}</span>
        </div>
        <div class="admin-media-actions" @click.stop>
          <button type="button" class="admin-secondary-button" @click="edit(item)">
            Редагувати</button
          ><button type="button" class="admin-danger-button" @click="remove(item)">Видалити</button>
        </div>
      </article>
    </div>
  </section>
</template>
