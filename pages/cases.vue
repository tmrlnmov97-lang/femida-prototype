<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { CASES, type CaseItem } from '~/data/mock';

useHead({ title: 'My cases — Femida redesign prototype' });
const route = useRoute();

/* Data + screen state. Demo: ?state=loading | empty | error */
const cases = ref<CaseItem[]>(CASES.map((c) => ({ ...c })));
const phase = ref<'loading' | 'ready' | 'error'>('loading');
function load() {
  phase.value = 'loading';
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => {
    if (s === 'error') { phase.value = 'error'; return; }
    if (s === 'empty') cases.value = [];
    phase.value = 'ready';
  }, 600);
}
onMounted(load);

/* Tabs + search */
type Tab = 'active' | 'archived' | 'all';
const TABS: Tab[] = ['active', 'archived', 'all'];
const tab = ref<Tab>('active');
const query = ref('');
const counts = computed(() => ({
  active: cases.value.filter((c) => !c.archived).length,
  archived: cases.value.filter((c) => c.archived).length,
  all: cases.value.length,
}));
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cases.value
    .filter((c) => (tab.value === 'all' ? true : tab.value === 'archived' ? c.archived : !c.archived))
    .filter((c) => !q || c.name.toLowerCase().includes(q));
});
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/* Row actions */
const rowMenu = ref();
const menuFor = ref<CaseItem | null>(null);
const menuOpenId = ref<string | null>(null); // row highlight while its menu is open
const menuItems = computed(() => [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => menuFor.value && startRename(menuFor.value) },
  menuFor.value?.archived
    ? { label: 'Restore', icon: 'pi pi-replay', command: () => { if (menuFor.value) menuFor.value.archived = false; } }
    : { label: 'Archive', icon: 'pi pi-inbox', command: () => { if (menuFor.value) menuFor.value.archived = true; } },
  { separator: true },
  { label: 'Delete case', icon: 'pi pi-trash', class: 'fd-danger', command: () => { cases.value = cases.value.filter((c) => c !== menuFor.value); } },
]);
function openMenu(e: Event, c: CaseItem) { menuFor.value = c; menuOpenId.value = c.id; rowMenu.value.toggle(e); }

const renaming = ref<CaseItem | null>(null);
const renameDraft = ref('');
const renameInput = ref<HTMLInputElement[]>();
function startRename(c: CaseItem) {
  renaming.value = c; renameDraft.value = c.name;
  nextTick(() => { const el = renameInput.value?.[0]; el?.focus(); el?.select(); });
}
function commitRename() { if (renaming.value && renameDraft.value.trim()) renaming.value.name = renameDraft.value.trim(); renaming.value = null; }

