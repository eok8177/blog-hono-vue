<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { api, ApiError } from '../api/client';
import AdminPagination from '../components/AdminPagination.vue';

type User = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor';
  is_active: number;
};

const client = useQueryClient();
const error = ref('');
const page = ref(1);
const pageSize = 10;
const users = useQuery({
  queryKey: computed(() => ['users', page.value]),
  queryFn: () =>
    api<{ items: User[]; total: number }>(`/users?page=${page.value}&pageSize=${pageSize}`),
});
const items = computed(() => users.data.value?.items ?? []);
const totalPages = computed(() =>
  Math.max(1, Math.ceil((users.data.value?.total ?? 0) / pageSize)),
);

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
      <RouterLink class="button" to="/users/new">+ Створити користувача</RouterLink>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
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
              <RouterLink class="admin-row-link" :to="`/users/${user.id}`">Редагувати</RouterLink>
              <button type="button" class="admin-danger-button" @click="remove(user)">
                Видалити
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminPagination :page="page" :total-pages="totalPages" @update:page="page = $event" />
    </div>
  </section>
</template>
