<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import CatalogueIcon from './CatalogueIcon.vue';

defineProps<{
  editTo: string;
  previewHref?: string;
  publicHref?: string;
  published?: boolean;
  canDelete?: boolean;
}>();
const emit = defineEmits<{ (event: 'delete'): void }>();
const open = ref(false);
const menu = ref();
const button = ref();
function close() {
  open.value = false;
}
function onKey(event: Event) {
  if ((event as { key?: string }).key === 'Escape') {
    close();
    nextTick(() => button.value?.focus());
  }
}
function onDocumentClick(event: Event) {
  if (
    menu.value &&
    !(menu.value as { contains: (target: unknown) => boolean }).contains(event.target)
  )
    close();
}
watch(open, (value) => {
  if (value) {
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onDocumentClick);
  } else {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('click', onDocumentClick);
  }
});
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('click', onDocumentClick);
});
</script>
<template>
  <div ref="menu" class="catalogue-action-menu">
    <button
      ref="button"
      type="button"
      class="catalogue-menu-trigger"
      aria-label="Відкрити дії"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click.stop="open = !open"
    >
      <CatalogueIcon name="overflow" />
    </button>
    <div v-if="open" class="catalogue-menu" role="menu">
      <RouterLink :to="editTo" role="menuitem" @click="close">Редагувати</RouterLink>
      <a
        v-if="published && publicHref"
        :href="publicHref"
        target="_blank"
        rel="noopener"
        role="menuitem"
        @click="close"
        >Переглянути <CatalogueIcon name="external"
      /></a>
      <a
        v-else-if="previewHref"
        :href="previewHref"
        target="_blank"
        rel="noopener"
        role="menuitem"
        @click="close"
        >Preview <CatalogueIcon name="external"
      /></a>
      <button
        v-if="canDelete"
        type="button"
        role="menuitem"
        class="catalogue-menu-danger"
        @click="
          close();
          emit('delete');
        "
      >
        Видалити назавжди
      </button>
    </div>
  </div>
</template>
