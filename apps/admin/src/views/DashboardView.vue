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
</script>
<template>
  <section>
    <h1>Огляд</h1>
    <p v-if="isLoading">Завантаження…</p>
    <p v-else-if="hasError">Не вдалося завантажити дані.</p>
    <div v-else-if="data" class="grid">
      <article v-for="item in data.posts" :key="item.status">
        <b>{{ item.count }}</b
        ><br />{{ item.status }}
      </article>
      <article>
        <b>{{ data.categories.count }}</b
        ><br />категорій
      </article>
      <article>
        <b>{{ data.media.count }}</b
        ><br />медіафайлів
      </article>
    </div>
  </section>
</template>
