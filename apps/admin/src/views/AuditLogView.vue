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
    <h1>Журнал дій</h1>
    <p v-if="events.isPending.value">Завантаження…</p>
    <table v-else>
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
  </section>
</template>
