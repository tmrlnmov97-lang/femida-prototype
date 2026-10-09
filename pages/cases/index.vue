<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import type { CaseItem } from '~/data/mock';
import { monogram, plural } from '~/composables/useCases';

useHead({ title: 'My cases — Femida redesign prototype' });
const route = useRoute();
const { state, create, remove } = useCases();

/* Screen state. Demo: ?state=loading | empty | error */
const phase = ref<'loading' | 'ready' | 'error'>('loading');
const forceEmpty = ref(false);
function load() {
  phase.value = 'loading';
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => {
    if (s === 'error') { phase.value = 'error'; return; }
    forceEmpty.value = s === 'empty';
    phase.value = 'ready';
  }, 500);
}
onMounted(() => {
  load();
  try { showGuide.value = localStorage.getItem('fd-cases-guide') !== 'hidden'; } catch {}
});
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }
const all = computed(() => (forceEmpty.value ? [] : state.cases));

/* How-it-works guide: shown until the user dismisses it */
const showGuide = ref(true);
function hideGuide() { showGuide.value = false; try { localStorage.setItem('fd-cases-guide', 'hidden'); } catch {} }

/* Tabs + search */
type Tab = 'active' | 'archived';
const tab = ref<Tab>('active');
const query = ref('');
const counts = computed(() => ({ active: all.value.filter((c) => !c.archived).length, archived: all.value.filter((c) => c.archived).length }));
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  return all.value
    .filter((c) => (tab.value === 'archived' ? c.archived : !c.archived))
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.files.some((f) => f.name.toLowerCase().includes(q)) || c.chats.some((x) => x.title.toLowerCase().includes(q)))
    .sort((a, b) => b.ts - a.ts);
});
const summary = (c: CaseItem) => (!c.chats.length && !c.files.length ? 'Empty case' : [plural(c.chats.length, 'chat', 'chats'), plural(c.files.length, 'document', 'documents')].join(' · '));

/* Card menu */
const cardMenu = ref();
const menuFor = ref<CaseItem | null>(null);
const menuOpenId = ref<string | null>(null);
const menuItems = computed(() => [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => menuFor.value && startRename(menuFor.value) },
  menuFor.value?.archived
    ? { label: 'Restore', icon: 'pi pi-replay', command: () => { if (menuFor.value) menuFor.value.archived = false; } }
    : { label: 'Archive', icon: 'pi pi-inbox', command: () => { if (menuFor.value) menuFor.value.archived = true; } },
  { separator: true },
  { label: 'Delete case', icon: 'pi pi-trash', class: 'fd-danger', command: () => { if (menuFor.value) remove(menuFor.value); } },
]);
function openMenu(e: Event, c: CaseItem) { menuFor.value = c; menuOpenId.value = c.id; cardMenu.value.toggle(e); }
const renaming = ref<CaseItem | null>(null);
const renameDraft = ref('');
const renameInput = ref<HTMLInputElement[]>();
function startRename(c: CaseItem) { renaming.value = c; renameDraft.value = c.name; nextTick(() => { const el = renameInput.value?.[0]; el?.focus(); el?.select(); }); }
function commitRename() { if (renaming.value && renameDraft.value.trim()) renaming.value.name = renameDraft.value.trim(); renaming.value = null; }

