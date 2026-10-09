<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue';
import { monogram, plural, fileIcon } from '~/composables/useCases';

const route = useRoute();
const { byId, remove, addFile } = useCases();
const { state: chat, newChat, send } = useChat();
const c = computed(() => byId(String(route.params.id)));
useHead(() => ({ title: `${c.value?.name ?? 'Case'} — Femida redesign prototype` }));

const ready = ref(false); // skeleton first, like every screen
onMounted(() => setTimeout(() => (ready.value = true), 400));

/* Ask inside the case → a new chat that answers with this case's documents */
const question = ref('');
const askEl = ref<HTMLTextAreaElement>();
function ask() {
  const q = question.value.trim();
  if (!q || !c.value) return;
  c.value.chats.unshift({ id: `n${Date.now()}`, title: q.length > 48 ? `${q.slice(0, 46)}…` : q, when: 'Just now' });
  c.value.updated = 'Just now'; c.value.ts = 99999999;
  newChat();
  chat.caseCtx = { id: c.value.id, name: c.value.name, docs: c.value.files.length };
  send(q);
  navigateTo('/');
}
function onKey(e: KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(); } }
function openChat() { navigateTo({ path: '/', query: { demo: 'answer' } }); } // prototype: past chats open the sample answer

/* Case menu */
const menu = ref();
const renaming = ref(false);
const draft = ref('');
const renameEl = ref<HTMLInputElement>();
const items = computed(() => [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => { draft.value = c.value!.name; renaming.value = true; nextTick(() => { renameEl.value?.focus(); renameEl.value?.select(); }); } },
  c.value?.archived
    ? { label: 'Restore', icon: 'pi pi-replay', command: () => { c.value!.archived = false; } }
    : { label: 'Archive', icon: 'pi pi-inbox', command: () => { c.value!.archived = true; } },
  { separator: true },
  { label: 'Delete case', icon: 'pi pi-trash', class: 'fd-danger', command: () => { remove(c.value!); navigateTo('/cases'); } },
]);
function commitRename() { if (c.value && draft.value.trim()) c.value.name = draft.value.trim(); renaming.value = false; }
function removeFile(i: number) { c.value?.files.splice(i, 1); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <NuxtLink to="/cases" class="back"><i class="pi pi-arrow-left" />My cases</NuxtLink>

        <!-- Unknown id -->
        <div v-if="!c" class="state">
          <span class="state-ic"><i class="pi pi-briefcase" /></span>
          <h2>Case not found</h2>
          <p>It may have been deleted. Your other cases are in My&nbsp;cases.</p>
          <PButton label="Back to My cases" severity="secondary" @click="navigateTo('/cases')" />
        </div>

        <!-- Loading -->
        <template v-else-if="!ready">
          <div class="head"><PSkeleton width="56px" height="56px" border-radius="14px" /><div class="skel-col"><PSkeleton width="40%" height="28px" /><PSkeleton width="25%" height="14px" /></div></div>
          <div class="layout">
            <div class="main-col"><PSkeleton height="132px" border-radius="16px" /><PSkeleton height="220px" border-radius="16px" /></div>
            <PSkeleton height="320px" border-radius="16px" />
          </div>
        </template>

        <template v-else>
          <header class="head">
            <span class="mono" aria-hidden="true">{{ monogram(c.name) }}</span>
            <div class="titles">
              <input v-if="renaming" ref="renameEl" v-model="draft" class="rename" aria-label="Case name" maxlength="120"
                     @keydown.enter.prevent="commitRename" @keydown.esc.prevent="renaming = false" @blur="commitRename" />
              <h1 v-else>{{ c.name }}</h1>
              <p class="meta">
                <span v-if="c.archived" class="arch">Archived · </span>{{ plural(c.chats.length, 'chat', 'chats') }} · {{ plural(c.files.length, 'document', 'documents') }} · Updated {{ /^(Today|Yesterday|Just now)$/.test(c.updated) ? c.updated.toLowerCase() : c.updated }}
              </p>
            </div>
            <button class="more" aria-label="Case actions" aria-haspopup="menu" @click="menu.toggle($event)"><i class="pi pi-ellipsis-h" /></button>
            <PMenu ref="menu" :model="items" :popup="true" />
          </header>

          <div v-if="c.archived" class="banner">
            <i class="pi pi-inbox" /><span>This case is archived. Restore it to ask new questions.</span>
            <PButton label="Restore" size="small" severity="secondary" @click="c.archived = false" />
          </div>

          <div class="layout">
            <div class="main-col">
              <!-- 1. Ask: the main action of the page -->
              <section v-if="!c.archived" class="ask" @click="askEl?.focus()">
                <label class="sr-only" for="case-ask">Ask about this case</label>
                <textarea id="case-ask" ref="askEl" v-model="question" rows="2" placeholder="Ask a question about this case…" @keydown="onKey" />
                <div class="ask-foot">
                  <span v-if="c.files.length" class="ask-note"><i class="pi pi-shield" />Answers use this case’s {{ c.files.length === 1 ? 'document' : `${c.files.length} documents` }} and cite the&nbsp;law</span>
                  <span v-else class="ask-note warn"><i class="pi pi-info-circle" />No documents yet — answers will use the law only. Add files on the&nbsp;right.</span>
                  <PButton label="Ask" icon="pi pi-send" icon-pos="right" rounded :disabled="!question.trim()" @click.stop="ask" />
                </div>
              </section>

              <!-- 2. Chats in this case -->
              <section class="panel">
                <div class="sec-head"><h2>Chats in this case</h2><span class="count">{{ c.chats.length }}</span></div>
                <div v-if="!c.chats.length" class="empty-line"><i class="pi pi-comments" />No chats yet. Ask your first question above — it will be saved&nbsp;here.</div>
                <ul v-else class="rows">
                  <li v-for="x in c.chats" :key="x.id">
                    <button class="row" @click="openChat"><i class="pi pi-comment" /><span class="t">{{ x.title }}</span><span class="when">{{ x.when }}</span><i class="pi pi-angle-right go" /></button>
                  </li>
                </ul>
              </section>
            </div>

            <!-- 3. Documents: what the answers are based on -->
            <aside class="panel docs">
              <div class="sec-head"><h2>Documents</h2><span class="count">{{ c.files.length }}</span></div>
              <p class="docs-note">Femida reads these when it answers questions in this case, alongside legislation and court&nbsp;practice.</p>
              <ul v-if="c.files.length" class="files">
                <li v-for="(f, i) in c.files" :key="f.name + i" class="file">
                  <span class="f-ic"><i :class="fileIcon(f.name)" /></span>
                  <span class="f-text"><span class="f-name" :title="f.name">{{ f.name }}</span><span class="f-meta">{{ f.size }} · added {{ /^(Today|Yesterday|Just now)$/.test(f.added) ? f.added.toLowerCase() : f.added }}</span></span>
                  <button class="f-x" :aria-label="`Remove ${f.name}`" v-tooltip.left="'Remove'" @click="removeFile(i)"><i class="pi pi-times" /></button>
                </li>
              </ul>
              <button class="drop" :class="{ big: !c.files.length }" @click="addFile(c)">
                <span class="drop-ic"><i class="pi pi-upload" /></span>
                <span class="drop-t">{{ c.files.length ? 'Upload more documents' : 'Add the contract, claim or court decision' }}</span>
                <span class="drop-s">PDF or Word · up to 25 MB · encrypted</span>
              </button>
            </aside>
          </div>
        </template>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 1120px; margin: 0 auto; padding: 24px 0 72px; }
