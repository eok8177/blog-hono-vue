<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
type Page = {
  id: string;
  slug: string;
  template: 'default' | 'about' | 'contact';
  title_uk: string;
  title_en: string | null;
  body_md_uk: string;
  body_md_en: string | null;
  status: 'draft' | 'published' | 'archived';
  is_en_published: number;
  show_in_menu: number;
  menu_order: number;
  updated_at: string;
};
const client = useQueryClient();
const editing = ref(false);
const selectedId = ref<string>();
const error = ref('');
const form = reactive({
  slug: '',
  template: 'default',
  titleUk: '',
  titleEn: '',
  bodyMdUk: '',
  bodyMdEn: '',
  status: 'draft',
  isEnPublished: false,
  showInMenu: false,
  menuOrder: 0,
  version: '',
});
const pages = useQuery({ queryKey: ['pages'], queryFn: () => api<Page[]>('/pages') });
const items = computed(() => pages.data.value ?? []);
const isLoading = computed(() => pages.isPending.value);
function reset() {
  selectedId.value = undefined;
  error.value = '';
  Object.assign(form, {
    slug: '',
    template: 'default',
    titleUk: '',
    titleEn: '',
    bodyMdUk: '',
    bodyMdEn: '',
    status: 'draft',
    isEnPublished: false,
    showInMenu: false,
    menuOrder: 0,
    version: '',
  });
}
function edit(item: Page) {
  selectedId.value = item.id;
  editing.value = true;
  Object.assign(form, {
    slug: item.slug,
    template: item.template,
    titleUk: item.title_uk,
    titleEn: item.title_en ?? '',
    bodyMdUk: item.body_md_uk,
    bodyMdEn: item.body_md_en ?? '',
    status: item.status,
    isEnPublished: Boolean(item.is_en_published),
    showInMenu: Boolean(item.show_in_menu),
    menuOrder: item.menu_order,
    version: item.updated_at,
  });
}
const save = useMutation({
  mutationFn: () =>
    api<{ id: string }>(selectedId.value ? `/pages/${selectedId.value}` : '/pages', {
      method: selectedId.value ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    }),
  onSuccess: async () => {
    editing.value = false;
    reset();
    await client.invalidateQueries({ queryKey: ['pages'] });
  },
  onError: (cause) => {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося зберегти сторінку.';
  },
});
const isSaving = computed(() => save.isPending.value);
async function archive(item: Page) {
  if (!confirm(`Архівувати «${item.title_uk}»?`)) return;
  try {
    await api(`/pages/${item.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['pages'] });
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося архівувати сторінку.';
  }
}
</script>
<template>
  <section>
    <div class="row">
      <h1>Сторінки</h1>
      <button
        @click="
          reset();
          editing = true;
        "
      >
        Створити
      </button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <form v-if="editing" @submit.prevent="save.mutate()">
      <h2>{{ selectedId ? 'Редагування сторінки' : 'Нова сторінка' }}</h2>
      <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label
      ><label
        >Шаблон
        <select v-model="form.template">
          <option>default</option>
          <option>about</option>
          <option>contact</option>
        </select></label
      ><label>Назва українською <input v-model="form.titleUk" required /></label
      ><label>Текст українською <textarea v-model="form.bodyMdUk" rows="10" required /></label
      ><label>Title English <input v-model="form.titleEn" /></label
      ><label>Text English <textarea v-model="form.bodyMdEn" rows="5" /></label
      ><label
        >Статус
        <select v-model="form.status">
          <option>draft</option>
          <option>published</option>
          <option>archived</option>
        </select></label
      ><button :disabled="isSaving">{{ isSaving ? 'Збереження…' : 'Зберегти' }}</button
      ><button
        type="button"
        @click="
          editing = false;
          reset();
        "
      >
        Скасувати
      </button>
    </form>
    <p v-if="isLoading">Завантаження…</p>
    <table v-else>
      <thead>
        <tr>
          <th>Назва</th>
          <th>Slug</th>
          <th>Статус</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.title_uk }}</td>
          <td>{{ item.slug }}</td>
          <td>{{ item.status }}</td>
          <td>
            <button @click="edit(item)">Редагувати</button>
            <button @click="archive(item)">Архівувати</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
