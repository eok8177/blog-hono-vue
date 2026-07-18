<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';
const route = useRoute(),
  router = useRouter(),
  id = typeof route.params.id === 'string' ? route.params.id : undefined;
const form = reactive({
  slug: '',
  titleUk: '',
  titleEn: '',
  bodyMdUk: '',
  bodyMdEn: '',
  status: 'draft',
  isEnPublished: false,
  categoryIds: [] as string[],
});
const error = ref('');
const saving = ref(false);
async function save() {
  saving.value = true;
  error.value = '';
  try {
    const path = id ? `/posts/${id}` : '/posts';
    await api(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(form) });
    await router.push('/posts');
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Помилка збереження';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <section>
    <h1>{{ id ? 'Редагування' : 'Нова публікація' }}</h1>
    <form @submit.prevent="save">
      <p v-if="error" role="alert">{{ error }}</p>
      <label>Slug <input v-model="form.slug" required pattern="[a-z0-9-]+" /></label
      ><label>Український заголовок <input v-model="form.titleUk" required /></label
      ><label>Український текст <textarea v-model="form.bodyMdUk" required rows="12" /></label>
      <fieldset>
        <legend>English</legend>
        <label>Title <input v-model="form.titleEn" /></label
        ><label>Body <textarea v-model="form.bodyMdEn" rows="8" /></label
        ><label><input v-model="form.isEnPublished" type="checkbox" /> Опублікувати English</label>
      </fieldset>
      <label
        >Статус
        <select v-model="form.status">
          <option>draft</option>
          <option>published</option>
          <option>archived</option>
        </select></label
      ><button :disabled="saving">{{ saving ? 'Збереження…' : 'Зберегти' }}</button>
    </form>
  </section>
</template>
