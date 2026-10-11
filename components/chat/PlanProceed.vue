<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { RESEARCH_PLAN as P } from '~/data/mock';
import type { AssistantMsg } from '~/composables/useChat';

// "Would you like to proceed?" in place of the composer, like Claude after a plan: run it, answer directly (the live
// product's "Answer directly"), or keep planning — say what to change and the plan is re-drafted.
const props = defineProps<{ msg: AssistantMsg }>();
const { approvePlan, revisePlan } = useChat();
const OPTS = computed(() => [
  { label: 'Yes, run the research', desc: `${P.steps.length} steps · ${P.sources.length} sources — every statement will cite its source` },
  { label: 'Yes, but answer directly', desc: 'Skip the research steps and answer now' },
  { label: 'No, keep planning', desc: 'Tell femid.ai what to change in the plan' },
]);
const revising = ref(false);
const fb = ref('');
const fbEl = ref();

function pick(_label: string, i: number) {
  if (i === 0) approvePlan(props.msg, { steps: P.steps.length, sources: P.sources.length });
  else if (i === 1) approvePlan(props.msg, 'direct');
  else { revising.value = true; nextTick(() => fbEl.value?.$el?.focus()); }
}
function send() { if (fb.value.trim()) revisePlan(props.msg, fb.value); }
</script>

<template>
  <section class="panel plan-dock" aria-label="Approve the plan">
    <p class="q">Would you like to proceed?</p>
    <PlanChoices :options="OPTS" :selected="revising ? OPTS[2].label : null" autofocus @pick="pick" />
    <div v-if="revising" class="fb">
      <PTextarea ref="fbEl" v-model="fb" class="fb-in" auto-resize rows="2" aria-label="What should change in the plan"
                 placeholder="What should change? For example: also check ECHR practice on access to court"
                 @keydown.enter.exact.prevent="send" @keydown.esc="revising = false" />
      <div class="fb-row">
        <button class="ghost t-label" @click="revising = false">Cancel</button>
        <PButton label="Update plan" :disabled="!fb.trim()" @click="send" />
      </div>
    </div>
    <footer v-else class="foot"><span class="keys">↑↓ choose · Enter confirm</span></footer>
  </section>
</template>

<style scoped>
p { margin: 0; }
.panel { display: grid; gap: 10px; padding: 16px 14px 12px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: 0 2px 20px rgb(0 0 0 / .25); }
.q { padding: 0 2px; color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.fb { display: grid; gap: 8px; padding: 4px 2px 0; }
.fb-in, :deep(.p-textarea.fb-in) { width: 100%; padding: 10px 12px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-accent); background: var(--fd-bg); color: var(--fd-ink);
  font: 400 15px/22px var(--fd-font-sans); resize: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 14%, transparent); }
.fb-row { display: flex; justify-content: flex-end; gap: 8px; }
.ghost { height: 36px; padding: 0 12px; border: 0; border-radius: 999px; background: none; color: var(--fd-muted); cursor: pointer; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.ghost:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.foot { padding: 8px 2px 0; border-top: 1px solid var(--fd-line); }
.keys { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
:global(html.fd-light .plan-dock) { box-shadow: 0 2px 6px rgb(23 24 26 / .05), 0 12px 32px rgb(23 24 26 / .08); }
@media (max-width: 767px) { .foot { display: none; } }
</style>
