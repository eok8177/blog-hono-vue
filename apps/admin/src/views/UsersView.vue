<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  is_active: number;
};

const client = useQueryClient();
const users = useQuery({
  queryKey: ['users'],
  queryFn: () => api<{ items: User[]; total: number }>('/users'),
});
const items = computed(() => users.data.value?.items ?? []);
const selectedId = ref<string>();
const error = ref('');
const form = reactive({ email: '', name: '', role: 'editor' as User['role'], isActive: true });

function edit(user: User) {
  selectedId.value = user.id;
  error.value = '';
  Object.assign(form, {
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: Boolean(user.is_active),
  });
}
function cancel() {
  selectedId.value = undefined;
  error.value = '';
}
const save = useMutation({
  mutationFn: () =>
    api<{ id: string }>(`/users/${selectedId.value}`, {
      method: 'PUT',
      body: JSON.stringify(form),
    }),
  onSuccess: async () => {
    cancel();
    await client.invalidateQueries({ queryKey: ['users'] });
  },
  onError: (cause) => {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося зберегти користувача.';
  },
});

async function remove(user: User) {
  if (!confirm(`Видалити користувача «${user.email}»?`)) return;
  error.value = '';
  try {
    await api(`/users/${user.id}`, { method: 'DELETE' });
    await client.invalidateQueries({ queryKey: ['users'] });
  } catch (cause) {
    error.value = cause instanceof ApiError ? cause.message : 'Не вдалося видалити користувача.';
  }
}
</script>
<template>
  <section>
    <h1>Користувачі</h1>
    <p v-if="error" role="alert">{{ error }}</p>
    <form v-if="selectedId" @submit.prevent="save.mutate()">
      <h2>Редагування користувача</h2>
      <label>Email <input v-model="form.email" type="email" required /></label>
      <label>Ім'я <input v-model="form.name" required /></label>
      <label
        >Роль
        <select v-model="form.role">
          <option value="editor">Редактор</option>
          <option value="admin">Адміністратор</option>
        </select>
      </label>
      <label><input v-model="form.isActive" type="checkbox" /> Активний</label>
      <button :disabled="save.isPending.value">
        {{ save.isPending.value ? 'Збереження…' : 'Зберегти' }}
      </button>
      <button type="button" @click="cancel">Скасувати</button>
    </form>
    <p v-if="users.isPending.value">Завантаження…</p>
    <p v-else-if="users.isError.value" role="alert">
      Немає доступу або не вдалося завантажити список.
    </p>
    <table v-else>
      <thead>
        <tr>
          <th>Email</th>
          <th>Ім'я</th>
          <th>Роль</th>
          <th>Активний</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in items" :key="user.id">
          <td>{{ user.email }}</td>
          <td>{{ user.name }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.is_active ? 'Так' : 'Ні' }}</td>
          <td>
            <button type="button" @click="edit(user)">Редагувати</button>
            <button type="button" @click="remove(user)">Видалити</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
