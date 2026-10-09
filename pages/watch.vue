<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { WATCH_TAGS, WATCH_SUGGESTIONS, WATCH_UPDATES } from '~/data/mock';
import { rel } from '~/composables/useCases';

// Watch, after the live screen (en/app-watch.jpg): your topics as tags + new laws and decisions for them.
useHead({ title: 'Watch — Femida redesign prototype' });
const route = useRoute();
const { state: chat, newChat } = useChat();

/* Screen state. Demo: ?state=loading | empty | error */
const phase = ref<'loading' | 'ready' | 'error'>('loading');
const tags = ref<string[]>([...WATCH_TAGS]);
function load() {
  phase.value = 'loading';
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => {
    if (s === 'error') { phase.value = 'error'; return; }
    if (s === 'empty') tags.value = [];
    phase.value = 'ready';
  }, 400);
}
onMounted(load);
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }

/* Topics */
const draft = ref('');
const input = ref<HTMLInputElement>();
const suggestions = computed(() => WATCH_SUGGESTIONS.filter((s) => !tags.value.some((t) => t.toLowerCase() === s.toLowerCase())).slice(0, 4));
function addTag(t = draft.value) {
  const v = t.trim();
  if (v && !tags.value.some((x) => x.toLowerCase() === v.toLowerCase())) tags.value.push(v);
  draft.value = '';
  nextTick(() => input.value?.focus());
}
function removeTag(t: string) { tags.value = tags.value.filter((x) => x !== t); }
function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
  else if (e.key === 'Backspace' && !draft.value && tags.value.length) tags.value.pop();
}

/* Updates for the chosen topics */
const updates = computed(() => WATCH_UPDATES.filter((u) => tags.value.includes(u.tag)).sort((a, b) => b.ts - a.ts));
function ask(title: string) {
  newChat();
  chat.draft = `What does this mean for my clients: ${title}?`;
  navigateTo('/');
}
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <h1>Watch</h1>
        <p class="lead">Put tags on topics — you’ll be notified the moment a new law or court decision&nbsp;appears.</p>

        <div v-if="phase === 'loading'" class="skel" aria-busy="true" aria-label="Loading Watch">
          <PSkeleton height="56px" border-radius="12px" />
          <PSkeleton width="30%" height="14px" />
          <PSkeleton height="52px" /><PSkeleton height="52px" />
        </div>

        <div v-else-if="phase === 'error'" class="state">
          <h2>Couldn’t load Watch</h2>
          <p>This is temporary. Your topics are safe.</p>
          <button class="btn" @click="retry"><i class="pi pi-refresh" />Try again</button>
        </div>

        <template v-else>
          <!-- Your topics -->
          <section class="topics" aria-label="Your topics">
            <div class="field" @click="input?.focus()">
              <span v-for="t in tags" :key="t" class="chip">
                {{ t }}<button :aria-label="`Stop watching ${t}`" @click.stop="removeTag(t)"><i class="pi pi-times" /></button>
              </span>
              <input ref="input" v-model="draft" :placeholder="tags.length ? 'Add a topic…' : 'Add a topic, e.g. Labour disputes'" aria-label="Add a topic" @keydown="onKey" />
              <button v-if="draft.trim()" class="add" @click.stop="addTag()">Add</button>
            </div>
            <div v-if="suggestions.length" class="suggest">
              <span class="muted">Suggestions:</span>
              <button v-for="s in suggestions" :key="s" class="sug" @click="addTag(s)"><i class="pi pi-plus" />{{ s }}</button>
            </div>
            <p class="note"><i class="pi pi-envelope" />We email you when a new law, amendment, court or tax decision matches your&nbsp;topics.</p>
          </section>

          <!-- New updates -->
          <h2 class="sec">New updates<span v-if="updates.length" class="n">{{ updates.length }}</span></h2>
          <div v-if="!tags.length" class="state">
            <h2>Add a topic to start watching</h2>
            <p>New laws and decisions on your topics will appear&nbsp;here.</p>
          </div>
          <div v-else-if="!updates.length" class="state">
            <h2>No updates yet</h2>
            <p>Nothing new on your topics so far. We’ll email you when something&nbsp;appears.</p>
          </div>
          <ul v-else class="rows">
            <li v-for="u in updates" :key="u.id">
              <button class="row" @click="ask(u.title)">
                <span class="title">{{ u.title }}</span>
                <span class="sub">{{ u.kind }} · {{ u.tag }} · {{ rel(u.date) }}</span>
                <span class="go">Ask about it<i class="pi pi-arrow-right" /></span>
              </button>
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
.lead { margin: 4px 0 0; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: pretty; }
.skel { display: grid; gap: 14px; margin-top: 24px; }

/* Topics */
.topics { margin-top: 24px; }
.field { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 52px; padding: 8px 8px 8px 10px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); cursor: text; transition: border-color .15s, box-shadow .15s; }
.field:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.chip { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 4px 0 12px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.chip button { display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.chip button:hover { background: color-mix(in srgb, var(--fd-ink) 10%, transparent); color: var(--fd-ink); }
.chip button .pi { font-size: 10px; }
.field input { flex: 1; min-width: 160px; height: 32px; padding: 0 6px; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 15px/20px var(--fd-font-sans); }
.field input::placeholder { color: var(--fd-muted); }
.add { height: 32px; padding: 0 12px; border: 0; border-radius: 8px; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.suggest { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 10px; font: 400 13px/18px var(--fd-font-sans); }
.muted { color: var(--fd-muted); }
.sug { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 999px; border: 1px dashed var(--fd-line); background: transparent; color: var(--fd-ink); cursor: pointer; font: 400 13px/18px var(--fd-font-sans); }
.sug .pi { font-size: 9px; color: var(--fd-muted); }
.sug:hover { border-style: solid; border-color: var(--fd-accent); }
.note { display: flex; align-items: center; gap: 8px; margin: 12px 0 0; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.note .pi { font-size: 12px; }

/* Updates */
.sec { display: flex; align-items: center; gap: 8px; margin: 36px 0 8px; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.sec .n { color: var(--fd-muted); font-weight: 400; }
.rows { margin: 0; padding: 0; list-style: none; }
.rows li + li .row { border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: 'title go' 'sub go'; align-items: center; gap: 4px 16px; width: calc(100% + 24px); margin: 0 -12px; padding: 14px 12px; border: 0; border-radius: 10px; background: transparent; text-align: left; cursor: pointer; transition: background-color .12s; }
.row:hover { background: color-mix(in srgb, var(--fd-ink) 5%, transparent); }
.row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.title { grid-area: title; color: var(--fd-ink); font: 500 16px/22px var(--fd-font-sans); }
.sub { grid-area: sub; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.go { grid-area: go; display: inline-flex; align-items: center; gap: 6px; color: var(--fd-accent-text); font: 500 13px/18px var(--fd-font-sans); opacity: 0; transition: opacity .12s; white-space: nowrap; }
.go .pi { font-size: 11px; }
.row:hover .go, .row:focus-visible .go { opacity: 1; }

.state { display: grid; justify-items: center; gap: 8px; padding: 40px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: 16px; }
.state h2 { margin: 0; color: var(--fd-ink); font: 600 17px/24px var(--fd-font-sans); }
.state p { margin: 0; color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); }
.btn { display: inline-flex; align-items: center; gap: 8px; height: 36px; margin-top: 6px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.btn .pi { font-size: 11px; }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 48px; }
  h1 { font-size: 26px; line-height: 34px; }
  .row { grid-template-columns: 1fr; grid-template-areas: 'title' 'sub'; }
  .go { display: none; }
}
</style>
