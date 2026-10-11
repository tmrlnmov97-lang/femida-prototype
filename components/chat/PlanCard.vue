<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { RESEARCH_PLAN as P } from '~/data/mock';
import type { PlanApproval } from '~/composables/useChat';

// Plan first — the research plan to review before the answer. Same content and functions as the live card (11.10.2026),
// simpler to read (user: "UX not good, simplify"): the plan reads as text, editing is opt-in.
//   Goal → Questions for you (the context the answer needs; the hint shows on focus) → Legal issues (read; Edit turns them
//   into fields) → Sources / Research steps / Assumptions folded into one-line summaries → sticky Answer directly / Approve and run.
const props = defineProps<{ noQuestions?: boolean }>();
const emit = defineEmits<{ (e: 'approve', how: PlanApproval): void }>();
const root = ref<HTMLElement>();

let uid = 100;
const issues = ref(P.issues.map((text, i) => ({ id: i, text })));
const sources = ref(P.sources.map((s, i) => ({ id: i, ...s, on: true })));
const answers = ref(P.questions.map(() => ''));
const steps = ref(P.steps.map((text, i) => ({ id: i, text, on: true })));

const editIssues = ref(false), allIssues = ref(false);
const ISSUES_SHOWN = 3;
const shownIssues = computed(() => (allIssues.value || editIssues.value ? issues.value : issues.value.slice(0, ISSUES_SHOWN)));
const focusQ = ref<number | null>(null);
const open = ref({ sources: false, steps: false, assumptions: false });
type Fold = keyof typeof open.value;
const toggle = (k: Fold) => { open.value[k] = !open.value[k]; };

const onSources = computed(() => sources.value.filter((s) => s.on).length);
const onSteps = computed(() => steps.value.filter((s) => s.on && s.text.trim()).length);
const of = (on: number, all: number) => (on === all ? `${all}` : `${on} of ${all}`);
// one line per fold: "Labour Code of the RA · Articles 265, 113, …"
const srcLine = computed(() => {
  const by = new Map<string, string[]>();
  sources.value.filter((s) => s.on).forEach((s) => by.set(s.act, [...(by.get(s.act) || []), s.article.replace('Article ', '')]));
  return [...by].map(([act, a]) => `${act} · ${a.length > 1 ? 'Articles' : 'Article'} ${a.join(', ')}`).join('; ');
});
const stepLine = computed(() => steps.value.find((s) => s.on && s.text.trim())?.text || '');

function focusLast(list: string) {
  nextTick(() => {
    const all = root.value?.querySelectorAll<HTMLTextAreaElement>(`[data-list="${list}"] textarea`);
    all?.[all.length - 1]?.focus();
  });
}
function addIssue() { issues.value.push({ id: uid++, text: '' }); focusLast('issues'); }
function addStep() { steps.value.push({ id: uid++, text: '', on: true }); focusLast('steps'); }
function doneEditing() { issues.value = issues.value.filter((i) => i.text.trim()); editIssues.value = false; }
function run() { emit('approve', { steps: onSteps.value, sources: onSources.value }); }
</script>

