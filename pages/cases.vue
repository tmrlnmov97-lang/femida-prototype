<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { CASES, type CaseItem } from '~/data/mock';

useHead({ title: 'My cases — Femida redesign prototype' });
const route = useRoute();
const { state, newChat } = useChat();

/* Data + screen state. Demo: ?state=loading | empty | error */
const cases = ref<CaseItem[]>(CASES.map((c) => ({ ...c, recent: c.recent?.map((r) => ({ ...r })), files: c.files ? [...c.files] : undefined })));
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
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }

/* Tabs, sort, search */
type Tab = 'active' | 'archived' | 'all';
const TABS: { id: Tab; label: string }[] = [{ id: 'active', label: 'Active' }, { id: 'archived', label: 'Archived' }, { id: 'all', label: 'All' }];
const tab = ref<Tab>('active');
const sort = ref<'recent' | 'name'>('recent');
const query = ref('');
const counts = computed(() => ({
  active: cases.value.filter((c) => !c.archived).length,
  archived: cases.value.filter((c) => c.archived).length,
  all: cases.value.length,
}));
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  return cases.value
    .filter((c) => (tab.value === 'all' ? true : tab.value === 'archived' ? !!c.archived : !c.archived))
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.files?.some((f) => f.toLowerCase().includes(q)) || c.recent?.some((r) => r.title.toLowerCase().includes(q)))
    .sort((a, b) => (sort.value === 'name' ? a.name.localeCompare(b.name) : b.ts - a.ts));
});
const sortMenu = ref();
const sortItems = computed(() => [
  { label: 'Recently updated', icon: sort.value === 'recent' ? 'pi pi-check' : 'pi pi-fw', command: () => (sort.value = 'recent') },
  { label: 'Name A–Z', icon: sort.value === 'name' ? 'pi pi-check' : 'pi pi-fw', command: () => (sort.value = 'name') },
]);

/* Card helpers */
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
function monogram(name: string) {
  const words = name.replace(/[—–-]/g, ' ').split(/\s+/).filter((w) => w && !/^v\.?$/i.test(w));
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase();
}
const fileIcon = (f: string) => (/\.docx?$/i.test(f) ? 'pi pi-file-word' : /\.pdf$/i.test(f) ? 'pi pi-file-pdf' : 'pi pi-file');

/* Actions */
function askInCase(c: CaseItem) {
  newChat();
  state.caseCtx = { id: c.id, name: c.name, docs: c.docs };
  navigateTo('/');
}
function addDoc(c: CaseItem) { // prototype: a sample upload lands in the case
  c.files = [...(c.files ?? []), `Document_${(c.files?.length ?? 0) + 1}.pdf`]; c.docs++; c.updated = 'Just now'; c.ts = 99999999;
}
function openChat() { navigateTo({ path: '/', query: { demo: 'answer' } }); } // prototype: any past chat opens the sample answer

