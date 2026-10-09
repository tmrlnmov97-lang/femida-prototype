<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount } from 'vue';
import { WORK_QUESTIONS, LEASE_PLAN, GENERIC_PLAN, PLAN_STEPS } from '~/data/mock';

// Work plan as a conversation (like deep research in ChatGPT / Gemini / Claude):
// describe → a couple of clarifying questions → a plan card you can edit → Start → progress → answer.
useHead({ title: 'Work plan — Femida redesign prototype' });

type Phase = 'compose' | 'questions' | 'plan' | 'running' | 'done';
const phase = ref<Phase>('compose');
const task = ref('');
const answers = ref<(string | null)[]>(WORK_QUESTIONS.map(() => null));
const plan = ref<string[]>([]);
const editing = ref(false);
const done = ref(0);
const thinking = ref(false);
const thread = ref<HTMLElement>();
let timer: ReturnType<typeof setInterval> | undefined;
onBeforeUnmount(() => clearInterval(timer));

const scrollDown = () => nextTick(() => thread.value?.closest('.scroll')?.scrollTo({ top: 1e6, behavior: 'smooth' }));
function later(fn: () => void, ms = 700) { thinking.value = true; setTimeout(() => { thinking.value = false; fn(); scrollDown(); }, ms); }

function submit() {
  if (!task.value.trim()) return;
  phase.value = 'questions';
  later(() => {}, 600);
}
function onKey(e: KeyboardEvent) { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }
function toPlan() {
  const t = task.value.toLowerCase();
  plan.value = [...(/lease|rent|tenant|landlord/.test(t) ? LEASE_PLAN : /dismiss|employ|labour|labor|job/.test(t) ? PLAN_STEPS : GENERIC_PLAN)];
  phase.value = 'plan';
  later(() => {}, 800);
}
const chosen = computed(() => answers.value.map((a, i) => (a ? { q: WORK_QUESTIONS[i].q, a } : null)).filter(Boolean) as { q: string; a: string }[]);

/* Plan editing */
function addStep() { plan.value.push(''); nextTick(() => { const els = thread.value?.querySelectorAll<HTMLInputElement>('.pedit'); els?.[els.length - 1]?.focus(); }); }
function removeStep(i: number) { plan.value.splice(i, 1); }
function finishEdit() { plan.value = plan.value.map((s) => s.trim()).filter(Boolean); editing.value = false; }

