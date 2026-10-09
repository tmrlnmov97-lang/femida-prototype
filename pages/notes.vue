<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { NOTES, ANSWER, SOURCES, type Note } from '~/data/mock';
import { rel } from '~/composables/useCases';

useHead({ title: 'My notes — Femida redesign prototype' });
const route = useRoute();
const { byId } = useCases();

/* Screen state. Demo: ?state=loading | empty | error */
const notes = ref<Note[]>(NOTES.map((n) => ({ ...n })));
const phase = ref<'loading' | 'ready' | 'error'>('loading');
const openId = ref<string | null>(null);
const isPhone = ref(false);
function load() {
  phase.value = 'loading';
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => {
    if (s === 'error') { phase.value = 'error'; return; }
    if (s === 'empty') notes.value = [];
    phase.value = 'ready';
    if (!isPhone.value) openId.value = shown.value[0]?.id ?? null; // desktop: open the newest note
  }, 450);
}
onMounted(() => { isPhone.value = window.innerWidth < 900; load(); });
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }

/* Tabs + search */
type Tab = 'all' | 'answer' | 'studio';
const TABS: Tab[] = ['all', 'answer', 'studio'];
const tab = ref<Tab>('all');
const query = ref('');
const counts = computed(() => ({ all: notes.value.length, answer: notes.value.filter((n) => n.kind === 'answer').length, studio: notes.value.filter((n) => n.kind === 'studio').length }));
const shown = computed(() => {
  const q = query.value.trim().toLowerCase();
  return notes.value
    .filter((n) => tab.value === 'all' || n.kind === tab.value)
    .filter((n) => !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q))
    .sort((a, b) => b.ts - a.ts);
});
const current = computed(() => notes.value.find((n) => n.id === openId.value) ?? null);
const kindLabel = (n: Note) => (n.kind === 'answer' ? 'Answer' : n.studio ?? 'Studio');
const iconOf = (n: Note) => (n.kind === 'answer' ? 'pi pi-comment' : n.studio === 'Timeline' ? 'pi pi-calendar' : n.studio === 'Question list' ? 'pi pi-question-circle' : 'pi pi-list');

/* Answer text with [n] citations */
const segs = (t: string) => t.split(/(\[\d+\])/).filter(Boolean).map((p) => (/^\[\d+\]$/.test(p) ? { n: Number(p.slice(1, -1)) } : { t: p }));
const activeSrc = ref<number | null>(null);

