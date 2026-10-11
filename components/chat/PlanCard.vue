<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { RESEARCH_PLAN as P } from '~/data/mock';
import type { PlanApproval } from '~/composables/useChat';

// Plan first — the research plan to review before the answer (live product, 11.10.2026). Sections and hints are 1:1 with the
// live card: Goal · Legal issues to resolve · Sources to check · Questions for you · Research steps · Assumptions, then
// "Answer directly" / "Approve and run". Everything is editable; answers to the questions are used as facts of the question.
const props = defineProps<{ noQuestions?: boolean }>();
const emit = defineEmits<{ (e: 'approve', how: PlanApproval): void }>();
const root = ref<HTMLElement>();

let uid = 100;
const issues = ref(P.issues.map((text, i) => ({ id: i, text })));
const sources = ref(P.sources.map((s, i) => ({ id: i, ...s, on: true })));
const answers = ref(P.questions.map(() => ''));
const steps = ref(P.steps.map((text, i) => ({ id: i, text, on: true })));
const allIssues = ref(false), allSources = ref(false);
const ISSUES_SHOWN = 4, SOURCES_SHOWN = 3;
const shownIssues = computed(() => (allIssues.value ? issues.value : issues.value.slice(0, ISSUES_SHOWN)));
const shownSources = computed(() => (allSources.value ? sources.value : sources.value.slice(0, SOURCES_SHOWN)));
const onSources = computed(() => sources.value.filter((s) => s.on).length);
const onSteps = computed(() => steps.value.filter((s) => s.on && s.text.trim()).length);

function focusLast(list: string) {
  nextTick(() => {
    const all = root.value?.querySelectorAll<HTMLTextAreaElement>(`[data-list="${list}"] textarea`);
    all?.[all.length - 1]?.focus();
  });
}
function addIssue() { issues.value.push({ id: uid++, text: '' }); allIssues.value = true; focusLast('issues'); }
function addStep() { steps.value.push({ id: uid++, text: '', on: true }); focusLast('steps'); }
function run() { emit('approve', { steps: onSteps.value, sources: onSources.value }); }
</script>