.back { display: inline-flex; align-items: center; gap: 8px; height: 32px; margin-left: -8px; padding: 0 10px; border-radius: var(--fd-radius-md); color: var(--fd-muted); text-decoration: none; font: 500 14px/20px var(--fd-font-sans); transition: color .15s, background-color .15s; }
.back:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.back .pi { font-size: 12px; }

.head { position: relative; display: flex; align-items: center; gap: 16px; margin: 16px 0 24px; }
.mono { display: grid; place-items: center; width: 56px; height: 56px; flex-shrink: 0; border-radius: 14px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 19px/1 var(--fd-font-serif); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fd-accent) 25%, transparent); }
.titles { display: grid; gap: 4px; flex: 1; min-width: 0; }
h1 { margin: 0; color: var(--fd-ink); font: 600 30px/38px var(--fd-font-serif); letter-spacing: -.01em; text-wrap: balance; }
.meta { margin: 0; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.arch { color: var(--fd-amber); }
.more { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border: 1px solid var(--fd-line); border-radius: 10px; background: var(--fd-panel); color: var(--fd-muted); cursor: pointer; }
.more:hover { color: var(--fd-ink); border-color: color-mix(in srgb, var(--fd-ink) 22%, transparent); }
.rename { height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-accent); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 600 24px/32px var(--fd-font-serif); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.banner { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 12px 12px 12px 16px; border-radius: var(--fd-radius-lg); background: var(--fd-amber-soft); color: var(--fd-amber); font: 400 15px/22px var(--fd-font-sans); }
.banner span { flex: 1; }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }
.main-col { display: grid; gap: 20px; min-width: 0; }

