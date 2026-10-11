<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { ANSWER, DEEP_STEPS, SOURCES, WIZARD_STEPS, WIZARD_GROUNDS, DRAFTS, WATCH_UPDATES, TEMPORAL_SAMPLE, FILES, STUDIO_RESULTS } from '~/data/mock';

// The product in one window (idea from the "Bento card" block, rebuilt in Vue + CSS, PrimeIcons). It replaced two blocks —
// the "Answer / No source" demo and the capabilities bento (user, 11.10: replace, don't add; make it neat). The sidebar is
// grouped like the real app: Chat (an answer with sources, a refusal) and Tools. The highlight slides between items, the
// preview swaps with a soft blur, items advance on their own while the window is on screen until someone clicks.
// Every preview is built from the coded prototype's SAMPLE data (data/mock) — no invented numbers.
const GROUPS = [
  { label: 'Chat', items: [
    { id: 'answer', icon: 'pi pi-verified', label: 'Answer with sources', title: 'Contesting a dismissal', body: 'Every statement in an answer links to the source it is based on. Tap a number to see it.' },
    { id: 'refusal', icon: 'pi pi-shield', label: 'No source → no answer', title: 'New chat', body: 'No source found — no answer. You get a clear message and ideas for rephrasing, never a guess.' },
  ] },
  { label: 'Tools', items: [
    { id: 'analysis', icon: 'pi pi-file-check', label: 'Document analysis', title: 'Document analysis', body: 'Upload a contract or a court decision. Deadlines, obligations and risks come back flagged.' },
    { id: 'deep', icon: 'pi pi-compass', label: 'Deep research', title: 'Deep research', body: 'For hard questions it plans the research and works through legislation, cassation practice and ECHR.' },
    { id: 'wizard', icon: 'pi pi-file-edit', label: 'Drafting wizard', title: 'Drafting wizard', body: 'Five steps from a short description to an appeal or a claim, in Word or PDF.' },
    { id: 'court', icon: 'pi pi-search', label: 'Court practice search', title: 'Court practice search', body: 'Find how courts decided cases like yours — cassation, appeals, first instance.' },
    { id: 'date', icon: 'pi pi-calendar', label: 'Law on a date', title: 'Law on a date', body: 'Pick a date and see which version of the law was in force then.' },
  ] },
] as const;
const ITEMS = GROUPS.flatMap((g) => g.items);
type ItemId = typeof ITEMS[number]['id'];
const active = ref<ItemId>('answer');
const item = computed(() => ITEMS.find((t) => t.id === active.value)!);

// --- sliding highlight
const listEl = ref<HTMLElement>();
const hl = ref({ y: 0, h: 0, x: 0, w: 0 });
function placeHl() {
  const list = listEl.value, el = list?.querySelector<HTMLElement>(`[data-item="${active.value}"]`);
  if (!list || !el) return;
  hl.value = { y: el.offsetTop, h: el.offsetHeight, x: el.offsetLeft, w: el.offsetWidth };
  // phone: the items are a scrolling row — keep the active one in view (horizontally only, never scrolls the page)
  if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: Math.max(0, el.offsetLeft - 12), behavior: 'smooth' });
}
watch(active, () => nextTick(placeHl));

// --- autoplay while on screen; pauses on hover, stops for good after a click
const DWELL = 5500;
const root = ref<HTMLElement>();
const inView = ref(false), hover = ref(false), user = ref(false);
const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const playing = computed(() => inView.value && !hover.value && !user.value && !reduce);
let timer: ReturnType<typeof setTimeout> | null = null;
function next() { const i = ITEMS.findIndex((t) => t.id === active.value); active.value = ITEMS[(i + 1) % ITEMS.length].id; }
function schedule() { if (timer) clearTimeout(timer); timer = playing.value ? setTimeout(() => { next(); schedule(); }, DWELL) : null; }
watch(playing, schedule);
function pick(id: ItemId) { user.value = true; active.value = id; }
function onKey(e: KeyboardEvent) {
  const i = ITEMS.findIndex((t) => t.id === active.value);
  const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
  if (!d) return;
  e.preventDefault(); pick(ITEMS[(i + d + ITEMS.length) % ITEMS.length].id);
  nextTick(() => listEl.value?.querySelector<HTMLElement>(`[data-item="${active.value}"]`)?.focus());
}

