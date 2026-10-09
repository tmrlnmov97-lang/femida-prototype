<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import type { CaseItem } from '~/data/mock';
import { rel } from '~/composables/useCases';

// Layout follows Claude's "Projects" page: title + New, full-width search, sort, two-column cards (name, description, updated).
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
  }, 450);
}
onMounted(load);
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }
const all = computed(() => (forceEmpty.value ? [] : state.cases));

/* Search, sort, archived */
const query = ref('');
const sort = ref<'activity' | 'name'>('activity');
const showArchived = ref(false);
const archivedCount = computed(() => all.value.filter((c) => c.archived).length);
const visible = computed(() => {
  const q = query.value.trim().toLowerCase();
  return all.value
    .filter((c) => (showArchived.value ? c.archived : !c.archived))
    .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q))
    .sort((a, b) => (sort.value === 'name' ? a.name.localeCompare(b.name) : b.ts - a.ts));
});
const sortMenu = ref();
const sortItems = computed(() => [
  { label: 'Activity', icon: sort.value === 'activity' ? 'pi pi-check' : 'pi pi-fw', command: () => (sort.value = 'activity') },
  { label: 'Name', icon: sort.value === 'name' ? 'pi pi-check' : 'pi pi-fw', command: () => (sort.value = 'name') },
]);

/* Card menu */
const cardMenu = ref();
const menuFor = ref<CaseItem | null>(null);
const menuOpenId = ref<string | null>(null);
const menuItems = computed(() => [
  { label: 'Edit details', icon: 'pi pi-pencil', command: () => menuFor.value && openEdit(menuFor.value) },
  menuFor.value?.archived
    ? { label: 'Restore', icon: 'pi pi-replay', command: () => { if (menuFor.value) menuFor.value.archived = false; } }
    : { label: 'Archive', icon: 'pi pi-inbox', command: () => { if (menuFor.value) menuFor.value.archived = true; } },
  { separator: true },
  { label: 'Delete case', icon: 'pi pi-trash', class: 'fd-danger', command: () => { if (menuFor.value) remove(menuFor.value); } },
]);
function openMenu(e: Event, c: CaseItem) { menuFor.value = c; menuOpenId.value = c.id; cardMenu.value.toggle(e); }

