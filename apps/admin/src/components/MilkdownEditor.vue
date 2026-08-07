<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { Crepe } from '@milkdown/crepe';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/nord.css';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const editorRoot = ref<HTMLDivElement | null>(null);

let crepe: Crepe | null = null;

onMounted(async () => {
  if (!editorRoot.value) {
    return;
  }

  crepe = new Crepe({
    root: editorRoot.value,
    defaultValue: props.modelValue ?? '',
    features: {
      [Crepe.Feature.Cursor]: false,
      [Crepe.Feature.ImageBlock]: false,
    },
  });

  crepe.on((listener) => {
    listener.markdownUpdated((_ctx, markdown, previousMarkdown) => {
      if (markdown !== previousMarkdown) {
        emit('update:modelValue', markdown);
      }
    });
  });

  await crepe.create();
});

onBeforeUnmount(() => {
  const instance = crepe;
  crepe = null;

  if (instance) {
    void instance.destroy();
  }
});

defineExpose({
  getContent: () => crepe?.getMarkdown() ?? '',
});
</script>

<template>
  <div ref="editorRoot" class="milkdown-editor-host" />
</template>