// --- chat: the same SAMPLE answer and sources as the coded Chat; a citation keeps its word and punctuation on one line
type Seg = { t: string } | { word: string; n: number; tail: string };
function cites(s: string): Seg[] {
  const out: Seg[] = []; const re = /\s*\[(\d+)\]([.,;:]?)/g; let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const before = s.slice(last, m.index); const sp = before.lastIndexOf(' ');
    if (sp >= 0) out.push({ t: before.slice(0, sp + 1) });
    out.push({ word: before.slice(sp + 1), n: +m[1], tail: m[2] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}
const QUESTION = 'Can an employee contest a dismissal after the one-month deadline if they were in hospital?';
const PARAS = [cites(ANSWER.short), cites(ANSWER.paragraphs[0])];
const CITED = SOURCES.slice(0, 2);
const activeSrc = ref(1);

// --- deep research: steps tick while it is shown
const deepStep = ref(0);
let deepTimer: ReturnType<typeof setInterval> | null = null;
watch(active, (id) => {
  if (deepTimer) clearInterval(deepTimer);
  deepStep.value = reduce ? DEEP_STEPS.length : 0;
  if (id === 'deep' && !reduce) deepTimer = setInterval(() => { if (deepStep.value < DEEP_STEPS.length) deepStep.value++; else clearInterval(deepTimer!); }, 750);
}, { immediate: true });
const deepSources = computed(() => SOURCES.filter((s) => deepStep.value > s.n));

// --- tools sample content
const FILE = FILES[0];
const RISKS = STUDIO_RESULTS['Possible risks'];
const FLAGS = [
  { kind: 'Deadline', tone: 'amber', text: STUDIO_RESULTS['Timeline'].find((t) => t.label === 'Deadline')!.text },
  { kind: 'Risk', tone: 'red', text: RISKS[2].text },
  { kind: 'Risk', tone: 'red', text: RISKS[1].text },
];
const DRAFT = DRAFTS[0];
const COURT = SOURCES.find((s) => s.kind === 'Court decision')!;
const WATCH = WATCH_UPDATES.find((w) => w.kind === 'Court decision')!;
// Law on a date: the same demo as /temporal?q=employment&d=2019-03-12
const ON = new Date(2019, 2, 12);
const toDate = (s: string) => { const [d, m, y] = s.split('.').map(Number); return new Date(y, m - 1, d); };
const ACTS = TEMPORAL_SAMPLE.map((a) => {
  const from = toDate(a.from), to = a.to ? toDate(a.to) : null;
  return { ...a, st: from > ON ? 'later' : to && to < ON ? 'repealed' : 'in-force' };
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
    <div class="win">
      <div class="bar">
        <span class="dots"><span /><span /><span /></span>
        <Transition name="fade" mode="out-in"><span :key="item.title" class="bar-t">{{ item.title }}</span></Transition>
        <span class="tag">SAMPLE</span>
      </div>
      <div class="body">
        <!-- sidebar: Chat + Tools, like the app -->
        <div ref="listEl" class="side" role="tablist" aria-label="femid.ai" aria-orientation="vertical" @keydown="onKey">
          <span class="hl" :style="{ transform: `translate(${hl.x}px, ${hl.y}px)`, width: `${hl.w}px`, height: `${hl.h}px` }" aria-hidden="true">
            <span class="hl-bar" />
            <span v-if="playing" :key="active" class="hl-timer" :style="{ animationDuration: `${DWELL}ms` }" />
          </span>
          <template v-for="g in GROUPS" :key="g.label">
            <p class="grp">{{ g.label }}</p>
            <button v-for="t in g.items" :key="t.id" :data-item="t.id" class="item" :class="{ on: active === t.id }" role="tab"
                    :aria-selected="active === t.id" :tabindex="active === t.id ? 0 : -1" @click="pick(t.id)">
              <i :class="t.icon" /><span>{{ t.label }}</span>
            </button>
          </template>
        </div>

        <!-- preview -->
        <div class="main" role="tabpanel" :aria-label="item.label">
          <Transition name="swap" mode="out-in">
            <!-- Chat · answer with sources -->
            <div v-if="active === 'answer'" key="answer" class="pane chat">
              <div class="conv">
                <p class="bubble">{{ QUESTION }}</p>
                <div class="who"><span class="who-ic"><i class="pi pi-sparkles" /></span><b>femid.ai</b><span class="chip ok">2 sources</span></div>
                <div class="answer">
                  <p v-for="(p, i) in PARAS" :key="i" :class="{ first: i === 0 }">
                    <template v-for="(seg, k) in p" :key="k">
                      <span v-if="'n' in seg" class="nw">{{ seg.word }}&nbsp;<button class="cite btn-cite" :class="{ on: activeSrc === seg.n }" :aria-label="`Source ${seg.n}`" @click="activeSrc = seg.n; user = true">{{ seg.n }}</button>{{ seg.tail }}</span>
                      <template v-else>{{ seg.t }}</template>
                    </template>
                  </p>
                </div>
              </div>
              <aside class="srcs" aria-label="Sources">
                <p class="srcs-h">Sources</p>
                <button v-for="s in CITED" :key="s.n" class="src" :class="{ on: activeSrc === s.n }" @click="activeSrc = s.n; user = true">
                  <span class="src-k"><span class="cite">{{ s.n }}</span>{{ s.kind }}</span>
                  <span class="src-t">{{ s.title }}</span>
                  <span class="src-r">{{ s.ref }}</span>
                  <span v-if="activeSrc === s.n" class="quote">{{ s.quote }}</span>
                </button>
              </aside>
            </div>

            <!-- Chat · refusal -->
            <div v-else-if="active === 'refusal'" key="refusal" class="pane narrow">
              <p class="bubble">How to bake a cake?</p>
              <RefusalCard />
            </div>

            <!-- Tools -->
            <div v-else :key="active" class="pane">
              <header class="v-head"><p class="v-t">{{ item.title }}</p><p class="v-d">{{ item.body }}</p></header>

              <template v-if="active === 'analysis'">
                <div class="file rowin">
                  <span class="f-ic"><i class="pi pi-file-pdf" /></span>
                  <span class="f-txt"><b>{{ FILE.name }}</b><span>{{ FILE.size }} · encrypted</span></span>
                  <span class="chip ok"><i class="pi pi-check" />Analysed</span>
                </div>
                <ul class="rows">
                  <li v-for="(f, i) in FLAGS" :key="i" class="row rowin" :style="{ '--d': `${80 + i * 80}ms` }">
                    <span class="chip" :class="f.tone">{{ f.kind }}</span>
                    <span class="r-text"><template v-for="(seg, k) in cites(f.text)" :key="k"><span v-if="'n' in seg" class="nw">{{ seg.word }}&nbsp;<span class="cite">{{ seg.n }}</span>{{ seg.tail }}</span><template v-else>{{ seg.t }}</template></template></span>
                  </li>
                </ul>
              </template>

              <template v-else-if="active === 'deep'">
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
              </template>

              <template v-else-if="active === 'wizard'">
                <ol class="stepper rowin">
                  <li v-for="(s, i) in WIZARD_STEPS" :key="s" :class="{ done: i < 3, now: i === 3 }"><span class="sn"><i v-if="i < 3" class="pi pi-check" /><template v-else>{{ i + 1 }}</template></span>{{ s }}</li>
                </ol>
                <ul class="rows">
                  <li v-for="(g, i) in WIZARD_GROUNDS" :key="i" class="row rowin" :style="{ '--d': `${80 + i * 80}ms` }"><span class="r-text">{{ g.text }}<span v-for="c in g.cites" :key="c" class="cite">{{ c }}</span></span></li>
                </ul>
                <div class="doc rowin" style="--d: 320ms"><i class="pi pi-file-word" /><span>{{ DRAFT.title }}</span><span class="doc-m">Word · PDF</span></div>
              </template>

              <template v-else-if="active === 'court'">
                <div class="search rowin"><i class="pi pi-search" /><span>restoring a missed deadline</span></div>
                <div class="res rowin" style="--d: 80ms">
                  <span class="r-k">{{ COURT.kind }}</span><b>{{ COURT.title }}</b><span class="r-m">{{ COURT.ref }}</span>
                  <span class="quote">{{ COURT.quote }}</span>
                </div>
                <div class="res rowin" style="--d: 160ms">
                  <span class="r-k">{{ WATCH.kind }} · {{ WATCH.tag }}</span><b>{{ WATCH.title }}</b><span class="r-m">{{ WATCH.date }}</span>
                </div>
              </template>

              <template v-else>
                <div class="search two rowin"><span><i class="pi pi-book" />employment</span><span><i class="pi pi-calendar" />12.03.2019</span></div>
                <p class="on rowin" style="--d: 60ms">In force on 12 March 2019</p>
                <ul class="rows">
                  <li v-for="(a, i) in ACTS" :key="a.id" class="row act rowin" :class="a.st" :style="{ '--d': `${100 + i * 60}ms` }">
                    <span class="a-txt"><b>{{ a.title }}</b><span>{{ a.match }}</span></span>
                    <span class="chip" :class="a.st === 'in-force' ? 'ok' : a.st === 'repealed' ? 'red' : 'amber'">{{ a.st === 'in-force' ? 'In force' : a.st === 'repealed' ? 'Repealed' : 'Not yet in force' }}</span>
                  </li>
                </ul>
              </template>
            </div>
          </Transition>
          <div class="fade-b" aria-hidden="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p, ul, ol { margin: 0; }
ul, ol { padding: 0; list-style: none; }
b { font-weight: 600; }

/* card: the window stands in it with even margins and is cut only at the bottom */
.tour { position: relative; overflow: hidden; padding: 40px 40px 0; border-radius: 32px; border: 1px solid var(--fd-line);
  background: radial-gradient(60% 70% at 50% 0%, color-mix(in srgb, var(--fd-accent) 14%, transparent), transparent 70%), var(--fd-panel); }
.win { display: flex; flex-direction: column; height: 560px; overflow: hidden; border-radius: 20px 20px 0 0; border: 1px solid var(--fd-line); border-bottom: 0;
  background: var(--fd-bg); box-shadow: var(--lift, 0 30px 80px rgb(0 0 0 / .35)); }
.bar { position: relative; display: flex; align-items: center; height: 46px; flex-shrink: 0; padding: 0 18px; border-bottom: 1px solid var(--fd-line); }
.dots { display: flex; gap: 6px; } .dots span { width: 9px; height: 9px; border-radius: 50%; background: var(--fd-line); }
.bar-t { position: absolute; left: 50%; transform: translateX(-50%); color: var(--fd-muted); font: 500 13px/18px var(--fd-font-sans); white-space: nowrap; }
.tag { margin-left: auto; padding: 2px 10px; border-radius: 999px; border: 1px dashed var(--fd-line); color: var(--fd-muted); font: 500 11px/18px var(--fd-font-sans); letter-spacing: .8px; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; } .fade-enter-from, .fade-leave-to { opacity: 0; }
.body { display: flex; flex: 1; min-height: 0; }

/* sidebar */
.side { position: relative; display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; width: 244px; padding: 14px 12px; border-right: 1px solid var(--fd-line);
  background: color-mix(in srgb, var(--fd-panel) 45%, transparent); }
.grp { padding: 14px 12px 6px; color: var(--fd-muted); font: 600 11px/16px var(--fd-font-sans); letter-spacing: 1px; text-transform: uppercase; }
.grp:first-of-type { padding-top: 4px; }
.item { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 12px; border: 0; border-radius: 10px; background: none;
  color: var(--fd-muted); cursor: pointer; text-align: left; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); transition: color .2s; }
.item .pi { width: 16px; font-size: 14px; text-align: center; }
.item:hover, .item.on { color: var(--fd-ink); }
.item.on .pi { color: var(--fd-accent-text); }
.item:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.hl { position: absolute; left: 0; top: 0; z-index: 0; overflow: hidden; border-radius: 10px; background: var(--fd-panel-2); box-shadow: inset 0 0 0 1px var(--fd-line);
  transition: transform .42s cubic-bezier(.34, 1.25, .64, 1), width .3s, height .3s; }
.hl-bar { position: absolute; left: 0; top: 50%; width: 3px; height: 16px; margin-top: -8px; border-radius: 0 3px 3px 0; background: var(--fd-accent); }
.hl-timer { position: absolute; left: 0; bottom: 0; height: 2px; width: 100%; background: color-mix(in srgb, var(--fd-accent) 55%, transparent); transform-origin: left; animation: fill linear both; }
@keyframes fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }

/* main */
.main { position: relative; flex: 1; min-width: 0; overflow: hidden; }
.pane { display: grid; align-content: start; gap: 12px; height: 100%; padding: 28px 32px 48px; }
.pane.narrow { max-width: 760px; margin: 0 auto; gap: 16px; }
.pane.narrow .bubble { justify-self: end; }
.fade-b { position: absolute; left: 0; right: 0; bottom: 0; height: 64px; background: linear-gradient(transparent, var(--fd-bg)); pointer-events: none; }
.swap-enter-active { transition: opacity .32s cubic-bezier(.23, 1, .32, 1), transform .32s cubic-bezier(.23, 1, .32, 1), filter .32s; }
.swap-leave-active { transition: opacity .16s ease, transform .16s ease, filter .16s; }
.swap-enter-from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
.swap-leave-to { opacity: 0; transform: translateY(-6px); filter: blur(4px); }
.rowin { animation: rise .4s cubic-bezier(.23, 1, .32, 1) both; animation-delay: var(--d, 0ms); }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } }
.v-head { display: grid; gap: 4px; margin-bottom: 6px; }
.v-t { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.v-d { max-width: 620px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }

/* shared bits */
.chip { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; height: 22px; padding: 0 9px; border-radius: 999px; font: 600 11px/1 var(--fd-font-sans); letter-spacing: .3px; white-space: nowrap; }
.chip .pi { font-size: 9px; }
.chip.ok { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.chip.amber { background: var(--fd-amber-soft); color: var(--fd-amber); }
.chip.red { background: var(--fd-red-soft); color: var(--fd-red); }
.cite { display: inline-grid; place-items: center; min-width: 18px; height: 18px; margin-left: 4px; padding: 0 5px; border: 0; border-radius: 5px; vertical-align: 1px;
  background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 11px/1 var(--fd-font-sans); }
.btn-cite { cursor: pointer; transition: background-color .15s, color .15s; }
.btn-cite.on, .btn-cite:hover { background: var(--fd-accent); color: var(--fd-on-accent); }
.nw { white-space: nowrap; }
.rows { display: grid; gap: 8px; }
.row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 40%, transparent); }
.row .chip { margin-top: 1px; min-width: 72px; justify-content: center; }
.r-text { color: var(--fd-ink); font: 400 14px/21px var(--fd-font-sans); }
.quote { margin-top: 8px; padding: 8px 12px; border-left: 2px solid var(--fd-accent); border-radius: 0 8px 8px 0; background: var(--fd-panel-2); color: var(--fd-muted); font: 400 13px/20px var(--fd-font-sans); text-align: left; }

