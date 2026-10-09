<script setup lang="ts">
const emit = defineEmits<{ (e: 'suggest', q: string): void }>();
const ideas = ['Rephrase with the article or law name', 'Narrow it to one situation', 'Search court practice instead'];
</script>

<template>
  <div class="refusal">
    <div class="head">
      <span class="mark"><i class="pi pi-shield" /></span>
      <h3 class="t-label">No source found — so no answer</h3>
    </div>
    <p class="t-body-sm muted">
      We only answer when we can point to a law, a court decision or ECHR practice. For this question we found nothing we can stand behind, so we won’t guess. Your question wasn’t&nbsp;counted.
    </p>
    <div class="ideas">
      <button v-for="i in ideas" :key="i" class="idea t-body-sm" @click="emit('suggest', i)">{{ i }}<i class="pi pi-arrow-right" /></button>
    </div>
  </div>
</template>

<style scoped>
.refusal { display: grid; gap: 12px; padding: 20px; border-radius: var(--fd-radius-lg); background: var(--fd-panel); border: 1px solid var(--fd-line); }
.head { display: flex; align-items: center; gap: 12px; }
.head h3 { margin: 0; font-size: 17px; color: var(--fd-ink); }
.mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
p { margin: 0; }
.ideas { display: flex; flex-wrap: wrap; gap: 8px; }
.idea {
  display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: var(--fd-radius-md);
  border: 1px solid var(--fd-line); background: var(--fd-panel-2); color: var(--fd-ink); cursor: pointer;
}
.idea .pi { font-size: 11px; color: var(--fd-muted); }
.idea:hover { border-color: color-mix(in srgb, var(--fd-accent) 50%, transparent); }
</style>
