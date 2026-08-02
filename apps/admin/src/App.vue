<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import CatalogueIcon from './components/CatalogueIcon.vue';

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
const collection = [
  { label: 'Огляд', to: '/', icon: 'journal' as const },
  { label: 'Публікації', to: '/posts', icon: 'card' as const },
  { label: 'Категорії', to: '/categories', icon: 'collection' as const },
  { label: 'Сторінки', to: '/pages', icon: 'journal' as const },
  { label: 'Медіатека', to: '/media', icon: 'photo' as const },
];
const system = [
  { label: 'Користувачі', to: '/users', icon: 'card' as const },
  { label: 'Налаштування', to: '/settings', icon: 'collection' as const },
  { label: 'Redirects', to: '/redirects', icon: 'external' as const },
  { label: 'Журнал дій', to: '/audit-log', icon: 'journal' as const },
];
const currentSection = computed(
  () =>
    [...collection, ...system].find((entry) =>
      entry.to === '/' ? route.path === '/' : route.path.startsWith(entry.to),
    )?.label ?? 'Адмінпанель',
);
function isActive(path: string) {
  return path === '/' ? route.path === '/' : route.path.startsWith(path);
}
function closeSidebar() {
  sidebarOpen.value = false;
}
function onDocumentKeydown(event: Event) {
  if ((event as { key?: string }).key === 'Escape' && sidebarOpen.value) closeSidebar();
}

onMounted(() => document.addEventListener('keydown', onDocumentKeydown));
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKeydown));
</script>
<template>
  <div class="admin-shell">
    <div v-if="sidebarOpen" class="admin-sidebar-backdrop" @click="closeSidebar" />
    <aside class="admin-sidebar" :class="{ 'admin-sidebar-open': sidebarOpen }">
      <div class="admin-brand">
        <span class="admin-brand-mark" aria-hidden="true">F</span>
        <span><strong>Fauna</strong><small>Польовий каталог</small></span>
        <button
          class="admin-sidebar-close"
          type="button"
          aria-label="Закрити меню"
          @click="closeSidebar"
        >
          <CatalogueIcon name="close" />
        </button>
      </div>
      <nav aria-label="Адміністративна навігація">
        <p class="admin-nav-label">Колекція</p>
        <RouterLink
          v-for="item in collection"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link"
          :class="{ 'admin-nav-link-active': isActive(item.to) }"
          @click="closeSidebar"
        >
          <CatalogueIcon :name="item.icon" />{{ item.label }}
        </RouterLink>
        <p class="admin-nav-label admin-nav-label-spaced">Система</p>
        <RouterLink
          v-for="item in system"
          :key="item.to"
          :to="item.to"
          class="admin-nav-link"
          :class="{ 'admin-nav-link-active': isActive(item.to) }"
          @click="closeSidebar"
        >
          <CatalogueIcon :name="item.icon" />{{ item.label }}
        </RouterLink>
      </nav>
      <div class="admin-sidebar-footer">
        <span class="admin-avatar">A</span
        ><span><strong>Адміністратор</strong><small>Content manager</small></span>
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
            <CatalogueIcon name="menu" />
          </button>
          <div class="admin-breadcrumb">
            <span>Каталог</span><b>/</b><strong>{{ currentSection }}</strong>
          </div>
        </div>
        <div class="admin-topbar-right">
          <span class="admin-status-dot" aria-hidden="true"></span
          ><span class="admin-status-text">Система працює</span>
          <span v-if="localAccessBypass" class="admin-env-badge">Local</span>
          <button
            class="admin-theme-toggle"
            type="button"
            :aria-label="theme === 'dark' ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'"
            :title="theme === 'dark' ? 'Світла тема' : 'Темна тема'"
            @click="toggleTheme"
          >
            {{ theme === 'dark' ? 'Light' : 'Dark' }}
          </button>
          <a v-if="!localAccessBypass" class="admin-logout" href="/cdn-cgi/access/logout">Вийти</a>
        </div>
      </header>
      <main class="admin-content"><RouterView /></main>
    </div>
  </div>
</template>
