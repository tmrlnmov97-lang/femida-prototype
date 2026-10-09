<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { rel } from '~/composables/useCases';

// Layout follows a Claude project page: back link, title + description, the chat composer, the case's chats,
// and a "knowledge" panel on the right (here: Case documents).
const route = useRoute();
const { byId, remove, addFile } = useCases();
const { state: chat, newChat } = useChat();
const c = computed(() => byId(String(route.params.id)));
useHead(() => ({ title: `${c.value?.name ?? 'Case'} — Femida redesign prototype` }));

const ready = ref(false);
onMounted(() => {
  setTimeout(() => (ready.value = true), 350);
  // The composer on this page starts a chat inside the case
  if (c.value && !c.value.archived) { newChat(); chat.caseCtx = { id: c.value.id, name: c.value.name, docs: c.value.files.length }; }
});
watch(() => c.value?.files.length, (n) => { if (chat.caseCtx && c.value && chat.caseCtx.id === c.value.id) chat.caseCtx.docs = n ?? 0; });
// As soon as a question is sent from here: save it in the case and open the conversation
watch(() => chat.messages.length, (n) => {
  if (!n || !c.value || chat.caseCtx?.id !== c.value.id) return;
  const first = chat.messages.find((m) => m.role === 'user') as { text?: string } | undefined;
  const t = first?.text?.trim() || 'New chat';
  const title = t.length > 60 ? `${t.slice(0, 58)}…` : t;
  c.value.chats.unshift({ id: `n${Date.now()}`, title, when: 'Just now' });
  chat.chatTitle = title;
  c.value.updated = 'Just now'; c.value.ts = 99999999;
  navigateTo('/');
});
onBeforeUnmount(() => { if (!chat.messages.length && chat.caseCtx?.id === c.value?.id) chat.caseCtx = null; });
// prototype: past chats open the sample answer; the case and chat title ride along for the breadcrumbs
function openChat(title: string) { navigateTo({ path: '/', query: { demo: 'answer', case: c.value?.id, chat: title } }); }

