<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import { WORK_QUESTIONS, LEASE_PLAN, GENERIC_PLAN, PLAN_STEPS } from '~/data/mock';

// Work plan = one page with three numbered stages on a left rail: Questions → Plan → Answer.
// The task is the page title, a status line says what is expected from you, and only the current stage is open.
useHead({ title: 'Work plan — Femida redesign prototype' });

type Phase = 'compose' | 'questions' | 'plan' | 'running' | 'done';
const phase = ref<Phase>('compose');
const task = ref('');
const answers = ref<(string | null)[]>(WORK_QUESTIONS.map(() => null));
const plan = ref<string[]>([]);
const editing = ref(false);
const done = ref(0);
const thinking = ref(false);
const root = ref<HTMLElement>();
let timer: ReturnType<typeof setInterval> | undefined;
let openTimer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => { clearInterval(timer); clearTimeout(openTimer); });

const scrollTo = (sel: string) => nextTick(() => root.value?.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
function later(fn: () => void, ms = 700) { thinking.value = true; setTimeout(() => { thinking.value = false; fn(); }, ms); }

function submit() {
  if (!task.value.trim()) return;
  phase.value = 'questions';
  later(() => {}, 600);
}
function onKey(e: KeyboardEvent) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }
function toPlan() {
  const t = task.value.toLowerCase();
  plan.value = [...(/lease|rent|tenant|landlord/.test(t) ? LEASE_PLAN : /dismiss|employ|labour|labor|job/.test(t) ? PLAN_STEPS : GENERIC_PLAN)];
  editing.value = false;
  phase.value = 'plan';
  later(() => scrollTo('#stage-plan'), 800);
}
function changeAnswers() { editing.value = false; phase.value = 'questions'; }
const summary = computed(() => answers.value.map((a, i) => (a ? { k: WORK_QUESTIONS[i].label, v: a } : null)).filter(Boolean) as { k: string; v: string }[]);

/* Plan editing */
function addStep() { plan.value.push(''); nextTick(() => { const els = root.value?.querySelectorAll<HTMLInputElement>('.pedit'); els?.[els.length - 1]?.focus(); }); }
function removeStep(i: number) { plan.value.splice(i, 1); }
function finishEdit() { plan.value = plan.value.map((s) => s.trim()).filter(Boolean); editing.value = false; }

/* Run */
function start() {
  finishEdit();
  if (!plan.value.length) return;
  phase.value = 'running'; done.value = 0;
  timer = setInterval(() => {
    done.value++;
    // When the last step is done the answer opens by itself — no extra click
    if (done.value >= plan.value.length) { clearInterval(timer); phase.value = 'done'; scrollTo('#stage-answer'); openTimer = setTimeout(openAnswer, 900); }
  }, 1100);
}
function reset() { clearInterval(timer); clearTimeout(openTimer); phase.value = 'compose'; task.value = ''; answers.value = WORK_QUESTIONS.map(() => null); plan.value = []; editing.value = false; done.value = 0; thinking.value = false; }
function openAnswer() { navigateTo({ path: '/', query: { demo: 'answer' } }); }

/* What the page expects from you right now */
const current = computed(() => Math.min(done.value + 1, plan.value.length));
const status = computed(() => {
  if (phase.value === 'questions') return thinking.value ? { tone: 'busy', text: 'Reading the task' } : { tone: 'you', text: 'Needs your answers' };
  if (phase.value === 'plan') return thinking.value ? { tone: 'busy', text: 'Drafting the plan' } : { tone: 'you', text: 'Needs your approval' };
  if (phase.value === 'running') return { tone: 'busy', text: `Running · step ${current.value} of ${plan.value.length}` };
  return { tone: 'ok', text: 'Done' };
});
const stage = computed(() => (phase.value === 'questions' ? 1 : phase.value === 'done' ? 3 : 2));
const marker = (n: number) => (n < stage.value ? 'ok' : n === stage.value ? 'on' : 'off');
</script>

