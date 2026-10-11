<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { DEEP_STEPS, SOURCES, WIZARD_STEPS, WIZARD_GROUNDS, DRAFTS, WATCH_UPDATES, TEMPORAL_SAMPLE, FILES, STUDIO_RESULTS } from '~/data/mock';

// Capabilities as a live product window (idea from the "Bento card" block, rebuilt in Vue + CSS, PrimeIcons): the window peeks
// out of the card, tools on the left, a small preview of each tool on the right. The highlight slides between tools, the
// preview swaps with a soft blur; tools advance on their own every few seconds until someone clicks. Every preview is built
// from the coded prototype's SAMPLE data (data/mock) — no invented numbers.
const TOOLS = [
  { id: 'analysis', icon: 'pi pi-file-check', label: 'Document analysis', body: 'Upload a contract or a court decision. Deadlines, obligations and risks come back flagged.' },
  { id: 'deep', icon: 'pi pi-compass', label: 'Deep research', body: 'For hard questions it plans the research and works through legislation, cassation practice and ECHR.' },
  { id: 'wizard', icon: 'pi pi-file-edit', label: 'Drafting wizard', body: 'Five steps from a short description to an appeal or a claim, in Word or PDF.' },
  { id: 'court', icon: 'pi pi-search', label: 'Court practice search', body: 'Find how courts decided cases like yours — cassation, appeals, first instance.' },
  { id: 'date', icon: 'pi pi-calendar', label: 'Law on a date', body: 'Pick a date and see which version of the law was in force then.' },
] as const;
type ToolId = typeof TOOLS[number]['id'];
const active = ref<ToolId>('analysis');
const tool = computed(() => TOOLS.find((t) => t.id === active.value)!);

// --- sliding highlight in the tool list
const listEl = ref<HTMLElement>();
const hl = ref({ y: 0, h: 0, x: 0, w: 0 });
function placeHl() {
  const list = listEl.value, el = list?.querySelector<HTMLElement>(`[data-tool="${active.value}"]`);
  if (!list || !el) return;
  hl.value = { y: el.offsetTop, h: el.offsetHeight, x: el.offsetLeft, w: el.offsetWidth };
  // phone: the tools are a scrolling row — keep the active one in view (horizontally only, never scrolls the page)
  if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: Math.max(0, el.offsetLeft - 12), behavior: 'smooth' });
}
watch(active, () => nextTick(placeHl));

// --- autoplay: every 5 s while the card is on screen; stops for good after a click, pauses on hover
const DWELL = 5000;
const root = ref<HTMLElement>();
const inView = ref(false), hover = ref(false), user = ref(false);
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const playing = computed(() => inView.value && !hover.value && !user.value && !reduce);
let timer: ReturnType<typeof setTimeout> | null = null;
function next() { const i = TOOLS.findIndex((t) => t.id === active.value); active.value = TOOLS[(i + 1) % TOOLS.length].id; }
function schedule() { if (timer) clearTimeout(timer); timer = playing.value ? setTimeout(() => { next(); schedule(); }, DWELL) : null; }
watch(playing, schedule);
function pick(id: ToolId) { user.value = true; active.value = id; }
function onKey(e: KeyboardEvent) {
  const i = TOOLS.findIndex((t) => t.id === active.value);
  const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
  if (!d) return;
  e.preventDefault(); pick(TOOLS[(i + d + TOOLS.length) % TOOLS.length].id);
  nextTick(() => listEl.value?.querySelector<HTMLElement>(`[data-tool="${active.value}"]`)?.focus());
}

// --- deep research: steps tick while that tool is shown
const deepStep = ref(0);
let deepTimer: ReturnType<typeof setInterval> | null = null;
watch(active, (id) => {
  if (deepTimer) clearInterval(deepTimer);
  deepStep.value = reduce ? DEEP_STEPS.length : 0;
  if (id === 'deep' && !reduce) deepTimer = setInterval(() => { if (deepStep.value < DEEP_STEPS.length) deepStep.value++; else clearInterval(deepTimer!); }, 750);
}, { immediate: true });
const deepSources = computed(() => SOURCES.filter((s) => deepStep.value > s.n)); // a source "arrives" with steps 2–4

