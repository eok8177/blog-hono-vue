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
    <div class="admin-page-heading">
      <div>
        <p class="admin-eyebrow">Доступ</p>
        <h1>Користувачі</h1>
        <p>Керуйте редакторами та адміністраторами архіву.</p>
      </div>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
    <form v-if="selectedId" class="admin-editor-form" @submit.prevent="save.mutate()">
      <div class="admin-form-heading">
        <div>
          <p class="admin-eyebrow">Профіль</p>
          <h2>Редагування користувача</h2>
        </div>
        <button type="button" class="admin-close-button" @click="cancel">×</button>
      </div>
      <div class="admin-form-grid">
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
      </div>
      <div class="admin-form-actions">
        <button :disabled="save.isPending.value">
          {{ save.isPending.value ? 'Збереження…' : 'Зберегти' }}</button
        ><button type="button" class="admin-secondary-button" @click="cancel">Скасувати</button>
      </div>
    </form>
    <p v-if="users.isPending.value" class="admin-state">Завантаження…</p>
    <p v-else-if="users.isError.value" class="admin-state" role="alert">
      Немає доступу або не вдалося завантажити список.
    </p>
    <p v-else-if="!items.length" class="admin-state admin-list-card">Користувачів ще немає.</p>
    <div v-else class="admin-list-card admin-table-scroll">
      <table class="admin-data-table">
        <thead>
          <tr>
            <th>Користувач</th>
            <th>Роль</th>
            <th>Статус</th>
            <th class="admin-actions-heading">Дії</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in items" :key="user.id">
            <td>
              <div class="admin-primary-cell">
                <strong>{{ user.name }}</strong
                ><span>{{ user.email }}</span>
              </div>
            </td>
            <td>
              <span
                class="admin-status-badge"
                :class="user.role === 'admin' ? 'admin-status-published' : 'admin-status-draft'"
                >{{ user.role === 'admin' ? 'Адміністратор' : 'Редактор' }}</span
              >
            </td>
            <td>
              <span
                class="admin-status-badge"
                :class="user.is_active ? 'admin-status-published' : 'admin-status-archived'"
                >{{ user.is_active ? 'Активний' : 'Неактивний' }}</span
              >
            </td>
            <td class="admin-actions-cell">
              <button
                type="button"
                class="admin-row-link admin-secondary-button"
                @click="edit(user)"
              >
                Редагувати</button
              ><button type="button" class="admin-danger-button" @click="remove(user)">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
