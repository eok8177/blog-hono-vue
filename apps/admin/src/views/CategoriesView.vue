<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
type Category = {
  id: string;
  slug: string;
  title_uk: string;
  title_en: string | null;
  description_md_uk: string | null;
  description_md_en: string | null;
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
  titleUk: '',
  titleEn: '',
  descriptionMdUk: '',
  descriptionMdEn: '',
  status: 'draft',
  isEnPublished: false,
  showInMenu: false,
  menuOrder: 0,
  version: '',
});
const categories = useQuery({
  queryKey: ['categories'],
  queryFn: () => api<{ items: Category[]; total: number }>('/categories'),
});
const items = computed(() => categories.data.value?.items ?? []);
const isLoading = computed(() => categories.isPending.value);
function reset() {
  selectedId.value = undefined;
  error.value = '';
  Object.assign(form, {
    slug: '',
    titleUk: '',
    titleEn: '',
    descriptionMdUk: '',
    descriptionMdEn: '',
    status: 'draft',
    isEnPublished: false,
    showInMenu: false,
    menuOrder: 0,
    version: '',
  });
}
function edit(item: Category) {
  selectedId.value = item.id;
  editing.value = true;
  error.value = '';
  Object.assign(form, {
    slug: item.slug,
    titleUk: item.title_uk,
    titleEn: item.title_en ?? '',
    descriptionMdUk: item.description_md_uk ?? '',
    descriptionMdEn: item.description_md_en ?? '',
    status: item.status,
    isEnPublished: Boolean(item.is_en_published),
    showInMenu: Boolean(item.show_in_menu),
    menuOrder: item.menu_order,
    version: item.updated_at,
  });
}
const save = useMutation({
  mutationFn: () =>
    api<{ id: string }>(selectedId.value ? `/categories/${selectedId.value}` : '/categories', {
      method: selectedId.value ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    }),
  onSuccess: async () => {
    editing.value = false;
    reset();
    await client.invalidateQueries({ queryKey: ['categories'] });
  },
  onError: (cause) => {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося зберегти категорію.';
  },
});
const isSaving = computed(() => save.isPending.value);
async function remove(item: Category) {
  if (!confirm(`Повністю видалити категорію «${item.title_uk}»? Цю дію неможливо скасувати.`))
    return;
  try {
    await api(`/categories/${item.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['categories'] });
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Не вдалося повністю видалити категорію.';
  }
}
</script>
<template>
  <section>
    <div class="row">
      <h1>Категорії</h1>
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
      <h2>{{ selectedId ? 'Редагування категорії' : 'Нова категорія' }}</h2>
      <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label
      ><label>Назва українською <input v-model="form.titleUk" required /></label
      ><label>Title English <input v-model="form.titleEn" /></label
      ><label>Опис <textarea v-model="form.descriptionMdUk" rows="5" /></label
      ><label
        >Статус
        <select v-model="form.status">
          <option>draft</option>
          <option>published</option>
        </select></label
      ><label><input v-model="form.showInMenu" type="checkbox" /> Показувати в меню</label
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
            <button @click="remove(item)">Видалити назавжди</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