/* Create / edit dialog (like "Create a project": name + what it's about) */
const dialog = ref<null | { mode: 'new' | 'edit'; target?: CaseItem }>(null);
const fName = ref('');
const fDesc = ref('');
const nameEl = ref<HTMLInputElement>();
function openNew() { dialog.value = { mode: 'new' }; fName.value = ''; fDesc.value = ''; nextTick(() => nameEl.value?.focus()); }
function openEdit(c: CaseItem) { dialog.value = { mode: 'edit', target: c }; fName.value = c.name; fDesc.value = c.description ?? ''; nextTick(() => nameEl.value?.focus()); }
function submit() {
  const name = fName.value.trim();
  if (!name || !dialog.value) return;
  if (dialog.value.mode === 'edit' && dialog.value.target) {
    dialog.value.target.name = name; dialog.value.target.description = fDesc.value.trim(); dialog.value = null; return;
  }
  const c = create(name, fDesc.value.trim());
  dialog.value = null;
  navigateTo(`/cases/${c.id}`);
}
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>My cases</h1>
          <button class="new-btn" @click="openNew"><i class="pi pi-plus" />New case</button>
        </header>

        <template v-if="phase !== 'error' && !(phase === 'ready' && !all.length)">
          <label class="search">
            <i class="pi pi-search" />
            <input v-model="query" type="search" placeholder="Search cases…" aria-label="Search cases" @keydown.esc="query = ''" />
            <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
          </label>
          <div class="bar">
            <span class="hint">{{ showArchived ? 'Archived cases' : 'A case keeps a client’s chats and documents together. Questions asked in a case are answered with its documents.' }}</span>
            <div class="bar-right">
              <button v-if="archivedCount || showArchived" class="link" @click="showArchived = !showArchived">
                {{ showArchived ? 'Back to active' : `Archived (${archivedCount})` }}
              </button>
              <button class="sort" aria-haspopup="menu" @click="sortMenu.toggle($event)">
                <span class="muted">Sort by</span> {{ sort === 'activity' ? 'Activity' : 'Name' }}<i class="pi pi-angle-down" />
              </button>
              <PMenu ref="sortMenu" :model="sortItems" :popup="true" />
            </div>
          </div>
        </template>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="grid" aria-busy="true" aria-label="Loading cases">
          <div v-for="i in 4" :key="i" class="card skel"><PSkeleton width="55%" height="18px" /><PSkeleton width="90%" height="13px" /><PSkeleton width="70%" height="13px" /><PSkeleton class="skel-foot" width="30%" height="12px" /></div>
        </div>

        <!-- Error -->
        <div v-else-if="phase === 'error'" class="state">
          <span class="state-ic err"><i class="pi pi-refresh" /></span>
          <h2>Couldn’t load your cases</h2>
          <p>This is temporary. Your cases are safe — try&nbsp;again.</p>
          <PButton label="Try again" icon="pi pi-refresh" severity="secondary" @click="retry" />
        </div>

        <!-- No cases yet -->
        <div v-else-if="!all.length" class="state">
          <span class="state-ic"><i class="pi pi-briefcase" /></span>
          <h2>Create your first case</h2>
          <p>A case keeps a client’s chats and documents together. Questions asked in a case are answered with its documents, and every answer cites the&nbsp;law.</p>
          <PButton label="New case" icon="pi pi-plus" @click="openNew" />
        </div>

        <!-- Nothing matches -->
        <div v-else-if="!visible.length" class="state small">
          <h2>{{ query.trim() ? `No cases match «${query.trim()}»` : showArchived ? 'No archived cases' : 'No active cases' }}</h2>
          <PButton v-if="query.trim()" label="Clear search" severity="secondary" size="small" @click="query = ''" />
        </div>

        <!-- Cards -->
        <div v-else class="grid">
          <article v-for="c in visible" :key="c.id" class="card" :class="{ 'menu-open': menuOpenId === c.id, archived: c.archived }">
            <div class="card-head">
              <NuxtLink :to="`/cases/${c.id}`" class="name">{{ c.name }}</NuxtLink>
              <button class="more" :aria-label="`Actions for ${c.name}`" aria-haspopup="menu" @click="openMenu($event, c)"><i class="pi pi-ellipsis-h" /></button>
            </div>
            <p v-if="c.description" class="desc">{{ c.description }}</p>
            <p v-else class="desc none">No description</p>
            <span class="updated">Updated {{ rel(c.updated) }}</span>
          </article>
        </div>
      </div>
    </div>
    <PMenu ref="cardMenu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />

    <!-- Create / edit -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="dialog" class="modal-mask" @click.self="dialog = null" @keydown.esc="dialog = null">
          <form class="modal" role="dialog" aria-modal="true" aria-labelledby="case-dialog-title" @submit.prevent="submit">
            <h2 id="case-dialog-title">{{ dialog.mode === 'new' ? 'Create a case' : 'Edit case details' }}</h2>
            <label class="field">
              <span>What is the case called?</span>
              <input ref="nameEl" v-model="fName" placeholder="e.g. Petrosyan v. Alfa — lease termination" maxlength="120" />
            </label>
            <label class="field">
              <span>What is it about? <em>Optional</em></span>
              <textarea v-model="fDesc" rows="3" placeholder="The client, the dispute and what you need to find out" maxlength="300" />
            </label>
            <div class="modal-actions">
              <PButton type="button" label="Cancel" severity="secondary" text @click="dialog = null" />
              <PButton type="submit" :label="dialog.mode === 'new' ? 'Create case' : 'Save'" :disabled="!fName.trim()" />
            </div>
          </form>
        </div>
      </Transition>
    </Teleport>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 900px; margin: 0 auto; padding: 48px 0 72px; }