<template>
  <div ref="root" class="plan">
    <header class="head">
      <span class="mark"><i class="pi pi-list-check" /></span>
      <h3 class="title">Research plan</h3>
    </header>
    <div class="notes">
      <p class="note"><i class="pi pi-info-circle" />This is a research plan, not legal advice. The answer will cite verified sources&nbsp;only.</p>
      <p class="note warn"><i class="pi pi-exclamation-triangle" />Items that stated the law were left out of the&nbsp;plan.</p>
    </div>

    <!-- Goal -->
    <section class="sec">
      <h4 class="sec-h">Goal</h4>
      <p class="goal">{{ P.goal }}</p>
    </section>

    <!-- Legal issues -->
    <section class="sec">
      <h4 class="sec-h">Legal issues to resolve <span class="count">· {{ issues.length }}</span></h4>
      <TransitionGroup tag="ol" name="row" class="rows" data-list="issues">
        <li v-for="(it, i) in shownIssues" :key="it.id" class="row">
          <span class="num">{{ i + 1 }}</span>
          <PTextarea v-model="it.text" class="field" auto-resize rows="1" :aria-label="`Issue ${i + 1}`" />
          <button class="x" aria-label="Remove the issue" v-tooltip.top="'Remove'" @click="issues.splice(issues.indexOf(it), 1)"><i class="pi pi-times" /></button>
        </li>
      </TransitionGroup>
      <div class="sec-foot">
        <button v-if="issues.length > ISSUES_SHOWN" class="link" @click="allIssues = !allIssues">{{ allIssues ? 'Show less' : `Show all ${issues.length}` }}</button>
        <button class="add" @click="addIssue"><i class="pi pi-plus" />Add an issue</button>
      </div>
    </section>

    <!-- Sources -->
    <section class="sec">
      <h4 class="sec-h">Sources to check <span class="count">· {{ sources.length }}</span></h4>
      <p class="hint">Untick a source to leave it&nbsp;out.</p>
      <ul class="srcs">
        <li v-for="s in shownSources" :key="s.id">
          <label class="src" :class="{ off: !s.on }">
            <input v-model="s.on" type="checkbox" class="cb" />
            <i class="pi pi-file doc" />
            <span class="src-txt"><span class="src-t">{{ s.act }}, {{ s.article }}</span><span class="src-m">{{ s.meta }}</span><span class="src-n">{{ s.note }}</span></span>
          </label>
        </li>
      </ul>
      <div v-if="sources.length > SOURCES_SHOWN" class="sec-foot">
        <button class="link" @click="allSources = !allSources">{{ allSources ? 'Show less' : `Show all ${sources.length}` }}</button>
      </div>
    </section>

    <!-- Questions -->
    <section v-if="!props.noQuestions" class="sec">
      <h4 class="sec-h">Questions for you</h4>
      <p class="hint">Optional. Your answers are used as facts of the&nbsp;question.</p>
      <div class="qs">
        <label v-for="(q, i) in P.questions" :key="i" class="q">
          <span class="q-t">{{ q.q }}</span>
          <span v-if="q.hint" class="q-h">{{ q.hint }}</span>
          <PTextarea v-model="answers[i]" class="field" auto-resize rows="1" placeholder="Your answer" />
        </label>
      </div>
    </section>

    <!-- Research steps -->
    <section class="sec">
      <h4 class="sec-h">Research steps</h4>
      <TransitionGroup tag="ol" name="row" class="rows" data-list="steps">
        <li v-for="(st, i) in steps" :key="st.id" class="row" :class="{ off: !st.on }">
          <input v-model="st.on" type="checkbox" class="cb" :aria-label="`Run step ${i + 1}`" />
          <PTextarea v-model="st.text" class="field" auto-resize rows="1" :aria-label="`Step ${i + 1}`" />
          <button class="x" aria-label="Remove the step" v-tooltip.top="'Remove'" @click="steps.splice(i, 1)"><i class="pi pi-times" /></button>
        </li>
      </TransitionGroup>
      <div class="sec-foot">
        <button class="add" @click="addStep"><i class="pi pi-plus" />Add a step</button>
      </div>
    </section>

    <!-- Assumptions -->
    <section class="sec">
      <h4 class="sec-h">Assumptions</h4>
      <ul class="assume"><li v-for="a in P.assumptions" :key="a">{{ a }}</li></ul>
    </section>

    <!-- Actions stay in view while the plan scrolls -->
    <footer class="foot">
      <span class="sum">{{ onSteps }} {{ onSteps === 1 ? 'step' : 'steps' }} · {{ onSources }} {{ onSources === 1 ? 'source' : 'sources' }}</span>
      <PButton label="Answer directly" icon="pi pi-bolt" severity="secondary" @click="emit('approve', 'direct')" />
      <PButton label="Approve and run" icon="pi pi-play" :disabled="!onSteps" @click="run" />
    </footer>
  </div>
</template>

<style scoped>
h3, h4, p, ol, ul { margin: 0; }
.plan { position: relative; display: grid; gap: 22px; padding: 22px 22px 0; border-radius: var(--fd-radius-lg); border: 1px solid var(--fd-line); background: var(--fd-panel); }
.head { display: flex; align-items: center; gap: 12px; }
.mark { display: grid; place-items: center; width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.mark .pi { font-size: 14px; }
.title { color: var(--fd-ink); font: 600 19px/26px var(--fd-font-sans); }
.notes { display: grid; gap: 6px; margin-top: -8px; }
.note { display: flex; align-items: flex-start; gap: 8px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.note .pi { margin-top: 3px; font-size: 13px; }
.note.warn { color: var(--fd-amber); }

.sec { display: grid; gap: 10px; padding-top: 20px; border-top: 1px solid var(--fd-line); }
.sec-h { color: var(--fd-ink); font: 600 15px/20px var(--fd-font-sans); }
.count { color: var(--fd-muted); font-weight: 400; }
.hint { margin-top: -4px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.goal { padding: 12px 16px; border-left: 3px solid var(--fd-accent); border-radius: 0 var(--fd-radius-md) var(--fd-radius-md) 0;
  background: color-mix(in srgb, var(--fd-accent-soft) 55%, transparent); color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }

.rows { display: grid; gap: 8px; padding: 0; list-style: none; }
.row { display: flex; align-items: flex-start; gap: 10px; }
.num { display: grid; place-items: center; min-width: 24px; height: 24px; margin-top: 9px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--fd-accent) 50%, transparent); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.row .cb { margin-top: 12px; }
.field, :deep(.p-textarea.field) { flex: 1; min-width: 0; width: 100%; padding: 9px 12px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-line); background: var(--fd-bg);
  color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); resize: none; box-shadow: none; transition: border-color .15s; }
