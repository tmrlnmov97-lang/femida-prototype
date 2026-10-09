<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ANSWER, SOURCES } from '~/data/mock';
import { rel } from '~/composables/useCases';
import { savedOn, type NoteItem } from '~/composables/useNotes';

useHead({ title: 'My notes — Femida redesign prototype' });
const route = useRoute();
const { state: cs, byId } = useCases();
const { state: ns, remove: removeNote } = useNotes();
const { state: chat, newChat, send } = useChat();

/* Screen state. Demo: ?state=loading | empty | error */
const phase = ref<'loading' | 'ready' | 'error'>('loading');
const forceEmpty = ref(false);
const openId = ref<string | null>(null);
const isPhone = ref(false);
const notes = computed(() => (forceEmpty.value ? [] : ns.notes));
function load() {
  phase.value = 'loading';
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => {
    if (s === 'error') { phase.value = 'error'; return; }
    forceEmpty.value = s === 'empty';
    phase.value = 'ready';
    if (!isPhone.value) openId.value = flat.value[0]?.id ?? null; // desktop: open the newest note
  }, 450);
}
onMounted(() => { isPhone.value = window.innerWidth < 900; load(); });
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }

/* Filters: type tabs, case, search */
type Tab = 'all' | 'answer' | 'studio';
const TABS: Tab[] = ['all', 'answer', 'studio'];
const tab = ref<Tab>('all');
const caseFilter = ref<string>('all'); // 'all' | caseId | 'none'
const query = ref('');
const counts = computed(() => ({ all: notes.value.length, answer: notes.value.filter((n) => n.kind === 'answer').length, studio: notes.value.filter((n) => n.kind === 'studio').length }));
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return notes.value
    .filter((n) => tab.value === 'all' || n.kind === tab.value)
    .filter((n) => caseFilter.value === 'all' || (caseFilter.value === 'none' ? !n.caseId : n.caseId === caseFilter.value))
    .filter((n) => !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q) || (n.comment ?? '').toLowerCase().includes(q))
    .sort((a, b) => b.ts - a.ts);
});
// Grouped by case (lawyers think in cases); notes without a case go last
const groups = computed(() => {
  const map = new Map<string, NoteItem[]>();
  for (const n of filtered.value) { const k = n.caseId && byId(n.caseId) ? n.caseId : 'none'; if (!map.has(k)) map.set(k, []); map.get(k)!.push(n); }
  return [...map.entries()].sort(([a], [b]) => (a === 'none' ? 1 : b === 'none' ? -1 : 0)).map(([k, items]) => ({ key: k, name: k === 'none' ? 'Not in a case' : byId(k)!.name, items }));
});
const flat = computed(() => groups.value.flatMap((g) => g.items));
const current = computed(() => notes.value.find((n) => n.id === openId.value) ?? null);
const caseMenu = ref();
const caseLabel = computed(() => (caseFilter.value === 'all' ? 'All cases' : caseFilter.value === 'none' ? 'Not in a case' : byId(caseFilter.value)?.name ?? 'All cases'));
const caseItems = computed(() => [
  { label: 'All cases', icon: caseFilter.value === 'all' ? 'pi pi-check' : 'pi pi-fw', command: () => (caseFilter.value = 'all') },
  { separator: true },
  ...cs.cases.filter((c) => notes.value.some((n) => n.caseId === c.id)).map((c) => ({ label: c.name, icon: caseFilter.value === c.id ? 'pi pi-check' : 'pi pi-fw', command: () => (caseFilter.value = c.id) })),
  { label: 'Not in a case', icon: caseFilter.value === 'none' ? 'pi pi-check' : 'pi pi-fw', command: () => (caseFilter.value = 'none') },
]);

