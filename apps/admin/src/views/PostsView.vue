<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';

type Post = { id: string; slug: string; title_uk: string; status: string; updated_at: string };
const q = ref('');
const page = ref(1);
const pageSize = 10;
const error = ref('');
const client = useQueryClient();
const key = computed(() => ['posts', q.value, page.value]);
const posts = useQuery({
  queryKey: key,
  queryFn: () =>
    api<{ items: Post[]; total: number; page: number; pageSize: number }>(
      `/posts?q=${encodeURIComponent(q.value)}&page=${page.value}&pageSize=${pageSize}`,
    ),
});
const data = computed(() => posts.data.value);
const isLoading = computed(() => posts.isPending.value);
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / pageSize)));
watch(q, () => {
  page.value = 1;
});
function statusLabel(status: string) {
  return { published: 'Опубліковано', draft: 'Чернетка', archived: 'Архів' }[status] ?? status;
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
        <p class="admin-eyebrow">Контент</p>
        <h1>Публікації</h1>
        <p>Створюйте, редагуйте та публікуйте матеріали архіву.</p>
      </div>
      <RouterLink class="button" to="/posts/new">+ Створити публікацію</RouterLink>
    </div>
    <div class="admin-list-card">
      <div class="admin-list-toolbar">
        <label class="admin-search">
          <span class="sr-only">Пошук публікацій</span>
          <span class="admin-search-icon">⌕</span>
          <input v-model="q" type="search" placeholder="Пошук за назвою…" />
        </label>
        <span v-if="data" class="admin-list-count">{{ data.total }} матеріалів</span>
      </div>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="isLoading" class="admin-state">Завантаження…</p>
      <p v-else-if="posts.isError.value" class="admin-state" role="alert">
        Не вдалося завантажити публікації.
      </p>
      <p v-else-if="!data?.items.length" class="admin-state">Публікацій не знайдено.</p>
      <div v-else class="admin-table-scroll">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Публікація</th>
              <th>Статус</th>
              <th>Оновлено</th>
              <th class="admin-actions-heading">Дії</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in data.items" :key="post.id">
              <td>
                <div class="admin-primary-cell">
                  <strong>{{ post.title_uk }}</strong
                  ><span>/post/{{ post.slug }}</span>
                </div>
              </td>
              <td>
                <span class="admin-status-badge" :class="`admin-status-${post.status}`">{{
                  statusLabel(post.status)
                }}</span>
              </td>
              <td>{{ new Date(post.updated_at).toLocaleDateString('uk-UA') }}</td>
              <td class="admin-actions-cell">
                <RouterLink class="admin-row-link" :to="`/posts/${post.id}`">Редагувати</RouterLink>
                <button class="admin-danger-button" type="button" @click="remove(post)">
                  Видалити
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="data && data.total" class="admin-pagination">
        <span>Сторінка {{ page }} з {{ totalPages }}</span>
        <div>
          <button type="button" :disabled="page === 1" @click="page--">← Назад</button>
          <button type="button" :disabled="page >= totalPages" @click="page++">Далі →</button>
        </div>
      </div>
    </div>
  </section>
</template>