:deep(.p-textarea.field:hover) { border-color: color-mix(in srgb, var(--fd-ink) 22%, var(--fd-line)); }
:deep(.p-textarea.field:focus) { border-color: var(--fd-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 16%, transparent); }
.row.off :deep(.p-textarea.field) { color: var(--fd-muted); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--fd-muted) 60%, transparent); }
.x { display: grid; place-items: center; width: 32px; height: 32px; margin-top: 4px; flex-shrink: 0; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--fd-muted); cursor: pointer; }
.x:hover { background: var(--fd-panel-2); color: var(--fd-ink); }
.x .pi { font-size: 12px; }
.sec-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.link { padding: 0; border: 0; background: none; color: var(--fd-accent-text); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); text-decoration: underline; text-underline-offset: 3px; }
.add { display: inline-flex; align-items: center; gap: 8px; height: 34px; margin-left: auto; padding: 0 14px; border-radius: 999px; border: 1px dashed var(--fd-line); background: none; color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.add:hover { border-color: var(--fd-accent); color: var(--fd-accent-text); }
.add .pi { font-size: 12px; }

.srcs { display: grid; gap: 4px; padding: 0; list-style: none; }
.src { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; margin: 0 -12px; border-radius: var(--fd-radius-md); cursor: pointer; transition: background-color .15s, opacity .15s; }
.src:hover { background: var(--fd-panel-2); }
.src .cb { margin-top: 3px; }
.doc { margin-top: 4px; color: var(--fd-muted); font-size: 14px; }
.src-txt { display: grid; gap: 2px; min-width: 0; }
.src-t { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.src-m { color: var(--fd-muted); font: 400 12px/18px var(--fd-font-sans); }
.src-n { margin-top: 2px; color: var(--fd-ink); opacity: .82; font: 400 14px/20px var(--fd-font-sans); }
.src.off { opacity: .55; }
.src.off .src-t { text-decoration: line-through; }

.qs { display: grid; gap: 16px; }
.q { display: grid; gap: 4px; }
.q-t { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.q-h { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.q .field, .q :deep(.p-textarea.field) { margin-top: 4px; }

.assume { display: grid; gap: 6px; padding: 0; list-style: none; }
.assume li { position: relative; padding-left: 18px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.assume li::before { content: ''; position: absolute; left: 4px; top: 10px; width: 5px; height: 5px; border-radius: 50%; background: var(--fd-muted); }

.cb { flex-shrink: 0; width: 18px; height: 18px; margin: 0; accent-color: var(--fd-accent); cursor: pointer; }
.cb:focus-visible, .link:focus-visible, .add:focus-visible, .x:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* sticky action bar — above the dock's fade */
.foot { position: sticky; bottom: 0; z-index: 4; display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin: 0 -22px; padding: 14px 22px;
  border-top: 1px solid var(--fd-line); border-radius: 0 0 var(--fd-radius-lg) var(--fd-radius-lg); background: var(--fd-panel); }
.sum { margin-right: auto; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }

.row-enter-active, .row-leave-active { transition: opacity .18s ease, transform .18s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 767px) {
  .plan { padding: 18px 16px 0; gap: 18px; }
  .foot { margin: 0 -16px; padding: 12px 16px calc(12px); }
  .sum { display: none; }
  .foot :deep(.p-button) { flex: 1; padding-left: 10px; padding-right: 10px; white-space: nowrap; }
  .foot :deep(.p-button-icon) { display: none; }
  .src { margin: 0 -8px; padding: 10px 8px; }
}
</style>
