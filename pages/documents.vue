<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { FILES, DRAFTS, WIZARD_STEPS, type DocFile } from '~/data/mock';
import { rel } from '~/composables/useCases';

useHead({ title: 'Documents — Femida redesign prototype' });
const route = useRoute();
const { byId } = useCases();
const { state: chat, newChat } = useChat();

/* Screen state. Demo: ?state=loading | empty | error */
const files = ref<(DocFile & { progress?: number })[]>(FILES.map((f) => ({ ...f })));
const drafts = ref(DRAFTS.map((d) => ({ ...d })));
const phase = ref<'loading' | 'ready' | 'error'>('loading');
function load() {
  phase.value = 'loading';
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => {
    if (s === 'error') { phase.value = 'error'; return; }
    if (s === 'empty') { files.value = []; drafts.value = []; }
    phase.value = 'ready';
  }, 450);
}
onMounted(load);
function retry() { navigateTo({ query: {} }, { replace: true }).then(load); }

/* Tabs, search, sort */
const tab = ref<'files' | 'drafts'>('files');
const query = ref('');
const sort = ref<'newest' | 'name' | 'size'>('newest');
const sortLabel = computed(() => ({ newest: 'Newest', name: 'Name', size: 'Size' })[sort.value]);
const sortMenu = ref();
const sortItems = computed(() => (['newest', 'name', 'size'] as const).map((k) => ({
  label: { newest: 'Newest', name: 'Name', size: 'Size' }[k], icon: sort.value === k ? 'pi pi-check' : 'pi pi-fw', command: () => (sort.value = k),
})));
const shownFiles = computed(() => {
  const q = query.value.trim().toLowerCase();
  return files.value
    .filter((f) => !q || f.name.toLowerCase().includes(q))
    .sort((a, b) => (a.progress !== undefined ? -1 : b.progress !== undefined ? 1 : sort.value === 'name' ? a.name.localeCompare(b.name) : sort.value === 'size' ? b.bytes - a.bytes : b.ts - a.ts));
});
const shownDrafts = computed(() => {
  const q = query.value.trim().toLowerCase();
  return drafts.value.filter((d) => !q || d.title.toLowerCase().includes(q)).sort((a, b) => (sort.value === 'name' ? a.title.localeCompare(b.title) : b.ts - a.ts));
});
const typeOf = (n: string) => (/\.docx?$/i.test(n) ? 'DOCX' : /\.pdf$/i.test(n) ? 'PDF' : 'FILE');

/* Upload with progress (prototype: simulated) */
const timers: ReturnType<typeof setInterval>[] = [];
const samples = ['Contract_of_sale.pdf', 'Power_of_attorney.docx', 'Court_ruling_2026.pdf'];
function upload() {
  tab.value = 'files'; query.value = '';
  const name = samples[files.value.length % samples.length];
  const f = { id: `u${Date.now()}`, name, size: '820 KB', bytes: 820000, date: 'Today', ts: 99999999, progress: 0 };
  files.value.unshift(f);
  const row = files.value[0];
  const t = setInterval(() => {
    row.progress = Math.min(100, (row.progress ?? 0) + 9);
    if (row.progress >= 100) { clearInterval(t); delete row.progress; }
  }, 120);
  timers.push(t);
}
onBeforeUnmount(() => timers.forEach(clearInterval));

/* Selection → action bar */
const selected = ref<Set<string>>(new Set());
const selCount = computed(() => selected.value.size);
function toggle(id: string) { const s = new Set(selected.value); s.has(id) ? s.delete(id) : s.add(id); selected.value = s; }
const allChecked = computed(() => shownFiles.value.length > 0 && shownFiles.value.every((f) => selected.value.has(f.id)));
function toggleAll() { selected.value = allChecked.value ? new Set() : new Set(shownFiles.value.filter((f) => f.progress === undefined).map((f) => f.id)); }
function clearSel() { selected.value = new Set(); }
function deleteSelected() { files.value = files.value.filter((f) => !selected.value.has(f.id)); clearSel(); }
function askInChat(ids: string[]) {
  const picked = files.value.filter((f) => ids.includes(f.id));
  if (!picked.length) return;
  newChat();
  chat.file = picked.length === 1 ? { name: picked[0].name, size: picked[0].size } : { name: `${picked.length} documents`, size: 'from Documents' };
  navigateTo('/');
}