/* Actions */
const copied = ref(false);
function copy() { copied.value = true; setTimeout(() => (copied.value = false), 1400); }
function remove(n: Note) {
  const i = shown.value.findIndex((x) => x.id === n.id);
  notes.value = notes.value.filter((x) => x.id !== n.id);
  openId.value = isPhone.value ? null : shown.value[Math.min(i, shown.value.length - 1)]?.id ?? null;
}
function openChat(n: Note) { navigateTo({ path: '/', query: { demo: 'answer', ...(n.caseId ? { case: n.caseId, chat: n.chat } : {}) } }); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>My notes</h1>
          <p class="lead">Saved answers and Studio materials.</p>
        </header>

        <div class="toolbar">
          <nav class="utabs" role="tablist" aria-label="Notes">
            <button v-for="t in TABS" :key="t" role="tab" :aria-selected="tab === t" class="utab" :class="{ on: tab === t }" @click="tab = t">
              {{ t === 'all' ? 'All' : t === 'answer' ? 'Answers' : 'Studio' }}<span v-if="phase === 'ready'" class="n">{{ counts[t] }}</span>
            </button>
          </nav>
          <label class="search">
            <i class="pi pi-search" />
            <input v-model="query" type="search" placeholder="Search notes" aria-label="Search notes" @keydown.esc="query = ''" />
            <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
          </label>
        </div>

        <!-- Loading: skeletons (the live page shows a bare spinner) -->
        <div v-if="phase === 'loading'" class="split" aria-busy="true" aria-label="Loading notes">
          <div class="list"><div v-for="i in 4" :key="i" class="item skel"><PSkeleton width="80%" height="14px" /><PSkeleton width="95%" height="12px" /><PSkeleton width="40%" height="11px" /></div></div>
          <div class="reader skel-reader"><PSkeleton width="30%" height="11px" /><PSkeleton width="75%" height="24px" /><PSkeleton height="90px" /><PSkeleton height="60px" /></div>
        </div>

        <div v-else-if="phase === 'error'" class="notice">
          <i class="pi pi-exclamation-circle" />
          <div><b>Couldn’t load your notes.</b> This is temporary — your notes are&nbsp;safe.</div>
          <button class="btn" @click="retry"><i class="pi pi-refresh" />Try again</button>
        </div>

        <div v-else-if="!notes.length" class="empty">
          <i class="pi pi-bookmark" />
          <h2>No notes yet</h2>
          <p>Click “Save to notes” under an answer or a Studio material to keep it&nbsp;here.</p>
          <NuxtLink to="/" class="btn">Go to chat<i class="pi pi-arrow-right" /></NuxtLink>
        </div>

        <div v-else-if="!shown.length" class="notice"><i class="pi pi-search" /><div>No notes match <b>«{{ query.trim() }}»</b>.</div><button class="btn" @click="query = ''">Clear search</button></div>

        <div v-else class="split">
          <!-- List -->
          <ul class="list" role="listbox" aria-label="Notes">
            <li v-for="n in shown" :key="n.id">
              <button class="item" :class="{ on: n.id === openId }" role="option" :aria-selected="n.id === openId" @click="openId = n.id">
                <span class="item-top">
                  <span class="kind"><i :class="iconOf(n)" />{{ kindLabel(n) }}</span>
                  <span class="date">{{ rel(n.saved) }}</span>
                </span>
                <span class="title">{{ n.title }}</span>
                <span class="excerpt">{{ n.excerpt }}</span>
                <span v-if="n.caseId && byId(n.caseId)" class="case"><i class="pi pi-briefcase" />{{ byId(n.caseId)!.name }}</span>
              </button>
            </li>
          </ul>

          <!-- Reader -->
          <article v-if="current" class="reader" :class="{ sheet: isPhone }">
            <button v-if="isPhone" class="back" @click="openId = null"><i class="pi pi-arrow-left" />All notes</button>
            <div class="r-head">
              <span class="r-kind">{{ current.kind === 'answer' ? 'Saved answer' : `Studio · ${current.studio}` }}</span>
              <div class="r-actions">
                <button class="icon-act" :aria-label="copied ? 'Copied' : 'Copy'" v-tooltip.bottom="copied ? 'Copied' : 'Copy'" @click="copy"><i class="pi" :class="copied ? 'pi-check' : 'pi-copy'" /></button>
                <button v-if="current.kind === 'answer'" class="icon-act" aria-label="Open chat" v-tooltip.bottom="'Open chat'" @click="openChat(current)"><i class="pi pi-comments" /></button>
                <button class="icon-act danger" aria-label="Remove from notes" v-tooltip.bottom="'Remove from notes'" @click="remove(current)"><i class="pi pi-trash" /></button>
              </div>
            </div>
            <h2 class="r-title">{{ current.title }}</h2>
            <p class="r-meta">
              <template v-if="current.chat">From chat «{{ current.chat }}» · </template>
              <template v-if="current.caseId && byId(current.caseId)"><NuxtLink :to="`/cases/${current.caseId}`" class="r-link">{{ byId(current.caseId)!.name }}</NuxtLink> · </template>
              Saved {{ rel(current.saved) }}
            </p>

            <!-- Saved answer: same answer, citations stay clickable -->
            <template v-if="current.kind === 'answer'">
              <p class="short"><template v-for="(s, i) in segs(ANSWER.short)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
              <p v-for="(para, pi) in ANSWER.paragraphs" :key="pi" class="para"><template v-for="(s, i) in segs(para)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
              <ul class="steps"><li v-for="(st, si) in ANSWER.steps" :key="si"><template v-for="(s, i) in segs(st)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></li></ul>
              <section class="sources" aria-label="Sources">
                <h3>Sources</h3>
                <ol>
                  <li v-for="src in SOURCES" :key="src.n" :class="{ hl: activeSrc === src.n }" @click="activeSrc = src.n">
                    <span class="sn">{{ src.n }}</span>
                    <span class="st"><b>{{ src.title }}</b><span>{{ src.kind }} · {{ src.ref }}</span></span>
                  </li>
                </ol>
              </section>
            </template>

            <!-- Studio material -->
            <template v-else>
              <ol v-if="current.studio === 'Timeline'" class="timeline">
                <li v-for="(it, i) in current.items" :key="i"><span class="tl-date">{{ it.label }}</span><span class="tl-text">{{ it.text }}</span></li>
              </ol>
              <ol v-else-if="current.studio === 'Question list'" class="numbered"><li v-for="(it, i) in current.items" :key="i">{{ it.text }}</li></ol>
              <ul v-else class="bullets"><li v-for="(it, i) in current.items" :key="i">{{ it.text }}</li></ul>
              <section v-if="current.files?.length" class="based">
                <h3>Based on</h3>
                <div class="files"><span v-for="f in current.files" :key="f" class="file"><i :class="/\.docx?$/i.test(f) ? 'pi pi-file-word' : 'pi pi-file-pdf'" />{{ f }}</span></div>
              </section>
            </template>
          </article>
          <div v-else-if="!isPhone" class="reader placeholder"><i class="pi pi-bookmark" /><span>Select a note to read it</span></div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 1180px; margin: 0 auto; padding: 40px 0 64px; }
