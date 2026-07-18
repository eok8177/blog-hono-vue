<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();
const sidebarOpen = ref(false);
const savedTheme = window.localStorage.getItem('admin-theme');
const theme = ref<'light' | 'dark'>(savedTheme === 'dark' ? 'dark' : 'light');
document.documentElement.dataset.theme = theme.value;
watch(theme, (value) => {
  document.documentElement.dataset.theme = value;
  window.localStorage.setItem('admin-theme', value);
});
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}
const localAccessBypass = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const navigation = [
  { label: 'Огляд', to: '/', icon: '⌂' },
  { label: 'Публікації', to: '/posts', icon: '▤' },
  { label: 'Категорії', to: '/categories', icon: '◈' },
  { label: 'Сторінки', to: '/pages', icon: '▧' },
  { label: 'Медіатека', to: '/media', icon: '▦' },
];
const administration = [
  { label: 'Користувачі', to: '/users', icon: '◎' },
  { label: 'Налаштування', to: '/settings', icon: '⚙' },
  { label: 'Redirects', to: '/redirects', icon: '↪' },
  { label: 'Журнал дій', to: '/audit-log', icon: '≡' },
];
const currentSection = computed(() => {
  const item = [...navigation, ...administration].find((entry) =>
    entry.to === '/' ? route.path === '/' : route.path.startsWith(entry.to),
  );
  return item?.label ?? 'Адмінпанель';
});
function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}
function closeSidebar() {
  sidebarOpen.value = false;
}
</script>
<template>
  <div class="admin-shell">
    <div v-if="sidebarOpen" class="admin-sidebar-backdrop" @click="closeSidebar" />
    <aside class="admin-sidebar" :class="{ 'admin-sidebar-open': sidebarOpen }">
      <div class="admin-brand">
        <span class="admin-brand-mark">F</span>
        <span><strong>Fauna</strong><small>Archive Admin</small></span>
        <button
          class="admin-sidebar-close"
          type="button"
          aria-label="Закрити меню"
          @click="closeSidebar"
        >
          ×
        </button>
      </div>
      <nav aria-label="Адміністративна навігація">
        <p class="admin-nav-label">Меню</p>
        <RouterLink
          v-for="item in navigation"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link"
          :class="{ 'admin-nav-link-active': isActive(item.to) }"
          @click="closeSidebar"
          ><span class="admin-nav-icon">{{ item.icon }}</span
          >{{ item.label }}</RouterLink
        >
        <p class="admin-nav-label admin-nav-label-spaced">Адміністрування</p>
        <RouterLink
          v-for="item in administration"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link"
          :class="{ 'admin-nav-link-active': isActive(item.to) }"
          @click="closeSidebar"
          ><span class="admin-nav-icon">{{ item.icon }}</span
          >{{ item.label }}</RouterLink
        >
      </nav>
      <div class="admin-sidebar-footer">
        <span class="admin-avatar">A</span>
        <span><strong>Адміністратор</strong><small>Content manager</small></span>
      </div>
    </aside>
    <div class="admin-main">
      <header class="admin-topbar">
        <div class="admin-topbar-left">
          <button
            class="admin-menu-button"
            type="button"
            aria-label="Відкрити меню"
            @click="sidebarOpen = true"
          >
            ☰
          </button>
          <div class="admin-breadcrumb">
            <span>Адмінпанель</span><b>/</b><strong>{{ currentSection }}</strong>
          </div>
        </div>
        <div class="admin-topbar-right">
          <span class="admin-status-dot">●</span
          ><span class="admin-status-text">Система працює</span>
          <span v-if="localAccessBypass" class="admin-env-badge">Local</span>
          <button
            class="admin-theme-toggle"
            type="button"
            :aria-label="theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
            :title="theme === 'dark' ? 'Світла тема' : 'Темна тема'"
            @click="toggleTheme"
          >
            {{ theme === 'dark' ? '☀' : '☾' }}
          </button>
          <a v-if="!localAccessBypass" class="admin-logout" href="/cdn-cgi/access/logout">Вийти</a>
        </div>
      </header>
      <main class="admin-content"><RouterView /></main>
    </div>
  </div>
</template>
