<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { rel } from '~/composables/useCases';
import type { NoteItem } from '~/composables/useNotes';

// Same simple pattern as My cases: search + cards; a card opens the note on its own page.
useHead({ title: 'My notes — Femida redesign prototype' });
const route = useRoute();
const { byId } = useCases();
const { state: ns, remove } = useNotes();

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

const notes = computed(() => (forceEmpty.value ? [] : ns.notes));
const query = ref('');
const shown = computed(() => {
  const q = query.value.trim().toLowerCase();
  return notes.value.filter((n) => !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)).sort((a, b) => b.ts - a.ts);
});
const kindLabel = (n: NoteItem) => (n.kind === 'answer' ? 'Saved answer' : `Studio · ${n.studio}`);

const menu = ref();
const menuFor = ref<NoteItem | null>(null);
const menuOpenId = ref<string | null>(null);
const menuItems = [{ label: 'Remove from notes', icon: 'pi pi-trash', class: 'fd-danger', command: () => menuFor.value && remove(menuFor.value.id) }];
function openMenu(e: Event, n: NoteItem) { menuFor.value = n; menuOpenId.value = n.id; menu.value.toggle(e); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>My notes</h1>
          <p class="lead">Saved answers and Studio materials.</p>
        </header>

        <label v-if="phase !== 'error' && !(phase === 'ready' && !notes.length)" class="search">
          <i class="pi pi-search" />
          <input v-model="query" type="search" placeholder="Search notes…" aria-label="Search notes" @keydown.esc="query = ''" />
          <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
        </label>

        <div v-if="phase === 'loading'" class="grid" aria-busy="true" aria-label="Loading notes">
          <div v-for="i in 4" :key="i" class="card skel"><PSkeleton width="30%" height="11px" /><PSkeleton width="80%" height="16px" /><PSkeleton width="95%" height="13px" /><PSkeleton width="70%" height="13px" /></div>
        </div>

        <div v-else-if="phase === 'error'" class="state">
          <h2>Couldn’t load your notes</h2>
          <p>This is temporary. Your notes are safe — try&nbsp;again.</p>
          <PButton label="Try again" icon="pi pi-refresh" severity="secondary" @click="retry" />
        </div>

        <div v-else-if="!notes.length" class="state">
          <span class="state-ic"><i class="pi pi-bookmark" /></span>
          <h2>No notes yet</h2>
          <p>Click “Save to notes” under an answer in the chat to keep it&nbsp;here.</p>
          <NuxtLink to="/" class="go">Go to chat<i class="pi pi-arrow-right" /></NuxtLink>
        </div>

        <div v-else-if="!shown.length" class="state small">
          <h2>No notes match «{{ query.trim() }}»</h2>
          <PButton label="Clear search" severity="secondary" size="small" @click="query = ''" />
        </div>

        <div v-else class="grid">
          <article v-for="n in shown" :key="n.id" class="card" :class="{ 'menu-open': menuOpenId === n.id }">
            <div class="card-head">
              <span class="kind">{{ kindLabel(n) }}</span>
              <button class="more" :aria-label="`Actions for ${n.title}`" aria-haspopup="menu" @click="openMenu($event, n)"><i class="pi pi-ellipsis-h" /></button>
            </div>
            <NuxtLink :to="`/notes/${n.id}`" class="title">{{ n.title }}</NuxtLink>
            <p class="excerpt">{{ n.excerpt }}</p>
            <span class="foot">
              <template v-if="n.caseId && byId(n.caseId)">{{ byId(n.caseId)!.name }} · </template>Saved {{ rel(n.saved) }}
            </span>
          </article>
        </div>
      </div>
    </div>
    <PMenu ref="menu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 900px; margin: 0 auto; padding: 48px 0 72px; }
.head { display: grid; gap: 4px; }
h1 { margin: 0; font: 600 34px/42px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }

.search { display: flex; align-items: center; gap: 12px; height: 48px; margin: 24px 0 24px; padding: 0 8px 0 16px; border-radius: 12px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s; }
.search:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search > .pi { font-size: 15px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 16px/22px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear .pi { font-size: 11px; }

.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.card { position: relative; display: flex; flex-direction: column; gap: 8px; min-height: 170px; padding: 16px 16px 16px 20px; border-radius: 14px; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: background-color .15s, border-color .15s; }
.card:not(.skel):hover, .card.menu-open { background: color-mix(in srgb, var(--fd-ink) 3%, var(--fd-panel)); border-color: color-mix(in srgb, var(--fd-ink) 18%, var(--fd-line)); }
.card.skel { gap: 10px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 24px; }
.kind { color: var(--fd-muted); font: 500 11px/16px var(--fd-font-sans); letter-spacing: .05em; text-transform: uppercase; }
.more { position: relative; z-index: 1; display: grid; place-items: center; width: 28px; height: 28px; margin: -4px -4px 0 0; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; opacity: 0; transition: opacity .15s; }
.card:hover .more, .card.menu-open .more, .more:focus-visible { opacity: 1; }
.more:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.title { color: var(--fd-ink); text-decoration: none; font: 600 16px/22px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.title::after { content: ''; position: absolute; inset: 0; border-radius: inherit; } /* whole card opens the note */
.title:focus-visible { outline: none; }
.card:has(.title:focus-visible) { box-shadow: 0 0 0 2px var(--fd-focus); }
.excerpt { margin: 0; color: var(--fd-muted); font: 400 14px/21px var(--fd-font-sans); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.foot { margin-top: auto; padding-top: 8px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }

.state { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 32px; padding: 56px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state.small { padding: 36px 24px; border-style: solid; background: var(--fd-panel); }
.state-ic { display: grid; place-items: center; width: 52px; height: 52px; margin-bottom: 4px; border-radius: 14px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state-ic .pi { font-size: 20px; }
.state h2 { margin: 0; font: 600 18px/26px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 6px; max-width: 420px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }
.go { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--fd-line); color: var(--fd-ink); text-decoration: none; font: 500 14px/20px var(--fd-font-sans); }
.go .pi { font-size: 11px; }
.go:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  h1 { font-size: 28px; line-height: 36px; }
  .grid { grid-template-columns: 1fr; }
  .card { min-height: 0; }
  .more { opacity: 1; }
}
</style>
