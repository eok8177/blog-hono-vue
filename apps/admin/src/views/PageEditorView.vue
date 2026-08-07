<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';
import AdminGallery from '../components/AdminGallery.vue';
import MilkdownEditor from '../components/MilkdownEditor.vue';

const route = useRoute();
const router = useRouter();
const id = typeof route.params.id === 'string' ? route.params.id : undefined;

const bodyEditorUk = ref<{ getContent?: () => string }>();
const bodyEditorEn = ref<{ getContent?: () => string }>();

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
  mediaIds: [] as string[],
  version: undefined as number | undefined,
});

const error = ref('');
const saving = ref(false);
const loading = ref(Boolean(id));
const dirty = ref(false);
const activeLocale = ref<'uk' | 'en'>('uk');

type StoredPage = {
  slug: string;
  template: 'default' | 'about' | 'contact';
  title_uk: string;
  title_en: string | null;
  body_md_uk: string;
  body_md_en: string | null;
  status: string;
  is_en_published: number;
  show_in_menu: number;
  menu_order: number;
  revision: number;
  mediaIds: string[];
};

onMounted(async () => {
  try {
    if (!id) return;
    const page = await api<StoredPage>(`/pages/${id}`);
    Object.assign(form, {
      slug: page.slug,
      template: page.template,
      titleUk: page.title_uk,
      titleEn: page.title_en ?? '',
      bodyMdUk: page.body_md_uk,
      bodyMdEn: page.body_md_en ?? '',
      status: page.status,
      isEnPublished: Boolean(page.is_en_published),
      showInMenu: Boolean(page.show_in_menu),
      menuOrder: page.menu_order,
      mediaIds: page.mediaIds ?? [],
      version: page.revision,
    });
    dirty.value = false;
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не вдалося завантажити сторінку.';
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
    await api(id ? `/pages/${id}` : '/pages', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify({
        ...form,
        bodyMdUk: bodyEditorUk.value?.getContent?.() ?? form.bodyMdUk,
        bodyMdEn: bodyEditorEn.value?.getContent?.() ?? form.bodyMdEn,
      }),
    });
    dirty.value = false;
    await router.push('/pages');
  } catch (e) {
    error.value =
      e instanceof ApiError && e.code === 'CONFLICT'
        ? 'Сторінку змінив інший редактор. Перечитайте версію перед збереженням.'
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
        <p class="admin-eyebrow">Контент / Сторінка</p>
        <h1>{{ id ? 'Редагування сторінки' : 'Нова сторінка' }}</h1>
        <p>Заповніть українську версію, переклад та налаштування.</p>
      </div>
      <RouterLink class="admin-secondary-button button" to="/pages">← До списку</RouterLink>
    </div>
    <p v-if="loading" class="admin-state">Завантаження…</p>
    <form v-else class="admin-editor-form" @submit.prevent="save">
      <p v-if="error" role="alert">{{ error }}</p>
      <label
        >Slug <input v-model="form.slug" pattern="[a-z0-9-]+" /><small v-if="!form.slug.trim()"
          >Згенерується з назви автоматично</small
        ></label
      >
      <label class="admin-page-template"
        >Шаблон
        <select v-model="form.template">
          <option>default</option>
          <option>about</option>
          <option>contact</option>
        </select></label
      >
      <section class="admin-language-section" aria-label="Мовні версії сторінки">
        <div class="admin-language-tabs" role="tablist" aria-label="Мова сторінки">
          <button
            id="page-locale-uk-tab"
            class="admin-language-tab"
            :class="{ 'admin-language-tab-active': activeLocale === 'uk' }"
            type="button"
            role="tab"
            :aria-selected="activeLocale === 'uk'"
            aria-controls="page-locale-uk-panel"
            @click="activeLocale = 'uk'"
          >
            Українська
          </button>
          <button
            id="page-locale-en-tab"
            class="admin-language-tab"
            :class="{ 'admin-language-tab-active': activeLocale === 'en' }"
            type="button"
            role="tab"
            :aria-selected="activeLocale === 'en'"
            aria-controls="page-locale-en-panel"
            @click="activeLocale = 'en'"
          >
            English
          </button>
        </div>
        <div
          id="page-locale-uk-panel"
          v-show="activeLocale === 'uk'"
          class="admin-language-panel"
          role="tabpanel"
          aria-labelledby="page-locale-uk-tab"
        >
          <label>Назва українською <input v-model="form.titleUk" required /></label>
          <label class="admin-editor-label"
            >Текст українською <MilkdownEditor ref="bodyEditorUk" v-model="form.bodyMdUk"
          /></label>
        </div>
        <div
          id="page-locale-en-panel"
          v-show="activeLocale === 'en'"
          class="admin-language-panel"
          role="tabpanel"
          aria-labelledby="page-locale-en-tab"
        >
          <label>Title English <input v-model="form.titleEn" /></label>
          <label class="admin-editor-label"
            >Text English <MilkdownEditor ref="bodyEditorEn" v-model="form.bodyMdEn"
          /></label>
          <label class="admin-checkbox"
            ><input v-model="form.isEnPublished" type="checkbox" /> English опубліковано</label
          >
        </div>
      </section>
      <AdminGallery v-model="form.mediaIds" />
      <fieldset class="admin-editor-section admin-editor-settings">
        <legend>Налаштування сторінки</legend>
        <div class="admin-editor-settings-grid">
          <label class="admin-checkbox"
            ><input v-model="form.showInMenu" type="checkbox" /> Показувати в меню</label
          >
          <label
            >Порядок у меню <input v-model.number="form.menuOrder" type="number" min="0"
          /></label>
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
