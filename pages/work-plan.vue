<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import { WORK_STEPS, WORK_QUESTIONS, LEASE_PLAN, GENERIC_PLAN, PLAN_STEPS } from '~/data/mock';

// Work plan, after the live screen: Description → Clarifying questions → Plan → Execution.
// Nothing runs until the plan is approved.
useHead({ title: 'Work plan — Femida redesign prototype' });
const { state: chat, newChat } = useChat();

const step = ref(0); // 0..3
const task = ref('');
const answers = ref<(string | null)[]>(WORK_QUESTIONS.map(() => null));
const plan = ref<string[]>([]);
const editing = ref<number | null>(null);
const editEl = ref<HTMLInputElement[]>();
const drafting = ref(false);

/* 1 → 2 */
function draftPlan() {
  if (!task.value.trim()) return;
  drafting.value = true;
  setTimeout(() => { drafting.value = false; step.value = 1; }, 700);
}
/* 2 → 3: the plan follows the task (SAMPLE plans) */
function makePlan() {
  const t = task.value.toLowerCase();
  plan.value = [...(/lease|rent|tenant|landlord/.test(t) ? LEASE_PLAN : /dismiss|employ|labour|labor|job/.test(t) ? PLAN_STEPS : GENERIC_PLAN)];
  step.value = 2;
}
/* 3: edit the plan */
function editStep(i: number) { editing.value = i; nextTick(() => editEl.value?.[0]?.focus()); }
function addStep() { plan.value.push(''); editStep(plan.value.length - 1); }
function removeStep(i: number) { plan.value.splice(i, 1); editing.value = null; }
function commitEdit(i: number) { if (!plan.value[i]?.trim()) plan.value.splice(i, 1); editing.value = null; }
function move(i: number, d: -1 | 1) { const j = i + d; if (j < 0 || j >= plan.value.length) return; [plan.value[i], plan.value[j]] = [plan.value[j], plan.value[i]]; }

