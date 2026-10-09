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
        <header class="head">
          <h1>Watch</h1>
          <p class="lead">Put tags on topics — you’ll be notified the moment a new law or court decision&nbsp;appears.</p>
        </header>

        <div v-if="phase === 'loading'" class="skel" aria-busy="true" aria-label="Loading Watch">
          <PSkeleton height="168px" border-radius="16px" />
          <PSkeleton width="28%" height="18px" />
          <PSkeleton height="64px" /><PSkeleton height="64px" />
        </div>

        <div v-else-if="phase === 'error'" class="state">
          <h3>Couldn’t load Watch</h3>
          <p>This is temporary. Your topics are safe.</p>
          <button class="btn" @click="retry"><i class="pi pi-refresh" />Try again</button>
        </div>

        <template v-else>
          <!-- 1. Your topics -->
          <section class="card" aria-labelledby="topics-title">
            <div class="sec-head">
              <h2 id="topics-title">Your topics<span v-if="tags.length" class="n">{{ tags.length }}</span></h2>
            </div>
            <p class="helper">Add the areas of law you follow. We email you when a new law, amendment, court or tax decision&nbsp;appears.</p>
            <div class="field" @click="input?.focus()">
              <span v-for="t in tags" :key="t" class="chip">
                {{ t }}<button :aria-label="`Stop watching ${t}`" @click.stop="removeTag(t)"><i class="pi pi-times" /></button>
              </span>
              <input ref="input" v-model="draft" :placeholder="tags.length ? 'Add a topic…' : 'Add a topic, e.g. Labour disputes'" aria-label="Add a topic" @keydown="onKey" />
              <button v-if="draft.trim()" class="add" @click.stop="addTag()">Add</button>
            </div>
            <div v-if="suggestions.length" class="suggest">
              <span class="suggest-label">Popular</span>
              <button v-for="sug in suggestions" :key="sug" class="sug" @click="addTag(sug)"><i class="pi pi-plus" />{{ sug }}</button>
            </div>
          </section>

          <!-- 2. New updates -->
          <section class="updates" aria-labelledby="updates-title">
            <div class="sec-head">
              <h2 id="updates-title">New updates<span v-if="updates.length" class="n">{{ updates.length }}</span></h2>
              <span v-if="updates.length" class="sec-hint">For your topics</span>
            </div>

            <div v-if="!tags.length" class="state">
              <h3>Add a topic to start watching</h3>
              <p>New laws and decisions on your topics will appear&nbsp;here.</p>
            </div>
            <div v-else-if="!updates.length" class="state">
              <h3>No updates yet</h3>
              <p>Nothing new on your topics so far. We’ll email you when something&nbsp;appears.</p>
            </div>
            <ul v-else class="rows">
              <li v-for="u in updates" :key="u.id" class="row">
                <div class="row-main">
                  <span class="title">{{ u.title }}</span>
                  <span class="meta"><span class="tag">{{ u.tag }}</span>{{ u.kind }} · {{ rel(u.date) }}</span>
                </div>
                <button class="ask" :aria-label="`Ask about: ${u.title}`" @click="ask(u.title)">Ask about it<i class="pi pi-arrow-right" /></button>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
/* Spacing on an 8px grid: header → 32 → topics card (24 inside) → 48 → updates */
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 80px; }

/* Text hierarchy: H1 32 serif · section 18/600 · body 15–16 · meta 13 */
.head { display: grid; gap: 8px; margin-bottom: 32px; }
h1 { margin: 0; font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; max-width: 560px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }
.sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
h2 { display: flex; align-items: baseline; gap: 8px; margin: 0; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
h2 .n { color: var(--fd-muted); font-weight: 400; font-size: 15px; }
.sec-hint { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.skel { display: grid; gap: 16px; }

/* 1. Topics card */
.card { padding: 24px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.helper { margin: 4px 0 16px; max-width: 560px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: pretty; }
.field { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 52px; padding: 8px 8px 8px 10px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); cursor: text; transition: border-color .15s, box-shadow .15s; }
.field:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.chip { display: inline-flex; align-items: center; gap: 2px; height: 32px; padding: 0 4px 0 12px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.chip button { display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.chip button:hover { background: color-mix(in srgb, var(--fd-ink) 10%, transparent); color: var(--fd-ink); }
.chip button .pi { font-size: 10px; }
.field input { flex: 1; min-width: 160px; height: 32px; padding: 0 6px; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 15px/20px var(--fd-font-sans); }
.field input::placeholder { color: var(--fd-muted); }
.add { height: 32px; padding: 0 14px; border: 0; border-radius: 8px; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.suggest { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.suggest-label { margin-right: 4px; color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.sug { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px dashed var(--fd-line); background: transparent; color: var(--fd-ink); cursor: pointer; font: 400 14px/20px var(--fd-font-sans); transition: border-color .12s; }
.sug .pi { font-size: 9px; color: var(--fd-muted); }
.sug:hover { border-style: solid; border-color: var(--fd-accent); }

/* 2. Updates */
.updates { margin-top: 48px; }
.updates .sec-head { margin-bottom: 8px; }
.rows { margin: 0; padding: 0; list-style: none; }
.row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row:first-child { border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row-main { display: grid; gap: 6px; flex: 1; min-width: 0; }
.title { color: var(--fd-ink); font: 500 16px/24px var(--fd-font-sans); text-wrap: pretty; }
.meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.tag { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-ink); font: 500 12px/16px var(--fd-font-sans); }
.ask { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; height: 34px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 500 13px/18px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.ask .pi { font-size: 10px; color: var(--fd-muted); }
.ask:hover { border-color: var(--fd-accent); background: var(--fd-accent-soft); }
.ask:focus-visible, .sug:focus-visible, .chip button:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

.state { display: grid; justify-items: center; gap: 6px; padding: 40px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: 16px; }
.state h3 { margin: 0; color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.state p { margin: 0; max-width: 400px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: balance; }
.btn { display: inline-flex; align-items: center; gap: 8px; height: 36px; margin-top: 8px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.btn .pi { font-size: 11px; }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 56px; }
  .head { margin-bottom: 24px; }
  h1 { font-size: 26px; line-height: 34px; }
  .lead { font-size: 15px; line-height: 24px; }
  .card { padding: 16px; }
  .updates { margin-top: 32px; }
  .row { flex-direction: column; align-items: stretch; gap: 12px; }
  .ask { align-self: flex-start; }
}
</style>
