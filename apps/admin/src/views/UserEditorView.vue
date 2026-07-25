<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api, ApiError } from '../api/client';

const route = useRoute();
const router = useRouter();
const id = typeof route.params.id === 'string' ? route.params.id : undefined;

const form = reactive({
  email: '',
  name: '',
  role: 'editor' as 'admin' | 'editor',
  isActive: true,
});
const error = ref('');
const saving = ref(false);
const loading = ref(Boolean(id));

type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  is_active: number;
};

onMounted(async () => {
  if (!id) return;
  try {
    const user = await api<StoredUser>(`/users/${id}`);
    Object.assign(form, {
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: Boolean(user.is_active),
    });
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Не вдалося завантажити користувача.';
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  error.value = '';
  try {
    await api(id ? `/users/${id}` : '/users', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(form),
    });
    await router.push('/users');
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'Помилка збереження';
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <section>
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Доступ</p>
        <h1>{{ id ? 'Редагування користувача' : 'Новий користувач' }}</h1>
        <p>Заповніть профіль користувача.</p>
      </div>
      <RouterLink class="admin-secondary-button button" to="/users">← До списку</RouterLink>
    </div>
    <p v-if="loading" class="admin-state">Завантаження…</p>
    <form v-else class="admin-editor-form" @submit.prevent="save">
      <p v-if="error" role="alert">{{ error }}</p>
      <label>Email <input v-model="form.email" type="email" required /></label
      ><label>Ім'я <input v-model="form.name" required /></label
      ><label
        >Роль
        <select v-model="form.role">
          <option value="editor">Редактор</option>
          <option value="admin">Адміністратор</option>
        </select></label
      ><label class="admin-checkbox"
        ><input v-model="form.isActive" type="checkbox" /> Активний</label
      >
      <button :disabled="saving">{{ saving ? 'Збереження…' : 'Зберегти' }}</button>
    </form>
  </section>
</template>
