<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { useRoute } from 'vue-router';
import { api, ApiError } from '../api/client';
import AdminPagination from '../components/AdminPagination.vue';
import ActionMenu from '../components/ActionMenu.vue';
import CatalogueIcon from '../components/CatalogueIcon.vue';

type Post = {
  id: string;
  slug: string;
  title_uk: string;
  title_en: string | null;
  status: 'draft' | 'published' | 'archived';
  is_en_published: number | boolean;
  updated_at: string;
  category_title: string | null;
  category_count: number;
};
type Category = { id: string; title_uk: string; status: string };
const route = useRoute();
const queryValue = (name: string) =>
  typeof route.query[name] === 'string' ? (route.query[name] as string) : '';
const q = ref(queryValue('q'));
const status = ref(queryValue('status'));
const category = ref(queryValue('category'));
const translation = ref(queryValue('translation'));
const seo = ref(queryValue('seo'));
const sort = ref('updated');
const page = ref(1);
const pageSize = 10;
const error = ref('');
const client = useQueryClient();
const categories = useQuery({
  queryKey: ['post-filter-categories'],
  queryFn: () => api<{ items: Category[] }>('/categories?page=1&pageSize=100'),
});
const key = computed(() => [
  'posts',
  {
    q: q.value,
    status: status.value,
    category: category.value,
    translation: translation.value,
    seo: seo.value,
    sort: sort.value,
    page: page.value,
  },
]);
const posts = useQuery({
  queryKey: key,
  queryFn: () => {
    const params: Record<string, string> = {
      page: String(page.value),
      pageSize: String(pageSize),
      sort: sort.value,
    };
    if (q.value) params.q = q.value;
    if (status.value) params.status = status.value;
    if (category.value) params.category = category.value;
    if (translation.value) params.translation = translation.value;
    if (seo.value) params.seo = seo.value;
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${window.encodeURIComponent(value)}`)
      .join('&');
    return api<{ items: Post[]; total: number }>(`/posts?${query}`);
  },
});
const data = computed(() => posts.data.value);
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / pageSize)));
const activeCount = computed(
  () =>
    [q.value, status.value, category.value, translation.value, seo.value].filter(Boolean).length,
);
watch([q, status, category, translation, seo, sort], () => {
  page.value = 1;
});
function statusLabel(value: string) {
  return { published: 'Опубліковано', draft: 'Чернетка', archived: 'Архівовано' }[value] ?? value;
}
function spineClass(post: Post) {
  if (post.status === 'archived') return 'spine-archived';
  if (post.status === 'draft' || !post.is_en_published) return 'spine-attention';
  return 'spine-published';
}
function clearFilters() {
  q.value = '';
  status.value = '';
  category.value = '';
  translation.value = '';
  seo.value = '';
  sort.value = 'updated';
}
async function remove(post: Post) {
  if (!confirm(`Повністю видалити публікацію «${post.title_uk}»? Цю дію неможливо скасувати.`))
    return;
  error.value = '';
  try {
    await api(`/posts/${post.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['posts'] });
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Не вдалося повністю видалити публікацію.';
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Реєстр колекції</p>
        <h1>Публікації</h1>
        <p>Редакційний стан, переклад і остання інвентаризація матеріалів.</p>
      </div>
      <RouterLink class="button" to="/posts/new">Створити публікацію</RouterLink>
    </div>
    <div class="admin-list-card">
      <div class="admin-list-toolbar">
        <label class="admin-search"
          ><span class="sr-only">Пошук публікацій</span><CatalogueIcon name="search" /><input
            v-model="q"
            type="search"
            placeholder="Назва або slug" /></label
        ><label class="admin-filter"
          >Статус<select v-model="status">
            <option value="">Усі статуси</option>
            <option value="published">Опубліковано</option>
            <option value="draft">Чернетки</option>
            <option value="archived">Архів</option>
          </select></label
        ><label class="admin-filter"
          >Категорія<select v-model="category">
            <option value="">Усі категорії</option>
            <option
              v-for="item in categories.data.value?.items ?? []"
              :key="item.id"
              :value="item.id"
            >
              {{ item.title_uk }}
            </option>
          </select></label
        ><label class="admin-filter"
          >Англійська<select v-model="translation">
            <option value="">Будь-яка готовність</option>
            <option value="ready">Опубліковано</option>
            <option value="missing">Потребує перекладу</option>
          </select></label
        ><label class="admin-filter"
          >SEO<select v-model="seo">
            <option value="">Будь-який стан</option>
            <option value="missing">Без українського опису</option>
          </select></label
        ><label class="admin-filter"
          >Сортувати<select v-model="sort">
            <option value="updated">Найновіші зміни</option>
            <option value="title">За назвою</option>
          </select></label
        ><span v-if="data" class="admin-list-count">{{ data.total }} записів</span>
        <div v-if="activeCount" class="admin-active-filters">
          Активні фільтри: {{ activeCount }}
          <button type="button" @click="clearFilters">Очистити</button>
        </div>
      </div>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="posts.isPending.value" class="admin-state">Завантаження реєстру…</p>
      <p v-else-if="posts.isError.value" class="admin-state" role="alert">
        Не вдалося завантажити публікації.
      </p>
      <p v-else-if="!data?.items.length" class="admin-state">Записів не знайдено.</p>
      <div v-else class="catalogue-register">
        <div class="table-row table-head" aria-hidden="true">
          <span></span><span class="table-meta">Назва / slug</span
          ><span class="table-meta">Категорія</span><span class="table-meta">Статус</span
          ><span class="table-meta">English</span><span class="table-meta">Оновлено</span
          ><span></span>
        </div>
        <div v-for="post in data.items" :key="post.id" class="table-row">
          <span
            class="table-spine"
            :class="spineClass(post)"
            :aria-label="`${statusLabel(post.status)}${post.is_en_published ? ', English опубліковано' : ''}`"
            ><i v-if="post.status === 'published' && post.is_en_published" aria-hidden="true"></i
          ></span>
          <div class="table-title">
            <strong>{{ post.title_uk }}</strong
            ><span class="table-slug">/post/{{ post.slug }}</span>
          </div>
          <div class="table-meta">
            <span class="table-label">Категорія: </span>{{ post.category_title ?? '—'
            }}<span v-if="post.category_count > 1"> +{{ post.category_count - 1 }}</span>
          </div>
          <div class="table-meta">
            <span class="table-label">Статус: </span
            ><span class="admin-status-badge" :class="`admin-status-${post.status}`">{{
              statusLabel(post.status)
            }}</span>
          </div>
          <div
            class="table-meta"
            :class="post.is_en_published ? 'readiness-ready' : 'readiness-missing'"
          >
            <span class="table-label">English: </span
            >{{ post.is_en_published ? 'Опубліковано' : 'Не готово' }}
          </div>
          <div class="table-meta">
            <span class="table-label">Оновлено: </span
            >{{ new Date(post.updated_at).toLocaleDateString('uk-UA') }}
          </div>
          <ActionMenu
            :edit-to="`/posts/${post.id}`"
            :public-href="`/post/${post.slug}`"
            :preview-href="`/api/admin/posts/${post.id}/preview`"
            :published="post.status === 'published'"
            can-delete
            @delete="remove(post)"
          />
        </div>
      </div>
      <AdminPagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
    </div>
  </section>
</template>
