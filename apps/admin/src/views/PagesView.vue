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
  revision: number;
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
  version: undefined as number | undefined,
});
const pages = useQuery({
  queryKey: ['pages'],
  queryFn: () => api<{ items: Page[]; total: number }>('/pages'),
});
const items = computed(() => pages.data.value?.items ?? []);
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
    version: undefined,
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
    version: item.revision,
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
async function remove(item: Page) {
  if (!confirm(`Повністю видалити сторінку «${item.title_uk}»? Цю дію неможливо скасувати.`))
    return;
  try {
    await api(`/pages/${item.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['pages'] });
  } catch (cause) {
    error.value =
      cause instanceof ApiError ? cause.message : 'Не вдалося повністю видалити сторінку.';
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
        <p class="admin-eyebrow">Контент</p>
        <h1>Сторінки</h1>
        <p>Керуйте статичними сторінками та інформацією про архів.</p>
      </div>
      <button
        type="button"
        @click="
          reset();
          editing = true;
        "
      >
        + Створити сторінку
      </button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <form v-if="editing" class="admin-editor-form" @submit.prevent="save.mutate()">
      <div class="admin-form-heading">
        <div>
          <p class="admin-eyebrow">Налаштування</p>
          <h2>{{ selectedId ? 'Редагування сторінки' : 'Нова сторінка' }}</h2>
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
          >Шаблон
          <select v-model="form.template">
            <option>default</option>
            <option>about</option>
            <option>contact</option>
          </select></label
        >
      </div>
      <div class="admin-editor-columns">
        <label>Текст українською <textarea v-model="form.bodyMdUk" rows="12" required /></label
        ><label>Text English <textarea v-model="form.bodyMdEn" rows="12" /></label>
      </div>
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
    <p v-if="pages.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="pages.isError.value" class="admin-state" role="alert">
      Не вдалося завантажити сторінки.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Сторінок ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Сторінка</th>
            <th>Шаблон</th>
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
                ><span>/{{ item.slug }}</span>
              </div>
            </td>
            <td>{{ item.template }}</td>
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
