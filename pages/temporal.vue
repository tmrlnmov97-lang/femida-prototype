<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { TEMPORAL_SAMPLE, type TemporalAct } from '~/data/mock';

// Law on a date (live: /temporal). One search row — topic + date + Search — and an answer that is easy to read:
// what was in force on that day first, what wasn't (repealed earlier / came later) folded below.
// Status is worked out from the chosen date. Demo: ?state=error | none · ?q=employment&d=2019-03-12 runs a search.
useHead({ title: 'Law on a date — Femida redesign prototype' });
const route = useRoute();
const { state: chat, newChat } = useChat();

const topic = ref('');
const date = ref(''); // yyyy-mm-dd from <input type="date">
const phase = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const asked = ref<{ topic: string; date: string } | null>(null);
const canSearch = computed(() => !!topic.value.trim() && !!date.value);
let failOnce = route.query.state === 'error';

function search() {
  if (!canSearch.value) return;
  asked.value = { topic: topic.value.trim(), date: date.value };
  phase.value = 'loading'; showOther.value = false;
  setTimeout(() => { if (failOnce) { failOnce = false; phase.value = 'error'; return; } phase.value = 'ready'; }, 700);
}
function today() { date.value = new Date().toISOString().slice(0, 10); }
onMounted(() => {
  if (typeof route.query.q === 'string') topic.value = route.query.q;
  if (typeof route.query.d === 'string') date.value = route.query.d;
  if (canSearch.value) search();
});

/* Dates */
const toDate = (dmy: string) => { const [d, m, y] = dmy.split('.').map(Number); return new Date(y, m - 1, d); };
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const long = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const dmy = (iso: string) => iso.split('-').reverse().join('.');

/* Results: status from the chosen date */
type Row = TemporalAct & { st: 'in-force' | 'repealed' | 'later' };
const rows = computed<Row[]>(() => {
  if (!asked.value || route.query.state === 'none') return [];
  const [y, m, d] = asked.value.date.split('-').map(Number); const on = new Date(y, m - 1, d);
  return TEMPORAL_SAMPLE.map((a) => ({ ...a, st: toDate(a.from) > on ? 'later' : a.to && toDate(a.to) < on ? 'repealed' : 'in-force' }));
});
const inForce = computed(() => rows.value.filter((r) => r.st === 'in-force'));
const other = computed(() => rows.value.filter((r) => r.st !== 'in-force'));
const showOther = ref(false);

function ask(r: Row) {
  newChat();
  chat.draft = `What did the ${r.title} say on ${dmy(asked.value!.date)}? (${r.match})`;
  navigateTo('/');
}
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>The law on a given date</h1>
          <p class="lead">See which acts on a topic were in force on a chosen&nbsp;date.</p>
        </header>

        <!-- One search row -->
        <form class="search" @submit.prevent="search">
          <label class="f topic">
            <span class="lbl">Topic / keyword</span>
            <span class="in"><i class="pi pi-search" /><input v-model="topic" placeholder="E.g. inheritance, employment…" /></span>
          </label>
          <label class="f when">
            <span class="lbl">Date <button type="button" class="today" @click="today">Today</button></span>
            <span class="in"><input v-model="date" type="date" aria-label="Date" /></span>
          </label>
          <button type="submit" class="primary" :disabled="!canSearch">Search</button>
        </form>
        <p class="hint">Acts with their entry-into-force and repeal&nbsp;dates.</p>

        <!-- Answer -->
        <section class="results" aria-live="polite">
          <div v-if="phase === 'idle'" class="card idle">
            <span class="e-ic"><i class="pi pi-calendar" /></span>
            <p>Enter a topic and a date to see the acts in&nbsp;force.</p>
          </div>

          <template v-else-if="phase === 'loading'">
            <PSkeleton width="40%" height="22px" class="sk-h" />
            <div class="card list" aria-busy="true" aria-label="Searching">
              <div v-for="i in 3" :key="i" class="row skel"><div class="grow"><PSkeleton :width="`${50 + i * 10}%`" height="15px" /><PSkeleton width="30%" height="12px" /></div><PSkeleton width="120px" height="24px" border-radius="999px" /></div>
            </div>
          </template>

          <div v-else-if="phase === 'error'" class="card state" role="alert">
            <h3>Couldn’t search right now</h3>
            <p>This is temporary. Try again in a&nbsp;moment.</p>
            <button class="secondary" @click="search"><i class="pi pi-refresh" />Try again</button>
          </div>

          <div v-else-if="!rows.length" class="card state">
            <h3>Nothing found for «{{ asked?.topic }}»</h3>
            <p>Try a broader topic, for example “employment” instead of a single&nbsp;article.</p>
          </div>

          <template v-else>
            <div class="r-head">
              <h2>In force on {{ long(asked!.date) }}</h2>
              <span class="r-meta">{{ inForce.length }} {{ inForce.length === 1 ? 'act' : 'acts' }} · «{{ asked!.topic }}»</span>
            </div>
            <ul v-if="inForce.length" class="card list">
              <li v-for="r in inForce" :key="r.id" class="row">
                <div class="grow">
                  <span class="title">{{ r.title }}</span>
                  <span class="match">{{ r.match }}</span>
                </div>
                <div class="side">
                  <span class="range">{{ r.from }} – {{ r.to ?? 'now' }}</span>
                  <span class="pill ok"><i class="pi pi-check" />In force</span>
                </div>
                <button class="ask" :aria-label="`Ask about ${r.title}`" @click="ask(r)">Ask about it<i class="pi pi-arrow-right" /></button>
              </li>
            </ul>
            <div v-else class="card state small"><p>No acts on this topic were in force on that&nbsp;date.</p></div>

            <template v-if="other.length">
              <button class="toggle" :aria-expanded="showOther" @click="showOther = !showOther">
                <i class="pi pi-angle-right" :class="{ open: showOther }" />Not in force on this date<span class="cnt">{{ other.length }}</span>
              </button>
              <ul v-if="showOther" class="card list muted">
                <li v-for="r in other" :key="r.id" class="row">
                  <div class="grow">
                    <span class="title">{{ r.title }}</span>
                    <span class="match">{{ r.match }}</span>
                  </div>
                  <div class="side">
                    <span class="range">{{ r.from }} – {{ r.to ?? 'now' }}</span>
                    <span class="pill" :class="r.st">{{ r.st === 'repealed' ? 'Repealed' : 'Not yet in force' }}</span>
                  </div>
                </li>
              </ul>
            </template>
          </template>
        </section>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