/* chat */
.pane.chat { display: flex; gap: 0; padding: 0; }
.conv { display: flex; flex-direction: column; gap: 16px; flex: 1; min-width: 0; padding: 28px 32px 48px; }
.bubble { align-self: flex-end; max-width: 460px; padding: 10px 16px; border-radius: 18px 18px 6px 18px; background: var(--fd-panel-2); color: var(--fd-ink); font: 400 15px/23px var(--fd-font-sans); }
.who { display: flex; align-items: center; gap: 8px; color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); }
.who-ic { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.who-ic .pi { font-size: 12px; }
.answer { display: grid; gap: 12px; color: var(--fd-ink); font: 400 15px/25px var(--fd-font-sans); }
.answer .first { padding: 10px 14px; border-left: 3px solid var(--fd-accent); border-radius: 0 10px 10px 0; background: color-mix(in srgb, var(--fd-accent-soft) 55%, transparent); font-weight: 500; }
.srcs { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; width: 300px; padding: 24px 18px; border-left: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 45%, transparent); }
.srcs-h { color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); }
.src { display: grid; justify-items: start; gap: 3px; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); cursor: pointer; text-align: left; transition: border-color .2s, box-shadow .2s; }
.src.on { border-color: var(--fd-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 16%, transparent); }
.src-k { display: flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 600 11px/16px var(--fd-font-sans); letter-spacing: .6px; text-transform: uppercase; }
.src-k .cite { margin: 0; }
.src-t { color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); }
.src-r { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }

