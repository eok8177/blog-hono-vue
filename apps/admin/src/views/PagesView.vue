<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
import AdminPagination from '../components/AdminPagination.vue';
import ActionMenu from '../components/ActionMenu.vue';
import CatalogueIcon from '../components/CatalogueIcon.vue';
type Page = {
  id: string;
  slug: string;
  template: 'default' | 'about' | 'contact';
  title_uk: string;
  title_en: string | null;
  status: 'draft' | 'published' | 'archived';
  is_en_published: number | boolean;
  updated_at: string;
};
const q = ref('');
const status = ref('');
const translation = ref('');
const sort = ref('updated');
const page = ref(1);
const pageSize = 10;
const error = ref('');
const client = useQueryClient();
const pages = useQuery({
  queryKey: computed(() => [
    'pages',
    {
      q: q.value,
      status: status.value,
      translation: translation.value,
      sort: sort.value,
      page: page.value,
    },
  ]),
  queryFn: () => {
    const params: Record<string, string> = {
      page: String(page.value),
      pageSize: String(pageSize),
      sort: sort.value,
    };
    if (q.value) params.q = q.value;
    if (status.value) params.status = status.value;
    if (translation.value) params.translation = translation.value;
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${window.encodeURIComponent(value)}`)
      .join('&');
    return api<{ items: Page[]; total: number }>(`/pages?${query}`);
  },
});
const data = computed(() => pages.data.value);
const items = computed(() => data.value?.items ?? []);
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / pageSize)));
const activeCount = computed(
  () => [q.value, status.value, translation.value].filter(Boolean).length,
);
watch([q, status, translation, sort], () => {
  page.value = 1;
});
function statusLabel(value: string) {
  return value === 'published' ? 'Опубліковано' : value === 'archived' ? 'Архівовано' : 'Чернетка';
}
function spineClass(item: Page) {
  if (item.status === 'archived') return 'spine-archived';
  if (item.status === 'draft' || !item.is_en_published) return 'spine-attention';
  return 'spine-published';
}
function clearFilters() {
  q.value = '';
  status.value = '';
  translation.value = '';
  sort.value = 'updated';
}
async function remove(item: Page) {
  if (!confirm(`Повністю видалити сторінку «${item.title_uk}»? Цю дію неможливо скасувати.`))
    return;
  try {
    await api(`/pages/${item.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['pages'] });
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Не вдалося повністю видалити сторінку.';
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Реєстр колекції</p>
        <h1>Сторінки</h1>
        <p>Системні сторінки, шаблон і перекладна готовність.</p>
      </div>
      <RouterLink class="button" to="/pages/new">Створити сторінку</RouterLink>
    </div>
    <div class="admin-list-card">
      <div class="admin-list-toolbar">
        <label class="admin-search"
          ><span class="sr-only">Пошук сторінок</span><CatalogueIcon name="search" /><input
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
          >Англійська<select v-model="translation">
            <option value="">Будь-яка готовність</option>
            <option value="ready">Опубліковано</option>
            <option value="missing">Потребує перекладу</option>
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
      <p v-if="pages.isPending.value" class="admin-state">Завантаження реєстру…</p>
      <p v-else-if="pages.isError.value" class="admin-state" role="alert">
        Не вдалося завантажити сторінки.
      </p>
      <p v-else-if="!items.length" class="admin-state">Записів не знайдено.</p>
      <div v-else class="catalogue-register">
        <div class="register-row register-head" aria-hidden="true">
          <span></span><span class="register-meta">Назва / slug</span
          ><span class="register-meta">Шаблон</span><span class="register-meta">Статус</span
          ><span class="register-meta">English</span><span class="register-meta">Оновлено</span
          ><span></span>
        </div>
        <div v-for="item in items" :key="item.id" class="register-row">
          <span
            class="register-spine"
            :class="spineClass(item)"
            :aria-label="`${statusLabel(item.status)}${item.is_en_published ? ', English опубліковано' : ''}`"
            ><i v-if="item.status === 'published' && item.is_en_published" aria-hidden="true"></i
          ></span>
          <div class="register-title">
            <strong>{{ item.title_uk }}</strong
            ><span class="register-slug">/{{ item.slug }}</span>
          </div>
          <div class="register-meta">
            <span class="register-label">Шаблон: </span>{{ item.template }}
          </div>
          <div class="register-meta">
            <span class="register-label">Статус: </span
            ><span class="admin-status-badge" :class="`admin-status-${item.status}`">{{
              statusLabel(item.status)
            }}</span>
          </div>
          <div
            class="register-meta"
            :class="item.is_en_published ? 'readiness-ready' : 'readiness-missing'"
          >
            <span class="register-label">English: </span
            >{{ item.is_en_published ? 'Опубліковано' : 'Не готово' }}
          </div>
          <div class="register-meta">
            <span class="register-label">Оновлено: </span
            >{{ new Date(item.updated_at).toLocaleDateString('uk-UA') }}
          </div>
          <ActionMenu
            :edit-to="`/pages/${item.id}`"
            :public-href="`/${item.slug}`"
            :preview-href="`/api/admin/pages/${item.id}/preview`"
            :published="item.status === 'published'"
            can-delete
            @delete="remove(item)"
          />
        </div>
      </div>
      <AdminPagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
    </div>
  </section>
</template>