const cardMenu = ref();
const menuFor = ref<CaseItem | null>(null);
const menuOpenId = ref<string | null>(null);
const menuItems = computed(() => [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => menuFor.value && startRename(menuFor.value) },
  menuFor.value?.archived
    ? { label: 'Restore', icon: 'pi pi-replay', command: () => { if (menuFor.value) menuFor.value.archived = false; } }
    : { label: 'Archive', icon: 'pi pi-inbox', command: () => { if (menuFor.value) menuFor.value.archived = true; } },
  { separator: true },
  { label: 'Delete case', icon: 'pi pi-trash', class: 'fd-danger', command: () => { cases.value = cases.value.filter((c) => c !== menuFor.value); } },
]);
function openMenu(e: Event, c: CaseItem) { menuFor.value = c; menuOpenId.value = c.id; cardMenu.value.toggle(e); }

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
  cases.value.unshift({ id: `k${Date.now()}`, name, chats: 0, docs: 0, updated: 'Just now', ts: 99999999 });
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
            <button v-for="t in TABS" :key="t.id" role="tab" :aria-selected="tab === t.id" class="tab" :class="{ on: tab === t.id }" @click="tab = t.id">
              {{ t.label }}<span v-if="phase === 'ready'" class="count">{{ counts[t.id] }}</span>
            </button>
          </div>
          <div class="tools">
            <button class="sort" aria-haspopup="menu" @click="sortMenu.toggle($event)">
              <i class="pi pi-sort-alt" />{{ sort === 'recent' ? 'Recently updated' : 'Name A–Z' }}<i class="pi pi-angle-down" />
            </button>
            <PMenu ref="sortMenu" :model="sortItems" :popup="true" />
            <label class="search">
              <i class="pi pi-search" />
              <input v-model="query" type="search" placeholder="Search cases, chats, files" aria-label="Search cases" @keydown.esc="query = ''" />
              <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
            </label>
          </div>
        </div>

        <!-- Loading: skeleton cards, not a spinner -->
        <div v-if="phase === 'loading'" class="grid" aria-busy="true" aria-label="Loading cases">
          <div v-for="i in 3" :key="i" class="card skel">
            <div class="card-top"><PSkeleton width="44px" height="44px" border-radius="12px" /><div class="skel-col"><PSkeleton width="70%" height="16px" /><PSkeleton width="40%" height="12px" /></div></div>
            <PSkeleton width="55%" height="12px" />
            <div class="skel-col"><PSkeleton width="85%" height="14px" /><PSkeleton width="65%" height="14px" /></div>
            <PSkeleton width="140px" height="34px" border-radius="999px" />
          </div>
        </div>

        <!-- Error: honest, retryable -->
        <div v-else-if="phase === 'error'" class="state">
          <span class="state-ic err"><i class="pi pi-refresh" /></span>
          <h2>Couldn’t load your cases</h2>
          <p>This is temporary. Your cases are safe — try&nbsp;again.</p>
          <PButton label="Try again" icon="pi pi-refresh" severity="secondary" @click="retry" />
        </div>

        <!-- Empty: explain the value, one clear action -->
        <div v-else-if="!cases.length" class="state empty">
          <span class="state-ic"><i class="pi pi-briefcase" /></span>
          <h2>Keep each client in one place</h2>
          <p>A case holds a client’s chats and documents. Ask inside a case and Femida answers with that case’s&nbsp;documents.</p>
          <ol class="how">
            <li><span>1</span>Create a case for a client or a dispute</li>
            <li><span>2</span>Add the contract, claim or court decision</li>
            <li><span>3</span>Ask questions — answers cite the law and your&nbsp;files</li>
          </ol>
          <PButton label="Create your first case" icon="pi pi-plus" @click="openNew" />
        </div>

        <!-- Search miss / empty tab -->
        <div v-else-if="!visible.length" class="state small">
          <template v-if="query.trim()">
            <h2>No cases match «{{ query.trim() }}»</h2>
            <p>Search looks in case names, chat titles and file names. Try another word or switch to All.</p>
            <PButton label="Clear search" severity="secondary" size="small" @click="query = ''" />
          </template>
          <template v-else>
            <h2>{{ tab === 'archived' ? 'No archived cases' : 'No active cases' }}</h2>
            <p>{{ tab === 'archived' ? 'Archive a case from its ⋯ menu when the work is done.' : 'All your cases are archived.' }}</p>
          </template>
        </div>

        <!-- Cards -->
        <div v-else class="grid">
          <article v-for="c in visible" :key="c.id" class="card" :class="{ archived: c.archived, 'menu-open': menuOpenId === c.id }">
            <div class="card-top">
              <span class="mono" aria-hidden="true">{{ monogram(c.name) }}</span>
              <div class="title-col">
                <input v-if="renaming === c" ref="renameInput" v-model="renameDraft" class="rename" aria-label="Case name" maxlength="120"
                       @keydown.enter.prevent="commitRename" @keydown.esc.prevent="renaming = null" @blur="commitRename" />
                <h3 v-else class="name" :title="c.name">{{ c.name }}</h3>
                <span class="sub">
                  <template v-if="c.archived"><span class="arch">Archived</span> · </template>Updated {{ c.updated.toLowerCase() === 'today' || c.updated.toLowerCase() === 'yesterday' || c.updated === 'Just now' ? c.updated.toLowerCase() : c.updated }}
                </span>
              </div>
              <button class="more" :aria-label="`Actions for ${c.name}`" aria-haspopup="menu" @click="openMenu($event, c)"><i class="pi pi-ellipsis-h" /></button>
            </div>

            <div v-if="c.chats || c.docs" class="stats">
              <span><i class="pi pi-comments" />{{ plural(c.chats, 'chat', 'chats') }}</span>
              <span><i class="pi pi-file" />{{ plural(c.docs, 'document', 'documents') }}</span>
            </div>

            <div v-if="c.recent?.length || c.files?.length" class="body">
              <div v-if="c.recent?.length" class="block">
                <span class="label">Recent chats</span>
                <button v-for="r in c.recent.slice(0, 2)" :key="r.id" class="chat-link" @click="openChat"><i class="pi pi-comment" /><span>{{ r.title }}</span><i class="pi pi-angle-right go" /></button>
              </div>
              <div v-if="c.files?.length" class="block">
                <span class="label">Documents</span>
                <div class="files">
                  <span v-for="f in c.files.slice(0, 2)" :key="f" class="file" :title="f"><i :class="fileIcon(f)" /><span>{{ f }}</span></span>
                  <span v-if="c.files.length > 2" class="file more-files">+{{ c.files.length - 2 }}</span>
                </div>
              </div>
            </div>
            <div v-else class="body empty-case">
              <i class="pi pi-inbox" />
              <p>Nothing here yet. Add a document or ask the first question — the answer will use this case’s&nbsp;files.</p>
            </div>

            <div class="card-foot">
              <PButton :label="c.archived ? 'Restore case' : 'Ask in this case'" :icon="c.archived ? 'pi pi-replay' : 'pi pi-arrow-right'" icon-pos="right" size="small"
                       :severity="c.archived ? 'secondary' : undefined" :outlined="!c.archived" class="ask" @click="c.archived ? (c.archived = false) : askInCase(c)" />
              <button v-if="!c.archived" class="ghost" @click="addDoc(c)"><i class="pi pi-upload" />Add document</button>
            </div>
          </article>

          <!-- Creating is always one click away, right in the grid -->
          <button v-if="tab !== 'archived' && !query.trim()" class="card new-card" @click="openNew">
            <span class="plus"><i class="pi pi-plus" /></span>
            <span class="new-title">New case</span>
            <span class="new-sub">For a client or a dispute — keep its chats and documents&nbsp;together</span>
          </button>
        </div>
      </div>
    </div>
    <PMenu ref="cardMenu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />

    <!-- New case dialog -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="creating" class="modal-mask" @click.self="creating = false" @keydown.esc="creating = false">
          <form class="modal" role="dialog" aria-modal="true" aria-labelledby="new-case-title" @submit.prevent="createCase">
            <span class="modal-ic"><i class="pi pi-briefcase" /></span>
            <h2 id="new-case-title">New case</h2>
            <p class="muted">Name it after the client or the dispute. You can add chats and documents&nbsp;next.</p>
            <label class="field">
              <span class="t-label">Case name</span>
              <input ref="newInput" v-model="newName" placeholder="e.g. Petrosyan v. Alfa — lease termination" maxlength="120" />
            </label>
            <div class="modal-actions">
              <PButton type="button" label="Cancel" severity="secondary" text @click="creating = false" />
              <PButton type="submit" label="Create case" :disabled="!newName.trim()" />
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding: 40px 0 72px; }