/* Run */
function start() {
  finishEdit();
  if (!plan.value.length) return;
  phase.value = 'running'; done.value = 0;
  timer = setInterval(() => {
    done.value++;
    if (done.value >= plan.value.length) { clearInterval(timer); phase.value = 'done'; scrollDown(); }
  }, 1100);
  scrollDown();
}
function reset() { clearInterval(timer); phase.value = 'compose'; task.value = ''; answers.value = WORK_QUESTIONS.map(() => null); plan.value = []; editing.value = false; done.value = 0; }
function openAnswer() { navigateTo({ path: '/', query: { demo: 'answer' } }); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <!-- Start: one clear field, like a new chat -->
      <div v-if="phase === 'compose'" class="start">
        <span class="mark"><i class="pi pi-list-check" /></span>
        <h1>Work plan</h1>
        <p class="lead">For a complex question, Femida first drafts a plan. You approve it — only then does the work&nbsp;begin.</p>
        <div class="composer">
          <textarea v-model="task" rows="4" placeholder="Describe a complex task — the situation, what needs to be established and what you want to end up with…" aria-label="Describe the task" @keydown="onKey" />
          <div class="composer-foot">
            <span class="hint"><i class="pi pi-shield" />Nothing runs until you approve the plan</span>
            <button class="primary" :disabled="!task.trim()" @click="submit"><i class="pi pi-list-check" />Draft a plan</button>
          </div>
        </div>
      </div>

      <!-- Conversation -->
      <div v-else ref="thread" class="thread-wrap">
        <div class="thread-head">
          <span class="th-title"><i class="pi pi-list-check" />Work plan</span>
          <button class="ghost" @click="reset"><i class="pi pi-plus" />New plan</button>
        </div>

        <div class="thread">
          <!-- Your task -->
          <div class="user"><div class="bubble">{{ task }}</div></div>

          <!-- Clarifying questions -->
          <div class="bot">
            <span class="who"><span class="av"><i class="pi pi-sparkles" /></span>femid.ai</span>
            <template v-if="phase === 'questions' && thinking"><p class="shimmer">Reading the task…</p></template>
            <template v-else-if="phase === 'questions'">
              <p class="say">A few quick questions so the plan fits your case. Skip any you&nbsp;like.</p>
              <div class="qs">
                <div v-for="(q, qi) in WORK_QUESTIONS" :key="q.q" class="q">
                  <span class="q-text">{{ q.q }}</span>
                  <div class="opts" role="radiogroup" :aria-label="q.q">
                    <button v-for="o in q.options" :key="o" class="opt" :class="{ on: answers[qi] === o }" role="radio" :aria-checked="answers[qi] === o" @click="answers[qi] = answers[qi] === o ? null : o">{{ o }}</button>
                  </div>
                </div>
              </div>
              <div class="row-actions">
                <button class="primary" @click="toPlan">Continue<i class="pi pi-arrow-right" /></button>
                <button class="ghost" @click="toPlan">Skip</button>
              </div>
            </template>
            <template v-else>
              <p class="say muted">{{ chosen.length ? 'Thanks — I’ll take this into account:' : 'Questions skipped.' }}</p>
              <div v-if="chosen.length" class="answered"><span v-for="c in chosen" :key="c.q" class="pill">{{ c.a }}</span></div>
            </template>
          </div>

          <!-- Plan card → progress → done -->
          <div v-if="phase !== 'questions'" class="bot">
            <span class="who"><span class="av"><i class="pi pi-sparkles" /></span>femid.ai</span>
            <p v-if="phase === 'plan' && thinking" class="shimmer">Drafting the plan…</p>
            <div v-else class="plan-card">
              <div class="pc-head">
                <span class="pc-title">
                  {{ phase === 'plan' ? 'Here’s the plan' : phase === 'running' ? `Working on it — step ${Math.min(done + 1, plan.length)} of ${plan.length}` : 'Done' }}
                </span>
                <span v-if="phase === 'running'" class="pc-sub">You can leave this page — the answer will appear in your chats.</span>
              </div>

              <ol class="steps" :class="{ editing }">
                <li v-for="(s, i) in plan" :key="i" :class="{ ok: phase !== 'plan' && i < done, run: phase === 'running' && i === done }">
                  <span class="si">
                    <i v-if="phase !== 'plan' && i < done" class="pi pi-check" />
                    <span v-else-if="phase === 'running' && i === done" class="pulse" />
                    <template v-else>{{ i + 1 }}</template>
                  </span>
                  <input v-if="editing" v-model="plan[i]" class="pedit" :aria-label="`Step ${i + 1}`" placeholder="Describe the step" @keydown.enter.prevent="addStep" />
                  <span v-else class="st">{{ s }}</span>
                  <button v-if="editing" class="x" :aria-label="`Remove step ${i + 1}`" @click="removeStep(i)"><i class="pi pi-times" /></button>
                </li>
              </ol>

              <div v-if="phase === 'plan'" class="pc-foot">
                <template v-if="editing">
                  <button class="ghost" @click="addStep"><i class="pi pi-plus" />Add step</button>
                  <button class="secondary" @click="finishEdit">Done editing</button>
                </template>
                <template v-else>
                  <button class="secondary" @click="editing = true"><i class="pi pi-pencil" />Edit plan</button>
                  <button class="primary" @click="start"><i class="pi pi-play" />Start</button>
                </template>
              </div>
            </div>
          </div>

          <!-- Result -->
          <div v-if="phase === 'done'" class="bot">
            <span class="who"><span class="av"><i class="pi pi-sparkles" /></span>femid.ai</span>
            <div class="result">
              <div>
                <b>The answer is ready</b>
                <span>It cites the law and court practice it relies&nbsp;on.</span>
              </div>
              <button class="primary" @click="openAnswer">Open the answer<i class="pi pi-arrow-right" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; display: flex; flex-direction: column; padding: 0 24px; }

