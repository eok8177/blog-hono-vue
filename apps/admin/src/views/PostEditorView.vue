<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';
const route = useRoute(),
  router = useRouter(),
  id = typeof route.params.id === 'string' ? route.params.id : undefined;
const form = reactive({
  slug: '',
  titleUk: '',
  titleEn: '',
  bodyMdUk: '',
  bodyMdEn: '',
  status: 'draft',
  isEnPublished: false,
  categoryIds: [] as string[],
  mediaIds: [] as string[],
  version: '',
});
const error = ref('');
const saving = ref(false);
const loading = ref(Boolean(id));
type StoredPost = {
  slug: string;
  title_uk: string;
  title_en: string | null;
  body_md_uk: string;
  body_md_en: string | null;
  status: string;
  is_en_published: number;
  updated_at: string;
  mediaIds: string[];
};
type Media = { id: string; alt_uk: string; status: string };
const availableMedia = ref<Media[]>([]);
onMounted(async () => {
  try {
    const media = await api<{ items: Media[] }>('/media');
    availableMedia.value = media.items.filter((item) => item.status === 'ready');
    if (!id) return;
    const post = await api<StoredPost>(`/posts/${id}`);
    Object.assign(form, {
      slug: post.slug,
      titleUk: post.title_uk,
      titleEn: post.title_en ?? '',
      bodyMdUk: post.body_md_uk,
      bodyMdEn: post.body_md_en ?? '',
      status: post.status,
      isEnPublished: Boolean(post.is_en_published),
      mediaIds: post.mediaIds,
      version: post.updated_at,
    });
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не вдалося завантажити матеріал.';
  } finally {
    loading.value = false;
  }
});
async function save() {
  saving.value = true;
  error.value = '';
  try {
    const path = id ? `/posts/${id}` : '/posts';
    await api(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await router.push('/posts');
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Помилка збереження';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <section>
    <h1>{{ id ? 'Редагування' : 'Нова публікація' }}</h1>
    <p v-if="loading">Завантаження…</p>
    <form v-else @submit.prevent="save">
      <p v-if="error" role="alert">{{ error }}</p>
      <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label
      ><label>Український заголовок <input v-model="form.titleUk" required /></label
      ><label>Український текст <textarea v-model="form.bodyMdUk" required rows="12" /></label>
      <fieldset>
        <legend>English</legend>
        <label>Title <input v-model="form.titleEn" /></label
        ><label>Body <textarea v-model="form.bodyMdEn" rows="8" /></label
        ><label><input v-model="form.isEnPublished" type="checkbox" /> Опублікувати English</label>
      </fieldset>
      <fieldset>
        <legend>Галерея</legend>
        <p v-if="!availableMedia.length">Спочатку завантажте зображення в Медіатеці.</p>
        <label v-for="media in availableMedia" :key="media.id"
          ><input v-model="form.mediaIds" type="checkbox" :value="media.id" />
          {{ media.alt_uk }}</label
        >
      </fieldset>
      <label
        >Статус
        <select v-model="form.status">
          <option>draft</option>
          <option>published</option>
          <option>archived</option>
        </select></label
      ><button :disabled="saving">{{ saving ? 'Збереження…' : 'Зберегти' }}</button
      ><a
        v-if="id"
        class="button"
        :href="`/api/admin/posts/${id}/preview`"
        target="_blank"
        rel="noopener"
        >Preview</a
      >
    </form>
  </section>
</template>