// --- sample content (all from data/mock)
const FILE = FILES[0];
const TIMELINE_DEADLINE = STUDIO_RESULTS['Timeline'].find((t) => t.label === 'Deadline')!.text;
const RISKS = STUDIO_RESULTS['Possible risks'];
const FLAGS = [
  { kind: 'Deadline', tone: 'amber', text: TIMELINE_DEADLINE },
  { kind: 'Risk', tone: 'red', text: RISKS[2].text },
  { kind: 'Risk', tone: 'red', text: RISKS[1].text },
];
const split = (s: string) => s.split(/(\s?\[\d\])/).filter(Boolean).map((t) => { const m = t.match(/\[(\d)\]/); return m ? { n: +m[1] } : { t }; });
const DRAFT = DRAFTS[0];
const COURT = SOURCES.find((s) => s.kind === 'Court decision')!;
const WATCH = WATCH_UPDATES.find((w) => w.kind === 'Court decision')!;
// Law on a date: the same demo as /temporal?q=employment&d=2019-03-12, status worked out from that date
const ON = new Date(2019, 2, 12);
const toDate = (s: string) => { const [d, m, y] = s.split('.').map(Number); return new Date(y, m - 1, d); };
const ACTS = TEMPORAL_SAMPLE.map((a) => {
  const from = toDate(a.from), to = a.to ? toDate(a.to) : null;
  const st = from > ON ? 'later' : to && to < ON ? 'repealed' : 'in-force';
  return { ...a, st };
});

let io: IntersectionObserver | null = null;
onMounted(() => {
  placeHl();
  window.addEventListener('resize', placeHl);
  io = new IntersectionObserver(([e]) => { inView.value = e.isIntersecting; }, { root: document.querySelector('.site'), threshold: 0.4 });
  if (root.value) io.observe(root.value);
});
onBeforeUnmount(() => { window.removeEventListener('resize', placeHl); io?.disconnect(); if (timer) clearTimeout(timer); if (deepTimer) clearInterval(deepTimer); });
</script>

<template>
  <div ref="root" class="tour" @mouseenter="hover = true" @mouseleave="hover = false">
    <div class="back" aria-hidden="true" />
    <div class="win">
      <div class="bar">
        <span class="dots"><span /><span /><span /></span>
        <span class="bar-t">femid.ai</span>
        <span class="tag">SAMPLE</span>
      </div>
      <div class="body">
        <!-- tools -->
        <div ref="listEl" class="tools" role="tablist" aria-label="femid.ai tools" aria-orientation="vertical" @keydown="onKey">
          <span class="hl" :style="{ transform: `translate(${hl.x}px, ${hl.y}px)`, width: `${hl.w}px`, height: `${hl.h}px` }" aria-hidden="true">
            <span class="hl-bar" />
            <span v-if="playing" :key="active" class="hl-timer" :style="{ animationDuration: `${DWELL}ms` }" />
          </span>
          <button v-for="t in TOOLS" :key="t.id" :data-tool="t.id" class="tool" :class="{ on: active === t.id }" role="tab"
                  :aria-selected="active === t.id" :tabindex="active === t.id ? 0 : -1" @click="pick(t.id)">
            <i :class="t.icon" />{{ t.label }}
          </button>
        </div>

        <!-- preview -->
        <div class="view" role="tabpanel" :aria-label="tool.label">
          <header class="v-head">
            <p class="v-t">{{ tool.label }}</p>
            <p class="v-d">{{ tool.body }}</p>
          </header>
          <Transition name="swap" mode="out-in">
            <!-- Document analysis -->
            <div v-if="active === 'analysis'" key="analysis" class="pane">
              <div class="file">
                <span class="f-ic"><i class="pi pi-file-pdf" /></span>
                <span class="f-txt"><b>{{ FILE.name }}</b><span>{{ FILE.size }} · encrypted</span></span>
                <span class="chip ok"><i class="pi pi-check" />Analysed</span>
              </div>
              <ul class="flags">
                <li v-for="(f, i) in FLAGS" :key="i" :style="{ '--d': `${i * 90}ms` }">
                  <span class="chip" :class="f.tone">{{ f.kind }}</span>
                  <span class="f-text"><template v-for="(seg, k) in split(f.text)" :key="k"><span v-if="'n' in seg" class="cite">{{ seg.n }}</span><template v-else>{{ seg.t }}</template></template></span>
                </li>
              </ul>
            </div>

            <!-- Deep research -->
            <div v-else-if="active === 'deep'" key="deep" class="pane">
              <ol class="steps">
                <li v-for="(s, i) in DEEP_STEPS" :key="s" :class="{ done: i < deepStep, now: i === deepStep }">
                  <span class="st"><i v-if="i < deepStep" class="pi pi-check" /><span v-else-if="i === deepStep" class="pulse" /><span v-else class="dot" /></span>{{ s }}
                </li>
              </ol>
              <div class="found">
                <span class="found-l">Sources</span>
                <TransitionGroup name="pop" tag="span" class="found-list">
                  <span v-for="s in deepSources" :key="s.n" class="src-chip"><span class="cite">{{ s.n }}</span>{{ s.title }} · {{ s.ref }}</span>
                </TransitionGroup>
              </div>
            </div>

            <!-- Drafting wizard -->
            <div v-else-if="active === 'wizard'" key="wizard" class="pane">
              <ol class="stepper">
                <li v-for="(s, i) in WIZARD_STEPS" :key="s" :class="{ done: i < 3, now: i === 3 }"><span class="sn"><i v-if="i < 3" class="pi pi-check" /><template v-else>{{ i + 1 }}</template></span>{{ s }}</li>
              </ol>
              <ul class="grounds">
                <li v-for="(g, i) in WIZARD_GROUNDS" :key="i" :style="{ '--d': `${i * 90}ms` }">{{ g.text }} <span v-for="c in g.cites" :key="c" class="cite">{{ c }}</span></li>
              </ul>
              <div class="doc"><i class="pi pi-file-word" /><span>{{ DRAFT.title }}</span><span class="doc-m">Word · PDF</span></div>
            </div>

            <!-- Court practice search -->
            <div v-else-if="active === 'court'" key="court" class="pane">
              <div class="search"><i class="pi pi-search" /><span>restoring a missed deadline</span></div>
              <div class="res" style="--d: 0ms">
                <span class="r-k">{{ COURT.kind }}</span>
                <b>{{ COURT.title }}</b>
                <span class="r-m">{{ COURT.ref }}</span>
                <span class="quote">{{ COURT.quote }}</span>
              </div>
              <div class="res" style="--d: 90ms">
                <span class="r-k">{{ WATCH.kind }} · {{ WATCH.tag }}</span>
                <b>{{ WATCH.title }}</b>
                <span class="r-m">{{ WATCH.date }}</span>
              </div>
            </div>

            <!-- Law on a date -->
            <div v-else key="date" class="pane">
              <div class="search two"><span><i class="pi pi-book" />employment</span><span><i class="pi pi-calendar" />12.03.2019</span></div>
              <p class="on">In force on 12 March 2019</p>
              <ul class="acts">
                <li v-for="(a, i) in ACTS" :key="a.id" :class="a.st" :style="{ '--d': `${i * 70}ms` }">
                  <span class="a-txt"><b>{{ a.title }}</b><span>{{ a.match }}</span></span>
                  <span class="chip" :class="a.st === 'in-force' ? 'ok' : a.st === 'repealed' ? 'red' : 'amber'">{{ a.st === 'in-force' ? 'In force' : a.st === 'repealed' ? 'Repealed' : 'Not yet in force' }}</span>
                </li>
              </ul>
            </div>
          </Transition>
          <div class="fade" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p, ul, ol { margin: 0; }
