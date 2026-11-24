<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { rel } from '~/composables/useCases';

// Same layout as Claude's "Chats" page: title, search, a count line and a plain list. A row opens the note.
useHead({ title: 'My notes — Femida redesign prototype' });
const route = useRoute();
const { byId } = useCases();
const { state: ns } = useNotes();

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
  }, 400);
}
onMounted(load);
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }

const notes = computed(() => (forceEmpty.value ? [] : ns.notes));
const query = ref('');
const shown = computed(() => {
  const q = query.value.trim().toLowerCase();
  return notes.value.filter((n) => !q || n.title.toLowerCase().includes(q) || n.excerpt.toLowerCase().includes(q)).sort((a, b) => b.ts - a.ts);
});
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <h1>My notes</h1>
        <p class="lead">Answers you saved from chats.</p>

        <label v-if="phase !== 'error' && !(phase === 'ready' && !notes.length)" class="search">
          <i class="pi pi-search" />
          <input v-model="query" type="search" placeholder="Search notes…" aria-label="Search notes" @keydown.esc="query = ''" />
          <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
        </label>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="rows" aria-busy="true" aria-label="Loading notes">
          <div v-for="i in 4" :key="i" class="row skel"><PSkeleton :width="`${50 + (i % 3) * 12}%`" height="15px" /><PSkeleton width="24%" height="12px" /></div>
        </div>

        <!-- Error -->
        <div v-else-if="phase === 'error'" class="state">
          <h2>Couldn’t load your notes</h2>
          <p>This is temporary. Your notes are safe.</p>
          <button class="btn" @click="retry"><i class="pi pi-refresh" />Try again</button>
        </div>

        <!-- Empty -->
        <div v-else-if="!notes.length" class="state">
          <h2>No notes yet</h2>
          <p>Click “Save to notes” under an answer in the chat.</p>
          <NuxtLink to="/" class="btn">Go to chat<i class="pi pi-arrow-right" /></NuxtLink>
        </div>

        <template v-else>
          <p class="count">{{ query.trim() ? `${shown.length} of ${notes.length} notes` : `${notes.length} saved ${notes.length === 1 ? 'note' : 'notes'}` }}</p>
          <div v-if="!shown.length" class="state small">
            <h2>No notes match «{{ query.trim() }}»</h2>
            <button class="btn" @click="query = ''">Clear search</button>
          </div>
          <ul v-else class="rows">
            <li v-for="n in shown" :key="n.id">
              <NuxtLink :to="`/notes/${n.id}`" class="row">
                <span class="title">{{ n.title }}</span>
                <span class="sub">Saved {{ rel(n.saved) }}<template v-if="n.caseId && byId(n.caseId)"> · {{ byId(n.caseId)!.name }}</template></span>
              </NuxtLink>
            </li>
          </ul>
        </template>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 72px; }
h1 { margin: 0; font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 4px 0 0; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }

.search { display: flex; align-items: center; gap: 12px; height: 48px; margin-top: 24px; padding: 0 8px 0 16px; border-radius: 12px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s; }
.search:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search > .pi { font-size: 15px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 16px/22px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear .pi { font-size: 11px; }

.count { margin: 20px 0 8px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }

/* Plain rows, like a chat history list */
.rows { margin: 0; padding: 0; list-style: none; }
.rows li + li .row, .row.skel + .row.skel { border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row { display: grid; gap: 4px; padding: 14px 12px; margin: 0 -12px; border-radius: 10px; color: inherit; text-decoration: none; transition: background-color .12s; }
.row:hover { background: color-mix(in srgb, var(--fd-ink) 5%, transparent); }
.row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.row.skel { gap: 8px; margin: 0; padding: 16px 0; }
.title { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 500 16px/22px var(--fd-font-sans); }
.sub { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }

.state { display: grid; justify-items: center; gap: 8px; margin-top: 32px; padding: 48px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: 16px; }
.state.small { margin-top: 8px; padding: 32px 24px; }
.state h2 { margin: 0; color: var(--fd-ink); font: 600 17px/24px var(--fd-font-sans); }
.state p { margin: 0 0 8px; color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); }
.btn { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; text-decoration: none; font: 500 14px/20px var(--fd-font-sans); }
.btn .pi { font-size: 11px; }
.btn:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  h1 { font-size: 26px; line-height: 34px; }
  .title { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
}
</style>