/* Start */
.start { display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; max-width: 720px; margin: auto; padding: 40px 0 64px; text-align: center; }
.mark { display: grid; place-items: center; width: 52px; height: 52px; margin-bottom: 4px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); border: 1px solid color-mix(in srgb, var(--fd-accent) 35%, transparent); }
.mark .pi { font-size: 20px; }
h1 { margin: 0; font: 600 36px/44px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0 0 16px; max-width: 520px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: balance; }
.composer { width: 100%; padding: 16px 16px 12px; border-radius: 20px; border: 1px solid var(--fd-line); background: var(--fd-panel); text-align: left; transition: border-color .15s, box-shadow .15s; }
.composer:focus-within { border-color: color-mix(in srgb, var(--fd-accent) 55%, var(--fd-line)); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.composer textarea { width: 100%; min-height: 96px; resize: none; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 17px/27px var(--fd-font-sans); }
.composer textarea::placeholder { color: var(--fd-muted); }
.composer-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 8px; }
.hint { display: inline-flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.hint .pi { font-size: 12px; color: var(--fd-accent-text); }

/* Buttons */
.primary, .secondary, .ghost { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 16px; border-radius: 999px; cursor: pointer; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, opacity .15s; }
.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .4; cursor: default; }
.secondary { border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.ghost { border: 0; background: transparent; color: var(--fd-muted); padding: 0 12px; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.primary .pi, .secondary .pi, .ghost .pi { font-size: 11px; }
.primary:focus-visible, .secondary:focus-visible, .ghost:focus-visible, .opt:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* Conversation */
.thread-wrap { width: 100%; max-width: 720px; margin: 0 auto; padding: 16px 0 64px; }
.thread-head { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: space-between; padding: 8px 0 12px; background: var(--fd-bg); }
.th-title { display: inline-flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.th-title .pi { font-size: 12px; color: var(--fd-accent-text); }
.thread { display: flex; flex-direction: column; gap: 28px; padding-top: 12px; }
.user { display: flex; justify-content: flex-end; }
.bubble { max-width: 560px; padding: 12px 16px; border-radius: 16px 16px 4px 16px; background: var(--fd-panel-2); color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); white-space: pre-wrap; }
.bot { display: grid; gap: 12px; }
.who { display: inline-flex; align-items: center; gap: 10px; color: var(--fd-ink); font: 600 15px/20px var(--fd-font-sans); }
.av { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); border: 1px solid color-mix(in srgb, var(--fd-accent) 35%, transparent); }
.av .pi { font-size: 12px; }
.say { margin: 0; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.say.muted { color: var(--fd-muted); font-size: 14px; line-height: 22px; }
.shimmer { margin: 0; font: 400 15px/24px var(--fd-font-sans); background: linear-gradient(90deg, var(--fd-muted) 0%, var(--fd-ink) 50%, var(--fd-muted) 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 1.6s linear infinite; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

.qs { display: grid; gap: 16px; }
.q { display: grid; gap: 8px; }
.q-text { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.opts { display: flex; flex-wrap: wrap; gap: 8px; }
.opt { height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 400 14px/20px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.opt:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.opt.on { border-color: var(--fd-accent); background: var(--fd-accent-soft); font-weight: 500; }
.row-actions { display: flex; gap: 8px; margin-top: 4px; }
.answered { display: flex; flex-wrap: wrap; gap: 6px; }
.pill { display: inline-flex; align-items: center; height: 28px; padding: 0 12px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-ink); font: 400 13px/18px var(--fd-font-sans); }

/* Plan card */
.plan-card { border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); overflow: hidden; }
.pc-head { display: grid; gap: 2px; padding: 16px 20px 8px; }
.pc-title { color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.pc-sub { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.steps { display: grid; margin: 0; padding: 4px 20px 12px; list-style: none; }
.steps li { display: flex; align-items: center; gap: 12px; min-height: 44px; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.steps li:last-child { border-bottom: 0; }
.si { display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--fd-line); color: var(--fd-muted); font: 600 12px/1 var(--fd-font-sans); }
.steps li.ok .si { border-color: transparent; background: var(--fd-accent); color: var(--fd-on-accent); }
.steps li.ok .si .pi { font-size: 10px; }
.steps li.run .si { border-color: var(--fd-accent); }
.pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--fd-accent); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(.6); opacity: .5; } }
.st { flex: 1; min-width: 0; }
.pedit { flex: 1; min-width: 0; height: 34px; margin: 5px 0; padding: 0 10px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); }
.pedit:focus { border-color: var(--fd-accent); }
.x { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.x:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.x .pi { font-size: 10px; }
.pc-foot { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-ink) 2%, var(--fd-panel)); }

.result { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 16px 16px 20px; border-radius: 16px; border: 1px solid color-mix(in srgb, var(--fd-accent) 40%, var(--fd-line)); background: color-mix(in srgb, var(--fd-accent-soft) 55%, var(--fd-panel)); }
.result div { display: grid; gap: 2px; }
.result b { color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.result span { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }

@media (max-width: 767px) {
  .page { padding: 0 16px; }
  h1 { font-size: 28px; line-height: 36px; }
  .composer-foot { flex-direction: column; align-items: stretch; }
  .composer-foot .primary { justify-content: center; }
  .result { flex-direction: column; align-items: stretch; }
  .pc-foot { flex-wrap: wrap; }
}
</style>