/* Title / description editing */
const menu = ref();
const editing = ref<null | 'name' | 'desc'>(null);
const draft = ref('');
const editEl = ref<HTMLInputElement | HTMLTextAreaElement>();
function startEdit(what: 'name' | 'desc') {
  if (!c.value) return;
  editing.value = what; draft.value = what === 'name' ? c.value.name : c.value.description ?? '';
  nextTick(() => { editEl.value?.focus(); (editEl.value as HTMLInputElement)?.select?.(); });
}
function commitEdit() {
  if (!c.value || !editing.value) return;
  if (editing.value === 'name') { if (draft.value.trim()) c.value.name = draft.value.trim(); }
  else c.value.description = draft.value.trim();
  editing.value = null;
}
function onEditKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.preventDefault(); editing.value = null; }
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); }
}
const items = computed(() => [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => startEdit('name') },
  { label: c.value?.description ? 'Edit description' : 'Add description', icon: 'pi pi-align-left', command: () => startEdit('desc') },
  c.value?.archived
    ? { label: 'Restore', icon: 'pi pi-replay', command: () => { c.value!.archived = false; } }
    : { label: 'Archive', icon: 'pi pi-inbox', command: () => { c.value!.archived = true; } },
  { separator: true },
  { label: 'Delete case', icon: 'pi pi-trash', class: 'fd-danger', command: () => { remove(c.value!); navigateTo('/cases'); } },
]);
// Break long file names only at '_' and before the extension, never inside a word
const wrapName = (f: string) => f.replace(/_/g, '_\u200b').replace(/\.(\w+)$/, '\u200b.$1');
const typeOf = (f: string) => (/\.docx?$/i.test(f) ? 'DOCX' : /\.pdf$/i.test(f) ? 'PDF' : 'FILE');
function removeFile(i: number) { c.value?.files.splice(i, 1); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <NuxtLink to="/cases" class="back"><i class="pi pi-arrow-left" />All cases</NuxtLink>

        <div v-if="!c" class="state">
          <h2>Case not found</h2>
          <p>It may have been deleted.</p>
          <PButton label="Back to My cases" severity="secondary" @click="navigateTo('/cases')" />
        </div>

        <div v-else-if="!ready" class="layout">
          <div class="main-col"><PSkeleton width="60%" height="34px" /><PSkeleton width="80%" height="16px" /><PSkeleton height="128px" border-radius="16px" /><PSkeleton height="64px" /><PSkeleton height="64px" /></div>
          <PSkeleton height="300px" border-radius="16px" />
        </div>

        <div v-else class="layout">
          <div class="main-col">
            <header class="head">
              <div class="title-row">
                <input v-if="editing === 'name'" ref="editEl" v-model="draft" class="edit-name" aria-label="Case name" maxlength="120" @keydown="onEditKey" @blur="commitEdit" />
                <h1 v-else>{{ c.name }}</h1>
                <button class="more" aria-label="Case actions" aria-haspopup="menu" @click="menu.toggle($event)"><i class="pi pi-ellipsis-h" /></button>
                <PMenu ref="menu" :model="items" :popup="true" />
              </div>
              <textarea v-if="editing === 'desc'" ref="editEl" v-model="draft" class="edit-desc" rows="2" aria-label="Case description" placeholder="The client, the dispute and what you need to find out" maxlength="300" @keydown="onEditKey" @blur="commitEdit" />
              <p v-else-if="c.description" class="desc" @click="startEdit('desc')">{{ c.description }}</p>
              <button v-else class="add-desc" @click="startEdit('desc')"><i class="pi pi-plus" />Add a description</button>
            </header>

            <div v-if="c.archived" class="banner">
              <i class="pi pi-inbox" /><span>This case is archived. Restore it to ask new questions.</span>
              <PButton label="Restore" size="small" severity="secondary" @click="c.archived = false" />
            </div>
            <template v-else>
              <ChatComposer variant="hero" placeholder="Ask a question about this case…" />
              <p class="ground"><i class="pi pi-shield" />
                <template v-if="c.files.length">Answers use this case’s {{ c.files.length === 1 ? 'document' : `${c.files.length} documents` }} and cite the&nbsp;law.</template>
                <template v-else>No documents yet, so answers use the law only. Add documents on the&nbsp;right.</template>
              </p>
            </template>

            <section class="chats" aria-label="Chats in this case">
              <ul v-if="c.chats.length" class="rows">
                <li v-for="x in c.chats" :key="x.id">
                  <button class="row" @click="openChat(x.title)">
                    <span class="t">{{ x.title }}</span>
                    <span class="when">Last message {{ rel(x.when) }}</span>
                  </button>
                </li>
              </ul>
              <div v-else class="no-chats">
                <i class="pi pi-comments" />
                <p>Start a chat to keep this case’s conversations together and reuse its&nbsp;documents.</p>
              </div>
            </section>
          </div>

          <!-- Like "Project knowledge" -->
          <aside class="knowledge" aria-label="Case documents">
            <div class="k-head">
              <h2>Case documents</h2>
              <button class="k-add" aria-label="Add documents" v-tooltip.left="'Add documents'" @click="addFile(c)"><i class="pi pi-plus" /></button>
            </div>
            <p class="k-note">Femida reads these when it answers in this case, alongside legislation and court&nbsp;practice.</p>
            <div v-if="c.files.length" class="tiles">
              <div v-for="(f, i) in c.files" :key="f.name + i" class="tile" :title="f.name">
                <span class="type" :class="typeOf(f.name).toLowerCase()">{{ typeOf(f.name) }}</span>
                <span class="fname">{{ wrapName(f.name) }}</span>
                <span class="fmeta">{{ f.size }}</span>
                <button class="tile-x" :aria-label="`Remove ${f.name}`" @click="removeFile(i)"><i class="pi pi-times" /></button>
              </div>
            </div>
            <button v-else class="k-empty" @click="addFile(c)">
              <span class="k-empty-ic"><i class="pi pi-upload" /></span>
              <span class="k-empty-t">No documents yet</span>
              <span class="k-empty-s">Add the contract, claim or court decision. PDF or Word · up to 25&nbsp;MB · encrypted</span>
            </button>
          </aside>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px 0 72px; }
.back { display: inline-flex; align-items: center; gap: 8px; height: 32px; margin: 0 0 20px -8px; padding: 0 10px; border-radius: var(--fd-radius-md); color: var(--fd-muted); text-decoration: none; font: 500 14px/20px var(--fd-font-sans); transition: color .15s, background-color .15s; }
.back:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.back .pi { font-size: 12px; }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 32px; align-items: start; }
.main-col { display: grid; gap: 16px; min-width: 0; }