/* Header */
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
.titles { display: grid; gap: 8px; max-width: 640px; }
h1 { margin: 0; font: 600 34px/42px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }
.new-btn { flex-shrink: 0; margin-top: 2px; }

/* Toolbar */
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 32px 0 20px; }
.tabs { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tab {
  display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 14px; border: 0; border-radius: 999px;
  background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: color .15s, background-color .15s;
}
.tab:hover { color: var(--fd-ink); }
.tab.on { background: var(--fd-panel-2); color: var(--fd-ink); }
.count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-muted); font: 600 11px/1 var(--fd-font-sans); }
.tab.on .count { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.tools { display: flex; align-items: center; gap: 8px; }
.sort {
  display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 12px; border: 1px solid var(--fd-line); border-radius: 10px;
  background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; transition: border-color .15s;
}
.sort:hover { border-color: color-mix(in srgb, var(--fd-ink) 22%, transparent); }
.sort .pi { font-size: 12px; color: var(--fd-muted); }
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

/* Grid of cards */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.card {
  position: relative; display: flex; flex-direction: column; gap: 16px; min-height: 300px; padding: 20px; border-radius: var(--fd-radius-xl);
  border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .2s, transform .2s;
}
.card:not(.skel):not(.new-card):hover, .card.menu-open { border-color: color-mix(in srgb, var(--fd-accent) 40%, var(--fd-line)); box-shadow: 0 10px 30px rgb(0 0 0 / .18); }
.card.archived { background: color-mix(in srgb, var(--fd-panel) 60%, var(--fd-bg)); }
.card-top { display: flex; align-items: flex-start; gap: 12px; }
.mono {
  display: grid; place-items: center; width: 44px; height: 44px; flex-shrink: 0; border-radius: 12px;
  background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 15px/1 var(--fd-font-serif); letter-spacing: .02em;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fd-accent) 25%, transparent);
}
.card.archived .mono { background: var(--fd-panel-2); color: var(--fd-muted); box-shadow: none; }
.title-col { display: grid; gap: 4px; flex: 1; min-width: 0; }
.name { margin: 0; color: var(--fd-ink); font: 600 17px/24px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-wrap: pretty; }
.sub { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.arch { color: var(--fd-amber); }
.more {
  display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; margin: -4px -6px 0 0; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-muted); cursor: pointer; transition: background-color .15s, color .15s;
}
.more:hover, .card.menu-open .more { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.more:focus-visible, .chat-link:focus-visible, .ghost:focus-visible, .new-card:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.rename {
  height: 32px; padding: 0 10px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-accent);
  background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 600 16px/22px var(--fd-font-sans); box-shadow: 0 0 0 3px var(--fd-accent-soft);
}

