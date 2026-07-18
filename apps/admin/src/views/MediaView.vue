<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
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
  width: number;
  height: number;
  status: string;
  updated_at: string;
};
const file = ref<File>();
const altUk = ref('');
const message = ref('');
const selectedId = ref<string>();
const client = useQueryClient();
const media = useQuery({ queryKey: ['media'], queryFn: () => api<{ items: Media[] }>('/media') });
const items = computed(() => media.data.value?.items ?? []);
const form = reactive({
  altUk: '',
  altEn: '',
  captionUk: '',
  captionEn: '',
  credit: '',
  license: '',
  sourceUrl: '',
  version: '',
});
const upload = useMutation({
  mutationFn: () => {
    if (!file.value) throw new Error('Оберіть файл.');
    return uploadMedia(file.value, altUk.value);
  },
  onSuccess: async () => {
    message.value = 'Файл завантажено.';
    file.value = undefined;
    altUk.value = '';
    await client.invalidateQueries({ queryKey: ['media'] });
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
    await client.invalidateQueries({ queryKey: ['media'] });
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
    await client.invalidateQueries({ queryKey: ['media'] });
  } catch (e) {
    message.value = e instanceof ApiError ? e.message : 'Не вдалося повністю видалити файл.';
  }
}
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
          @change="selected" /></label
      ><label class="admin-upload-alt"
        >Alt українською<input v-model="altUk" required placeholder="Опишіть зображення" /></label
      ><button :disabled="upload.isPending.value">
        {{ upload.isPending.value ? 'Підготовка…' : 'Завантажити' }}
      </button>
    </form>
    <p v-if="message" role="status" aria-live="polite">{{ message }}</p>
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
        ><label>Source URL <input v-model="form.sourceUrl" type="url" /></label>
      </div>
      <div class="admin-form-actions">
        <button :disabled="save.isPending.value">
          {{ save.isPending.value ? 'Збереження…' : 'Зберегти metadata' }}</button
        ><button type="button" class="admin-secondary-button" @click="selectedId = undefined">
          Скасувати
        </button>
      </div>
    </form>
    <p v-if="media.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="media.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити медіатеку.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Медіафайлів ще немає.</p>
    <div v-else class="admin-media-grid">
      <article v-for="item in items" :key="item.id" class="admin-media-card">
        <div class="admin-media-preview">
          <img
            :src="`/media/${item.id}/480`"
            :alt="item.alt_uk"
            width="480"
            height="320"
            loading="lazy"
          />
        </div>
        <div class="admin-media-info">
          <strong>{{ item.alt_uk }}</strong
          ><span>{{ item.width }}×{{ item.height }} · {{ item.status }}</span>
        </div>
        <div class="admin-media-actions">
          <button type="button" class="admin-secondary-button" @click="edit(item)">
            Редагувати</button
          ><button type="button" class="admin-danger-button" @click="remove(item)">Видалити</button>
        </div>
      </article>
    </div>
  </section>
</template>
