<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { api } from '../api/client';
import MediaCopyButton from './MediaCopyButton.vue';
import type { MediaImage } from '../utils/media-markdown';

type MediaItem = {
  id: string;
  alt_uk: string;
  alt_en: string | null;
  folder: string;
  status: string;
  url: string;
  r2Key: string;
};

const props = defineProps<{
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const availableMedia = ref<MediaItem[]>([]);
const folderFilter = ref('');

const folders = computed(() => {
  const set = new Set(availableMedia.value.map((m) => m.folder).filter(Boolean));
  return [...set].sort();
});

const hasUnfoldered = computed(() =>
  availableMedia.value.some((m) => !m.folder),
);

const filteredMedia = computed(() => {
  if (!folderFilter.value) return availableMedia.value;
  if (folderFilter.value === '__nofolder__')
    return availableMedia.value.filter((m) => !m.folder);
  return availableMedia.value.filter((m) => m.folder === folderFilter.value);
});

function toMediaImage(item: MediaItem): MediaImage {
  return {
    url: item.url,
    altUk: item.alt_uk,
    altEn: item.alt_en,
  };
}

function toggle(id: string) {
  const ids = new Set(props.modelValue);
  if (ids.has(id)) {
    ids.delete(id);
  } else {
    ids.add(id);
  }
  emit('update:modelValue', [...ids]);
}

onMounted(async () => {
  const response = await api<{ items: MediaItem[] }>('/media');
  availableMedia.value = response.items.filter((item) => item.status === 'ready');
});
</script>

<template>
  <fieldset>
    <legend>Галерея</legend>
    <p v-if="!availableMedia.length">Спочатку завантажте зображення в Медіатеці.</p>
    <template v-else>
      <div class="admin-gallery-toolbar">
        <button
          type="button"
          class="admin-gallery-tab"
          :class="{ 'admin-gallery-tab-active': !folderFilter }"
          @click="folderFilter = ''"
        >
          Усі
        </button>
        <button
          v-for="f in folders"
          :key="f"
          type="button"
          class="admin-gallery-tab"
          :class="{ 'admin-gallery-tab-active': folderFilter === f }"
          @click="folderFilter = f"
        >
          {{ f }}
        </button>
        <button
          v-if="hasUnfoldered"
          type="button"
          class="admin-gallery-tab"
          :class="{ 'admin-gallery-tab-active': folderFilter === '__nofolder__' }"
          @click="folderFilter = '__nofolder__'"
        >
          Без папки
        </button>
      </div>
      <div class="admin-gallery-grid">
        <label
          v-for="item in filteredMedia"
          :key="item.id"
          class="admin-gallery-item"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(item.id)"
            class="admin-gallery-checkbox"
            @change="toggle(item.id)"
          />
          <img
            :src="`/media/${item.id}/480`"
            :alt="item.alt_uk"
            width="240"
            height="160"
            loading="lazy"
            class="admin-gallery-thumb"
          />
          <span class="admin-gallery-name">{{ item.alt_uk }}</span>
          <MediaCopyButton
            :image="toMediaImage(item)"
            class="admin-gallery-copy"
            @click.stop
          />
        </label>
      </div>
    </template>
  </fieldset>
</template>
