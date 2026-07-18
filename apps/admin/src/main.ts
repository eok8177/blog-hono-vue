import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import router from './router';
import './style.css';
createApp(App)
  .use(createPinia())
  .use(router)
  .use(VueQueryPlugin, { queryClient: new QueryClient() })
  .mount('#app');
