import { createRouter, createWebHistory } from 'vue-router';
const routes = [
  { path: '/', component: () => import('../views/DashboardView.vue') },
  { path: '/posts', component: () => import('../views/PostsView.vue') },
  { path: '/posts/new', component: () => import('../views/PostEditorView.vue') },
  { path: '/posts/:id', component: () => import('../views/PostEditorView.vue') },
  { path: '/categories', component: () => import('../views/CategoriesView.vue') },
  { path: '/pages', component: () => import('../views/PagesView.vue') },
  { path: '/media', component: () => import('../views/MediaView.vue') },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
];
export default createRouter({ history: createWebHistory('/admin/'), routes });