/* New case */
const creating = ref(false);
const newName = ref('');
const newInput = ref<HTMLInputElement>();
function openNew() { creating.value = true; newName.value = ''; nextTick(() => newInput.value?.focus()); }
function createCase() {
  const name = newName.value.trim();
  if (!name) return;
  cases.value.unshift({ id: `k${Date.now()}`, name, chats: 0, docs: 0, updated: 'Just now' });
  tab.value = 'active'; query.value = ''; creating.value = false;
}
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <div class="titles">
            <h1>My cases</h1>
            <p class="lead">A case gathers one client’s chats and documents. Questions asked in a case are answered with its&nbsp;documents.</p>
          </div>
          <PButton label="New case" icon="pi pi-plus" class="new-btn" @click="openNew" />
        </header>

        <div v-if="phase !== 'error' && !(phase === 'ready' && !cases.length)" class="toolbar">
          <div class="tabs" role="tablist" aria-label="Filter cases">
            <button v-for="t in TABS" :key="t" role="tab" :aria-selected="tab === t" class="tab" :class="{ on: tab === t }" @click="tab = t">
              {{ t === 'active' ? 'Active' : t === 'archived' ? 'Archived' : 'All' }}
              <span v-if="phase === 'ready'" class="count">{{ counts[t] }}</span>
            </button>
          </div>
          <label class="search">
            <i class="pi pi-search" />
            <input v-model="query" type="search" placeholder="Search cases" aria-label="Search cases" @keydown.esc="query = ''" />
            <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
          </label>
        </div>

        <!-- Loading: skeleton rows, not a spinner -->
        <div v-if="phase === 'loading'" class="list" aria-busy="true" aria-label="Loading cases">
          <div v-for="i in 3" :key="i" class="row skel-row">
            <PSkeleton width="40px" height="40px" border-radius="10px" />
            <div class="skel-text"><PSkeleton :width="i === 2 ? '46%' : '34%'" height="16px" /><PSkeleton width="22%" height="12px" /></div>
            <PSkeleton width="96px" height="12px" />
          </div>
        </div>

        <!-- Error: honest, retryable -->
        <div v-else-if="phase === 'error'" class="state">
          <span class="state-ic err"><i class="pi pi-refresh" /></span>
          <h2>Couldn’t load your cases</h2>
          <p>This is temporary. Your cases are safe — try&nbsp;again.</p>
          <PButton label="Try again" icon="pi pi-refresh" severity="secondary" @click="$router.replace({ query: {} }).then(load)" />
        </div>

        <!-- Empty: no cases at all -->
        <div v-else-if="!cases.length" class="state">
          <span class="state-ic"><i class="pi pi-clipboard" /></span>
          <h2>No cases yet</h2>
          <p>Create a case for a client to keep their chats and documents together. Questions asked inside a case are answered with its&nbsp;documents.</p>
          <PButton label="Create your first case" icon="pi pi-plus" @click="openNew" />
        </div>

        <!-- Nothing in this tab / no search match -->
        <div v-else-if="!visible.length" class="state small">
          <template v-if="query.trim()">
            <h2>No cases match «{{ query.trim() }}»</h2>
            <p>Check the spelling or search in All&nbsp;cases.</p>
            <PButton label="Clear search" severity="secondary" size="small" @click="query = ''" />
          </template>
          <template v-else>
            <h2>{{ tab === 'archived' ? 'No archived cases' : 'No active cases' }}</h2>
            <p>{{ tab === 'archived' ? 'Archive a case from its ⋯ menu when the work is done.' : 'All your cases are archived.' }}</p>
          </template>
        </div>

        <ul v-else class="list" role="list">
          <li v-for="c in visible" :key="c.id" class="row" :class="{ archived: c.archived, 'menu-open': menuOpenId === c.id }">
            <span class="case-ic"><i class="pi pi-briefcase" /></span>
            <div class="info">
              <input v-if="renaming === c" ref="renameInput" v-model="renameDraft" class="rename" aria-label="Case name" maxlength="120"
                     @keydown.enter.prevent="commitRename" @keydown.esc.prevent="renaming = null" @blur="commitRename" />
              <a v-else href="#" class="name" @click.prevent>{{ c.name }}</a>
              <div class="meta">
                <span><i class="pi pi-comments" />{{ c.chats ? plural(c.chats, 'chat', 'chats') : 'No chats yet' }}</span>
                <span><i class="pi pi-file" />{{ c.docs ? plural(c.docs, 'document', 'documents') : 'No documents' }}</span>
                <span v-if="c.archived" class="tag">Archived</span>
              </div>
            </div>
            <span class="updated">Updated {{ c.updated }}</span>
            <button class="more" :aria-label="`Actions for ${c.name}`" aria-haspopup="menu" @click.stop="openMenu($event, c)"><i class="pi pi-ellipsis-h" /></button>
          </li>
        </ul>
      </div>
    </div>
    <PMenu ref="rowMenu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />

    <!-- New case dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="creating" class="modal-mask" @click.self="creating = false" @keydown.esc="creating = false">
          <form class="modal" role="dialog" aria-modal="true" aria-labelledby="new-case-title" @submit.prevent="createCase">
            <h2 id="new-case-title">New case</h2>
            <p class="muted">Give it a name you’ll recognise — usually the client or the&nbsp;dispute.</p>
            <label class="field">
              <span class="t-label">Case name</span>
              <input ref="newInput" v-model="newName" placeholder="e.g. Petrosyan v. Alfa — lease termination" maxlength="120" />
            </label>
            <div class="modal-actions">
              <PButton type="button" label="Cancel" severity="secondary" @click="creating = false" />
              <PButton type="submit" label="Create case" :disabled="!newName.trim()" />
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 32px; }
.wrap { width: 100%; max-width: 960px; margin: 0 auto; padding: 40px 0 64px; }

