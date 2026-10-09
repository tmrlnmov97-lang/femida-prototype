<script setup lang="ts">
import { ref } from 'vue';
import { PLAN_STEPS } from '~/data/mock';
const emit = defineEmits<{ (e: 'approve'): void }>();
const editing = ref(false);
const steps = ref([...PLAN_STEPS]);
</script>

<template>
  <div class="plan">
    <div class="head">
      <span class="mark"><i class="pi pi-list-check" /></span>
      <div class="titles">
        <h3 class="t-label">Research plan</h3>
        <p class="t-caption muted">Review it — the answer comes after you approve.</p>
      </div>
    </div>
    <ol class="steps">
      <li v-for="(s, i) in steps" :key="i">
        <span class="n t-caption">{{ i + 1 }}</span>
        <input v-if="editing" v-model="steps[i]" class="edit t-body-sm" :aria-label="`Step ${i + 1}`" />
        <span v-else class="t-body-sm">{{ s }}</span>
      </li>
    </ol>
    <div class="actions">
      <PButton label="Approve and answer" icon="pi pi-arrow-right" icon-pos="right" size="small" @click="emit('approve')" />
      <PButton :label="editing ? 'Done editing' : 'Edit plan'" :icon="editing ? 'pi pi-check' : 'pi pi-pencil'" severity="secondary" size="small" @click="editing = !editing" />
    </div>
  </div>
</template>

<style scoped>
.plan { display: grid; gap: 14px; padding: 20px; border-radius: var(--fd-radius-lg); background: var(--fd-panel); border: 1px solid var(--fd-line); }
.head { display: flex; align-items: center; gap: 12px; }
.mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); flex-shrink: 0; }
.titles { display: grid; gap: 2px; }
h3, p { margin: 0; } h3 { font-size: 17px; }
.steps { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; counter-reset: s; }
.steps li { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: var(--fd-radius-md); background: var(--fd-panel-2); }
.n { display: grid; place-items: center; min-width: 22px; height: 22px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--fd-accent) 50%, transparent); color: var(--fd-accent-text); }
.edit { flex: 1; min-width: 0; padding: 4px 8px; border-radius: var(--fd-radius-sm); border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; }
.edit:focus { border-color: var(--fd-accent); }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