/* Ask */
.ask { display: grid; gap: 10px; padding: 16px 16px 12px 18px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); cursor: text; transition: border-color .15s, box-shadow .15s; }
.ask:focus-within { border-color: color-mix(in srgb, var(--fd-accent) 55%, var(--fd-line)); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.ask textarea { width: 100%; min-height: 52px; resize: none; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 17px/26px var(--fd-font-sans); }
.ask textarea::placeholder { color: var(--fd-muted); }
.ask-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ask-note { display: inline-flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.ask-note .pi { font-size: 13px; color: var(--fd-accent-text); }
.ask-note.warn .pi { color: var(--fd-amber); }

/* Panels */
.panel { padding: 18px; border-radius: var(--fd-radius-xl); border: 1px solid var(--fd-line); background: var(--fd-panel); }
.sec-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.sec-head h2 { margin: 0; color: var(--fd-ink); font: 600 16px/22px var(--fd-font-sans); }
.count { min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; display: grid; place-items: center; background: var(--fd-panel-2); color: var(--fd-muted); font: 600 12px/1 var(--fd-font-sans); }
.rows { display: grid; margin: 0 -8px; padding: 0; list-style: none; }
.row { display: flex; align-items: center; gap: 12px; width: 100%; height: 44px; padding: 0 10px; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-ink); text-align: left; cursor: pointer; font: 400 15px/20px var(--fd-font-sans); transition: background-color .15s; }
.row .pi { font-size: 13px; color: var(--fd-muted); }
.row .t { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.row .when { color: var(--fd-muted); font-size: 13px; }
.row .go { opacity: 0; transition: opacity .15s, transform .15s; }
.row:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.row:hover .go { opacity: 1; transform: translateX(2px); }
.row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.empty-line { display: flex; align-items: center; gap: 10px; padding: 14px; border-radius: var(--fd-radius-md); background: var(--fd-panel-2); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }

/* Documents */
.docs { position: sticky; top: 24px; }
.docs-note { margin: -4px 0 14px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); text-wrap: pretty; }
.files { display: grid; gap: 6px; margin: 0 0 12px; padding: 0; list-style: none; }
.file { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 10px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-line); }
.f-ic { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 8px; background: var(--fd-panel-2); color: var(--fd-accent-text); }
.f-text { display: grid; flex: 1; min-width: 0; }
.f-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.f-meta { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.f-x { display: grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; opacity: 0; transition: opacity .15s; }
.file:hover .f-x, .f-x:focus-visible { opacity: 1; }
.f-x:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.f-x .pi { font-size: 10px; }
.drop { display: grid; justify-items: center; gap: 4px; width: 100%; padding: 14px; border-radius: var(--fd-radius-lg); border: 1px dashed color-mix(in srgb, var(--fd-accent) 40%, var(--fd-line)); background: transparent; color: var(--fd-ink); text-align: center; cursor: pointer; transition: background-color .15s, border-color .15s; }
.drop:hover { background: color-mix(in srgb, var(--fd-accent) 6%, transparent); border-color: var(--fd-accent); }
.drop.big { padding: 28px 16px; }
.drop-ic { display: grid; place-items: center; width: 36px; height: 36px; margin-bottom: 4px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.drop-t { font: 500 14px/20px var(--fd-font-sans); text-wrap: balance; }
.drop-s { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }

.state { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 32px; padding: 56px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state-ic { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 6px; border-radius: 16px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.skel-col { display: grid; gap: 10px; flex: 1; }

@media (max-width: 1023px) {
  .page { padding: 0 24px; }
  .layout { grid-template-columns: 1fr; }
  .docs { position: static; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 16px 0 48px; }
  .head { gap: 12px; }
  .mono { width: 44px; height: 44px; font-size: 15px; }
  h1 { font-size: 24px; line-height: 32px; }
  .ask-foot { flex-direction: column; align-items: stretch; }
}
</style>
