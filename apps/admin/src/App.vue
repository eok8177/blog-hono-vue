<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
const localAccessBypass = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
</script>
<template>
  <header class="bg-archive-900 px-5 py-4 text-white shadow-sm">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
      <strong>Архів фауни · admin</strong>
      <nav class="flex flex-wrap gap-4" aria-label="Адміністративна навігація">
        <RouterLink to="/">Огляд</RouterLink><RouterLink to="/posts">Публікації</RouterLink
        ><RouterLink to="/categories">Категорії</RouterLink
        ><RouterLink to="/pages">Сторінки</RouterLink><RouterLink to="/media">Медіа</RouterLink
        ><span v-if="localAccessBypass" title="Cloudflare Access logout доступний після deployment"
          >Local development</span
        ><a v-else href="/cdn-cgi/access/logout">Вийти</a>
      </nav>
    </div>
  </header>
  <main class="mx-auto max-w-7xl p-5 sm:p-8"><RouterView /></main>
</template>
