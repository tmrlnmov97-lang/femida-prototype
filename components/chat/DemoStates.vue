<script setup lang="ts">
import { ref } from 'vue';
const { demo } = useChat();
const open = ref(false);
const router = useRouter();
const STATES = [
  ['empty', 'Empty'], ['searching', 'Searching'], ['streaming', 'Streaming'], ['answer', 'Answer + sources'], ['fragment', 'Source fragment'],
  ['deep', 'Deep research'], ['plan', 'Plan first (review)'], ['refused', 'Refused (no source)'], ['error-temporary', 'Error · temporary'], ['error-quota', 'Error · quota'],
  ['error-service', 'Error · service'], ['low', 'Few credits left'], ['out', 'Out of credits'],
];
function pick(id: string) { open.value = false; router.replace({ query: id === 'empty' ? {} : { demo: id } }); demo(id); }
</script>

<template>
  <div class="demo">
    <Transition name="pop">
      <div v-if="open" class="menu" role="menu">
        <div class="menu-title t-eyebrow">Reviewer · states</div>
        <button v-for="[id, label] in STATES" :key="id" class="menu-item t-label" role="menuitem" @click="pick(id)">{{ label }}</button>
      </div>
    </Transition>
    <button class="toggle t-caption" :aria-expanded="open" @click="open = !open"><i class="pi pi-sliders-h" />States</button>
  </div>
</template>

<style scoped>
.demo { position: fixed; left: 16px; bottom: 16px; z-index: 50; }
.menu { left: 0; min-width: 220px; max-height: 70vh; overflow: auto; }
.menu-item { padding: 7px 12px; }
.toggle {
  display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; cursor: pointer;
  border: 1px dashed var(--fd-line); background: var(--fd-panel); color: var(--fd-muted);
}
.toggle:hover { color: var(--fd-ink); }
@media (max-width: 767px) { .demo { left: 12px; bottom: 12px; } }
</style>