.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.titles { display: grid; gap: 6px; max-width: 620px; }
h1 { margin: 0; font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: pretty; }
.new-btn { flex-shrink: 0; }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 28px 0 16px; }
.tabs { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tab {
  display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 14px; border: 0; border-radius: 999px;
  background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: color .15s, background-color .15s;
}
.tab:hover { color: var(--fd-ink); }
.tab.on { background: var(--fd-panel-2); color: var(--fd-ink); }
.count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-muted); font: 600 11px/1 var(--fd-font-sans); }
.tab.on .count { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.search {
  display: flex; align-items: center; gap: 10px; width: 280px; height: 40px; padding: 0 6px 0 12px; border-radius: 10px; cursor: text;
  border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s;
}
.search:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search > .pi { font-size: 14px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 15px/20px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.clear .pi { font-size: 11px; }

.list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; border: 1px solid var(--fd-line); border-radius: var(--fd-radius-lg); background: var(--fd-panel); overflow: hidden; }
.row { position: relative; display: flex; align-items: center; gap: 16px; min-height: 76px; padding: 14px 12px 14px 18px; transition: background-color .15s; }
.row + .row { border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row:not(.skel-row):hover, .row.menu-open { background: color-mix(in srgb, var(--fd-ink) 4%, transparent); }
.case-ic { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.case-ic .pi { font-size: 16px; }
.row.archived .case-ic { background: var(--fd-panel-2); color: var(--fd-muted); }
.info { display: grid; gap: 4px; flex: 1; min-width: 0; }
.name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); text-decoration: none; font: 600 16px/22px var(--fd-font-sans); }
.name::after { content: ''; position: absolute; inset: 0; } /* whole row is the link */
.name:focus-visible { outline: none; }
.row:has(.name:focus-visible) { box-shadow: inset 0 0 0 2px var(--fd-focus); }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.meta span { display: inline-flex; align-items: center; gap: 6px; }
.meta .pi { font-size: 12px; }
.meta .tag { height: 20px; padding: 0 8px; font-size: 12px; }
.updated { flex-shrink: 0; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.more {
  position: relative; z-index: 1; display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-muted); cursor: pointer; transition: background-color .15s, color .15s;
}
.more:hover, .row.menu-open .more { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.more:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.rename {
  position: relative; z-index: 1; height: 32px; padding: 0 10px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-accent);
  background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 600 16px/22px var(--fd-font-sans); box-shadow: 0 0 0 3px var(--fd-accent-soft);
}
.skel-text { display: grid; gap: 8px; flex: 1; }

.state { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 28px; padding: 56px 24px; text-align: center;
  border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state.small { padding: 40px 24px; border-style: solid; background: var(--fd-panel); }
.state-ic { display: grid; place-items: center; width: 52px; height: 52px; margin-bottom: 6px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state-ic .pi { font-size: 20px; }
.state-ic.err { background: var(--fd-amber-soft); color: var(--fd-amber); }
.state h2 { margin: 0; font: 600 18px/26px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; max-width: 440px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }

/* Dialog */
.modal-mask { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 16px; background: rgb(0 0 0 / .55); backdrop-filter: blur(2px); }
.modal { width: 100%; max-width: 460px; display: grid; gap: 12px; padding: 24px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); }
.modal h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.modal .muted { margin: 0; font: 400 15px/22px var(--fd-font-sans); }
.field { display: grid; gap: 6px; margin-top: 6px; color: var(--fd-ink); }
.field input { height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/20px var(--fd-font-sans); }
.field input:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.field input::placeholder { color: var(--fd-muted); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
.fade-enter-active, .fade-leave-active { transition: opacity .16s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  .head { flex-direction: column; gap: 16px; }
  h1 { font-size: 26px; line-height: 34px; }
  .new-btn { width: 100%; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 12px; margin-top: 20px; }
  .tabs { align-self: flex-start; }
  .search { width: 100%; }
  .row { flex-wrap: wrap; gap: 6px 14px; padding: 14px 8px 14px 14px; }
  .updated { order: 3; width: 100%; padding-left: 54px; }
}
</style>
