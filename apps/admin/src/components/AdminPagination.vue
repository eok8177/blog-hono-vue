<script setup lang="ts">
defineProps<{
  page: number;
  totalPages: number;
}>();

const emit = defineEmits<{
  (e: 'update:page', page: number): void;
}>();
</script>
<template>
  <div v-if="totalPages > 0" class="admin-pagination">
    <span>Сторінка {{ page }} з {{ totalPages }}</span>
    <div>
      <button type="button" :disabled="page === 1" @click="emit('update:page', page - 1)">
        Назад
      </button>
      <button type="button" :disabled="page >= totalPages" @click="emit('update:page', page + 1)">
        Далі
      </button>
    </div>
  </div>
</template>