/* document analysis */
.file { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.f-ic { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px; background: var(--fd-red-soft); color: var(--fd-red); }
.f-txt { display: grid; flex: 1; min-width: 0; }
.f-txt b { overflow: hidden; color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); text-overflow: ellipsis; white-space: nowrap; }
.f-txt span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }

/* deep research */
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
.found { display: grid; gap: 8px; margin-top: 8px; padding-top: 14px; border-top: 1px solid var(--fd-line); }
.found-l { color: var(--fd-muted); font: 600 11px/16px var(--fd-font-sans); letter-spacing: 1px; text-transform: uppercase; }
.found-list { display: flex; flex-wrap: wrap; gap: 6px; min-height: 30px; }
.src-chip { display: inline-flex; align-items: center; height: 30px; padding: 0 12px 0 6px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); font: 500 13px/18px var(--fd-font-sans); white-space: nowrap; }
.src-chip .cite { margin: 0 6px 0 0; }
.pop-enter-active { transition: opacity .3s, transform .35s cubic-bezier(.34, 1.4, .64, 1); }
.pop-enter-from { opacity: 0; transform: scale(.85); }

/* wizard */
.stepper { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-bottom: 4px; }
.stepper li { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.stepper li.done, .stepper li.now { color: var(--fd-ink); }
.sn { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; border: 1px solid var(--fd-line); font: 600 11px/1 var(--fd-font-sans); }
.done .sn { border-color: transparent; background: var(--fd-accent-soft); color: var(--fd-accent-text); } .sn .pi { font-size: 9px; }
.now .sn { border-color: var(--fd-accent); background: var(--fd-accent); color: var(--fd-on-accent); }
.doc { display: flex; align-items: center; gap: 10px; padding: 11px 16px; border-radius: 12px; background: var(--fd-accent-soft); color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.doc .pi { color: var(--fd-accent-text); }
.doc-m { margin-left: auto; color: var(--fd-muted); font-size: 13px; }

/* court practice + law on a date */
.search { display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--fd-accent); background: var(--fd-panel);
  color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 14%, transparent); }
