<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { api } from '../api/client';
type Event = {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  actor_email: string | null;
};
const events = useQuery({
  queryKey: ['audit-log'],
  queryFn: () => api<{ items: Event[]; total: number }>('/audit-log'),
});
const items = computed(() => events.data.value?.items ?? []);
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Безпека</p>
        <h1>Журнал дій</h1>
        <p>Історія критичних змін у контенті та налаштуваннях.</p>
      </div>
    </div>
    <p v-if="events.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="events.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити журнал.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Подій ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Час</th>
            <th>Дія</th>
            <th>Сутність</th>
            <th>Актор</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.created_at }}</td>
            <td>{{ item.action }}</td>
            <td>{{ item.entity_type }}</td>
            <td>{{ item.actor_email ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
