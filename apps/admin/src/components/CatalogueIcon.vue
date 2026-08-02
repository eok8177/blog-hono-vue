<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name:
      | 'card'
      | 'search'
      | 'photo'
      | 'folder'
      | 'journal'
      | 'menu'
      | 'close'
      | 'overflow'
      | 'external'
      | 'collection';
    label?: string;
  }>(),
  { label: '' },
);
</script>
<template>
  <svg
    class="catalogue-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-label="props.label || undefined"
    :aria-hidden="props.label ? undefined : 'true'"
    role="img"
  >
    <template v-if="name === 'card'">
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <path d="M7 8h10M7 12h6M7 16h8" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="6.2" />
      <path d="m16 16 4.2 4.2" />
    </template>
    <template v-else-if="name === 'photo'">
      <rect x="3" y="4" width="18" height="16" rx="1" />
      <circle cx="8.5" cy="9" r="1.4" />
      <path d="m4 17 5-5 3.5 3 2.2-2 5.3 5" />
    </template>
    <template v-else-if="name === 'folder' || name === 'collection'">
      <path d="M3 7.5h6l1.8 2H21v8.8a1.7 1.7 0 0 1-1.7 1.7H4.7A1.7 1.7 0 0 1 3 18.3z" />
      <path d="M3 7.5V5.7A1.7 1.7 0 0 1 4.7 4h4l1.8 2H19a2 2 0 0 1 2 2v1.5" />
    </template>
    <template v-else-if="name === 'journal'">
      <path d="M5 4h13a1 1 0 0 1 1 1v15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M7 8h8M7 12h8M7 16h5" />
    </template>
    <template v-else-if="name === 'menu'"><path d="M4 7h16M4 12h16M4 17h16" /></template>
    <template v-else-if="name === 'close'"><path d="m6 6 12 12M18 6 6 18" /></template>
    <template v-else-if="name === 'overflow'">
      <circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else>
      <path d="M14 5h5v5M19 5l-8 8" />
      <path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </template>
  </svg>
</template>