<template>
  <div ref="root" class="plan">
    <header class="head">
      <h3 class="title"><i class="pi pi-list-check" />Research plan</h3>
      <p class="note"><i class="pi pi-info-circle" />This is a research plan, not legal advice. The answer will cite verified sources&nbsp;only.</p>
      <p class="note warn"><i class="pi pi-exclamation-triangle" />Items that stated the law were left out of the&nbsp;plan.</p>
    </header>

    <!-- Goal: how the question was understood -->
    <section class="blk">
      <p class="lbl">Goal</p>
      <p class="goal">{{ P.goal }}</p>
    </section>

    <!-- Questions: the context the answer needs; optional -->
    <section v-if="!props.noQuestions" class="blk">
      <p class="lbl">Questions for you</p>
      <p class="hint">Optional. Your answers are used as facts of the&nbsp;question.</p>
      <ol class="qs">
        <li v-for="(q, i) in P.questions" :key="i" class="q">
          <label :for="`plan-q${i}`" class="q-t">{{ q.q }}</label>
          <PTextarea :id="`plan-q${i}`" v-model="answers[i]" class="field" auto-resize rows="1" placeholder="Your answer"
                     @focus="focusQ = i" @blur="focusQ = null" />
          <Transition name="fade-up"><span v-if="q.hint && focusQ === i" class="q-h"><i class="pi pi-info-circle" />{{ q.hint }}</span></Transition>
        </li>
      </ol>
    </section>

    <!-- Legal issues: read by default, Edit makes them fields -->
    <section class="blk">
      <div class="lbl-row">
        <p class="lbl">Legal issues to resolve <span class="count">· {{ issues.length }}</span></p>
        <button class="text-btn" @click="editIssues ? doneEditing() : (editIssues = true)"><i class="pi" :class="editIssues ? 'pi-check' : 'pi-pencil'" />{{ editIssues ? 'Done' : 'Edit' }}</button>
      </div>
      <ol v-if="!editIssues" class="issues">
        <li v-for="(it, i) in shownIssues" :key="it.id"><span class="num">{{ i + 1 }}</span><span>{{ it.text }}</span></li>
      </ol>
      <TransitionGroup v-else tag="ol" name="row" class="rows" data-list="issues">
        <li v-for="(it, i) in issues" :key="it.id" class="row">
          <span class="num">{{ i + 1 }}</span>
          <PTextarea v-model="it.text" class="field" auto-resize rows="1" :aria-label="`Issue ${i + 1}`" />
          <button class="x" aria-label="Remove the issue" v-tooltip.top="'Remove'" @click="issues.splice(i, 1)"><i class="pi pi-times" /></button>
        </li>
      </TransitionGroup>
      <button v-if="!editIssues && issues.length > ISSUES_SHOWN" class="link" @click="allIssues = !allIssues">{{ allIssues ? 'Show less' : `Show all ${issues.length}` }}</button>
      <button v-if="editIssues" class="add" @click="addIssue"><i class="pi pi-plus" />Add an issue</button>
    </section>

    <!-- The rest folds into one-line summaries -->
    <div class="folds">
      <div class="fold">
        <button class="f-row" :aria-expanded="open.sources" @click="toggle('sources')">
          <i class="pi pi-book f-ic" />
          <span class="f-txt"><span class="f-t">Sources to check <span class="count">· {{ of(onSources, sources.length) }}</span></span><span class="f-s">{{ srcLine }}</span></span>
          <i class="pi pi-angle-down chev" :class="{ open: open.sources }" />
        </button>
        <div v-if="open.sources" class="f-body">
          <p class="hint">Untick a source to leave it&nbsp;out.</p>
          <label v-for="s in sources" :key="s.id" class="src" :class="{ off: !s.on }">
            <input v-model="s.on" type="checkbox" class="cb" />
            <span class="src-txt"><span class="src-t">{{ s.act }}, {{ s.article }}</span><span class="src-n">{{ s.note }}</span><span class="src-m">{{ s.meta }}</span></span>
          </label>
        </div>
      </div>

      <div class="fold">
        <button class="f-row" :aria-expanded="open.steps" @click="toggle('steps')">
          <i class="pi pi-list f-ic" />
          <span class="f-txt"><span class="f-t">Research steps <span class="count">· {{ of(onSteps, steps.length) }}</span></span><span class="f-s">{{ stepLine }}</span></span>
          <i class="pi pi-angle-down chev" :class="{ open: open.steps }" />
        </button>
        <div v-if="open.steps" class="f-body">
          <TransitionGroup tag="ol" name="row" class="rows" data-list="steps">
            <li v-for="(st, i) in steps" :key="st.id" class="row" :class="{ off: !st.on }">
              <input v-model="st.on" type="checkbox" class="cb" :aria-label="`Run step ${i + 1}`" />
              <PTextarea v-model="st.text" class="field" auto-resize rows="1" :aria-label="`Step ${i + 1}`" />
              <button class="x" aria-label="Remove the step" v-tooltip.top="'Remove'" @click="steps.splice(i, 1)"><i class="pi pi-times" /></button>
            </li>
          </TransitionGroup>
          <button class="add" @click="addStep"><i class="pi pi-plus" />Add a step</button>
        </div>
      </div>

      <div class="fold">
        <button class="f-row" :aria-expanded="open.assumptions" @click="toggle('assumptions')">
          <i class="pi pi-info-circle f-ic" />
          <span class="f-txt"><span class="f-t">Assumptions <span class="count">· {{ P.assumptions.length }}</span></span><span class="f-s">{{ P.assumptions[0] }}</span></span>
          <i class="pi pi-angle-down chev" :class="{ open: open.assumptions }" />
        </button>
        <ul v-if="open.assumptions" class="f-body assume"><li v-for="a in P.assumptions" :key="a">{{ a }}</li></ul>
      </div>
    </div>

    <!-- Actions stay in view while the plan scrolls -->
    <footer class="foot">
      <span class="sum">{{ onSteps }} {{ onSteps === 1 ? 'step' : 'steps' }} · {{ onSources }} {{ onSources === 1 ? 'source' : 'sources' }}</span>
      <PButton label="Answer directly" icon="pi pi-bolt" severity="secondary" @click="emit('approve', 'direct')" />
      <PButton label="Approve and run" icon="pi pi-play" :disabled="!onSteps" @click="run" />
    </footer>
  </div>