/* New case → straight into it */
const creating = ref(false);
const newName = ref('');
const newInput = ref<HTMLInputElement>();
function openNew() { creating.value = true; newName.value = ''; nextTick(() => newInput.value?.focus()); }
function createCase() {
  const name = newName.value.trim();
  if (!name) return;
  const c = create(name);
  creating.value = false;
  navigateTo(`/cases/${c.id}`);
}
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <div class="titles">
            <h1>My cases</h1>
            <p class="lead">One place per client: their documents and chats. Questions asked in a case are answered with its&nbsp;documents.</p>
          </div>
          <PButton label="New case" icon="pi pi-plus" class="new-btn" @click="openNew" />
        </header>

        <!-- How it works: answers "what is this and what do I do" on first visit -->
        <section v-if="showGuide && phase === 'ready' && all.length" class="guide" aria-label="How cases work">
          <ol>
            <li><span class="step-ic"><i class="pi pi-briefcase" /></span><div><b>Create a case</b><span>One per client or dispute</span></div></li>
            <li class="arrow" aria-hidden="true"><i class="pi pi-arrow-right" /></li>
            <li><span class="step-ic"><i class="pi pi-upload" /></span><div><b>Add documents</b><span>Contract, claim, court decision</span></div></li>
            <li class="arrow" aria-hidden="true"><i class="pi pi-arrow-right" /></li>
            <li><span class="step-ic"><i class="pi pi-comments" /></span><div><b>Ask questions</b><span>Answers use the files and cite the&nbsp;law</span></div></li>
          </ol>
          <button class="guide-close" aria-label="Hide how cases work" v-tooltip.left="'Got it, hide'" @click="hideGuide"><i class="pi pi-times" /></button>
        </section>

        <div v-if="phase === 'ready' && all.length" class="toolbar">
          <div class="tabs" role="tablist" aria-label="Filter cases">
            <button role="tab" :aria-selected="tab === 'active'" class="tab" :class="{ on: tab === 'active' }" @click="tab = 'active'">Active<span class="count">{{ counts.active }}</span></button>
            <button role="tab" :aria-selected="tab === 'archived'" class="tab" :class="{ on: tab === 'archived' }" @click="tab = 'archived'">Archived<span class="count">{{ counts.archived }}</span></button>
          </div>
          <label class="search">
            <i class="pi pi-search" />
            <input v-model="query" type="search" placeholder="Search cases, chats, files" aria-label="Search cases" @keydown.esc="query = ''" />
            <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
          </label>
        </div>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="grid" aria-busy="true" aria-label="Loading cases">
          <div v-for="i in 3" :key="i" class="card skel">
            <PSkeleton width="44px" height="44px" border-radius="12px" />
            <div class="skel-col"><PSkeleton width="70%" height="16px" /><PSkeleton width="45%" height="12px" /></div>
          </div>
        </div>

        <!-- Error -->
        <div v-else-if="phase === 'error'" class="state">
          <span class="state-ic err"><i class="pi pi-refresh" /></span>
          <h2>Couldn’t load your cases</h2>
          <p>This is temporary. Your cases are safe — try&nbsp;again.</p>
          <PButton label="Try again" icon="pi pi-refresh" severity="secondary" @click="retry" />
        </div>

        <!-- First visit, no cases: the page explains itself -->
        <div v-else-if="!all.length" class="state first">
          <span class="state-ic"><i class="pi pi-briefcase" /></span>
          <h2>Keep each client in one place</h2>
          <p>Put a client’s documents in a case, then ask questions. Femida answers with those documents and cites the&nbsp;law.</p>
          <ol class="steps">
            <li><span class="n">1</span><span><b>Create a case</b> for a client or a dispute</span></li>
            <li><span class="n">2</span><span><b>Add documents</b> — contract, claim, court decision</span></li>
            <li><span class="n">3</span><span><b>Ask</b> — answers use the files and cite the&nbsp;law</span></li>
          </ol>
          <PButton label="Create your first case" icon="pi pi-plus" @click="openNew" />
        </div>

        <!-- Search miss / empty tab -->
        <div v-else-if="!visible.length" class="state small">
          <template v-if="query.trim()">
            <h2>No cases match «{{ query.trim() }}»</h2>
            <p>Search looks in case names, chat titles and file&nbsp;names.</p>
            <PButton label="Clear search" severity="secondary" size="small" @click="query = ''" />
          </template>
          <template v-else>
            <h2>{{ tab === 'archived' ? 'No archived cases' : 'No active cases' }}</h2>
            <p>{{ tab === 'archived' ? 'Finished with a case? Archive it from its ⋯ menu.' : 'All your cases are archived.' }}</p>
          </template>
        </div>

        <!-- Cases: the whole card opens the case -->
        <div v-else class="grid">
          <article v-for="c in visible" :key="c.id" class="card" :class="{ archived: c.archived, 'menu-open': menuOpenId === c.id }">
            <span class="mono" aria-hidden="true">{{ monogram(c.name) }}</span>
            <div class="info">
              <input v-if="renaming === c" ref="renameInput" v-model="renameDraft" class="rename" aria-label="Case name" maxlength="120"
                     @keydown.enter.prevent="commitRename" @keydown.esc.prevent="renaming = null" @blur="commitRename" />
              <NuxtLink v-else :to="`/cases/${c.id}`" class="name">{{ c.name }}</NuxtLink>
              <span class="meta">{{ summary(c) }}</span>
              <span v-if="c.chats.length" class="last"><i class="pi pi-comment" />{{ c.chats[0].title }} <span class="when">· {{ c.chats[0].when }}</span></span>
              <span v-else class="last hint"><i class="pi pi-upload" />Empty — open it to add documents</span>
            </div>
            <div class="side">
              <button class="more" :aria-label="`Actions for ${c.name}`" aria-haspopup="menu" @click="openMenu($event, c)"><i class="pi pi-ellipsis-h" /></button>
              <span class="open">Open<i class="pi pi-arrow-right" /></span>
            </div>
          </article>
        </div>
      </div>
    </div>
    <PMenu ref="cardMenu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />

    <!-- New case -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="creating" class="modal-mask" @click.self="creating = false" @keydown.esc="creating = false">
          <form class="modal" role="dialog" aria-modal="true" aria-labelledby="new-case-title" @submit.prevent="createCase">
            <span class="modal-ic"><i class="pi pi-briefcase" /></span>
            <h2 id="new-case-title">New case</h2>
            <p class="muted">Name it after the client or the dispute. Next you’ll add documents and ask your first&nbsp;question.</p>
            <label class="field">
              <span class="t-label">Case name</span>
              <input ref="newInput" v-model="newName" placeholder="e.g. Petrosyan v. Alfa — lease termination" maxlength="120" />
            </label>
            <div class="modal-actions">
              <PButton type="button" label="Cancel" severity="secondary" text @click="creating = false" />
              <PButton type="submit" label="Create and open" icon="pi pi-arrow-right" icon-pos="right" :disabled="!newName.trim()" />
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 1040px; margin: 0 auto; padding: 40px 0 72px; }

