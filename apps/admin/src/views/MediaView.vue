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
const isLoading = computed(() => media.isPending.value);
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
const isUploading = computed(() => upload.isPending.value);
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
    <h1>Медіатека</h1>
    <form @submit.prevent="upload.mutate()">
      <label
        >Зображення
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          @change="selected" /></label
      ><label>Alt українською <input v-model="altUk" required /></label
      ><button :disabled="isUploading">
        {{ isUploading ? 'Підготовка й upload…' : 'Завантажити' }}
      </button>
    </form>
    <p aria-live="polite">{{ message }}</p>
    <form v-if="selectedId" @submit.prevent="save.mutate()">
      <h2>Редагування metadata</h2>
      <label>Alt українською <input v-model="form.altUk" required /></label
      ><label>Alt English <input v-model="form.altEn" /></label
      ><label>Caption <input v-model="form.captionUk" /></label
      ><label>Credit <input v-model="form.credit" /></label
      ><label>License <input v-model="form.license" /></label
      ><label>Source URL <input v-model="form.sourceUrl" type="url" /></label
      ><button>Зберегти metadata</button
      ><button type="button" @click="selectedId = undefined">Скасувати</button>
    </form>
    <p v-if="isLoading">Завантаження…</p>
    <div v-else class="grid">
      <article v-for="item in items" :key="item.id">
        <img
          :src="`/media/${item.id}/480`"
          :alt="item.alt_uk"
          width="480"
          height="320"
          loading="lazy"
        />
        <p>{{ item.alt_uk }} · {{ item.width }}×{{ item.height }}</p>
        <button @click="edit(item)">Редагувати</button>
        <button @click="remove(item)">Видалити назавжди</button>
      </article>
    </div>
  </section>
</template>