.head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
h1 { margin: 0; font: 600 34px/42px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
/* Compact primary action (like "New project") */
.new-btn {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; height: 36px; padding: 0 14px 0 12px; border: 0; border-radius: 10px;
  background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, transform .1s;
}
.new-btn .pi { font-size: 11px; }
.new-btn:hover { background: var(--fd-accent-hover); }
.new-btn:active { transform: scale(.98); }
.new-btn:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

.search {
  display: flex; align-items: center; gap: 12px; height: 48px; margin-top: 28px; padding: 0 8px 0 16px; border-radius: 12px; cursor: text;
  border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s;
}
.search:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search > .pi { font-size: 15px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 16px/22px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.clear .pi { font-size: 11px; }

.bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 14px 0 32px; }
.hint { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); text-wrap: pretty; }
.bar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.link { height: 32px; padding: 0 10px; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.link:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.sort { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 1px solid var(--fd-line); border-radius: var(--fd-radius-md); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.sort .muted { font-weight: 400; }
.sort .pi { font-size: 11px; color: var(--fd-muted); }
.sort:hover { border-color: color-mix(in srgb, var(--fd-ink) 22%, transparent); }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.card {
  position: relative; display: flex; flex-direction: column; gap: 8px; min-height: 148px; padding: 18px 16px 16px 20px; border-radius: 14px;
  border: 1px solid var(--fd-line); background: var(--fd-panel); transition: background-color .15s, border-color .15s;
}
.card:not(.skel):hover, .card.menu-open { background: color-mix(in srgb, var(--fd-ink) 3%, var(--fd-panel)); border-color: color-mix(in srgb, var(--fd-ink) 18%, var(--fd-line)); }
.card.archived { opacity: .8; }
.card-head { display: flex; align-items: flex-start; gap: 8px; }
.name { flex: 1; min-width: 0; color: var(--fd-ink); text-decoration: none; font: 600 16px/22px var(--fd-font-sans); text-wrap: pretty; }
.name::after { content: ''; position: absolute; inset: 0; border-radius: inherit; } /* the whole card opens the case */
.name:focus-visible { outline: none; }
.card:has(.name:focus-visible) { box-shadow: 0 0 0 2px var(--fd-focus); }
.more { position: relative; z-index: 1; display: grid; place-items: center; width: 30px; height: 30px; flex-shrink: 0; margin: -4px -4px 0 0; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-muted); cursor: pointer; opacity: 0; transition: opacity .15s, background-color .15s, color .15s; }
.card:hover .more, .card.menu-open .more, .more:focus-visible { opacity: 1; }
.more:hover, .card.menu-open .more { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.desc { margin: 0; color: var(--fd-muted); font: 400 14px/21px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.desc.none { opacity: .6; font-style: italic; }
.updated { margin-top: auto; padding-top: 10px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.skel { gap: 10px; }
.skel-foot { margin-top: auto; }

.state { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 32px; padding: 56px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state.small { padding: 36px 24px; border-style: solid; background: var(--fd-panel); }
.state-ic { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 6px; border-radius: 16px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state-ic .pi { font-size: 22px; }
.state-ic.err { background: var(--fd-amber-soft); color: var(--fd-amber); }
.state h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; max-width: 460px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }

.modal-mask { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 16px; background: rgb(0 0 0 / .55); backdrop-filter: blur(2px); }
.modal { width: 100%; max-width: 520px; display: grid; gap: 16px; padding: 28px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); }
.modal h2 { margin: 0; font: 600 22px/30px var(--fd-font-serif); color: var(--fd-ink); }
.field { display: grid; gap: 8px; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.field em { margin-left: 6px; color: var(--fd-muted); font-style: normal; font-weight: 400; }
.field input, .field textarea { padding: 11px 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); resize: vertical; }
.field input:focus, .field textarea:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.field input::placeholder, .field textarea::placeholder { color: var(--fd-muted); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.fade-enter-active, .fade-leave-active { transition: opacity .16s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  h1 { font-size: 28px; line-height: 36px; }
  .bar { flex-direction: column; align-items: stretch; gap: 8px; }
  .bar-right { justify-content: space-between; }
  .grid { grid-template-columns: 1fr; }
  .card { min-height: 0; }
  .more { opacity: 1; }
}
</style>