.head { display: grid; gap: 4px; }
h1 { margin: 0; font: 600 28px/36px var(--fd-font-serif); letter-spacing: -.005em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }

.btn { display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 12px; border-radius: 6px; flex-shrink: 0; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; white-space: nowrap; text-decoration: none; font: 500 14px/20px var(--fd-font-sans); }
.btn .pi { font-size: 12px; }
.btn:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }

/* Toolbar */
.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 24px; border-bottom: 1px solid var(--fd-line); }
.utabs { display: flex; gap: 20px; }
.utab { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 2px; border: 0; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.utab:hover, .utab.on { color: var(--fd-ink); }
.utab.on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--fd-accent); }
.utab .n { color: var(--fd-muted); font-weight: 400; font-variant-numeric: tabular-nums; }
.utab:focus-visible, .item:focus-visible, .icon-act:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.search { display: flex; align-items: center; gap: 8px; width: 260px; height: 32px; margin-bottom: 6px; padding: 0 6px 0 10px; border-radius: 6px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.search:focus-within { border-color: var(--fd-accent); }
.search > .pi { font-size: 12px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 14px/20px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 4px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear .pi { font-size: 10px; }

/* Master–detail */
.split { display: grid; grid-template-columns: 380px minmax(0, 1fr); gap: 0; align-items: start; }
.list { margin: 0; padding: 0; list-style: none; border-right: 1px solid var(--fd-line); }
.item { position: relative; display: grid; gap: 4px; width: 100%; padding: 14px 16px 14px 14px; border: 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); background: transparent; text-align: left; cursor: pointer; transition: background-color .1s; }
.item:hover { background: color-mix(in srgb, var(--fd-ink) 3%, transparent); }
.item.on { background: color-mix(in srgb, var(--fd-accent) 7%, transparent); }
.item.on::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--fd-accent); }
.item.skel { cursor: default; gap: 8px; }
.item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kind { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.kind .pi { font-size: 11px; }
.date { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); white-space: nowrap; }
.title { color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.excerpt { color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.case { display: inline-flex; align-items: center; gap: 6px; margin-top: 2px; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.case .pi { font-size: 10px; }

.reader { position: sticky; top: 0; min-height: 420px; padding: 24px 8px 24px 40px; }
.skel-reader { display: grid; gap: 14px; align-content: start; }
.placeholder { display: grid; place-items: center; align-content: center; gap: 10px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.placeholder .pi { font-size: 22px; }
.r-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.r-kind { color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .05em; text-transform: uppercase; }
.r-actions { display: flex; gap: 2px; }
.icon-act { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.icon-act:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.icon-act.danger:hover { color: var(--fd-red); }
.icon-act .pi { font-size: 13px; }
.r-title { margin: 8px 0 6px; max-width: 720px; color: var(--fd-ink); font: 600 22px/30px var(--fd-font-serif); text-wrap: pretty; }
.r-meta { margin: 0 0 20px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.r-link { color: var(--fd-ink); text-decoration: underline; text-decoration-color: var(--fd-line); text-underline-offset: 3px; }
.r-link:hover { color: var(--fd-accent-text); text-decoration-color: currentColor; }

.short { margin: 0 0 16px; max-width: 720px; padding: 12px 16px; border-left: 2px solid var(--fd-accent); background: color-mix(in srgb, var(--fd-ink) 3%, transparent); color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.para { margin: 0 0 12px; max-width: 720px; color: var(--fd-ink); font: 400 15px/25px var(--fd-font-sans); }
.steps { margin: 0 0 20px; max-width: 720px; padding-left: 20px; color: var(--fd-ink); font: 400 15px/25px var(--fd-font-sans); }
.steps li { margin-bottom: 4px; }
.sources, .based { max-width: 720px; padding-top: 16px; border-top: 1px solid var(--fd-line); }
.sources h3, .based h3 { margin: 0 0 10px; color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .05em; text-transform: uppercase; }
.sources ol { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.sources li { display: flex; align-items: flex-start; gap: 12px; padding: 8px; border-radius: 6px; cursor: pointer; transition: background-color .1s; }
.sources li:hover, .sources li.hl { background: color-mix(in srgb, var(--fd-accent) 7%, transparent); }
.sn { display: grid; place-items: center; min-width: 20px; height: 20px; margin-top: 1px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.st { display: grid; gap: 1px; }
.st b { color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.st span { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }

.timeline { display: grid; margin: 0 0 20px; padding: 0; list-style: none; max-width: 720px; }
.timeline li { display: grid; grid-template-columns: 120px 1fr; gap: 16px; padding: 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); }
.tl-date { color: var(--fd-muted); font: 500 13px/22px var(--fd-font-sans); font-variant-numeric: tabular-nums; }
.tl-text { color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.numbered, .bullets { margin: 0 0 20px; max-width: 720px; padding-left: 22px; color: var(--fd-ink); font: 400 15px/26px var(--fd-font-sans); }
.numbered li, .bullets li { margin-bottom: 6px; padding-left: 4px; }
.files { display: flex; flex-wrap: wrap; gap: 6px; }
.file { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--fd-line); color: var(--fd-ink); font: 400 13px/18px var(--fd-font-sans); }
.file .pi { font-size: 12px; color: var(--fd-muted); }

.empty { display: grid; justify-items: center; gap: 8px; padding: 64px 24px; text-align: center; border-bottom: 1px solid var(--fd-line); }
.empty > .pi { font-size: 26px; color: var(--fd-muted); margin-bottom: 4px; }
.empty h2 { margin: 0; color: var(--fd-ink); font: 600 16px/22px var(--fd-font-sans); }
.empty p { margin: 0 0 8px; max-width: 420px; color: var(--fd-muted); font: 400 14px/21px var(--fd-font-sans); text-wrap: balance; }
.notice { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px 12px 12px 14px; border-radius: 6px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.notice > div { flex: 1; } .notice b { color: var(--fd-ink); font-weight: 600; }

@media (max-width: 1023px) { .page { padding: 0 24px; } .split { grid-template-columns: 320px minmax(0, 1fr); } .reader { padding-left: 28px; } }
@media (max-width: 899px) {
  .split { grid-template-columns: 1fr; }
  .list { border-right: 0; }
  .reader.sheet { position: fixed; inset: 0; z-index: 70; overflow-y: auto; padding: 16px 16px 40px; background: var(--fd-bg); }
  .back { display: inline-flex; align-items: center; gap: 8px; height: 32px; margin: 0 0 12px -8px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
  .back .pi { font-size: 12px; }
  .timeline li { grid-template-columns: 96px 1fr; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  h1 { font-size: 24px; line-height: 32px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 0; border-bottom: 0; }
  .utabs { border-bottom: 1px solid var(--fd-line); }
  .search { width: 100%; margin: 10px 0 6px; }
}
</style>
