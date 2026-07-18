<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { api } from '../api/client';

const dashboard = useQuery({
  queryKey: ['dashboard'],
  queryFn: () =>
    api<{
      posts: { status: string; count: number }[];
      pages: { count: number };
      categories: { count: number };
      media: { count: number; bytes: number };
    }>('/dashboard'),
});
const data = computed(() => dashboard.data.value);
const isLoading = computed(() => dashboard.isPending.value);
const hasError = computed(() => dashboard.isError.value);
function postCount(status: string) {
  return data.value?.posts.find((item) => item.status === status)?.count ?? 0;
}
const statCards = computed(() => [
  {
    label: 'Усі публікації',
    value: data.value?.posts.reduce((sum, item) => sum + item.count, 0) ?? 0,
    icon: '▤',
    tone: 'blue',
    to: '/posts',
  },
  { label: 'Опубліковано', value: postCount('published'), icon: '✓', tone: 'green', to: '/posts' },
  {
    label: 'Категорії',
    value: data.value?.categories.count ?? 0,
    icon: '◈',
    tone: 'purple',
    to: '/categories',
  },
  {
    label: 'Медіафайли',
    value: data.value?.media.count ?? 0,
    icon: '▦',
    tone: 'orange',
    to: '/media',
  },
]);
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Огляд архіву</p>
        <h1>Панель керування</h1>
        <p>Керуйте контентом і матеріалами архіву.</p>
      </div>
      <RouterLink class="button" to="/posts/new">+ Нова публікація</RouterLink>
    </div>
    <p v-if="isLoading">Завантаження…</p>
    <p v-else-if="hasError" role="alert">Не вдалося завантажити дані.</p>
    <template v-else-if="data">
      <div class="admin-stat-grid">
        <RouterLink
          v-for="card in statCards"
          :key="card.label"
          :to="card.to"
          class="admin-stat-card"
          :class="`admin-stat-${card.tone}`"
        >
          <div class="admin-stat-icon">{{ card.icon }}</div>
          <div>
            <p>{{ card.label }}</p>
            <strong>{{ card.value }}</strong>
          </div>
          <span class="admin-stat-arrow">→</span>
        </RouterLink>
      </div>
      <div class="admin-dashboard-grid">
        <article class="admin-card admin-overview-card">
          <div class="admin-card-heading">
            <div>
              <p class="admin-eyebrow">Контент</p>
              <h2>Стан архіву</h2>
            </div>
            <RouterLink to="/posts">Переглянути все</RouterLink>
          </div>
          <div class="admin-progress-row">
            <span>Опубліковано</span><strong>{{ postCount('published') }}</strong>
          </div>
          <div class="admin-progress">
            <span :style="{ width: `${postCount('published') ? 100 : 0}%` }" />
          </div>
          <div class="admin-progress-row">
            <span>Чернетки</span><strong>{{ postCount('draft') }}</strong>
          </div>
          <div class="admin-progress">
            <span
              class="admin-progress-muted"
              :style="{ width: `${postCount('draft') ? 60 : 0}%` }"
            />
          </div>
          <div class="admin-progress-row">
            <span>Сторінки</span><strong>{{ data.pages.count }}</strong>
          </div>
        </article>
        <article class="admin-card admin-quick-card">
          <p class="admin-eyebrow">Швидкі дії</p>
          <h2>Почати роботу</h2>
          <RouterLink to="/posts/new">Створити публікацію <span>→</span></RouterLink>
          <RouterLink to="/categories">Керувати категоріями <span>→</span></RouterLink>
          <RouterLink to="/media">Додати зображення <span>→</span></RouterLink>
          <RouterLink to="/settings">Налаштувати головну <span>→</span></RouterLink>
        </article>
      </div>
    </template>
  </section>
</template>