<template>
  <AppShell>
    <div ref="root" class="scroll page">
      <div class="wrap">
        <!-- Start: title, one line, the three steps in one quiet row, the field -->
        <template v-if="phase === 'compose'">
          <header class="head">
            <h1>Work plan</h1>
            <p class="lead">For complex questions. Femida drafts a plan first — the work starts only after you&nbsp;approve&nbsp;it.</p>
            <ol class="flow" aria-label="How it works">
              <li class="on"><span class="n">1</span>Describe the task</li>
              <li><span class="n">2</span>Approve the plan</li>
              <li><span class="n">3</span>Get a cited answer</li>
            </ol>
          </header>

          <div class="composer">
            <textarea v-model="task" rows="4" placeholder="Describe the task: the situation, what needs to be established and what you want to end up with" aria-label="Describe the task" @keydown="onKey" />
            <div class="composer-foot">
              <button class="primary" :disabled="!task.trim()" @click="submit">Draft a plan<i class="pi pi-arrow-right" /></button>
            </div>
          </div>

        </template>

        <!-- Work in progress -->
        <template v-else>
          <header class="head task-head">
            <div class="eyebrow">
              <span>Work plan</span>
              <button class="ghost" @click="reset"><i class="pi pi-plus" />New plan</button>
            </div>
            <h1 class="task" :title="task">{{ task }}</h1>
            <p class="status" :class="status.tone" role="status"><span class="dot" />{{ status.text }}</p>
          </header>

          <ol class="stages">
            <!-- 1. Questions -->
            <li class="stage" :class="marker(1)">
              <span class="mk"><i v-if="marker(1) === 'ok'" class="pi pi-check" /><template v-else>1</template></span>
              <div class="body">
                <div class="s-head">
                  <h2 :class="{ shimmer: phase === 'questions' && thinking }">{{ phase === 'questions' ? (thinking ? 'Reading the task…' : 'Answer a few questions') : 'Clarifying questions' }}</h2>
                  <button v-if="phase === 'plan' && !thinking" class="ghost sm" @click="changeAnswers">Change</button>
                </div>

                <template v-if="phase === 'questions'">
                  <div v-if="thinking" class="card skel" aria-busy="true"><PSkeleton width="40%" height="15px" /><PSkeleton width="70%" height="34px" /><PSkeleton width="35%" height="15px" /><PSkeleton width="55%" height="34px" /></div>
                  <template v-else>
                    <p class="sub">So the plan fits your case. Skip any you&nbsp;like.</p>
                    <div class="card">
                      <div class="qs">
                        <div v-for="(q, qi) in WORK_QUESTIONS" :key="q.q" class="q">
                          <span class="q-text">{{ q.q }}</span>
                          <div class="opts" role="radiogroup" :aria-label="q.q">
                            <button v-for="o in q.options" :key="o" class="opt" :class="{ on: answers[qi] === o }" role="radio" :aria-checked="answers[qi] === o" @click="answers[qi] = answers[qi] === o ? null : o">{{ o }}</button>
                          </div>
                        </div>
                      </div>
                      <div class="card-foot">
                        <button class="ghost" @click="toPlan">Skip questions</button>
                        <button class="primary" @click="toPlan">Continue<i class="pi pi-arrow-right" /></button>
                      </div>
                    </div>
                  </template>
                </template>
                <p v-else class="sub" :class="{ answers: summary.length }">
                  <template v-if="summary.length"><span v-for="s in summary" :key="s.k" class="kv"><span class="k">{{ s.k }}</span>{{ s.v }}</span></template>
                  <template v-else>Skipped</template>
                </p>
              </div>
            </li>

            <!-- 2. Plan -->
            <li id="stage-plan" class="stage" :class="marker(2)">
              <span class="mk">
                <i v-if="marker(2) === 'ok'" class="pi pi-check" />
                <span v-else-if="phase === 'running'" class="pulse" />
                <template v-else>2</template>
              </span>
              <div class="body">
                <div class="s-head">
                  <h2 :class="{ shimmer: phase === 'plan' && thinking }">
                    {{ phase === 'questions' ? 'Plan' : phase === 'plan' ? (thinking ? 'Drafting the plan…' : 'Review the plan') : phase === 'running' ? 'Working on the plan' : 'Plan completed' }}
                  </h2>
                  <span v-if="phase === 'plan' && !thinking" class="count">{{ plan.length }} {{ plan.length === 1 ? 'step' : 'steps' }}</span>
                  <span v-else-if="phase === 'running'" class="count">{{ done }} of {{ plan.length }} done</span>
                </div>

                <p v-if="phase === 'questions'" class="sub">Femida drafts it after the questions.</p>
                <div v-else-if="phase === 'plan' && thinking" class="card skel" aria-busy="true"><PSkeleton v-for="i in 5" :key="i" :width="`${88 - (i % 3) * 14}%`" height="15px" /></div>
                <template v-else>
                  <p v-if="phase === 'plan'" class="sub">Check the steps and edit any of them. Nothing runs until you&nbsp;approve.</p>
                  <p v-else-if="phase === 'running'" class="sub">You can leave this page — the answer will appear in your&nbsp;chats.</p>
                  <p v-else class="sub">All {{ plan.length }} steps&nbsp;done.</p>

                  <div v-if="phase !== 'done'" class="card">
                    <div v-if="phase === 'running' || phase === 'done'" class="bar" role="progressbar" :aria-valuenow="done" aria-valuemin="0" :aria-valuemax="plan.length"><span :style="{ width: `${(done / plan.length) * 100}%` }" /></div>
                    <ol class="steps" :class="{ editing }">
                      <li v-for="(s, i) in plan" :key="i" :class="{ ok: phase !== 'plan' && i < done, run: phase === 'running' && i === done, wait: phase === 'running' && i > done }">
                        <span class="si">
                          <i v-if="phase !== 'plan' && i < done" class="pi pi-check" />
                          <span v-else-if="phase === 'running' && i === done" class="pulse" />
                          <template v-else>{{ i + 1 }}</template>
                        </span>
                        <input v-if="editing" v-model="plan[i]" class="pedit" :aria-label="`Step ${i + 1}`" placeholder="Describe the step" @keydown.enter.prevent="addStep" />
                        <span v-else class="st">{{ s }}</span>
                        <span v-if="phase === 'running' && i === done" class="tag">In progress</span>
                        <button v-if="editing" class="x" :aria-label="`Remove step ${i + 1}`" @click="removeStep(i)"><i class="pi pi-times" /></button>
                      </li>
                    </ol>
                    <div v-if="phase === 'plan'" class="card-foot">
                      <template v-if="editing">
                        <button class="ghost" @click="addStep"><i class="pi pi-plus" />Add step</button>
                        <button class="secondary" @click="finishEdit">Done editing</button>
                      </template>
                      <template v-else>
                        <button class="secondary" @click="editing = true"><i class="pi pi-pencil" />Edit plan</button>
                        <button class="primary" @click="start">Approve and start<i class="pi pi-arrow-right" /></button>
                      </template>
                    </div>
                  </div>
                </template>
              </div>
            </li>

            <!-- 3. Answer -->
            <li id="stage-answer" class="stage" :class="marker(3)">
              <span class="mk"><i v-if="marker(3) === 'ok'" class="pi pi-check" /><template v-else>3</template></span>
              <div class="body">
                <div class="s-head"><h2 :class="{ shimmer: phase === 'done' }">{{ phase === 'done' ? 'Opening the answer…' : 'Answer' }}</h2></div>
                <p v-if="phase !== 'done'" class="sub">Opens by itself when the work is&nbsp;done.</p>
              </div>
            </li>
          </ol>
        </template>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
