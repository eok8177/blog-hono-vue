<script setup lang="ts">
import { ref } from 'vue';
import { copyImageMarkdown, type MediaImage } from '../utils/media-markdown';

const props = defineProps<{
  image: MediaImage;
}>();

const copied = ref(false);
const errorMessage = ref('');

let resetTimer: ReturnType<typeof setTimeout> | undefined;

async function handleCopy(): Promise<void> {
  copied.value = false;
  errorMessage.value = '';

  try {
    await copyImageMarkdown(props.image);

    copied.value = true;

    if (resetTimer) {
      clearTimeout(resetTimer);
    }

    resetTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    errorMessage.value = 'Не вдалося скопіювати Markdown';

    console.error('Failed to copy image Markdown:', error);
  }
}
</script>

<template>
  <div class="media-copy-action">
    <button type="button" class="media-copy-button" @click="handleCopy">
      {{ copied ? 'Скопійовано' : 'Скопіювати' }}
    </button>

    <p v-if="errorMessage" class="media-copy-error" role="alert">
      {{ errorMessage }}
    </p>
  </div>
</template>
