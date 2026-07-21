<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/nord.css';

const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const editorRoot = ref<HTMLDivElement>();
let crepe: Crepe | undefined;
const ready = ref(false);

onMounted(async () => {
  if (!editorRoot.value) return;
  crepe = new Crepe({
    root: editorRoot.value,
    defaultValue: props.modelValue,
  });

  // Register change listener before creating
  crepe.on((listener) => {
    listener.markdownUpdated((_ctx, markdown) => {
      emit('update:modelValue', markdown);
    });
  });

  await crepe.create();
  ready.value = true;
});

onBeforeUnmount(async () => {
  if (crepe) {
    await crepe.destroy();
    crepe = undefined;
  }
});

// Sync external changes into the editor (only after editor is ready)
watch(
  [() => props.modelValue, ready],
  ([value, isReady]) => {
    if (!isReady || !crepe) return;
    const current = crepe.getMarkdown();
    if (value !== current) {
      crepe.editor.action(replaceAll(value));
    }
  },
);

defineExpose({
  getContent: () => crepe?.getMarkdown() ?? '',
});
</script>

<template>
  <div ref="editorRoot" class="milkdown-editor-host" />
</template>
