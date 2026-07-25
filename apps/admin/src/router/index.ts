import { createRouter, createWebHistory } from 'vue-router';
const routes = [
  { path: '/', component: () => import('../views/DashboardView.vue') },
  { path: '/posts', component: () => import('../views/PostsView.vue') },
  { path: '/posts/new', component: () => import('../views/PostEditorView.vue') },
  { path: '/posts/:id', component: () => import('../views/PostEditorView.vue') },
  { path: '/categories', component: () => import('../views/CategoriesView.vue') },
  { path: '/categories/new', component: () => import('../views/CategoryEditorView.vue') },
  { path: '/categories/:id', component: () => import('../views/CategoryEditorView.vue') },
  { path: '/pages', component: () => import('../views/PagesView.vue') },
  { path: '/pages/new', component: () => import('../views/PageEditorView.vue') },
  { path: '/pages/:id', component: () => import('../views/PageEditorView.vue') },
  { path: '/media', component: () => import('../views/MediaView.vue') },
  { path: '/users', component: () => import('../views/UsersView.vue') },
  { path: '/users/new', component: () => import('../views/UserEditorView.vue') },
  { path: '/users/:id', component: () => import('../views/UserEditorView.vue') },
  { path: '/settings', component: () => import('../views/SettingsView.vue') },
  { path: '/redirects', component: () => import('../views/RedirectsView.vue') },
  { path: '/audit-log', component: () => import('../views/AuditLogView.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
];
export default createRouter({ history: createWebHistory('/admin/'), routes });