const kindLabel = (n: NoteItem) => (n.kind === 'answer' ? 'Answer' : n.studio ?? 'Studio');
const iconOf = (n: NoteItem) => (n.kind === 'answer' ? 'pi pi-comment' : n.studio === 'Timeline' ? 'pi pi-calendar' : n.studio === 'Question list' ? 'pi pi-question-circle' : 'pi pi-list');
const segs = (t: string) => t.split(/(\[\d+\])/).filter(Boolean).map((p) => (/^\[\d+\]$/.test(p) ? { n: Number(p.slice(1, -1)) } : { t: p }));
const activeSrc = ref<number | null>(null);

/* Actions */
const copied = ref(false);
function copy() { copied.value = true; setTimeout(() => (copied.value = false), 1600); }
function followUp(n: NoteItem) { navigateTo({ path: '/', query: { demo: 'answer', ...(n.caseId ? { case: n.caseId, chat: n.chat ?? n.title } : {}) } }); }
function recheck(n: NoteItem) { // ask the same question again against today's law
  newChat();
  if (n.caseId && byId(n.caseId)) { const c = byId(n.caseId)!; chat.caseCtx = { id: c.id, name: c.name, docs: c.files.length }; chat.chatTitle = n.title; }
  send(n.title);
  navigateTo('/');
}
function removeCurrent(n: NoteItem) {
  const i = flat.value.findIndex((x) => x.id === n.id);
  removeNote(n.id);
  openId.value = isPhone.value ? null : flat.value[Math.min(i, flat.value.length - 1)]?.id ?? null;
}
const moreMenu = ref();
const moreItems = computed(() => {
  const n = current.value;
  if (!n) return [];
  return [
    { label: 'Move to case', icon: 'pi pi-briefcase', items: [
      ...cs.cases.filter((c) => !c.archived).map((c) => ({ label: c.name, icon: n.caseId === c.id ? 'pi pi-check' : 'pi pi-fw', command: () => { n.caseId = c.id; } })),
      { separator: true },
      { label: 'Not in a case', icon: !n.caseId ? 'pi pi-check' : 'pi pi-fw', command: () => { n.caseId = undefined; } },
    ] },
    { separator: true },
    { label: 'Remove from notes', icon: 'pi pi-trash', class: 'fd-danger', command: () => removeCurrent(n) },
  ];
});
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>My notes</h1>
          <p class="lead">Saved answers and Studio materials — with your own notes, ready to reuse.</p>
        </header>

        <div class="toolbar">
          <nav class="utabs" role="tablist" aria-label="Notes">
            <button v-for="t in TABS" :key="t" role="tab" :aria-selected="tab === t" class="utab" :class="{ on: tab === t }" @click="tab = t">
              {{ t === 'all' ? 'All' : t === 'answer' ? 'Answers' : 'Studio' }}<span v-if="phase === 'ready'" class="n">{{ counts[t] }}</span>
            </button>
          </nav>
          <div class="tools">
            <button class="btn ghost" aria-haspopup="menu" @click="caseMenu.toggle($event)"><i class="pi pi-briefcase" /><span class="lbl">{{ caseLabel }}</span><i class="pi pi-angle-down" /></button>
            <PMenu ref="caseMenu" :model="caseItems" :popup="true" />
            <label class="search">
              <i class="pi pi-search" />
              <input v-model="query" type="search" placeholder="Search notes" aria-label="Search notes" @keydown.esc="query = ''" />
              <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
            </label>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="split" aria-busy="true" aria-label="Loading notes">
          <div class="list"><div v-for="i in 4" :key="i" class="item skel"><PSkeleton width="80%" height="14px" /><PSkeleton width="95%" height="12px" /><PSkeleton width="40%" height="11px" /></div></div>
          <div class="reader skel-reader"><PSkeleton width="30%" height="11px" /><PSkeleton width="75%" height="24px" /><PSkeleton height="40px" /><PSkeleton height="90px" /></div>
        </div>

        <div v-else-if="phase === 'error'" class="notice">
          <i class="pi pi-exclamation-circle" />
          <div><b>Couldn’t load your notes.</b> This is temporary — your notes are&nbsp;safe.</div>
          <button class="btn" @click="retry"><i class="pi pi-refresh" />Try again</button>
        </div>

        <!-- Empty: show exactly where the save button is -->
        <div v-else-if="!notes.length" class="empty">
          <h2>Keep the answers you’ll need again</h2>
          <p>Under every answer in the chat there is a <b>Save to notes</b> button. Saved answers keep their sources, and you can add your own notes to&nbsp;them.</p>
          <div class="demo-actions" aria-hidden="true">
            <span><i class="pi pi-copy" />Copy</span>
            <span class="hot"><i class="pi pi-bookmark" />Save to notes</span>
            <span><i class="pi pi-shield" />How this answer was found</span>
          </div>
          <NuxtLink to="/" class="btn">Go to chat<i class="pi pi-arrow-right" /></NuxtLink>
        </div>

        <div v-else-if="!flat.length" class="notice"><i class="pi pi-search" /><div>No notes match these filters.</div><button class="btn" @click="query = ''; caseFilter = 'all'; tab = 'all'">Reset filters</button></div>

        <div v-else class="split">
          <!-- List, grouped by case -->
          <div class="list" role="listbox" aria-label="Notes">
            <section v-for="g in groups" :key="g.key" class="group">
              <div class="group-head">
                <NuxtLink v-if="g.key !== 'none'" :to="`/cases/${g.key}`" class="group-name"><i class="pi pi-briefcase" />{{ g.name }}</NuxtLink>
                <span v-else class="group-name plain">{{ g.name }}</span>
                <span class="group-n">{{ g.items.length }}</span>
              </div>
              <button v-for="n in g.items" :key="n.id" class="item" :class="{ on: n.id === openId }" role="option" :aria-selected="n.id === openId" @click="openId = n.id">
                <span class="item-top"><span class="kind"><i :class="iconOf(n)" />{{ kindLabel(n) }}</span><span class="date">{{ rel(n.saved) }}</span></span>
                <span class="title">{{ n.title }}</span>
                <span v-if="n.comment" class="mine"><i class="pi pi-pencil" />{{ n.comment }}</span>
                <span v-else class="excerpt">{{ n.excerpt }}</span>
              </button>
            </section>
          </div>

          <!-- Reader -->
          <article v-if="current" class="reader" :class="{ sheet: isPhone }">
            <button v-if="isPhone" class="back" @click="openId = null"><i class="pi pi-arrow-left" />All notes</button>
            <span class="r-kind"><i :class="iconOf(current)" />{{ current.kind === 'answer' ? 'Saved answer' : `Studio · ${current.studio}` }}</span>
            <h2 class="r-title">{{ current.title }}</h2>
            <p class="r-meta">
              <template v-if="current.caseId && byId(current.caseId)"><NuxtLink :to="`/cases/${current.caseId}`" class="r-link">{{ byId(current.caseId)!.name }}</NuxtLink> · </template>
              <template v-if="current.chat">from chat «{{ current.chat }}» · </template>saved {{ savedOn(current.saved) }}
            </p>

            <!-- What you can do with it -->
            <div class="bar">
              <button class="btn" @click="copy"><i class="pi" :class="copied ? 'pi-check' : 'pi-copy'" />{{ current.kind === 'answer' ? (copied ? 'Copied with sources' : 'Copy with sources') : (copied ? 'Copied' : 'Copy') }}</button>
              <button v-if="current.kind === 'answer'" class="btn" @click="followUp(current)"><i class="pi pi-comments" />Ask a follow-up</button>
              <NuxtLink v-else-if="current.caseId" :to="`/cases/${current.caseId}`" class="btn"><i class="pi pi-briefcase" />Open case</NuxtLink>
              <button class="btn icon" aria-label="More actions" aria-haspopup="menu" @click="moreMenu.toggle($event)"><i class="pi pi-ellipsis-h" /></button>
              <PMenu ref="moreMenu" :model="moreItems" :popup="true" />
            </div>

            <!-- Legal answers age: show the date of the law and a one-click re-check -->
            <div v-if="current.kind === 'answer'" class="validity">
              <i class="pi pi-calendar" />
              <span><b>Law as of {{ savedOn(current.saved) }}</b> — the day you saved it. Laws change; re-check before relying on&nbsp;it.</span>
              <button class="link" @click="recheck(current)">Re-check now</button>
            </div>

            <!-- Your own note -->
            <label class="mine-box">
              <span class="mine-label"><i class="pi pi-pencil" />Your note</span>
              <textarea v-model="current.comment" rows="2" placeholder="Add a note for yourself — what to check, what to tell the client, deadlines…" />
            </label>

            <template v-if="current.kind === 'answer'">
              <p class="short"><template v-for="(s, i) in segs(ANSWER.short)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
              <p v-for="(para, pi) in ANSWER.paragraphs" :key="pi" class="para"><template v-for="(s, i) in segs(para)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
              <ul class="steps"><li v-for="(st, si) in ANSWER.steps" :key="si"><template v-for="(s, i) in segs(st)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></li></ul>
              <section class="sources" aria-label="Sources">
                <h3>Sources</h3>
                <ol>
                  <li v-for="src in SOURCES" :key="src.n" :class="{ hl: activeSrc === src.n }" @click="activeSrc = src.n">
                    <span class="sn">{{ src.n }}</span>
                    <span class="st"><b>{{ src.title }}</b><span>{{ src.kind }} · {{ src.ref }}</span><em v-if="activeSrc === src.n">{{ src.quote }}</em></span>
                  </li>
                </ol>
              </section>
            </template>

            <template v-else>
              <ol v-if="current.studio === 'Timeline'" class="timeline"><li v-for="(it, i) in current.items" :key="i"><span class="tl-date">{{ it.label }}</span><span class="tl-text">{{ it.text }}</span></li></ol>
              <ol v-else-if="current.studio === 'Question list'" class="numbered"><li v-for="(it, i) in current.items" :key="i">{{ it.text }}</li></ol>
              <ul v-else class="bullets"><li v-for="(it, i) in current.items" :key="i">{{ it.text }}</li></ul>
              <section v-if="current.files?.length" class="sources">
                <h3>Based on</h3>
                <div class="files"><span v-for="f in current.files" :key="f" class="file"><i :class="/\.docx?$/i.test(f) ? 'pi pi-file-word' : 'pi pi-file-pdf'" />{{ f }}</span></div>
              </section>
            </template>
          </article>
          <div v-else-if="!isPhone" class="reader placeholder"><span>Select a note to read it</span></div>
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