.head { display: grid; gap: 8px; margin-bottom: 8px; }
.title-row { display: flex; align-items: flex-start; gap: 8px; }
h1 { flex: 1; margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; text-wrap: balance; }
.more { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; margin-top: 2px; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-muted); cursor: pointer; }
.more:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.desc { margin: 0; color: var(--fd-muted); font: 400 16px/25px var(--fd-font-sans); cursor: text; text-wrap: pretty; border-radius: 6px; }
.desc:hover { color: var(--fd-ink); }
.add-desc { justify-self: start; display: inline-flex; align-items: center; gap: 6px; height: 28px; margin-left: -8px; padding: 0 8px; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-muted); cursor: pointer; font: 400 15px/20px var(--fd-font-sans); }
.add-desc:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.add-desc .pi { font-size: 11px; }
.edit-name, .edit-desc { flex: 1; width: 100%; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--fd-accent); background: var(--fd-bg); color: var(--fd-ink); outline: none; box-shadow: 0 0 0 3px var(--fd-accent-soft); resize: none; }
.edit-name { font: 600 26px/34px var(--fd-font-serif); }
.edit-desc { font: 400 16px/24px var(--fd-font-sans); }

.ground { display: flex; align-items: center; gap: 8px; margin: -4px 0 8px 4px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.ground .pi { font-size: 12px; color: var(--fd-accent-text); }
.banner { display: flex; align-items: center; gap: 12px; padding: 12px 12px 12px 16px; border-radius: var(--fd-radius-lg); background: var(--fd-amber-soft); color: var(--fd-amber); font: 400 15px/22px var(--fd-font-sans); }
.banner span { flex: 1; }

/* Chats: two-line rows like a project's chat list */
.rows { display: grid; margin: 0; padding: 0; list-style: none; border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.rows li { border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.row { display: grid; gap: 4px; width: 100%; padding: 14px 12px; border: 0; border-radius: 10px; background: transparent; text-align: left; cursor: pointer; transition: background-color .15s; }
.row:hover { background: color-mix(in srgb, var(--fd-ink) 5%, transparent); }
.row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.row .t { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.row .when { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.no-chats { display: flex; align-items: center; gap: 12px; padding: 20px; border-radius: var(--fd-radius-lg); border: 1px dashed var(--fd-line); color: var(--fd-muted); }
.no-chats p { margin: 0; font: 400 14px/21px var(--fd-font-sans); text-wrap: pretty; }

/* Case documents panel */
.knowledge { position: sticky; top: 20px; padding: 18px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.k-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.k-head h2 { margin: 0; color: var(--fd-ink); font: 600 16px/22px var(--fd-font-sans); }
.k-add { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--fd-line); border-radius: 10px; background: transparent; color: var(--fd-ink); cursor: pointer; transition: background-color .15s, border-color .15s; }
.k-add:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); border-color: color-mix(in srgb, var(--fd-ink) 22%, transparent); }
.k-add .pi { font-size: 12px; }
.k-note { margin: 6px 0 14px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); text-wrap: pretty; }
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.tile { position: relative; display: grid; align-content: start; gap: 6px; min-height: 104px; padding: 10px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); }
.type { justify-self: start; padding: 2px 6px; border-radius: 4px; background: var(--fd-panel-2); color: var(--fd-muted); font: 600 10px/14px var(--fd-font-sans); letter-spacing: .04em; }
.type.pdf { background: var(--fd-red-soft); color: var(--fd-red); }
.type.docx { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.fname { color: var(--fd-ink); font: 500 13px/18px var(--fd-font-sans); overflow-wrap: break-word; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.fmeta { margin-top: auto; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.tile-x { position: absolute; top: 6px; right: 6px; display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 50%; background: var(--fd-panel-2); color: var(--fd-muted); cursor: pointer; opacity: 0; transition: opacity .15s; }
.tile:hover .tile-x, .tile-x:focus-visible { opacity: 1; }
.tile-x:hover { color: var(--fd-ink); }
.tile-x .pi { font-size: 9px; }
.k-empty { display: grid; justify-items: center; gap: 6px; width: 100%; padding: 28px 16px; border-radius: 12px; border: 1px dashed var(--fd-line); background: transparent; color: var(--fd-ink); text-align: center; cursor: pointer; transition: border-color .15s, background-color .15s; }
.k-empty:hover { border-color: var(--fd-accent); background: color-mix(in srgb, var(--fd-accent) 5%, transparent); }
.k-empty-ic { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 4px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.k-empty-t { font: 600 15px/20px var(--fd-font-sans); }
.k-empty-s { max-width: 260px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); text-wrap: balance; }

.state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state h2 { margin: 0; font: 600 20px/28px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; color: var(--fd-muted); }

@media (max-width: 1023px) {
  .page { padding: 0 24px; }
  .layout { grid-template-columns: 1fr; }
  .knowledge { position: static; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 12px 0 48px; }
  h1 { font-size: 26px; line-height: 34px; }
  .more { opacity: 1; }
  .tile-x { opacity: 1; }
}
</style>