ul, ol { padding: 0; list-style: none; }
b { font-weight: 600; }

/* card: the window peeks out of it, a second sheet sits behind */
.tour { position: relative; height: 580px; overflow: hidden; border-radius: 32px; border: 1px solid var(--fd-line);
  background: radial-gradient(70% 90% at 0% 0%, color-mix(in srgb, var(--fd-accent) 12%, transparent), transparent 60%), var(--fd-panel); }
.back { position: absolute; top: 88px; left: 40px; width: 100%; height: 100%; border-radius: 24px; border: 1px solid var(--fd-line); background: var(--fd-panel-2); opacity: .7; }
.win { position: absolute; top: 48px; left: 80px; right: -1px; bottom: -1px; display: flex; flex-direction: column; overflow: hidden; border-radius: 22px 0 0 0;
  background: var(--fd-bg); box-shadow: 0 0 0 6px color-mix(in srgb, var(--fd-line) 70%, transparent), var(--lift, 0 30px 80px rgb(0 0 0 / .35)); /* --lift comes from the landing, lighter in the light theme */
  transition: transform .5s var(--fd-easing); }
.tour:hover .win { transform: translate(-4px, -4px); }
.bar { position: relative; display: flex; align-items: center; height: 48px; padding: 0 20px; border-bottom: 1px solid var(--fd-line); }
.dots { display: flex; gap: 6px; } .dots span { width: 9px; height: 9px; border-radius: 50%; background: var(--fd-line); }
.bar-t { position: absolute; left: 50%; transform: translateX(-50%); color: var(--fd-muted); font: 500 13px/18px var(--fd-font-sans); letter-spacing: 1px; }
.tag { margin-left: auto; padding: 2px 10px; border-radius: 999px; border: 1px dashed var(--fd-line); color: var(--fd-muted); font: 500 11px/18px var(--fd-font-sans); letter-spacing: .8px; }
.body { display: flex; flex: 1; min-height: 0; }