.btn { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 12px; border-radius: 6px; flex-shrink: 0; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; white-space: nowrap; text-decoration: none; font: 500 13px/18px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.btn .pi { font-size: 12px; color: var(--fd-muted); }
.btn:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.btn.ghost { border-color: transparent; background: transparent; color: var(--fd-muted); max-width: 240px; }
.btn.ghost .lbl { overflow: hidden; text-overflow: ellipsis; }
.btn.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.btn.icon { width: 32px; padding: 0; justify-content: center; }
.btn:focus-visible, .utab:focus-visible, .item:focus-visible, .link:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 1px; }

/* Toolbar */
.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-top: 24px; border-bottom: 1px solid var(--fd-line); }
.utabs { display: flex; gap: 20px; }
.utab { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 2px; border: 0; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.utab:hover, .utab.on { color: var(--fd-ink); }
.utab.on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--fd-accent); }
.utab .n { color: var(--fd-muted); font-weight: 400; font-variant-numeric: tabular-nums; }
.tools { display: flex; align-items: center; gap: 6px; padding-bottom: 6px; }
.search { display: flex; align-items: center; gap: 8px; width: 240px; height: 32px; padding: 0 6px 0 10px; border-radius: 6px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.search:focus-within { border-color: var(--fd-accent); }
.search > .pi { font-size: 12px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 14px/20px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 4px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear .pi { font-size: 10px; }

/* Master–detail */
.split { display: grid; grid-template-columns: 380px minmax(0, 1fr); align-items: start; }
.list { border-right: 1px solid var(--fd-line); }
.group + .group { margin-top: 4px; }
.group-head { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 36px; padding: 0 16px 0 14px; background: var(--fd-bg); border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); }
.group-name { display: inline-flex; align-items: center; gap: 8px; min-width: 0; color: var(--fd-ink); text-decoration: none; font: 600 12px/16px var(--fd-font-sans); letter-spacing: .02em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.group-name .pi { font-size: 11px; color: var(--fd-muted); }
a.group-name:hover { color: var(--fd-accent-text); }
.group-name.plain { color: var(--fd-muted); }
.group-n { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.item { position: relative; display: grid; gap: 4px; width: 100%; padding: 12px 16px 12px 14px; border: 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); background: transparent; text-align: left; cursor: pointer; transition: background-color .1s; }
.item:hover { background: color-mix(in srgb, var(--fd-ink) 3%, transparent); }
.item.on { background: color-mix(in srgb, var(--fd-accent) 7%, transparent); }
.item.on::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--fd-accent); }
.item.skel { cursor: default; gap: 8px; }
.item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.kind { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.kind .pi { font-size: 11px; }
.date { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); white-space: nowrap; }
.title { color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.excerpt, .mine { font: 400 13px/19px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.excerpt { color: var(--fd-muted); }
.mine { color: var(--fd-amber); }
.mine .pi { margin-right: 6px; font-size: 10px; }

.reader { position: sticky; top: 0; min-height: 420px; padding: 20px 8px 24px 40px; }
.skel-reader { display: grid; gap: 14px; align-content: start; }
.placeholder { display: grid; place-items: center; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.r-kind { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .05em; text-transform: uppercase; }
.r-kind .pi { font-size: 11px; }
.r-title { margin: 8px 0 6px; max-width: 720px; color: var(--fd-ink); font: 600 22px/30px var(--fd-font-serif); text-wrap: pretty; }
.r-meta { margin: 0 0 14px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.r-link { color: var(--fd-ink); text-decoration: underline; text-decoration-color: var(--fd-line); text-underline-offset: 3px; }
.r-link:hover { color: var(--fd-accent-text); text-decoration-color: currentColor; }
.bar { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px; }

.validity { display: flex; align-items: center; gap: 10px; max-width: 720px; margin-bottom: 14px; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--fd-line); color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.validity .pi { color: var(--fd-muted); font-size: 12px; }
.validity b { color: var(--fd-ink); font-weight: 600; }
.validity span { flex: 1; }
.link { flex-shrink: 0; height: 28px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-accent-text); cursor: pointer; font: 600 13px/18px var(--fd-font-sans); }
.link:hover { background: color-mix(in srgb, var(--fd-accent) 10%, transparent); }

.mine-box { display: grid; gap: 6px; max-width: 720px; margin-bottom: 20px; padding: 10px 12px; border-radius: 6px; border: 1px dashed color-mix(in srgb, var(--fd-amber) 45%, var(--fd-line)); background: color-mix(in srgb, var(--fd-amber-soft) 50%, transparent); cursor: text; }
.mine-box:focus-within { border-style: solid; border-color: var(--fd-amber); }
.mine-label { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-amber); font: 600 11px/16px var(--fd-font-sans); letter-spacing: .05em; text-transform: uppercase; }
.mine-label .pi { font-size: 10px; }
.mine-box textarea { width: 100%; min-height: 40px; resize: vertical; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 14px/21px var(--fd-font-sans); }
.mine-box textarea::placeholder { color: var(--fd-muted); }

.short { margin: 0 0 16px; max-width: 720px; padding: 12px 16px; border-left: 2px solid var(--fd-accent); background: color-mix(in srgb, var(--fd-ink) 3%, transparent); color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.para { margin: 0 0 12px; max-width: 720px; color: var(--fd-ink); font: 400 15px/25px var(--fd-font-sans); }
.steps { margin: 0 0 20px; max-width: 720px; padding-left: 20px; color: var(--fd-ink); font: 400 15px/25px var(--fd-font-sans); }
.steps li { margin-bottom: 4px; }
.sources { max-width: 720px; padding-top: 16px; border-top: 1px solid var(--fd-line); }
.sources h3 { margin: 0 0 10px; color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .05em; text-transform: uppercase; }
.sources ol { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.sources li { display: flex; align-items: flex-start; gap: 12px; padding: 8px; border-radius: 6px; cursor: pointer; transition: background-color .1s; }
.sources li:hover, .sources li.hl { background: color-mix(in srgb, var(--fd-accent) 7%, transparent); }
.sn { display: grid; place-items: center; min-width: 20px; height: 20px; margin-top: 1px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.st { display: grid; gap: 1px; }
.st b { color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.st span { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.st em { margin-top: 4px; color: var(--fd-ink); font: italic 400 13px/19px var(--fd-font-sans); }
.timeline { display: grid; margin: 0 0 20px; padding: 0; list-style: none; max-width: 720px; }
.timeline li { display: grid; grid-template-columns: 120px 1fr; gap: 16px; padding: 10px 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); }
.tl-date { color: var(--fd-muted); font: 500 13px/22px var(--fd-font-sans); font-variant-numeric: tabular-nums; }
.tl-text { color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.numbered, .bullets { margin: 0 0 20px; max-width: 720px; padding-left: 22px; color: var(--fd-ink); font: 400 15px/26px var(--fd-font-sans); }
.numbered li, .bullets li { margin-bottom: 6px; padding-left: 4px; }
.files { display: flex; flex-wrap: wrap; gap: 6px; }
.file { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--fd-line); color: var(--fd-ink); font: 400 13px/18px var(--fd-font-sans); }
.file .pi { font-size: 12px; color: var(--fd-muted); }

/* Empty */
.empty { display: grid; justify-items: center; gap: 10px; padding: 56px 24px; text-align: center; border-bottom: 1px solid var(--fd-line); }
.empty h2 { margin: 0; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.empty p { margin: 0; max-width: 460px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: balance; }
.empty p b { color: var(--fd-ink); }
.demo-actions { display: flex; gap: 4px; margin: 8px 0 12px; padding: 6px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.demo-actions span { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 6px; color: var(--fd-muted); font: 500 13px/18px var(--fd-font-sans); }
.demo-actions .pi { font-size: 12px; }
.demo-actions .hot { color: var(--fd-ink); background: var(--fd-accent-soft); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fd-accent) 45%, transparent); }
.demo-actions .hot .pi { color: var(--fd-accent-text); }
.notice { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px 12px 12px 14px; border-radius: 6px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.notice > div { flex: 1; } .notice b { color: var(--fd-ink); font-weight: 600; }

@media (max-width: 1023px) { .page { padding: 0 24px; } .split { grid-template-columns: 320px minmax(0, 1fr); } .reader { padding-left: 28px; } }
@media (max-width: 899px) {
  .split { grid-template-columns: 1fr; }
  .list { border-right: 0; }
  .reader.sheet { position: fixed; inset: 0; z-index: 70; overflow-y: auto; padding: 16px 16px 40px; background: var(--fd-bg); }
  .back { display: inline-flex; align-items: center; gap: 8px; height: 32px; margin: 0 0 12px -8px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
  .back .pi { font-size: 12px; }
  .validity { flex-wrap: wrap; }
  .timeline li { grid-template-columns: 96px 1fr; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  h1 { font-size: 24px; line-height: 32px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 0; border-bottom: 0; }
  .utabs { border-bottom: 1px solid var(--fd-line); }
  .tools { padding: 10px 0 6px; }
  .search { flex: 1; width: auto; }
  .demo-actions { flex-wrap: wrap; justify-content: center; }
}
</style>
