<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { RESEARCH_PLAN as P } from '~/data/mock';
import type { AssistantMsg } from '~/composables/useChat';

// Clarifying questions in place of the composer, like Claude's question picker: a tab per question + Submit, numbered
// options (or "Type something"), picking one moves on. All optional: Skip / Esc goes straight to the plan.
const props = defineProps<{ msg: AssistantMsg }>();
const { answerQuestions } = useChat();
const Q = P.questions;
const idx = ref(0);
const picks = ref<(string | null)[]>(Q.map(() => null));
const review = computed(() => idx.value === Q.length);
const cur = computed(() => Q[Math.min(idx.value, Q.length - 1)]);
const answered = computed(() => picks.value.filter(Boolean).length);
const submitBtn = ref();

function pick(label: string) {
  picks.value[idx.value] = label;
  setTimeout(() => { idx.value = Math.min(Q.length, idx.value + 1); }, 160); // a beat to see the choice
}
function submit() { answerQuestions(props.msg, Q.map((q, i) => ({ h: q.h, a: picks.value[i] || '' })).filter((a) => a.a)); }
function skip() { answerQuestions(props.msg, []); }
function onKey(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement).tagName === 'INPUT';
  if (e.key === 'Escape') { e.preventDefault(); skip(); }
  else if (!typing && e.key === 'ArrowRight') { e.preventDefault(); idx.value = Math.min(Q.length, idx.value + 1); }
  else if (!typing && e.key === 'ArrowLeft') { e.preventDefault(); idx.value = Math.max(0, idx.value - 1); }
}
watch(review, (v) => { if (v) nextTick(() => submitBtn.value?.$el?.focus({ preventScroll: true })); });
</script>

<template>
  <section class="panel plan-dock" aria-label="Clarifying questions" @keydown="onKey">
    <nav class="tabs" aria-label="Questions">
      <button v-for="(q, i) in Q" :key="q.h" class="tab" :class="{ on: idx === i, done: !!picks[i] }" :aria-current="idx === i" @click="idx = i">
        <i class="pi" :class="picks[i] ? 'pi-check-circle' : 'pi-circle'" />{{ q.h }}
      </button>
      <button class="tab" :class="{ on: review }" :aria-current="review" @click="idx = Q.length"><i class="pi pi-send" />Submit</button>
    </nav>

    <div v-if="!review" :key="idx" class="body">
      <p class="q">{{ cur.q }}</p>
      <p v-if="cur.hint" class="hint">{{ cur.hint }}</p>
      <PlanChoices :options="cur.options" :selected="picks[idx]" other autofocus @pick="pick" />
    </div>
    <div v-else class="body">
      <p class="q">Review your answers</p>
      <ul class="review">
        <li v-for="(q, i) in Q" :key="q.h">
          <button class="r-row" @click="idx = i"><span class="r-h">{{ q.h }}</span><span class="r-a" :class="{ none: !picks[i] }">{{ picks[i] || 'Not answered' }}</span><i class="pi pi-pencil" /></button>
        </li>
      </ul>
    </div>

    <footer class="foot">
      <span class="keys">↑↓ choose · Enter select · Esc skip</span>
      <button class="ghost t-label" @click="skip">Skip questions</button>
      <PButton v-if="review" ref="submitBtn" :label="answered ? 'Submit answers' : 'Continue without answers'" @click="submit" />
      <PButton v-else label="Next" severity="secondary" icon="pi pi-arrow-right" icon-pos="right" @click="idx = Math.min(Q.length, idx + 1)" />
    </footer>
  </section>
</template>

<style scoped>
p, ul { margin: 0; }
.panel { display: grid; gap: 14px; padding: 14px 14px 12px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: 0 2px 20px rgb(0 0 0 / .25); }
.tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
.tab { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; height: 30px; padding: 0 12px; border: 1px solid transparent; border-radius: 999px; background: none;
  color: var(--fd-muted); cursor: pointer; white-space: nowrap; font: 500 13px/18px var(--fd-font-sans); }
.tab .pi { font-size: 11px; }
.tab:hover { color: var(--fd-ink); }
.tab.done .pi { color: var(--fd-accent-text); }
.tab.on { border-color: var(--fd-line); background: var(--fd-panel-2); color: var(--fd-ink); }
.tab:focus-visible, .ghost:focus-visible, .r-row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.body { display: grid; gap: 8px; padding: 0 2px; }
.q { color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.hint { margin-top: -4px; margin-bottom: 2px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.review { display: grid; gap: 2px; padding: 0; list-style: none; }
.r-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 9px 12px; border: 0; border-radius: var(--fd-radius-md); background: none; cursor: pointer; text-align: left; }
.r-row:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.r-h { width: 96px; flex-shrink: 0; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.r-a { flex: 1; min-width: 0; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.r-a.none { color: var(--fd-muted); }
.r-row .pi { color: var(--fd-muted); font-size: 11px; opacity: 0; } .r-row:hover .pi { opacity: 1; }
.foot { display: flex; align-items: center; gap: 8px; padding-top: 10px; border-top: 1px solid var(--fd-line); }
.keys { margin-right: auto; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.ghost { height: 36px; padding: 0 12px; border: 0; border-radius: 999px; background: none; color: var(--fd-muted); cursor: pointer; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
:global(html.fd-light .plan-dock) { box-shadow: 0 2px 6px rgb(23 24 26 / .05), 0 12px 32px rgb(23 24 26 / .08); }
@media (max-width: 767px) {
  .keys { display: none; }
  .ghost { margin-right: auto; padding-left: 4px; }
}
</style>