/* Row menu */
const rowMenu = ref();
const menuFor = ref<DocFile | null>(null);
const menuOpenId = ref<string | null>(null);
const menuItems = computed(() => [
  { label: 'Ask in chat', icon: 'pi pi-comments', command: () => menuFor.value && askInChat([menuFor.value.id]) },
  { label: 'Download', icon: 'pi pi-download', command: () => {} },
  { separator: true },
  { label: 'Delete', icon: 'pi pi-trash', class: 'fd-danger', command: () => { files.value = files.value.filter((f) => f !== menuFor.value); } },
]);
function openMenu(e: Event, f: DocFile) { menuFor.value = f; menuOpenId.value = f.id; rowMenu.value.toggle(e); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <div class="titles">
            <h1>Documents</h1>
            <p class="lead">Your files and drafts in one place. Uploaded files can be reused in&nbsp;chats.</p>
          </div>
          <button class="primary-btn" @click="upload"><i class="pi pi-upload" />Upload</button>
        </header>

        <div class="toolbar">
          <div class="tabs" role="tablist" aria-label="Documents">
            <button role="tab" :aria-selected="tab === 'files'" class="tab" :class="{ on: tab === 'files' }" @click="tab = 'files'; clearSel()"><i class="pi pi-folder" />Files<span v-if="phase === 'ready'" class="count">{{ files.length }}</span></button>
            <button role="tab" :aria-selected="tab === 'drafts'" class="tab" :class="{ on: tab === 'drafts' }" @click="tab = 'drafts'; clearSel()"><i class="pi pi-pencil" />Drafts<span v-if="phase === 'ready'" class="count">{{ drafts.length }}</span></button>
          </div>
          <div class="tools">
            <label class="search">
              <i class="pi pi-search" />
              <input v-model="query" type="search" :placeholder="tab === 'files' ? 'Search files' : 'Search drafts'" aria-label="Search documents" @keydown.esc="query = ''" />
              <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
            </label>
            <button class="sort" aria-haspopup="menu" @click="sortMenu.toggle($event)"><span class="muted">Sort by</span> {{ sortLabel }}<i class="pi pi-angle-down" /></button>
            <PMenu ref="sortMenu" :model="tab === 'files' ? sortItems : sortItems.slice(0, 2)" :popup="true" />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="list" aria-busy="true" aria-label="Loading documents">
          <div v-for="i in 5" :key="i" class="row skel"><PSkeleton width="36px" height="36px" border-radius="8px" /><div class="skel-col"><PSkeleton :width="`${40 + (i % 3) * 12}%`" height="14px" /><PSkeleton width="18%" height="12px" /></div></div>
        </div>

        <!-- Error -->
        <div v-else-if="phase === 'error'" class="state">
          <span class="state-ic err"><i class="pi pi-refresh" /></span>
          <h2>Couldn’t load your documents</h2>
          <p>This is temporary. Your files are safe — try&nbsp;again.</p>
          <PButton label="Try again" icon="pi pi-refresh" severity="secondary" @click="retry" />
        </div>

        <!-- FILES -->
        <template v-else-if="tab === 'files'">
          <button v-if="!files.length" class="drop big" @click="upload">
            <span class="drop-ic"><i class="pi pi-upload" /></span>
            <span class="drop-t">Upload your first file</span>
            <span class="drop-s">A contract, claim or court decision — then ask about it in any chat. PDF or Word · up to 25&nbsp;MB · encrypted</span>
          </button>
          <template v-else>
            <div v-if="!shownFiles.length" class="state small"><h2>No files match «{{ query.trim() }}»</h2><PButton label="Clear search" severity="secondary" size="small" @click="query = ''" /></div>
            <div v-else class="list" role="table" aria-label="Files">
              <div class="list-head" role="row">
                <label class="check" @click.stop><input type="checkbox" :checked="allChecked" aria-label="Select all files" @change="toggleAll" /><span /></label>
                <span class="h-name">Name</span><span class="h-case">Case</span><span class="h-size">Size</span><span class="h-date">Added</span><span class="h-act" />
              </div>
              <div v-for="f in shownFiles" :key="f.id" class="row" role="row" :class="{ sel: selected.has(f.id), 'menu-open': menuOpenId === f.id, uploading: f.progress !== undefined }">
                <label class="check" @click.stop>
                  <input type="checkbox" :checked="selected.has(f.id)" :disabled="f.progress !== undefined" :aria-label="`Select ${f.name}`" @change="toggle(f.id)" /><span />
                </label>
                <div class="name-col">
                  <span class="type" :class="typeOf(f.name).toLowerCase()">{{ typeOf(f.name) }}</span>
                  <div class="name-text">
                    <span class="fname" :title="f.name">{{ f.name }}</span>
                    <div v-if="f.progress !== undefined" class="progress" role="progressbar" :aria-valuenow="f.progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Uploading ${f.name}`">
                      <span :style="{ width: `${f.progress}%` }" />
                    </div>
                    <span class="fmeta-m">{{ f.progress !== undefined ? `Uploading · ${f.progress}%` : `${f.size} · ${rel(f.date)}` }}</span>
                  </div>
                </div>
                <span class="case-col">
                  <NuxtLink v-if="f.caseId && byId(f.caseId)" :to="`/cases/${f.caseId}`" class="case-link"><i class="pi pi-briefcase" />{{ byId(f.caseId)!.name }}</NuxtLink>
                  <span v-else class="dash">—</span>
                </span>
                <span class="size-col">{{ f.progress !== undefined ? `${f.progress}%` : f.size }}</span>
                <span class="date-col">{{ f.progress !== undefined ? 'Uploading…' : rel(f.date) }}</span>
                <span class="act-col">
                  <button class="icon-act" :aria-label="`Ask about ${f.name} in chat`" v-tooltip.top="'Ask in chat'" :disabled="f.progress !== undefined" @click="askInChat([f.id])"><i class="pi pi-comments" /></button>
                  <button class="icon-act" :aria-label="`Actions for ${f.name}`" aria-haspopup="menu" :disabled="f.progress !== undefined" @click="openMenu($event, f)"><i class="pi pi-ellipsis-h" /></button>
                </span>
              </div>
            </div>
            <p class="foot-note"><i class="pi pi-lock" />Files are encrypted. PDF or Word, up to 25&nbsp;MB each.</p>
          </template>
        </template>

        <!-- DRAFTS (from the Document wizard) -->
        <template v-else>
          <div v-if="!drafts.length" class="state">
            <span class="state-ic"><i class="pi pi-file-edit" /></span>
            <h2>No drafts yet</h2>
            <p>Documents you prepare in the Document wizard are saved here, so you can come back and finish&nbsp;them.</p>
            <PButton label="Open Document wizard" icon="pi pi-arrow-right" icon-pos="right" severity="secondary" />
          </div>
          <div v-else-if="!shownDrafts.length" class="state small"><h2>No drafts match «{{ query.trim() }}»</h2></div>
          <div v-else class="list">
            <div v-for="d in shownDrafts" :key="d.id" class="row draft">
              <span class="type doc"><i class="pi pi-file-edit" /></span>
              <div class="name-text">
                <span class="fname">{{ d.title }}</span>
                <span class="steps" :aria-label="`Step ${d.step} of 5`">
                  <span v-for="(s, i) in WIZARD_STEPS" :key="s" class="pip" :class="{ done: i < d.step }" />
                  <span class="step-t">{{ d.step === 5 ? 'Ready' : `Step ${d.step} of 5 · ${WIZARD_STEPS[d.step - 1]}` }}</span>
                  <span class="dot">·</span>{{ d.kind }}<span class="dot">·</span>edited {{ rel(d.edited) }}
                </span>
              </div>
              <span class="act-col always">
                <PButton v-if="d.step === 5" label="Download" icon="pi pi-download" size="small" severity="secondary" text />
                <PButton :label="d.step === 5 ? 'Open' : 'Continue'" icon="pi pi-arrow-right" icon-pos="right" size="small" severity="secondary" />
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>
    <PMenu ref="rowMenu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />

    <!-- Selection bar -->
    <Transition name="rise">
      <div v-if="selCount && tab === 'files'" class="selbar" role="toolbar" aria-label="Selected files">
        <span class="sel-n">{{ selCount }} selected</span>
        <button class="sel-btn primary" @click="askInChat([...selected])"><i class="pi pi-comments" />Ask in chat</button>
        <button class="sel-btn"><i class="pi pi-download" />Download</button>
        <button class="sel-btn danger" @click="deleteSelected"><i class="pi pi-trash" />Delete</button>
        <button class="sel-x" aria-label="Clear selection" @click="clearSel"><i class="pi pi-times" /></button>
      </div>
    </Transition>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 980px; margin: 0 auto; padding: 48px 0 112px; }