/* tools */
.tools { position: relative; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; width: 248px; padding: 20px 12px; border-right: 1px solid var(--fd-line);
  background: color-mix(in srgb, var(--fd-panel) 40%, transparent); }
.tool { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 14px; border: 0; border-radius: 12px; background: none;
  color: var(--fd-muted); cursor: pointer; text-align: left; white-space: nowrap; font: 500 15px/20px var(--fd-font-sans); transition: color .2s; }
.tool .pi { font-size: 14px; }
.tool:hover, .tool.on { color: var(--fd-ink); }
.tool.on .pi { color: var(--fd-accent-text); }
.tool:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.hl { position: absolute; left: 0; top: 0; z-index: 0; overflow: hidden; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel-2);
  transition: transform .45s cubic-bezier(.34, 1.3, .64, 1), width .3s, height .3s; }
.hl-bar { position: absolute; left: 0; top: 50%; width: 3px; height: 16px; margin-top: -8px; border-radius: 0 3px 3px 0; background: var(--fd-accent); }
.hl-timer { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: color-mix(in srgb, var(--fd-accent) 60%, transparent); transform-origin: left; animation: fill linear both; }
@keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* preview */
.view { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 18px; padding: 24px 28px 0; overflow: hidden; }
.v-head { display: grid; gap: 4px; max-width: 560px; }
.v-t { color: var(--fd-ink); font: 600 19px/26px var(--fd-font-sans); }
.v-d { color: var(--fd-muted); font: 400 15px/23px var(--fd-font-sans); }
.pane { display: grid; align-content: start; gap: 12px; max-width: 640px; }
.fade { position: absolute; left: 0; right: 0; bottom: 0; height: 56px; background: linear-gradient(transparent, var(--fd-bg)); pointer-events: none; }
.swap-enter-active { transition: opacity .32s cubic-bezier(.23, 1, .32, 1), transform .32s cubic-bezier(.23, 1, .32, 1), filter .32s; }
.swap-leave-active { transition: opacity .18s ease, transform .18s ease, filter .18s; }
.swap-enter-from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
.swap-leave-to { opacity: 0; transform: translateY(-8px); filter: blur(4px); }
/* rows inside a pane rise one after another */
.flags li, .grounds li, .res, .acts li { animation: rise .4s cubic-bezier(.23, 1, .32, 1) both; animation-delay: var(--d, 0ms); }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }

.chip { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; height: 22px; padding: 0 9px; border-radius: 999px; font: 600 11px/1 var(--fd-font-sans); letter-spacing: .3px; white-space: nowrap; }
.chip .pi { font-size: 9px; }
.chip.ok { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.chip.amber { background: var(--fd-amber-soft); color: var(--fd-amber); }
.chip.red { background: var(--fd-red-soft); color: var(--fd-red); }
.cite { display: inline-grid; place-items: center; min-width: 18px; height: 18px; margin-left: 4px; padding: 0 5px; border-radius: 5px; vertical-align: 1px;
  background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 11px/1 var(--fd-font-sans); }

.file { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.f-ic { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--fd-red-soft); color: var(--fd-red); }
.f-txt { display: grid; flex: 1; min-width: 0; }
.f-txt b { overflow: hidden; color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); text-overflow: ellipsis; white-space: nowrap; }
.f-txt span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.flags { display: grid; gap: 8px; }
.flags li { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--fd-line); }
.flags .chip { margin-top: 1px; min-width: 70px; justify-content: center; }
.f-text { color: var(--fd-ink); font: 400 14px/21px var(--fd-font-sans); }

