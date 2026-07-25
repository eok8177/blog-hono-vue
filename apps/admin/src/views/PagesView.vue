<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
import AdminPagination from '../components/AdminPagination.vue';
type Page = {
  id: string;
  slug: string;
  template: 'default' | 'about' | 'contact';
  title_uk: string;
  title_en: string | null;
  status: 'draft' | 'published' | 'archived';
  updated_at: string;
};
const client = useQueryClient();
const error = ref('');
const page = ref(1);
const pageSize = 10;
const pages = useQuery({
  queryKey: computed(() => ['pages', page.value]),
  queryFn: () =>
    api<{ items: Page[]; total: number }>(`/pages?page=${page.value}&pageSize=${pageSize}`),
});
const items = computed(() => pages.data.value?.items ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((pages.data.value?.total ?? 0) / pageSize)),
);
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
function statusLabel(status: string) {
  return status === 'published'
    ? 'Опубліковано'
    : status === 'archived'
      ? 'Архівовано'
      : 'Чернетка';
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Контент</p>
        <h1>Сторінки</h1>
        <p>Керуйте статичними сторінками та інформацією про архів.</p>
      </div>
      <RouterLink class="button" to="/pages/new">+ Створити сторінку</RouterLink>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="pages.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="pages.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити сторінки.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Сторінок ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Сторінка</th>
            <th>Шаблон</th>
            <th>Статус</th>
            <th>Оновлено</th>
            <th class="admin-actions-heading">Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <div class="admin-primary-cell">
                <strong>{{ item.title_uk }}</strong
                ><span>/{{ item.slug }}</span>
              </div>
            </td>
            <td>{{ item.template }}</td>
            <td>
              <span class="admin-status-badge" :class="`admin-status-${item.status}`">{{
                statusLabel(item.status)
              }}</span>
            </td>
            <td>{{ new Date(item.updated_at).toLocaleDateString('uk-UA') }}</td>
            <td class="admin-actions-cell">
              <RouterLink class="admin-row-link" :to="`/pages/${item.id}`"
                >Редагувати</RouterLink
              >
              <button type="button" class="admin-danger-button" @click="remove(item)">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminPagination
        :page="page"
        :total-pages="totalPages"
        @update:page="page = $event"
      />
    </div>
  </section>
</template>
