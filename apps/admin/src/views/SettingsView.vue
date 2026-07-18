<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';

type SettingKey = 'site' | 'home';
type SettingRow = { key: SettingKey; value_json: string };
type SiteSettings = {
  titleUk: string;
  titleEn: string;
  descriptionUk: string;
  descriptionEn: string;
};
type HomeSettings = {
  heroTitleUk: string;
  heroTitleEn: string;
  introUk: string;
  introEn: string;
  featuredPostIds: string;
};

const settings = useQuery({
  queryKey: ['settings'],
  queryFn: () => api<SettingRow[]>('/settings'),
});
const site = reactive<SiteSettings>({
  titleUk: '',
  titleEn: '',
  descriptionUk: '',
  descriptionEn: '',
});
const home = reactive<HomeSettings>({
  heroTitleUk: '',
  heroTitleEn: '',
  introUk: '',
  introEn: '',
  featuredPostIds: '',
});
const hydrated = ref(false);
const saving = ref<SettingKey>();
const error = ref('');
const message = ref('');
const isLoading = computed(() => settings.isPending.value);

watch(
  () => settings.data.value,
  (rows) => {
    if (!rows || hydrated.value) return;
    for (const row of rows) {
      try {
        const value = JSON.parse(row.value_json) as Record<string, unknown>;
        if (row.key === 'site') {
          Object.assign(site, {
            titleUk: typeof value.titleUk === 'string' ? value.titleUk : '',
            titleEn: typeof value.titleEn === 'string' ? value.titleEn : '',
            descriptionUk: typeof value.descriptionUk === 'string' ? value.descriptionUk : '',
            descriptionEn: typeof value.descriptionEn === 'string' ? value.descriptionEn : '',
          });
        } else {
          Object.assign(home, {
            heroTitleUk: typeof value.heroTitleUk === 'string' ? value.heroTitleUk : '',
            heroTitleEn: typeof value.heroTitleEn === 'string' ? value.heroTitleEn : '',
            introUk: typeof value.introUk === 'string' ? value.introUk : '',
            introEn: typeof value.introEn === 'string' ? value.introEn : '',
            featuredPostIds: Array.isArray(value.featuredPostIds)
              ? value.featuredPostIds
                  .filter((id): id is string => typeof id === 'string')
                  .join('\n')
              : '',
          });
        }
      } catch {
        error.value = `Не вдалося прочитати налаштування «${row.key}».`;
      }
    }
    hydrated.value = true;
  },
  { immediate: true },
);

async function save(key: SettingKey) {
  saving.value = key;
  error.value = '';
  message.value = '';
  const value =
    key === 'site'
      ? site
      : {
          ...home,
          featuredPostIds: home.featuredPostIds
            .split(/\s+/)
            .map((id) => id.trim())
            .filter(Boolean),
        };
  try {
    await api(`/settings`, {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
    message.value = 'Налаштування збережено.';
    await settings.refetch();
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося зберегти налаштування.';
  } finally {
    saving.value = undefined;
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Конфігурація</p>
        <h1>Налаштування</h1>
        <p>Керуйте назвою сайту та контентом головної сторінки.</p>
      </div>
    </div>
    <p v-if="isLoading">Завантаження…</p>
    <p v-else-if="settings.isError.value" role="alert">Не вдалося завантажити налаштування.</p>
    <template v-else>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="message" role="status">{{ message }}</p>
      <form class="admin-editor-form" @submit.prevent="save('site')">
        <h2>Сайт</h2>
        <label>Назва українською <input v-model="site.titleUk" maxlength="250" required /></label>
        <label>Назва English <input v-model="site.titleEn" maxlength="250" /></label>
        <label
          >Опис українською <textarea v-model="site.descriptionUk" maxlength="320" rows="3" />
        </label>
        <label
          >Опис English <textarea v-model="site.descriptionEn" maxlength="320" rows="3" />
        </label>
        <button :disabled="saving === 'site'">
          {{ saving === 'site' ? 'Збереження…' : 'Зберегти сайт' }}
        </button>
      </form>
      <form class="admin-editor-form" @submit.prevent="save('home')">
        <h2>Головна сторінка</h2>
        <label
          >Hero заголовок українською <input v-model="home.heroTitleUk" maxlength="250"
        /></label>
        <label>Hero заголовок English <input v-model="home.heroTitleEn" maxlength="250" /></label>
        <label>Вступ українською <textarea v-model="home.introUk" rows="4" /></label>
        <label>Вступ English <textarea v-model="home.introEn" rows="4" /></label>
        <label
          >Featured post IDs
          <textarea v-model="home.featuredPostIds" rows="3" placeholder="один UUID на рядок" />
        </label>
        <button :disabled="saving === 'home'">
          {{ saving === 'home' ? 'Збереження…' : 'Зберегти головну' }}
        </button>
      </form>
    </template>
  </section>
</template>