/* Same frame as Watch / My notes: 760 column, 48 top. Spacing on an 8px grid.
   Text: H1 32 serif (task title 26) · stage 18/600 · body 15 · secondary 14 · meta 13 */
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 80px; }
.head { display: grid; gap: 8px; margin-bottom: 32px; }
h1 { margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; }
.lead { margin: 0; max-width: 560px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }

/* Start */
.composer { padding: 16px 16px 12px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s; }
.composer:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.composer textarea { display: block; width: 100%; min-height: 104px; resize: none; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.composer textarea::placeholder { color: var(--fd-muted); }
.composer-foot { display: flex; justify-content: flex-end; margin-top: 8px; }

/* The three steps: one quiet row under the lead, step 1 marked as where you are */
.flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin: 12px 0 0; padding: 0; list-style: none; }
.flow li { display: inline-flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.flow li + li::before { content: ''; width: 24px; height: 1px; margin-right: 4px; background: var(--fd-line); }
.flow .n { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--fd-line); font: 600 11px/1 var(--fd-font-sans); }
.flow li.on { color: var(--fd-ink); }
.flow li.on .n { border-color: transparent; background: var(--fd-accent-soft); color: var(--fd-accent-text); }

/* Buttons */
.primary, .secondary, .ghost { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, color .15s, opacity .15s; }
.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .4; cursor: default; }
.secondary { border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); }
.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.ghost { border: 0; background: transparent; color: var(--fd-muted); padding: 0 12px; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.ghost.sm { height: 28px; margin-right: -10px; padding: 0 10px; border-radius: 8px; font-size: 13px; }
.primary .pi, .secondary .pi, .ghost .pi { font-size: 11px; }
.primary:focus-visible, .secondary:focus-visible, .ghost:focus-visible, .opt:focus-visible, .x:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* Task header: what you asked + what is expected from you now */
.eyebrow { display: flex; align-items: center; justify-content: space-between; height: 32px; margin: -8px 0 0; color: var(--fd-muted); font: 500 13px/18px var(--fd-font-sans); }
.eyebrow .ghost { height: 32px; margin-right: -12px; }
.task { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-size: 24px; line-height: 32px; text-wrap: pretty; }
.status { display: inline-flex; align-items: center; gap: 8px; margin: 4px 0 0; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fd-muted); }
.status.you .dot { background: var(--fd-amber); }
.status.busy .dot { background: var(--fd-accent); animation: pulse 1.2s ease-in-out infinite; }
.status.ok .dot { background: var(--fd-accent); }

