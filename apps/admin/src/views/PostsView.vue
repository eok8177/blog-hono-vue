<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { api } from '../api/client';
const q = ref('');
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
</script>
<template>
  <section>
    <div class="row">
      <h1>Публікації</h1>
      <RouterLink class="button" to="/posts/new">Створити</RouterLink>
    </div>
    <label>Пошук <input v-model="q" /></label>
    <p v-if="posts.isPending">Завантаження…</p>
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
          <td><RouterLink :to="`/posts/${post.id}`">Редагувати</RouterLink></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
