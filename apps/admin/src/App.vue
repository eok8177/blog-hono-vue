<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>
<template>
  <header>
    <strong>Архів фауни · admin</strong>
    <nav>
      <RouterLink to="/">Огляд</RouterLink><RouterLink to="/posts">Публікації</RouterLink
      ><a href="/cdn-cgi/access/logout">Вийти</a>
    </nav>
  </header>
  <main><RouterView /></main>
</template>