.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.titles { display: grid; gap: 6px; }
h1 { margin: 0; font: 600 34px/42px var(--fd-font-serif); letter-spacing: -.01em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.primary-btn {
  display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; height: 36px; margin-top: 4px; padding: 0 14px 0 12px; border: 0; border-radius: 10px;
  background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, transform .1s;
}
.primary-btn .pi { font-size: 12px; }
.primary-btn:hover { background: var(--fd-accent-hover); }
.primary-btn:active { transform: scale(.98); }
.primary-btn:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 28px 0 20px; }
.tabs { display: inline-flex; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tab { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 14px 0 12px; border: 0; border-radius: 999px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: color .15s, background-color .15s; }
.tab .pi { font-size: 12px; }
.tab:hover { color: var(--fd-ink); }
.tab.on { background: var(--fd-panel-2); color: var(--fd-ink); }
.count { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; display: grid; place-items: center; background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-muted); font: 600 11px/1 var(--fd-font-sans); }
.tab.on .count { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.tools { display: flex; align-items: center; gap: 8px; }
.search { display: flex; align-items: center; gap: 10px; width: 260px; height: 36px; padding: 0 6px 0 12px; border-radius: 10px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s, box-shadow .15s; }
.search:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search > .pi { font-size: 13px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 14px/20px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear .pi { font-size: 10px; }
.sort { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; border: 1px solid var(--fd-line); border-radius: 10px; background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); white-space: nowrap; }
.sort .muted { font-weight: 400; }
.sort .pi { font-size: 11px; color: var(--fd-muted); }

/* List */
.list { border: 1px solid var(--fd-line); border-radius: 14px; background: var(--fd-panel); overflow: hidden; }
.list-head, .row { display: grid; grid-template-columns: 28px minmax(0, 1fr) 200px 80px 90px 76px; align-items: center; gap: 12px; padding: 0 12px 0 16px; }
.list-head { height: 40px; border-bottom: 1px solid var(--fd-line); color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .02em; }
.row { min-height: 60px; transition: background-color .12s; }
.row + .row { border-top: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.row:not(.skel):hover, .row.menu-open { background: color-mix(in srgb, var(--fd-ink) 3%, var(--fd-panel)); }
.row.sel { background: color-mix(in srgb, var(--fd-accent) 7%, var(--fd-panel)); }
.row.skel { display: flex; gap: 14px; }
.skel-col { display: grid; gap: 8px; flex: 1; }

.check { position: relative; display: grid; place-items: center; width: 20px; height: 20px; cursor: pointer; }
.check input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.check span { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid color-mix(in srgb, var(--fd-muted) 70%, transparent); transition: background-color .12s, border-color .12s; }
.check input:checked + span { background: var(--fd-accent); border-color: var(--fd-accent); box-shadow: inset 0 0 0 3px var(--fd-panel); }
.check input:focus-visible + span { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.check input:disabled + span { opacity: .4; }

.name-col { display: flex; align-items: center; gap: 12px; min-width: 0; }
.type { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 8px; background: var(--fd-panel-2); color: var(--fd-muted); font: 700 9px/1 var(--fd-font-sans); letter-spacing: .04em; }
.type.pdf { background: var(--fd-red-soft); color: var(--fd-red); }
.type.docx, .type.doc { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.type.doc .pi { font-size: 14px; }
.name-text { display: grid; gap: 3px; min-width: 0; }
.fname { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.fmeta-m { display: none; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.progress { width: min(280px, 100%); height: 4px; border-radius: 999px; background: var(--fd-panel-2); overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--fd-accent); transition: width .12s linear; }
.case-col { min-width: 0; }
.case-link { display: inline-block; max-width: 100%; height: 26px; padding: 0 10px 0 8px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-ink); text-decoration: none; font: 400 13px/26px var(--fd-font-sans); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; vertical-align: middle; }
.case-link .pi { margin-right: 6px; font-size: 11px; color: var(--fd-accent-text); }
.case-link:hover { background: var(--fd-accent-soft); }
.dash { color: color-mix(in srgb, var(--fd-muted) 50%, transparent); }
.size-col, .date-col { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); white-space: nowrap; }
.act-col { display: flex; justify-content: flex-end; gap: 2px; opacity: 0; transition: opacity .12s; }
.row:hover .act-col, .row.menu-open .act-col, .row:focus-within .act-col, .act-col.always { opacity: 1; }
.icon-act { display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.icon-act:hover:not(:disabled) { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.icon-act:disabled { opacity: .3; cursor: default; }
.icon-act .pi { font-size: 13px; }
.foot-note { display: flex; align-items: center; gap: 8px; margin: 12px 0 0 4px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.foot-note .pi { font-size: 11px; }

/* Drafts */
.row.draft { grid-template-columns: 36px minmax(0, 1fr) auto; min-height: 72px; padding: 10px 12px 10px 16px; }
.steps { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.pip { width: 14px; height: 4px; border-radius: 2px; background: var(--fd-panel-2); }
.pip.done { background: var(--fd-accent); }
.step-t { margin-left: 4px; color: var(--fd-ink); }
.dot { opacity: .5; }

/* Empty / drop */
.drop { display: grid; justify-items: center; gap: 6px; width: 100%; padding: 48px 24px; border-radius: 16px; border: 1px dashed color-mix(in srgb, var(--fd-accent) 40%, var(--fd-line)); background: transparent; color: var(--fd-ink); text-align: center; cursor: pointer; transition: background-color .15s, border-color .15s; }
.drop:hover { background: color-mix(in srgb, var(--fd-accent) 5%, transparent); border-color: var(--fd-accent); }
.drop-ic { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 6px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.drop-t { font: 600 17px/24px var(--fd-font-sans); }
.drop-s { max-width: 420px; color: var(--fd-muted); font: 400 14px/21px var(--fd-font-sans); text-wrap: balance; }
.state { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 56px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: var(--fd-radius-xl); }
.state.small { padding: 36px 24px; border-style: solid; background: var(--fd-panel); }
.state-ic { display: grid; place-items: center; width: 56px; height: 56px; margin-bottom: 6px; border-radius: 16px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.state-ic .pi { font-size: 22px; }
.state-ic.err { background: var(--fd-amber-soft); color: var(--fd-amber); }
.state h2 { margin: 0; font: 600 19px/26px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 8px; max-width: 440px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }

/* Selection bar */
.selbar {
  position: fixed; left: 50%; bottom: 24px; z-index: 40; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; padding: 6px 6px 6px 16px;
  border-radius: 14px; border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 96%, transparent); backdrop-filter: blur(20px); box-shadow: var(--fd-overlay-shadow);
}
.sel-n { margin-right: 8px; color: var(--fd-ink); font: 600 14px/20px var(--fd-font-sans); white-space: nowrap; }
.sel-btn { display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border: 0; border-radius: 10px; background: transparent; color: var(--fd-ink); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); white-space: nowrap; }
.sel-btn .pi { font-size: 12px; }
.sel-btn:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.sel-btn.primary { background: var(--fd-accent); color: var(--fd-on-accent); }
.sel-btn.primary:hover { background: var(--fd-accent-hover); }
.sel-btn.danger { color: var(--fd-red); }
.sel-x { display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 10px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.sel-x:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.rise-enter-active, .rise-leave-active { transition: opacity .18s ease, transform .18s ease; }
.rise-enter-from, .rise-leave-to { opacity: 0; transform: translate(-50%, 12px); }

@media (max-width: 1023px) {
  .page { padding: 0 24px; }
  .list-head, .row { grid-template-columns: 28px minmax(0, 1fr) 80px 76px; }
  .h-case, .case-col, .h-date, .date-col { display: none; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 112px; }
  h1 { font-size: 28px; line-height: 36px; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .tabs { align-self: flex-start; }
  .search { flex: 1; width: auto; }
  .list-head { display: none; }
  .list-head, .row { grid-template-columns: 24px minmax(0, 1fr) 68px; padding: 0 8px 0 12px; }
  .h-size, .size-col { display: none; }
  .fmeta-m { display: block; }
  .act-col { opacity: 1; }
  .row.draft { grid-template-columns: 36px minmax(0, 1fr); }
  .row.draft .act-col { grid-column: 1 / -1; justify-content: flex-start; }
  .selbar { left: 12px; right: 12px; bottom: 12px; transform: none; flex-wrap: wrap; }
  .rise-enter-from, .rise-leave-to { transform: translateY(12px); }
}
</style>