/* 4: run the approved plan step by step */
const done = ref(0);
let timer: ReturnType<typeof setInterval> | undefined;
function approve() {
  plan.value = plan.value.filter((s) => s.trim());
  if (!plan.value.length) return;
  step.value = 3; done.value = 0;
  timer = setInterval(() => { done.value++; if (done.value >= plan.value.length) clearInterval(timer); }, 1100);
}
onBeforeUnmount(() => clearInterval(timer));
const finished = computed(() => step.value === 3 && done.value >= plan.value.length);
function openResult() { navigateTo({ path: '/', query: { demo: 'answer' } }); }
function restart() { clearInterval(timer); step.value = 0; task.value = ''; answers.value = WORK_QUESTIONS.map(() => null); plan.value = []; done.value = 0; }
function goTo(i: number) { if (i < step.value && step.value < 3) step.value = i; } // go back to finished steps (not during execution)
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>Work plan</h1>
          <p class="lead">For a complex question, Femida first drafts a work plan. You edit and approve it — only then does the work&nbsp;begin.</p>
        </header>

        <!-- Stepper -->
        <ol class="stepper" aria-label="Progress">
          <li v-for="(s, i) in WORK_STEPS" :key="s" :class="{ on: i === step, done: i < step || finished }">
            <button class="st" :disabled="!(i < step && step < 3)" :aria-current="i === step ? 'step' : undefined" @click="goTo(i)">
              <span class="num"><i v-if="i < step || finished" class="pi pi-check" /><template v-else>{{ i + 1 }}</template></span>
              <span class="lbl">{{ s }}</span>
            </button>
            <span v-if="i < WORK_STEPS.length - 1" class="line" />
          </li>
        </ol>

        <!-- 1. Description -->
        <section v-if="step === 0" class="card">
          <h2>Describe the task</h2>
          <p class="helper">Write it as you would to a colleague: the situation, what needs to be established and what you want to end up with. Nothing starts until you approve the&nbsp;plan.</p>
          <textarea v-model="task" rows="6" placeholder="e.g. The tenant has not paid rent for 4 months and claims the premises were unfit for use. Assess whether the lease can be terminated unilaterally and the debt recovered…" aria-label="Task description" />
          <div class="foot">
            <span class="muted">{{ task.trim().length }} characters</span>
            <button class="primary" :disabled="!task.trim() || drafting" @click="draftPlan">
              <i class="pi pi-list-check" :class="{ breathe: drafting }" />{{ drafting ? 'Reading the task…' : 'Draft a plan' }}
            </button>
          </div>
        </section>

        <!-- 2. Clarifying questions -->
        <section v-else-if="step === 1" class="card">
          <h2>A few questions first</h2>
          <p class="helper">Answers make the plan more precise. You can skip any of&nbsp;them.</p>
          <div class="qs">
            <div v-for="(q, qi) in WORK_QUESTIONS" :key="q.q" class="q">
              <span class="q-text">{{ q.q }}</span>
              <div class="opts" role="radiogroup" :aria-label="q.q">
                <button v-for="o in q.options" :key="o" class="opt" :class="{ on: answers[qi] === o }" role="radio" :aria-checked="answers[qi] === o" @click="answers[qi] = answers[qi] === o ? null : o">{{ o }}</button>
              </div>
            </div>
          </div>
          <div class="foot">
            <button class="ghost" @click="makePlan">Skip questions</button>
            <button class="primary" @click="makePlan">Continue<i class="pi pi-arrow-right" /></button>
          </div>
        </section>

        <!-- 3. Plan -->
        <section v-else-if="step === 2" class="card">
          <h2>Review the plan</h2>
          <p class="helper">Edit, reorder or remove steps. Femida starts only after you approve&nbsp;it.</p>
          <ol class="plan">
            <li v-for="(s, i) in plan" :key="i" class="pstep">
              <span class="pn">{{ i + 1 }}</span>
              <input v-if="editing === i" ref="editEl" v-model="plan[i]" class="pedit" :aria-label="`Step ${i + 1}`" placeholder="Describe the step" @keydown.enter.prevent="commitEdit(i)" @keydown.esc.prevent="commitEdit(i)" @blur="commitEdit(i)" />
              <button v-else class="ptext" @click="editStep(i)">{{ s }}</button>
              <span class="pact">
                <button :aria-label="`Move step ${i + 1} up`" :disabled="i === 0" @click="move(i, -1)"><i class="pi pi-arrow-up" /></button>
                <button :aria-label="`Move step ${i + 1} down`" :disabled="i === plan.length - 1" @click="move(i, 1)"><i class="pi pi-arrow-down" /></button>
                <button :aria-label="`Remove step ${i + 1}`" @click="removeStep(i)"><i class="pi pi-times" /></button>
              </span>
            </li>
          </ol>
          <button class="add-step" @click="addStep"><i class="pi pi-plus" />Add a step</button>
          <div class="foot">
            <span class="muted">{{ plan.filter((s) => s.trim()).length }} steps</span>
            <button class="primary" :disabled="!plan.some((s) => s.trim())" @click="approve"><i class="pi pi-check" />Approve and run</button>
          </div>
        </section>

        <!-- 4. Execution -->
        <section v-else class="card">
          <h2>{{ finished ? 'Done' : 'Working on it…' }}</h2>
          <p class="helper">{{ finished ? 'Every step is finished. The answer cites the law and court practice it relies on.' : 'You can leave this page — the work continues and the result appears in your chats.' }}</p>
          <ol class="exec">
            <li v-for="(s, i) in plan" :key="i" :class="{ ok: i < done, run: i === done && !finished }">
              <span class="ei"><i v-if="i < done" class="pi pi-check" /><span v-else-if="i === done && !finished" class="pulse" /><span v-else class="dot" /></span>
              <span class="et">{{ s }}</span>
            </li>
          </ol>
          <div class="foot">
            <button class="ghost" @click="restart">New plan</button>
            <button class="primary" :disabled="!finished" @click="openResult">Open the answer<i class="pi pi-arrow-right" /></button>
          </div>
        </section>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 80px; }
.head { display: grid; gap: 8px; margin-bottom: 32px; }
h1 { margin: 0; font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; max-width: 600px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }

