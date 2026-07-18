<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';

const route = useRoute();
const router = useRouter();
const id = typeof route.params.id === 'string' ? route.params.id : undefined;
const form = reactive({
  slug: '',
  titleUk: '',
  titleEn: '',
  excerptUk: '',
  excerptEn: '',
  bodyMdUk: '',
  bodyMdEn: '',
  status: 'draft',
  isEnPublished: false,
  seoTitleUk: '',
  seoTitleEn: '',
  seoDescriptionUk: '',
  seoDescriptionEn: '',
  categoryIds: [] as string[],
  mediaIds: [] as string[],
  version: '',
});
const error = ref('');
const saving = ref(false);
const loading = ref(Boolean(id));
const dirty = ref(false);
type StoredPost = {
  slug: string;
  title_uk: string;
  title_en: string | null;
  excerpt_uk: string | null;
  excerpt_en: string | null;
  body_md_uk: string;
  body_md_en: string | null;
  seo_title_uk: string | null;
  seo_title_en: string | null;
  seo_description_uk: string | null;
  seo_description_en: string | null;
  status: string;
  is_en_published: number;
  updated_at: string;
  mediaIds: string[];
  categoryIds: string[];
};
type Media = { id: string; alt_uk: string; status: string };
type Category = { id: string; title_uk: string; status: string };
const availableMedia = ref<Media[]>([]);
const availableCategories = ref<Category[]>([]);

onMounted(async () => {
  try {
    const [media, categories] = await Promise.all([
      api<{ items: Media[] }>('/media'),
      api<{ items: Category[] }>('/categories'),
    ]);
    availableMedia.value = media.items.filter((item) => item.status === 'ready');
    availableCategories.value = categories.items.filter((item) => item.status !== 'archived');
    if (!id) return;
    const post = await api<StoredPost>(`/posts/${id}`);
    Object.assign(form, {
      slug: post.slug,
      titleUk: post.title_uk,
      titleEn: post.title_en ?? '',
      excerptUk: post.excerpt_uk ?? '',
      excerptEn: post.excerpt_en ?? '',
      bodyMdUk: post.body_md_uk,
      bodyMdEn: post.body_md_en ?? '',
      status: post.status,
      isEnPublished: Boolean(post.is_en_published),
      seoTitleUk: post.seo_title_uk ?? '',
      seoTitleEn: post.seo_title_en ?? '',
      seoDescriptionUk: post.seo_description_uk ?? '',
      seoDescriptionEn: post.seo_description_en ?? '',
      mediaIds: post.mediaIds,
      categoryIds: post.categoryIds,
      version: post.updated_at,
    });
    dirty.value = false;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не вдалося завантажити матеріал.';
  } finally {
    loading.value = false;
  }
});
watch(
  form,
  () => {
    if (!loading.value) dirty.value = true;
  },
  { deep: true },
);
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault();
}
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
async function save() {
  saving.value = true;
  error.value = '';
  try {
    await api(id ? `/posts/${id}` : '/posts', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    });
    dirty.value = false;
    await router.push('/posts');
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === 'CONFLICT'
        ? 'Матеріал змінив інший редактор. Перечитайте версію перед збереженням.'
        : e instanceof ApiError
          ? e.message
          : 'Помилка збереження';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Контент / Публікація</p>
        <h1>{{ id ? 'Редагування публікації' : 'Нова публікація' }}</h1>
        <p>Заповніть українську версію, переклад, SEO та медіа.</p>
      </div>
      <RouterLink class="admin-secondary-button button" to="/posts">← До списку</RouterLink>
    </div>
    <p v-if="loading" class="admin-state">Завантаження…</p>
    <form v-else class="admin-editor-form" @submit.prevent="save">
      <p v-if="error" role="alert">{{ error }}</p>
      <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label>
      <label>Український заголовок <input v-model="form.titleUk" required /></label>
      <label>Короткий вступ <textarea v-model="form.excerptUk" rows="3" /></label>
      <label>Український текст <textarea v-model="form.bodyMdUk" required rows="12" /></label>
      <fieldset>
        <legend>English</legend>
        <label>Title <input v-model="form.titleEn" /></label>
        <label>Excerpt <textarea v-model="form.excerptEn" rows="3" /></label>
        <label>Body <textarea v-model="form.bodyMdEn" rows="8" /></label>
        <label><input v-model="form.isEnPublished" type="checkbox" /> Опублікувати English</label>
      </fieldset>
      <fieldset>
        <legend>Категорії</legend>
        <p v-if="!availableCategories.length">Категорій ще немає.</p>
        <label v-for="category in availableCategories" :key="category.id"
          ><input v-model="form.categoryIds" type="checkbox" :value="category.id" />
          {{ category.title_uk }}</label
        >
      </fieldset>
      <fieldset>
        <legend>SEO</legend>
        <label>SEO title <input v-model="form.seoTitleUk" /></label>
        <label>SEO description <textarea v-model="form.seoDescriptionUk" rows="3" /></label>
        <label>SEO title English <input v-model="form.seoTitleEn" /></label>
        <label>SEO description English <textarea v-model="form.seoDescriptionEn" rows="3" /></label>
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
        </select></label
      >
      <button :disabled="saving">{{ saving ? 'Збереження…' : 'Зберегти' }}</button>
      <a
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