.steps { display: grid; gap: 10px; }
.steps li { display: flex; align-items: center; gap: 12px; color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); transition: color .2s; }
.steps li.done { color: var(--fd-ink); }
.steps li.now { color: var(--fd-ink); font-weight: 600; }
.st { display: grid; place-items: center; width: 22px; height: 22px; flex-shrink: 0; border-radius: 50%; border: 1px solid var(--fd-line); color: var(--fd-accent-text); }
.done .st { border-color: transparent; background: var(--fd-accent-soft); }
.st .pi { font-size: 10px; }
.dot { width: 5px; height: 5px; border-radius: 50%; background: var(--fd-line); }
.pulse { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--fd-accent); }
.pulse::after { content: ''; position: absolute; inset: -4px; border-radius: 50%; border: 2px solid var(--fd-accent); animation: ring 1.3s ease-out infinite; }
@keyframes ring { 0% { transform: scale(.5); opacity: .7; } 100% { transform: scale(1.4); opacity: 0; } }
.found { display: grid; gap: 8px; margin-top: 6px; padding-top: 14px; border-top: 1px solid var(--fd-line); }
.found-l { color: var(--fd-muted); font: 600 12px/16px var(--fd-font-sans); letter-spacing: 1px; text-transform: uppercase; }
.found-list { display: flex; flex-wrap: wrap; gap: 6px; min-height: 30px; }
.src-chip { display: inline-flex; align-items: center; gap: 2px; height: 30px; padding: 0 12px 0 6px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); font: 500 13px/18px var(--fd-font-sans); white-space: nowrap; }
.src-chip .cite { margin: 0 6px 0 0; }
.pop-enter-active { transition: opacity .3s, transform .35s cubic-bezier(.34, 1.4, .64, 1); }
.pop-enter-from { opacity: 0; transform: scale(.85); }

.stepper { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.stepper li { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.stepper li.done, .stepper li.now { color: var(--fd-ink); }
.sn { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--fd-line); font: 600 11px/1 var(--fd-font-sans); }
.done .sn { border-color: transparent; background: var(--fd-accent-soft); color: var(--fd-accent-text); } .sn .pi { font-size: 9px; }
.now .sn { border-color: var(--fd-accent); background: var(--fd-accent); color: var(--fd-on-accent); }
.grounds { display: grid; gap: 8px; }
.grounds li { padding: 12px 14px; border-radius: 14px; border: 1px solid var(--fd-line); color: var(--fd-ink); font: 400 14px/21px var(--fd-font-sans); }
.doc { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; background: var(--fd-accent-soft); color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.doc .pi { color: var(--fd-accent-text); }
.doc-m { margin-left: auto; color: var(--fd-muted); font-size: 13px; }

.search { display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--fd-accent); background: var(--fd-panel);
  color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 14%, transparent); }
.search .pi { color: var(--fd-muted); font-size: 13px; }
.search.two { gap: 8px; padding: 0 6px; border-color: var(--fd-line); box-shadow: none; }
.search.two span { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; border-radius: 8px; background: var(--fd-panel-2); }
.res { display: grid; gap: 3px; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--fd-line); }
.r-k { color: var(--fd-muted); font: 600 11px/16px var(--fd-font-sans); letter-spacing: .8px; text-transform: uppercase; }
.res b { color: var(--fd-ink); font-size: 15px; line-height: 22px; }
.r-m { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.quote { margin-top: 6px; padding: 8px 12px; border-left: 2px solid var(--fd-accent); border-radius: 0 8px 8px 0; background: var(--fd-panel); color: var(--fd-muted); font: 400 13px/20px var(--fd-font-sans); }
.on { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.acts { display: grid; gap: 6px; }
.acts li { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--fd-line); }
.acts li.repealed, .acts li.later { opacity: .65; }
.a-txt { display: grid; flex: 1; min-width: 0; }
.a-txt b { overflow: hidden; color: var(--fd-ink); font-size: 14px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.a-txt span { color: var(--fd-muted); font: 400 12px/17px var(--fd-font-sans); }

/* 1024 */
@media (max-width: 1100px) {
  .win { left: 48px; }
  .back { left: 20px; }
  .tools { width: 208px; }
  .tool { font-size: 14px; }
}
/* phone: no offsets, tools become a row of chips above the preview */
@media (max-width: 767px) {
  .tour { height: auto; border-radius: 24px; }
  .back { display: none; }
  .win { position: relative; top: auto; left: auto; right: auto; bottom: auto; margin: 16px 0 0 16px; border-radius: 18px 0 0 0; height: 560px; }
  .tour:hover .win { transform: none; }
  .body { flex-direction: column; }
  .tools { flex-direction: row; width: auto; padding: 10px; gap: 4px; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--fd-line); scrollbar-width: none; }
  .tool { height: 36px; padding: 0 12px; font-size: 13px; }
  .hl-bar { display: none; }
  .view { padding: 18px 16px 0; gap: 14px; }
  .v-t { font-size: 17px; }
  .v-d { font-size: 14px; line-height: 21px; }
}
@media (prefers-reduced-motion: reduce) {
  .hl, .win, .swap-enter-active, .swap-leave-active, .pop-enter-active { transition: none; }
  .flags li, .grounds li, .res, .acts li, .pulse::after { animation: none; }
}
</style>