/* Stepper */
.stepper { display: flex; align-items: center; gap: 8px; margin: 0 0 24px; padding: 0; list-style: none; }
.stepper li { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.stepper li:last-child { flex: none; }
.st { display: inline-flex; align-items: center; gap: 10px; padding: 0; border: 0; background: transparent; color: var(--fd-muted); cursor: default; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); }
.st:not(:disabled) { cursor: pointer; }
.st:not(:disabled):hover .lbl { color: var(--fd-ink); text-decoration: underline; text-underline-offset: 3px; }
.num { display: grid; place-items: center; width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--fd-line); color: var(--fd-muted); font: 600 13px/1 var(--fd-font-sans); }
.num .pi { font-size: 11px; }
li.on .st { color: var(--fd-ink); }
li.on .num { border-color: var(--fd-accent); color: var(--fd-accent-text); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
li.done .num { border-color: transparent; background: var(--fd-accent); color: var(--fd-on-accent); }
li.done .st { color: var(--fd-ink); }
.line { flex: 1; height: 1px; min-width: 16px; background: var(--fd-line); }
li.done .line { background: var(--fd-accent); }

/* Card */
.card { padding: 24px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
h2 { margin: 0; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.helper { margin: 4px 0 20px; max-width: 600px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: pretty; }
textarea { width: 100%; min-height: 160px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; resize: vertical; font: 400 16px/26px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
textarea:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
textarea::placeholder { color: var(--fd-muted); }
.foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 20px; }
.muted { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.primary { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 600 14px/20px var(--fd-font-sans); transition: background-color .15s, opacity .15s; }
.primary .pi { font-size: 12px; }
.breathe { animation: pulse 1.2s ease-in-out infinite; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .45; cursor: default; }
.ghost { height: 40px; padding: 0 14px; border: 0; border-radius: 10px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.primary:focus-visible, .ghost:focus-visible, .opt:focus-visible, .ptext:focus-visible, .st:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* Questions */
.qs { display: grid; gap: 20px; }
.q { display: grid; gap: 10px; }
.q-text { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.opts { display: flex; flex-wrap: wrap; gap: 8px; }
.opt { height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); cursor: pointer; font: 400 14px/20px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.opt:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.opt.on { border-color: var(--fd-accent); background: var(--fd-accent-soft); color: var(--fd-ink); font-weight: 500; }

/* Plan */
.plan { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.pstep { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 8px 8px 12px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); }
.pn { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.ptext { flex: 1; min-width: 0; padding: 4px 6px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-ink); text-align: left; cursor: text; font: 400 15px/22px var(--fd-font-sans); }
.ptext:hover { background: color-mix(in srgb, var(--fd-ink) 5%, transparent); }
.pedit { flex: 1; min-width: 0; height: 34px; padding: 0 8px; border-radius: 6px; border: 1px solid var(--fd-accent); background: var(--fd-panel); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); }
.pact { display: flex; gap: 2px; flex-shrink: 0; opacity: 0; transition: opacity .12s; }
.pstep:hover .pact, .pstep:focus-within .pact { opacity: 1; }
.pact button { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.pact button:hover:not(:disabled) { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.pact button:disabled { opacity: .3; cursor: default; }
.pact .pi { font-size: 11px; }
.add-step { display: inline-flex; align-items: center; gap: 8px; height: 36px; margin-top: 12px; padding: 0 12px; border: 1px dashed var(--fd-line); border-radius: 10px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.add-step .pi { font-size: 11px; }
.add-step:hover { color: var(--fd-ink); border-color: var(--fd-accent); }

/* Execution */
.exec { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.exec li { display: flex; align-items: center; gap: 12px; padding: 12px 4px; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); }
.exec li.ok, .exec li.run { color: var(--fd-ink); }
.ei { display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0; }
.exec li.ok .ei { border-radius: 50%; background: var(--fd-accent); color: var(--fd-on-accent); }
.exec li.ok .ei .pi { font-size: 10px; }
.dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--fd-line); }
.pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--fd-accent); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(.6); opacity: .5; } }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 56px; }
  .head { margin-bottom: 24px; }
  h1 { font-size: 26px; line-height: 34px; }
  .lead { font-size: 15px; line-height: 24px; }
  .card { padding: 16px; }
  .stepper .lbl { display: none; }
  .stepper li.on .lbl { display: inline; }
  .pact { opacity: 1; }
  .foot { flex-wrap: wrap; }
}
</style>
