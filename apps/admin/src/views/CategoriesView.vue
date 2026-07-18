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
  revision: number;
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
  version: undefined as number | undefined,
});
const categories = useQuery({
  queryKey: ['categories'],
  queryFn: () => api<{ items: Category[]; total: number }>('/categories'),
});
const items = computed(() => categories.data.value?.items ?? []);
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
    version: undefined,
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
    version: item.revision,
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
function statusLabel(status: string) {
  return status === 'published'
    ? 'Опубліковано'
    : status === 'archived'
      ? 'Архівовано'
      : 'Чернетка';
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Структура контенту</p>
        <h1>Категорії</h1>
        <p>Організовуйте публікації за темами та напрямами.</p>
      </div>
      <button
        type="button"
        @click="
          reset();
          editing = true;
        "
      >
        + Створити категорію
      </button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <form v-if="editing" class="admin-editor-form" @submit.prevent="save.mutate()">
      <div class="admin-form-heading">
        <div>
          <p class="admin-eyebrow">Налаштування</p>
          <h2>{{ selectedId ? 'Редагування категорії' : 'Нова категорія' }}</h2>
        </div>
        <button
          type="button"
          class="admin-close-button"
          @click="
            editing = false;
            reset();
          "
        >
          ×
        </button>
      </div>
      <div class="admin-form-grid">
        <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label
        ><label>Назва українською <input v-model="form.titleUk" required /></label
        ><label>Title English <input v-model="form.titleEn" /></label
        ><label
          >Порядок у меню <input v-model.number="form.menuOrder" type="number" min="0"
        /></label>
      </div>
      <label>Опис <textarea v-model="form.descriptionMdUk" rows="5" /></label>
      <div class="admin-form-actions">
        <label class="admin-checkbox"
          ><input v-model="form.showInMenu" type="checkbox" /> Показувати в меню</label
        ><label class="admin-checkbox"
          ><input v-model="form.isEnPublished" type="checkbox" /> English опубліковано</label
        ><label
          >Статус
          <select v-model="form.status">
            <option>draft</option>
            <option>published</option>
            <option>archived</option>
          </select></label
        ><button :disabled="save.isPending.value">
          {{ save.isPending.value ? 'Збереження…' : 'Зберегти' }}</button
        ><button
          type="button"
          class="admin-secondary-button"
          @click="
            editing = false;
            reset();
          "
        >
          Скасувати
        </button>
      </div>
    </form>
    <p v-if="categories.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="categories.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити категорії.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Категорій ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Категорія</th>
            <th>Slug</th>
            <th>Статус</th>
            <th>Оновлено</th>
            <th class="admin-actions-heading">Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>
              <div class="admin-primary-cell">
                <strong>{{ item.title_uk }}</strong
                ><span>{{ item.title_en || 'Без English перекладу' }}</span>
              </div>
            </td>
            <td>
              <code>{{ item.slug }}</code>
            </td>
            <td>
              <span class="admin-status-badge" :class="`admin-status-${item.status}`">{{
                statusLabel(item.status)
              }}</span>
            </td>
            <td>{{ new Date(item.updated_at).toLocaleDateString('uk-UA') }}</td>
            <td class="admin-actions-cell">
              <button
                type="button"
                class="admin-row-link admin-secondary-button"
                @click="edit(item)"
              >
                Редагувати</button
              ><button type="button" class="admin-danger-button" @click="remove(item)">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
