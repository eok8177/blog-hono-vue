<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
const q = ref('');
const error = ref('');
const client = useQueryClient();
const key = computed(() => ['posts', q.value]);
const posts = useQuery({
  queryKey: key,
  queryFn: () =>
    api<{
      items: { id: string; slug: string; title_uk: string; status: string; updated_at: string }[];
      total: number;
    }>(`/posts?q=${encodeURIComponent(q.value)}`),
});
const data = computed(() => posts.data.value);
const isLoading = computed(() => posts.isPending.value);
async function remove(post: { id: string; title_uk: string }) {
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
    <div class="row">
      <h1>Публікації</h1>
      <RouterLink class="button" to="/posts/new">Створити</RouterLink>
    </div>
    <label>Пошук <input v-model="q" /></label>
    <p v-if="error" role="alert">{{ error }}</p>
    <p v-if="isLoading">Завантаження…</p>
    <table v-else-if="data">
      <thead>
        <tr>
          <th>Назва</th>
          <th>Статус</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in data.items" :key="post.id">
          <td>{{ post.title_uk }}</td>
          <td>{{ post.status }}</td>
          <td>
            <RouterLink :to="`/posts/${post.id}`">Редагувати</RouterLink>
            <button type="button" @click="remove(post)">Видалити назавжди</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