.stats { display: flex; gap: 8px; }
.stats span {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 999px;
  background: var(--fd-panel-2); color: var(--fd-ink); font: 500 13px/18px var(--fd-font-sans);
}
.stats .pi { font-size: 12px; color: var(--fd-muted); }

.body { display: grid; gap: 14px; }
.block { display: grid; gap: 4px; min-width: 0; }
.label { color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .02em; }
.chat-link {
  display: flex; align-items: center; gap: 10px; width: 100%; height: 34px; margin: 0 -8px; padding: 0 8px; border: 0; border-radius: var(--fd-radius-md); box-sizing: content-box;
  background: transparent; color: var(--fd-ink); text-align: left; cursor: pointer; font: 400 15px/20px var(--fd-font-sans); transition: background-color .15s;
}
.chat-link span { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.chat-link .pi { font-size: 13px; color: var(--fd-muted); }
.chat-link .go { opacity: 0; transition: opacity .15s, transform .15s; }
.chat-link:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.chat-link:hover .go { opacity: 1; transform: translateX(2px); }
.files { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.file {
  display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 28px; padding: 0 10px; border-radius: 8px;
  border: 1px solid var(--fd-line); color: var(--fd-ink); font: 400 13px/18px var(--fd-font-sans);
}
.file span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 190px; }
.file .pi { font-size: 13px; color: var(--fd-accent-text); }
.more-files { color: var(--fd-muted); }
.empty-case { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: var(--fd-radius-md); background: var(--fd-panel-2); }
.empty-case .pi { margin-top: 2px; color: var(--fd-muted); }
.empty-case p { margin: 0; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); text-wrap: pretty; }

.card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: auto; padding-top: 4px; }
.ghost {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 13px/18px var(--fd-font-sans); transition: color .15s, background-color .15s;
}
.ghost .pi { font-size: 12px; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }

.new-card {
  min-height: 180px; align-items: center; justify-content: center; gap: 8px; text-align: center; cursor: pointer;
  border-style: dashed; background: transparent; color: var(--fd-muted);
}
.new-card:hover { border-color: var(--fd-accent); background: color-mix(in srgb, var(--fd-accent) 5%, transparent); color: var(--fd-ink); }
.plus { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 4px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); transition: transform .2s; }
.new-card:hover .plus { transform: scale(1.06); }
.new-title { color: var(--fd-ink); font: 600 16px/22px var(--fd-font-sans); }
.new-sub { max-width: 240px; font: 400 14px/20px var(--fd-font-sans); text-wrap: balance; }

.skel { gap: 18px; }
.skel-col { display: grid; gap: 8px; flex: 1; }

/* States */
.state { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 32px; padding: 56px 24px; text-align: center;
  border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state.small { padding: 40px 24px; border-style: solid; background: var(--fd-panel); }
.state-ic { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 6px; border-radius: 16px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state-ic .pi { font-size: 22px; }
.state-ic.err { background: var(--fd-amber-soft); color: var(--fd-amber); }
.state h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; max-width: 480px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }
.how { display: grid; gap: 10px; margin: 8px 0 20px; padding: 0; list-style: none; text-align: left; }
.how li { display: flex; align-items: center; gap: 12px; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.how span { display: grid; place-items: center; width: 26px; height: 26px; flex-shrink: 0; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--fd-accent) 50%, transparent); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }

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
  .toolbar { flex-wrap: wrap; }
  .search { width: 240px; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  .head { flex-direction: column; align-items: stretch; gap: 16px; }
  h1 { font-size: 28px; line-height: 36px; }
  .lead { font-size: 15px; line-height: 24px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 10px; margin-top: 20px; }
  .tabs { align-self: flex-start; }
  .tools { flex-direction: row-reverse; }
  .search { flex: 1; width: auto; }
  .sort { width: 40px; padding: 0; justify-content: center; font-size: 0; gap: 0; }
  .sort .pi-angle-down { display: none; }
  .sort .pi { font-size: 14px; }
  .grid { grid-template-columns: 1fr; }
  .card { min-height: 0; }
}
</style>
