<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';

const route = useRoute();
const router = useRouter();
const id = typeof route.params.id === 'string' ? route.params.id : undefined;

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

const error = ref('');
const saving = ref(false);
const loading = ref(Boolean(id));
const dirty = ref(false);
const activeLocale = ref<'uk' | 'en'>('uk');

type StoredCategory = {
  slug: string;
  title_uk: string;
  title_en: string | null;
  description_md_uk: string | null;
  description_md_en: string | null;
  status: string;
  is_en_published: number;
  show_in_menu: number;
  menu_order: number;
  revision: number;
};

onMounted(async () => {
  if (!id) return;
  try {
    const category = await api<StoredCategory>(`/categories/${id}`);
    Object.assign(form, {
      slug: category.slug,
      titleUk: category.title_uk,
      titleEn: category.title_en ?? '',
      descriptionMdUk: category.description_md_uk ?? '',
      descriptionMdEn: category.description_md_en ?? '',
      status: category.status,
      isEnPublished: Boolean(category.is_en_published),
      showInMenu: Boolean(category.show_in_menu),
      menuOrder: category.menu_order,
      version: category.revision,
    });
    dirty.value = false;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не вдалося завантажити категорію.';
  } finally {
    loading.value = false;
  }
});

watch(
  form,
  () => {
    if (!loading.value) dirty.value = true;
  },
  { deep: true },
);

function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) event.preventDefault();
}
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await api(id ? `/categories/${id}` : '/categories', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    });
    dirty.value = false;
    await router.push('/categories');
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === 'CONFLICT'
        ? 'Категорію змінив інший редактор. Перечитайте версію перед збереженням.'
        : e instanceof ApiError
          ? e.message
          : 'Помилка збереження';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Структура / Категорія</p>
        <h1>{{ id ? 'Редагування категорії' : 'Нова категорія' }}</h1>
        <p>Налаштуйте slug, назви, статус та порядок у меню.</p>
      </div>
      <RouterLink class="admin-secondary-button button" to="/categories">← До списку</RouterLink>
    </div>
    <p v-if="loading" class="admin-state">Завантаження…</p>
    <form v-else class="admin-editor-form" @submit.prevent="save">
      <p v-if="error" role="alert">{{ error }}</p>
      <label
        >Slug <input v-model="form.slug" pattern="[a-z0-9-]+" /><small v-if="!form.slug.trim()"
          >Згенерується з назви автоматично</small
        ></label
      >
      <section class="admin-language-section" aria-label="Мовні версії категорії">
        <div class="admin-language-tabs" role="tablist" aria-label="Мова категорії">
          <button
            id="category-locale-uk-tab"
            class="admin-language-tab"
            :class="{ 'admin-language-tab-active': activeLocale === 'uk' }"
            type="button"
            role="tab"
            :aria-selected="activeLocale === 'uk'"
            aria-controls="category-locale-uk-panel"
            @click="activeLocale = 'uk'"
          >
            Українська
          </button>
          <button
            id="category-locale-en-tab"
            class="admin-language-tab"
            :class="{ 'admin-language-tab-active': activeLocale === 'en' }"
            type="button"
            role="tab"
            :aria-selected="activeLocale === 'en'"
            aria-controls="category-locale-en-panel"
            @click="activeLocale = 'en'"
          >
            English
          </button>
        </div>
        <div
          id="category-locale-uk-panel"
          v-show="activeLocale === 'uk'"
          class="admin-language-panel"
          role="tabpanel"
          aria-labelledby="category-locale-uk-tab"
        >
          <label>Назва українською <input v-model="form.titleUk" required /></label>
          <label>Опис українською <textarea v-model="form.descriptionMdUk" rows="5" /></label>
        </div>
        <div
          id="category-locale-en-panel"
          v-show="activeLocale === 'en'"
          class="admin-language-panel"
          role="tabpanel"
          aria-labelledby="category-locale-en-tab"
        >
          <label>Title English <input v-model="form.titleEn" /></label>
          <label>Description English <textarea v-model="form.descriptionMdEn" rows="5" /></label>
          <label class="admin-checkbox"
            ><input v-model="form.isEnPublished" type="checkbox" /> English опубліковано</label
          >
        </div>
      </section>
      <fieldset class="admin-editor-section admin-editor-settings">
        <legend>Налаштування категорії</legend>
        <div class="admin-editor-settings-grid">
          <label class="admin-checkbox"
            ><input v-model="form.showInMenu" type="checkbox" /> Показувати в меню</label
          >
          <label>
            Порядок у меню <input v-model.number="form.menuOrder" type="number" min="0" />
          </label>
          <label
            >Статус
            <select v-model="form.status">
              <option>draft</option>
              <option>published</option>
              <option>archived</option>
            </select></label
          >
          <button :disabled="saving">{{ saving ? 'Збереження…' : 'Зберегти' }}</button>
        </div>
      </fieldset>
    </form>
  </section>
</template>