/* Same frame and scale as the other tools: 760 column · H1 32 serif · section 18/600 · body 15 · meta 13 */
.page { flex: 1; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 80px; }
.head { display: grid; gap: 8px; margin-bottom: 32px; }
h1 { margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; }
.lead { margin: 0; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }

/* Search row */
.search { display: grid; grid-template-columns: 1fr 200px auto; align-items: end; gap: 12px; padding: 16px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.f { display: grid; gap: 8px; min-width: 0; }
.lbl { display: flex; align-items: center; justify-content: space-between; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.today { height: 20px; padding: 0 6px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-accent-text); cursor: pointer; font: 500 13px/18px var(--fd-font-sans); }
.today:hover { background: var(--fd-accent-soft); }
.in { display: flex; align-items: center; gap: 10px; height: 48px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); transition: border-color .15s, box-shadow .15s; }
.in:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.in .pi { flex-shrink: 0; color: var(--fd-muted); font-size: 14px; }
.in input { flex: 1; min-width: 0; height: 100%; border: 0; outline: none; background: transparent; color: var(--fd-ink); color-scheme: dark; font: 400 15px/22px var(--fd-font-sans); }
:global(.fd-light) .in input { color-scheme: light; }
.in input::placeholder { color: var(--fd-muted); }
.search .primary { height: 48px; padding: 0 24px; }
.hint { margin: 12px 0 0 4px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }

/* Results */
.results { margin-top: 40px; }
.card { margin: 0; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); overflow: hidden; }
.idle { display: grid; justify-items: center; gap: 8px; padding: 48px 24px; border-style: dashed; background: transparent; text-align: center; }
.idle p { margin: 0; color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); }
.e-ic { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: var(--fd-panel-2); color: var(--fd-muted); }
.sk-h { margin-bottom: 16px; }
.r-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
h2 { margin: 0; color: var(--fd-ink); font: 600 20px/28px var(--fd-font-sans); }
.r-meta { flex-shrink: 0; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }

.list { padding: 0; list-style: none; }
.row { display: flex; align-items: center; gap: 16px; padding: 16px 20px; }
.row + .row { border-top: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.row.skel { padding: 18px 20px; }
.grow { display: grid; gap: 4px; flex: 1; min-width: 0; }
.title { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); text-wrap: pretty; }
.match { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.side { display: grid; justify-items: end; gap: 6px; flex-shrink: 0; }
.range { color: var(--fd-ink); font: 500 13px/18px var(--fd-font-sans); font-variant-numeric: tabular-nums; }
.pill { display: inline-flex; align-items: center; gap: 6px; height: 24px; padding: 0 10px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); }
.pill .pi { font-size: 9px; }
.pill.ok { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.pill.later { background: var(--fd-amber-soft, var(--fd-panel-2)); color: var(--fd-amber); }
.ask { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; height: 34px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 500 13px/18px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.ask .pi { font-size: 10px; color: var(--fd-muted); }
.ask:hover { border-color: var(--fd-accent); background: var(--fd-accent-soft); }
.muted .title { color: color-mix(in srgb, var(--fd-ink) 70%, transparent); }
.muted .range { color: var(--fd-muted); }

.toggle { display: inline-flex; align-items: center; gap: 8px; height: 36px; margin: 24px 0 12px -10px; padding: 0 10px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-ink); cursor: pointer; font: 500 15px/22px var(--fd-font-sans); }
.toggle:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.toggle .pi { font-size: 12px; color: var(--fd-muted); transition: transform .15s; }
.toggle .pi.open { transform: rotate(90deg); }
.cnt { color: var(--fd-muted); font-weight: 400; }

.state { display: grid; justify-items: center; gap: 4px; padding: 32px 24px; text-align: center; }
.state.small { padding: 24px; }
.state h3 { margin: 0; color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.state p { margin: 0 0 8px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: balance; }

/* Buttons */
.primary, .secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, opacity .15s; }
.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .4; cursor: default; }
.secondary { border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.secondary .pi { font-size: 12px; }
.primary:focus-visible, .secondary:focus-visible, .ask:focus-visible, .toggle:focus-visible, .today:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 56px; }
  .head { margin-bottom: 24px; }
  h1 { font-size: 26px; line-height: 34px; }
  .lead { font-size: 15px; line-height: 24px; }
  .search { grid-template-columns: 1fr; }
  .results { margin-top: 32px; }
  .r-head { flex-direction: column; gap: 4px; }
  .row { flex-wrap: wrap; gap: 10px 16px; padding: 16px; }
  .grow { flex-basis: 100%; }
  .side { justify-items: start; grid-auto-flow: column; align-items: center; gap: 10px; }
  .ask { margin-left: auto; }
}
</style>