.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.titles { display: grid; gap: 8px; max-width: 620px; }
h1 { margin: 0; font: 600 34px/42px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }
.new-btn { flex-shrink: 0; margin-top: 2px; }

/* Guide */
.guide { position: relative; margin-top: 28px; padding: 18px 56px 18px 20px; border-radius: var(--fd-radius-xl); border: 1px solid color-mix(in srgb, var(--fd-accent) 25%, var(--fd-line)); background: color-mix(in srgb, var(--fd-accent-soft) 60%, var(--fd-panel)); }
.guide ol { display: flex; align-items: center; gap: 16px; margin: 0; padding: 0; list-style: none; }
.guide li { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.guide li.arrow { flex: none; color: color-mix(in srgb, var(--fd-accent-text) 60%, transparent); }
.guide li.arrow .pi { font-size: 13px; }
.step-ic { display: grid; place-items: center; width: 40px; height: 40px; flex-shrink: 0; border-radius: 12px; background: var(--fd-panel); color: var(--fd-accent-text); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fd-accent) 25%, transparent); }
.step-ic .pi { font-size: 16px; }
.guide li div { display: grid; gap: 2px; min-width: 0; }
.guide b { color: var(--fd-ink); font: 600 15px/20px var(--fd-font-sans); }
.guide li div span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.guide-close { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.guide-close:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.guide-close .pi { font-size: 12px; }

/* Toolbar */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 28px 0 16px; }
.tabs { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tab { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: color .15s, background-color .15s; }
.tab:hover { color: var(--fd-ink); }
.tab.on { background: var(--fd-panel-2); color: var(--fd-ink); }
.count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-muted); font: 600 11px/1 var(--fd-font-sans); }
.tab.on .count { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.search { display: flex; align-items: center; gap: 10px; width: 300px; height: 40px; padding: 0 6px 0 12px; border-radius: 10px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s; }
.search:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search > .pi { font-size: 14px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 15px/20px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.clear .pi { font-size: 11px; }

/* Cards */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 12px; }
.card { position: relative; display: flex; align-items: flex-start; gap: 14px; padding: 18px 16px 18px 18px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .2s, background-color .15s; }
.card:not(.skel):hover, .card.menu-open { border-color: color-mix(in srgb, var(--fd-accent) 45%, var(--fd-line)); box-shadow: 0 10px 28px rgb(0 0 0 / .16); }
.card.archived { background: color-mix(in srgb, var(--fd-panel) 55%, var(--fd-bg)); }
.mono { display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 15px/1 var(--fd-font-serif); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fd-accent) 25%, transparent); }
.card.archived .mono { background: var(--fd-panel-2); color: var(--fd-muted); box-shadow: none; }
.info { display: grid; gap: 4px; flex: 1; min-width: 0; }
.name { color: var(--fd-ink); text-decoration: none; font: 600 17px/24px var(--fd-font-sans); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.name::after { content: ''; position: absolute; inset: 0; border-radius: inherit; } /* whole card opens the case */
.name:focus-visible { outline: none; }
.card:has(.name:focus-visible) { box-shadow: 0 0 0 2px var(--fd-focus); }
.meta { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.last { display: flex; align-items: center; gap: 8px; min-width: 0; margin-top: 6px; color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.last .pi { font-size: 12px; color: var(--fd-muted); flex-shrink: 0; }
.last .when { color: var(--fd-muted); }
.last.hint { color: var(--fd-accent-text); }
.last.hint .pi { color: var(--fd-accent-text); }
.side { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; align-self: stretch; gap: 8px; pointer-events: none; }
.more { pointer-events: auto; display: grid; place-items: center; width: 32px; height: 32px; margin: -6px -4px 0 0; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-muted); cursor: pointer; transition: background-color .15s, color .15s; }
.more:hover, .card.menu-open .more { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.more:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 0; }
.open { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-accent-text); font: 500 13px/18px var(--fd-font-sans); opacity: 0; transform: translateX(-4px); transition: opacity .15s, transform .15s; }
.open .pi { font-size: 11px; }
.card:hover .open { opacity: 1; transform: none; }
.rename { position: relative; z-index: 1; height: 32px; padding: 0 10px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-accent); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 600 16px/22px var(--fd-font-sans); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.skel { align-items: center; }
.skel-col { display: grid; gap: 8px; flex: 1; }

/* States */
.state { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 32px; padding: 56px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state.small { padding: 40px 24px; border-style: solid; background: var(--fd-panel); }
.state-ic { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 6px; border-radius: 16px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state-ic .pi { font-size: 22px; }
.state-ic.err { background: var(--fd-amber-soft); color: var(--fd-amber); }
.state h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; max-width: 480px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }
.steps { display: grid; gap: 10px; margin: 6px 0 20px; padding: 0; list-style: none; text-align: left; }
.steps li { display: flex; align-items: center; gap: 12px; color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); }
.steps b { color: var(--fd-ink); font-weight: 600; }
.steps .n { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--fd-accent) 50%, transparent); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }

/* Dialog */
.modal-mask { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 16px; background: rgb(0 0 0 / .55); backdrop-filter: blur(2px); }
.modal { width: 100%; max-width: 460px; display: grid; gap: 10px; padding: 28px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); }
.modal-ic { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 6px; border-radius: 12px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.modal h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.modal .muted { margin: 0; font: 400 15px/22px var(--fd-font-sans); text-wrap: pretty; }
.field { display: grid; gap: 6px; margin-top: 8px; color: var(--fd-ink); }
.field input { height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/20px var(--fd-font-sans); }
.field input:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.field input::placeholder { color: var(--fd-muted); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.fade-enter-active, .fade-leave-active { transition: opacity .16s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 1023px) {
  .page { padding: 0 24px; }
  .grid { grid-template-columns: 1fr; }
  .guide ol { flex-direction: column; align-items: stretch; gap: 12px; }
  .guide li.arrow { display: none; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  .head { flex-direction: column; align-items: stretch; gap: 16px; }
  h1 { font-size: 28px; line-height: 36px; }
  .lead { font-size: 15px; line-height: 24px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 10px; }
  .tabs { align-self: flex-start; }
  .search { width: 100%; }
  .open { display: none; }
}
</style>
