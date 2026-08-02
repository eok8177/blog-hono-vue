<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
import AdminPagination from '../components/AdminPagination.vue';
type Category = {
  id: string;
  slug: string;
  title_uk: string;
  title_en: string | null;
  status: 'draft' | 'published' | 'archived';
  updated_at: string;
};
const client = useQueryClient();
const error = ref('');
const page = ref(1);
const pageSize = 10;
const categories = useQuery({
  queryKey: computed(() => ['categories', page.value]),
  queryFn: () =>
    api<{ items: Category[]; total: number }>(
      `/categories?page=${page.value}&pageSize=${pageSize}`,
    ),
});
const items = computed(() => categories.data.value?.items ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((categories.data.value?.total ?? 0) / pageSize)),
);
async function remove(item: Category) {
  if (!confirm(`Повністю видалити категорію «${item.title_uk}»? Цю дію неможливо скасувати.`))
    return;
  try {
    await api(`/categories/${item.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['categories'] });
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Не вдалося повністю видалити категорію.';
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
        <p class="admin-eyebrow">Структура контенту</p>
        <h1>Категорії</h1>
        <p>Організовуйте публікації за темами та напрямами.</p>
      </div>
      <RouterLink class="button" to="/categories/new">+ Створити категорію</RouterLink>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="categories.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="categories.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити категорії.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Категорій ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Категорія</th>
            <th>Slug</th>
            <th>Статус</th>
            <th>Оновлено</th>
            <th class="admin-actions-heading">Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <div class="admin-primary-cell">
                <strong>{{ item.title_uk }}</strong>
                <span>{{ item.title_en || 'Без English перекладу' }}</span>
              </div>
            </td>
            <td>
              <code>{{ item.slug }}</code>
            </td>
            <td>
              <span class="admin-status-badge" :class="`admin-status-${item.status}`">
                {{ statusLabel(item.status) }}
              </span>
            </td>
            <td>{{ new Date(item.updated_at).toLocaleDateString('uk-UA') }}</td>
            <td class="admin-actions-cell">
              <RouterLink class="admin-row-link" :to="`/categories/${item.id}`">
                Редагувати
              </RouterLink>
              <button type="button" class="admin-danger-button" @click="remove(item)">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
    </div>
  </section>
</template>
