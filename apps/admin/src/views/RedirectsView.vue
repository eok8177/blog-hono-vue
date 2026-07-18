<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';

type Redirect = {
  id: string;
  old_path: string;
  new_path: string;
  status_code: number;
  entity_type: string;
  created_at: string;
};

const client = useQueryClient();
const redirects = useQuery({
  queryKey: ['redirects'],
  queryFn: () => api<{ items: Redirect[]; total: number }>('/redirects'),
});
const items = computed(() => redirects.data.value?.items ?? []);
const error = ref('');
const deletingId = ref<string>();

async function remove(redirect: Redirect) {
  if (!confirm(`Видалити redirect «${redirect.old_path}»?`)) return;
  deletingId.value = redirect.id;
  error.value = '';
  try {
    await api(`/redirects/${redirect.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['redirects'] });
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося видалити redirect.';
  } finally {
    deletingId.value = undefined;
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">SEO та URL</p>
        <h1>Redirects</h1>
        <p>Перевіряйте перенаправлення, створені після зміни slug.</p>
      </div>
    </div>
    <p>
      Redirects створюються автоматично під час зміни slug. Тут їх можна перевірити або видалити.
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="redirects.isPending.value">Завантаження…</p>
    <p v-else-if="redirects.isError.value" role="alert">Не вдалося завантажити redirects.</p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Redirects ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Старий шлях</th>
            <th>Новий шлях</th>
            <th>Код</th>
            <th>Створено</th>
            <th>Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <code>{{ item.old_path }}</code>
            </td>
            <td>
              <code>{{ item.new_path }}</code>
            </td>
            <td>{{ item.status_code }}</td>
            <td>{{ item.created_at }}</td>
            <td>
              <button
                class="admin-danger-button"
                type="button"
                :disabled="deletingId === item.id"
                @click="remove(item)"
              >
                {{ deletingId === item.id ? 'Видалення…' : 'Видалити' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
