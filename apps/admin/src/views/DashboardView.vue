<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { api } from '../api/client';

type QueueItem = { id: string; title: string; slug?: string; updated_at: string };
type RecentItem = {
  id: string;
  title: string;
  entity_type: 'post' | 'page';
  status: string;
  updated_at: string;
};
type AuditItem = {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
  actor_email: string | null;
};
export type DashboardResponse = {
  posts: { status: string; count: number }[];
  pages: { count: number };
  categories: { count: number };
  media: { count: number; bytes: number };
  queues: {
    missingSeoUk: QueueItem[];
    missingMediaAltUk: QueueItem[];
    englishUnpublished: QueueItem[];
  };
  recent: { changes: RecentItem[]; audits?: AuditItem[] };
};
const dashboard = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => api<DashboardResponse>('/dashboard'),
});
const data = computed(() => dashboard.data.value);
function count(status: string) {
  return data.value?.posts.find((item) => item.status === status)?.count ?? 0;
}
function bytes(value: number) {
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(1)} GB`;
}
function date(value: string) {
  return new Date(value).toLocaleDateString('uk-UA');
}
const queues = computed(() =>
  data.value
    ? [
        {
          label: 'Чернетки без українського SEO-опису',
          items: data.value.queues.missingSeoUk,
          to: '/posts?status=draft&seo=missing',
        },
        {
          label: 'Медіа без українського alt',
          items: data.value.queues.missingMediaAltUk,
          to: '/media?alt=missing',
        },
        {
          label: 'Українські публікації без опублікованої англійської версії',
          items: data.value.queues.englishUnpublished,
          to: '/posts?status=published&translation=missing',
        },
      ]
    : [],
);
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Огляд архіву</p>
        <h1>Польовий каталог</h1>
        <p>Стан колекції та найближча безпечна дія.</p>
      </div>
      <RouterLink class="button" to="/posts/new">Нова публікація</RouterLink>
    </div>
    <p v-if="dashboard.isPending.value" class="admin-state">Завантаження стану архіву…</p>
    <p v-else-if="dashboard.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити стан архіву. Спробуйте ще раз.
    </p>
    <template v-else-if="data">
      <div class="admin-inventory">
        <p class="inventory-line">
          <RouterLink to="/posts"
            >Публікації {{ count('published') + count('draft') + count('archived') }}</RouterLink
          >
          ·
          <RouterLink to="/posts?status=published"
            >Опубліковано {{ count('published') }}</RouterLink
          >
          · <RouterLink to="/posts?status=draft">Чернетки {{ count('draft') }}</RouterLink> ·
          <RouterLink to="/media">Медіа {{ data.media.count }}</RouterLink> ·
          {{ bytes(data.media.bytes) }} · Архів {{ count('archived') }}
        </p>
      </div>
      <div class="admin-dashboard-grid">
        <article class="admin-card">
          <div class="admin-card-heading">
            <div>
              <p class="admin-eyebrow">Редакційна черга</p>
              <h2>Що потребує уваги</h2>
            </div>
            <RouterLink to="/posts">Усі публікації</RouterLink>
          </div>
          <ul class="editorial-queue">
            <li v-for="queue in queues" :key="queue.label">
              <RouterLink :to="queue.to"
                ><span
                  ><strong>{{ queue.label }}</strong
                  ><small v-if="queue.items.length">{{
                    queue.items
                      .slice(0, 3)
                      .map((item) => item.title)
                      .join(' · ')
                  }}</small
                  ><small v-else class="queue-empty">Дій не потрібно</small></span
                ><span class="queue-count">{{ queue.items.length }}</span></RouterLink
              >
            </li>
          </ul>
        </article>
        <div>
          <article class="admin-card">
            <div class="admin-card-heading">
              <div>
                <p class="admin-eyebrow">Журнал змін</p>
                <h2>Нещодавно оновлено</h2>
              </div>
            </div>
            <ul v-if="data.recent.changes.length" class="recent-list">
              <li v-for="item in data.recent.changes" :key="item.id">
                <RouterLink :to="`/${item.entity_type === 'post' ? 'posts' : 'pages'}/${item.id}`"
                  ><strong>{{ item.title }}</strong
                  ><span
                    >{{ item.entity_type === 'post' ? 'Публікація' : 'Сторінка' }} ·
                    {{ date(item.updated_at) }}</span
                  ></RouterLink
                >
              </li>
            </ul>
            <p v-else class="queue-empty">Змін ще немає.</p>
          </article>
          <article v-if="data.recent.audits" class="admin-card dashboard-audit-card">
            <p class="admin-eyebrow">Система</p>
            <h2>Останні аудити</h2>
            <ul class="recent-list">
              <li v-for="item in data.recent.audits" :key="item.id">
                <strong>{{ item.action }}</strong
                ><span>{{ item.actor_email ?? 'Система' }} · {{ date(item.created_at) }}</span>
              </li>
            </ul>
            <p v-if="!data.recent.audits.length" class="queue-empty">Аудитів ще немає.</p>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>
