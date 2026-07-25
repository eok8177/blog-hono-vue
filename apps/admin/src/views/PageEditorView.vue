<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';
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

type Media = { id: string; alt_uk: string; folder: string; status: string };
const availableMedia = ref<Media[]>([]);
const galleryFolderFilter = ref('');
const galleryFolders = computed(() => {
  const folders = new Set(availableMedia.value.map((m) => m.folder).filter(Boolean));
  return [...folders].sort();
});
const hasUnfoldered = computed(() => availableMedia.value.some((m) => !m.folder));
const filteredGalleryMedia = computed(() => {
  if (!galleryFolderFilter.value) return availableMedia.value;
  if (galleryFolderFilter.value === '__nofolder__')
    return availableMedia.value.filter((m) => !m.folder);
  return availableMedia.value.filter((m) => m.folder === galleryFolderFilter.value);
});

onMounted(async () => {
  try {
    const media = await api<{ items: Media[] }>('/media');
    availableMedia.value = media.items.filter((item) => item.status === 'ready');
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
      <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label>
      <div class="admin-form-grid">
        <label>Назва українською <input v-model="form.titleUk" required /></label>
        <label>Title English <input v-model="form.titleEn" /></label>
        <label
          >Шаблон
          <select v-model="form.template">
            <option>default</option>
            <option>about</option>
            <option>contact</option>
          </select></label
        >
      </div>
      <div class="admin-editor-columns">
        <label class="admin-editor-label"
          >Текст українською
          <MilkdownEditor ref="bodyEditorUk" v-model="form.bodyMdUk" /></label
        ><label class="admin-editor-label"
          >Text English <MilkdownEditor ref="bodyEditorEn" v-model="form.bodyMdEn"
        /></label>
      </div>
      <fieldset>
        <legend>Галерея</legend>
        <p v-if="!availableMedia.length">Спочатку завантажте зображення в Медіатеці.</p>
        <template v-else>
          <div class="admin-gallery-toolbar">
            <button
              type="button"
              class="admin-gallery-tab"
              :class="{ 'admin-gallery-tab-active': !galleryFolderFilter }"
              @click="galleryFolderFilter = ''"
            >
              Усі
            </button>
            <button
              v-for="f in galleryFolders"
              :key="f"
              type="button"
              class="admin-gallery-tab"
              :class="{ 'admin-gallery-tab-active': galleryFolderFilter === f }"
              @click="galleryFolderFilter = f"
            >
              {{ f }}
            </button>
            <button
              v-if="hasUnfoldered"
              type="button"
              class="admin-gallery-tab"
              :class="{ 'admin-gallery-tab-active': galleryFolderFilter === '__nofolder__' }"
              @click="galleryFolderFilter = '__nofolder__'"
            >
              Без папки
            </button>
          </div>
          <div class="admin-gallery-grid">
            <label
              v-for="media in filteredGalleryMedia"
              :key="media.id"
              class="admin-gallery-item"
            >
              <input
                v-model="form.mediaIds"
                type="checkbox"
                :value="media.id"
                class="admin-gallery-checkbox"
              />
              <img
                :src="`/media/${media.id}/480`"
                :alt="media.alt_uk"
                width="240"
                height="160"
                loading="lazy"
                class="admin-gallery-thumb"
              />
              <span class="admin-gallery-name">{{ media.alt_uk }}</span>
            </label>
          </div>
        </template>
      </fieldset>
      <div class="admin-form-actions">
        <label class="admin-checkbox"
          ><input v-model="form.showInMenu" type="checkbox" /> Показувати в меню</label
        >
        <label class="admin-checkbox"
          ><input v-model="form.isEnPublished" type="checkbox" /> English опубліковано</label
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
    </form>
  </section>
</template>