</template>

<style scoped>
h3, p, ol, ul { margin: 0; }
.plan { position: relative; display: grid; gap: 24px; padding: 22px 24px 0; border-radius: var(--fd-radius-lg); border: 1px solid var(--fd-line); background: var(--fd-panel); }
.head { display: grid; gap: 6px; }
.title { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; color: var(--fd-ink); font: 600 19px/26px var(--fd-font-sans); }
.title .pi { color: var(--fd-accent-text); font-size: 16px; }
.note { display: flex; align-items: flex-start; gap: 8px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.note .pi { margin-top: 3px; font-size: 12px; }
.note.warn { color: var(--fd-amber); }

.blk { display: grid; gap: 10px; }
.lbl-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.lbl { color: var(--fd-muted); font: 600 13px/18px var(--fd-font-sans); letter-spacing: .6px; text-transform: uppercase; }
.count { font-weight: 400; letter-spacing: 0; }
.hint { margin-top: -4px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.goal { color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }

/* questions */
.qs { display: grid; gap: 14px; padding: 0; list-style: none; }
.q { display: grid; gap: 6px; }
.q-t { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); cursor: text; }
.q-h { display: flex; align-items: flex-start; gap: 6px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.q-h .pi { margin-top: 3px; font-size: 11px; color: var(--fd-accent-text); }

/* issues */
.issues { display: grid; gap: 10px; padding: 0; list-style: none; }
.issues li { display: flex; align-items: flex-start; gap: 12px; color: var(--fd-ink); font: 400 15px/23px var(--fd-font-sans); }
.num { display: grid; place-items: center; min-width: 22px; height: 22px; margin-top: 1px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.row .num { margin-top: 10px; }
.text-btn { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border: 0; border-radius: 999px; background: none; color: var(--fd-accent-text); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.text-btn:hover { background: var(--fd-accent-soft); }
.text-btn .pi { font-size: 12px; }
.link { justify-self: start; padding: 0; border: 0; background: none; color: var(--fd-accent-text); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.link:hover { text-decoration: underline; text-underline-offset: 3px; }

/* editable rows (issues in Edit, research steps) */
.rows { display: grid; gap: 8px; padding: 0; list-style: none; }
.row { display: flex; align-items: flex-start; gap: 10px; }
.row .cb { margin-top: 12px; }
.field, :deep(.p-textarea.field) { flex: 1; min-width: 0; width: 100%; padding: 9px 12px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-line); background: var(--fd-bg);
  color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); resize: none; box-shadow: none; transition: border-color .15s; }
:deep(.p-textarea.field:hover) { border-color: color-mix(in srgb, var(--fd-ink) 22%, var(--fd-line)); }
:deep(.p-textarea.field:focus) { border-color: var(--fd-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 16%, transparent); }
.row.off :deep(.p-textarea.field) { color: var(--fd-muted); text-decoration: line-through; }
.x { display: grid; place-items: center; width: 32px; height: 32px; margin-top: 4px; flex-shrink: 0; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--fd-muted); cursor: pointer; }
.x:hover { background: var(--fd-panel-2); color: var(--fd-ink); }
.x .pi { font-size: 12px; }
.add { justify-self: start; display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px dashed var(--fd-line); background: none; color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.add:hover { border-color: var(--fd-accent); color: var(--fd-accent-text); }
.add .pi { font-size: 11px; }

/* folds */
.folds { border-radius: var(--fd-radius-md); border: 1px solid var(--fd-line); }
.fold + .fold { border-top: 1px solid var(--fd-line); }
.f-row { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border: 0; background: none; cursor: pointer; text-align: left; border-radius: var(--fd-radius-md); }
.f-row:hover { background: color-mix(in srgb, var(--fd-ink) 4%, transparent); }
.f-ic { flex-shrink: 0; color: var(--fd-muted); font-size: 14px; }
.f-txt { display: grid; gap: 2px; flex: 1; min-width: 0; }
.f-t { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.f-s { overflow: hidden; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); text-overflow: ellipsis; white-space: nowrap; }
.chev { flex-shrink: 0; color: var(--fd-muted); font-size: 12px; transition: transform .2s ease; }
.chev.open { transform: rotate(180deg); }
.f-body { display: grid; gap: 8px; padding: 2px 14px 14px 40px; }
.src { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; cursor: pointer; transition: opacity .15s; }
.src .cb { margin-top: 3px; }
.src-txt { display: grid; gap: 1px; min-width: 0; }
.src-t { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.src-n { color: var(--fd-ink); opacity: .82; font: 400 14px/20px var(--fd-font-sans); }
.src-m { color: var(--fd-muted); font: 400 12px/18px var(--fd-font-sans); }
.src.off { opacity: .5; }
.src.off .src-t { text-decoration: line-through; }
.assume { padding-left: 40px; list-style: none; }
.assume li { position: relative; padding-left: 16px; color: var(--fd-ink); font: 400 15px/23px var(--fd-font-sans); }
.assume li::before { content: ''; position: absolute; left: 3px; top: 10px; width: 5px; height: 5px; border-radius: 50%; background: var(--fd-muted); }

.cb { flex-shrink: 0; width: 18px; height: 18px; margin: 0; accent-color: var(--fd-accent); cursor: pointer; }
.cb:focus-visible, .link:focus-visible, .add:focus-visible, .x:focus-visible, .text-btn:focus-visible, .f-row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* sticky action bar — above the dock's fade */
.foot { position: sticky; bottom: 0; z-index: 4; display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin: 0 -24px; padding: 14px 24px;
  border-top: 1px solid var(--fd-line); border-radius: 0 0 var(--fd-radius-lg) var(--fd-radius-lg); background: var(--fd-panel); }
.sum { margin-right: auto; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }

.row-enter-active, .row-leave-active { transition: opacity .18s ease, transform .18s ease; }
.row-enter-from, .row-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 767px) {
  .plan { padding: 18px 16px 0; gap: 20px; }
  .f-body { padding-left: 14px; }
  .assume { padding-left: 14px; }
  .foot { margin: 0 -16px; padding: 12px 16px; }
  .sum { display: none; }
  .foot :deep(.p-button) { flex: 1; padding-left: 10px; padding-right: 10px; white-space: nowrap; }
  .foot :deep(.p-button-icon) { display: none; }
}
</style>