/* Stages on a left rail */
.stages { margin: 0; padding: 0; list-style: none; }
.stage { position: relative; display: grid; grid-template-columns: 28px 1fr; column-gap: 16px; padding-bottom: 32px; }
.stage:last-child { padding-bottom: 0; }
.stage::before { content: ''; position: absolute; left: 13.5px; top: 36px; bottom: 8px; width: 1px; background: var(--fd-line); }
.stage:last-child::before { display: none; }
.mk { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-muted); font: 600 13px/1 var(--fd-font-sans); }
.stage.on .mk { border-color: var(--fd-accent); background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.stage.ok .mk { border-color: transparent; background: var(--fd-accent); color: var(--fd-on-accent); }
.mk .pi { font-size: 11px; }
.body { min-width: 0; }
.s-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 28px; }
h2 { margin: 0; color: var(--fd-ink); font: 600 18px/28px var(--fd-font-sans); }
.stage.off h2 { color: var(--fd-muted); font-weight: 500; }
.count { flex-shrink: 0; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.sub { margin: 4px 0 0; max-width: 600px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: pretty; }
.answers { display: flex; flex-wrap: wrap; gap: 4px 20px; color: var(--fd-ink); }
.kv .k { margin-right: 6px; color: var(--fd-muted); }

/* Cards */
.card { margin-top: 16px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); overflow: hidden; }
.card.skel { display: grid; gap: 12px; padding: 20px; }
.card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--fd-line); }
.card-foot > :last-child { margin-left: auto; }

/* Questions */
.qs { display: grid; gap: 20px; padding: 20px; }
.q { display: grid; gap: 10px; }
.q-text { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.opts { display: flex; flex-wrap: wrap; gap: 8px; }
.opt { height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); cursor: pointer; font: 400 14px/20px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.opt:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.opt.on { border-color: var(--fd-accent); background: var(--fd-accent-soft); font-weight: 500; }

/* Plan steps */
.bar { height: 3px; background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.bar span { display: block; height: 100%; background: var(--fd-accent); transition: width .4s ease; }
.steps { margin: 0; padding: 4px 20px; list-style: none; }
.steps li { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.steps li:last-child { border-bottom: 0; }
.si { display: grid; place-items: center; width: 20px; flex-shrink: 0; color: var(--fd-muted); font: 600 13px/1 var(--fd-font-sans); }
.steps li.ok { color: var(--fd-muted); }
.steps li.ok .si { color: var(--fd-accent-text); }
.steps li.ok .si .pi { font-size: 12px; }
.steps li.run { font-weight: 500; }
.steps li.wait .st { color: color-mix(in srgb, var(--fd-ink) 75%, transparent); }
.st { flex: 1; min-width: 0; text-wrap: pretty; }
.tag { flex-shrink: 0; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 500 12px/24px var(--fd-font-sans); }
.pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--fd-accent); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(.6); opacity: .5; } }
.pedit { flex: 1; min-width: 0; height: 36px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); }
.pedit:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.x { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.x:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.x .pi { font-size: 11px; }


.shimmer { background: linear-gradient(90deg, var(--fd-muted) 0%, var(--fd-ink) 50%, var(--fd-muted) 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent !important; animation: shimmer 1.6s linear infinite; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 56px; }
  .head { margin-bottom: 24px; }
  h1 { font-size: 26px; line-height: 34px; }
  .task { font-size: 20px; line-height: 28px; }
  .lead { font-size: 15px; line-height: 24px; }
  .composer-foot { flex-direction: column; align-items: stretch; }
  .flow { flex-direction: column; align-items: flex-start; gap: 8px; }
  .flow li + li::before { display: none; }
  .stage { column-gap: 12px; }
  .qs { padding: 16px; }
  .steps { padding: 4px 16px; }
  .tag { display: none; }
  .card-foot { flex-wrap: wrap; }
  .card-foot .primary { flex: 1; }
}
</style>