.search .pi { color: var(--fd-muted); font-size: 13px; }
.search.two { justify-self: start; gap: 6px; padding: 0 6px; border-color: var(--fd-line); box-shadow: none; }
.search.two span { display: inline-flex; align-items: center; gap: 8px; height: 30px; padding: 0 12px; border-radius: 8px; background: var(--fd-panel-2); }
.res { display: grid; gap: 3px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 40%, transparent); }
.r-k { color: var(--fd-muted); font: 600 11px/16px var(--fd-font-sans); letter-spacing: .8px; text-transform: uppercase; }
.res b { color: var(--fd-ink); font-size: 15px; line-height: 22px; }
.r-m { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.on { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.act { align-items: center; padding: 10px 16px; }
.act.repealed, .act.later { opacity: .6; }
.a-txt { display: grid; flex: 1; min-width: 0; }
.a-txt b { overflow: hidden; color: var(--fd-ink); font-size: 14px; line-height: 20px; text-overflow: ellipsis; white-space: nowrap; }
.a-txt span { color: var(--fd-muted); font: 400 12px/17px var(--fd-font-sans); }

/* 1024 */
@media (max-width: 1100px) {
  .tour { padding: 28px 28px 0; }
  .side { width: 212px; }
  .srcs { width: 248px; }
  .conv, .pane { padding-left: 24px; padding-right: 24px; }
}
/* phone: the sidebar becomes a row of chips, sources move under the answer */
@media (max-width: 767px) {
  .tour { padding: 14px 14px 0; border-radius: 24px; }
  .win { height: 600px; border-radius: 16px 16px 0 0; }
  .bar { height: 42px; }
  .body { flex-direction: column; }
  .side { flex-direction: row; width: auto; gap: 4px; padding: 10px; overflow-x: auto; border-right: 0; border-bottom: 1px solid var(--fd-line); scrollbar-width: none; }
  .grp, .hl-bar { display: none; }
  .item { height: 34px; padding: 0 12px; font-size: 13px; }
  .pane, .conv { padding: 18px 16px 48px; }
  .srcs { display: none; }
  .bubble { max-width: 92%; }
}
@media (prefers-reduced-motion: reduce) {
  .hl, .swap-enter-active, .swap-leave-active, .pop-enter-active, .fade-enter-active, .fade-leave-active { transition: none; }
  .rowin, .pulse::after { animation: none; }
}
</style>
