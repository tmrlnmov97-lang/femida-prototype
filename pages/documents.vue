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
const iconOf = (n: string) => (/\.docx?$/i.test(n) ? 'pi pi-file-word' : /\.pdf$/i.test(n) ? 'pi pi-file-pdf' : 'pi pi-file');

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
          <button class="btn primary" @click="upload"><i class="pi pi-upload" />Upload</button>
        </header>

        <!-- Underline tabs on a divider, tools on the right -->
        <div class="toolbar">
          <nav class="utabs" role="tablist" aria-label="Documents">
            <button role="tab" :aria-selected="tab === 'files'" class="utab" :class="{ on: tab === 'files' }" @click="tab = 'files'; clearSel()">Files<span v-if="phase === 'ready'" class="n">{{ files.length }}</span></button>
            <button role="tab" :aria-selected="tab === 'drafts'" class="utab" :class="{ on: tab === 'drafts' }" @click="tab = 'drafts'; clearSel()">Drafts<span v-if="phase === 'ready'" class="n">{{ drafts.length }}</span></button>
          </nav>
          <div class="tools">
            <label class="search">
              <i class="pi pi-search" />
              <input v-model="query" type="search" :placeholder="tab === 'files' ? 'Search files' : 'Search drafts'" aria-label="Search documents" @keydown.esc="query = ''" />
              <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="query = ''"><i class="pi pi-times" /></button>
            </label>
            <button class="btn ghost" aria-haspopup="menu" @click="sortMenu.toggle($event)"><i class="pi pi-sort-alt" />{{ sortLabel }}</button>
            <PMenu ref="sortMenu" :model="tab === 'files' ? sortItems : sortItems.slice(0, 2)" :popup="true" />
          </div>
        </div>

        <!-- Loading -->
        <div v-if="phase === 'loading'" class="table" aria-busy="true" aria-label="Loading documents">
          <div class="thead"><span /><PSkeleton width="60px" height="10px" /></div>
          <div v-for="i in 6" :key="i" class="tr skel"><span /><PSkeleton :width="`${30 + (i % 3) * 12}%`" height="12px" /></div>
        </div>

        <!-- Error -->
        <div v-else-if="phase === 'error'" class="notice">
          <i class="pi pi-exclamation-circle" />
          <div><b>Couldn’t load your documents.</b> This is temporary — your files are&nbsp;safe.</div>
          <button class="btn" @click="retry"><i class="pi pi-refresh" />Try again</button>
        </div>

        <!-- FILES -->
        <template v-else-if="tab === 'files'">
          <div v-if="!files.length" class="empty">
            <i class="pi pi-folder-open" />
            <h2>No files yet</h2>
            <p>Upload a contract, claim or court decision, then ask about it in any chat. PDF or Word, up to 25&nbsp;MB, encrypted.</p>
            <button class="btn primary" @click="upload"><i class="pi pi-upload" />Upload file</button>
          </div>
          <template v-else>
            <div v-if="!shownFiles.length" class="notice"><i class="pi pi-search" /><div>No files match <b>«{{ query.trim() }}»</b>.</div><button class="btn" @click="query = ''">Clear search</button></div>
            <div v-else class="table" role="table" aria-label="Files" :class="{ selecting: selCount > 0 }">
              <!-- Header turns into the bulk-action bar while files are selected -->
              <div class="thead" role="row">
                <label class="check" @click.stop><input type="checkbox" :checked="allChecked" :indeterminate.prop="selCount > 0 && !allChecked" aria-label="Select all files" @change="toggleAll" /><span /></label>
                <template v-if="!selCount">
                  <span class="th name">Name</span><span class="th case">Case</span><span class="th size">Size</span><span class="th date">Added</span><span class="th act" />
                </template>
                <div v-else class="bulk">
                  <span class="bulk-n">{{ selCount }} selected</span>
                  <button class="link-btn" @click="askInChat([...selected])"><i class="pi pi-comments" />Ask in chat</button>
                  <button class="link-btn"><i class="pi pi-download" />Download</button>
                  <button class="link-btn danger" @click="deleteSelected"><i class="pi pi-trash" />Delete</button>
                  <button class="link-btn muted" @click="clearSel">Clear</button>
                </div>
              </div>
              <div v-for="f in shownFiles" :key="f.id" class="tr" role="row" :class="{ sel: selected.has(f.id), 'menu-open': menuOpenId === f.id, uploading: f.progress !== undefined }">
                <label class="check" @click.stop>
                  <input type="checkbox" :checked="selected.has(f.id)" :disabled="f.progress !== undefined" :aria-label="`Select ${f.name}`" @change="toggle(f.id)" /><span />
                </label>
                <div class="td name">
                  <i :class="[iconOf(f.name), typeOf(f.name).toLowerCase()]" class="ficon" aria-hidden="true" />
                  <div class="name-text">
                    <span class="fname" :title="f.name">{{ f.name }}</span>
                    <div v-if="f.progress !== undefined" class="progress" role="progressbar" :aria-valuenow="f.progress" aria-valuemin="0" aria-valuemax="100" :aria-label="`Uploading ${f.name}`"><span :style="{ width: `${f.progress}%` }" /></div>
                    <span class="sub">{{ f.progress !== undefined ? `Uploading — ${f.progress}%` : `${f.size} · ${rel(f.date)}` }}</span>
                  </div>
                </div>
                <span class="td case">
                  <NuxtLink v-if="f.caseId && byId(f.caseId)" :to="`/cases/${f.caseId}`" class="case-link" :title="byId(f.caseId)!.name">{{ byId(f.caseId)!.name }}</NuxtLink>
                  <span v-else class="none">—</span>
                </span>
                <span class="td size">{{ f.progress !== undefined ? '' : f.size }}</span>
                <span class="td date">{{ f.progress !== undefined ? 'Uploading…' : rel(f.date) }}</span>
                <span class="td act">
                  <button class="icon-act" :aria-label="`Ask about ${f.name} in chat`" v-tooltip.top="'Ask in chat'" :disabled="f.progress !== undefined" @click="askInChat([f.id])"><i class="pi pi-comments" /></button>
                  <button class="icon-act" :aria-label="`Actions for ${f.name}`" aria-haspopup="menu" :disabled="f.progress !== undefined" @click="openMenu($event, f)"><i class="pi pi-ellipsis-v" /></button>
                </span>
              </div>
            </div>
            <p class="foot"><i class="pi pi-lock" />Encrypted at rest. PDF or Word, up to 25&nbsp;MB per&nbsp;file.</p>
          </template>
        </template>

        <!-- DRAFTS (from the Document wizard) -->
        <template v-else>
          <div v-if="!drafts.length" class="empty">
            <i class="pi pi-file-edit" />
            <h2>No drafts yet</h2>
            <p>Documents you prepare in the Document wizard are saved here, so you can come back and finish&nbsp;them.</p>
            <NuxtLink to="/wizard" class="btn">Open Document wizard<i class="pi pi-arrow-right" /></NuxtLink>
          </div>
          <div v-else-if="!shownDrafts.length" class="notice"><i class="pi pi-search" /><div>No drafts match <b>«{{ query.trim() }}»</b>.</div></div>
          <div v-else class="table" role="table" aria-label="Drafts">
            <div class="thead drafts" role="row"><span class="th">Draft</span><span class="th">Progress</span><span class="th">Edited</span><span class="th" /></div>
            <div v-for="d in shownDrafts" :key="d.id" class="tr drafts" role="row">
              <div class="td name">
                <i class="pi pi-file-edit ficon" aria-hidden="true" />
                <div class="name-text"><span class="fname">{{ d.title }}</span><span class="sub">{{ d.kind }}</span></div>
              </div>
              <div class="td prog" :aria-label="`Step ${d.step} of 5`">
                <span class="bar"><span :style="{ width: `${d.step * 20}%` }" :class="{ full: d.step === 5 }" /></span>
                <span class="prog-t">{{ d.step === 5 ? 'Ready' : `${d.step}/5 · ${WIZARD_STEPS[d.step - 1]}` }}</span>
              </div>
              <span class="td date">{{ rel(d.edited) }}</span>
              <span class="td act always">
                <button v-if="d.step === 5" class="link-btn"><i class="pi pi-download" />Download</button>
                <NuxtLink :to="`/wizard?step=${d.step}`" class="link-btn">{{ d.step === 5 ? 'Open' : 'Continue' }}</NuxtLink>
              </span>
            </div>
          </div>
        </template>
      </div>
    </div>
    <PMenu ref="rowMenu" :model="menuItems" :popup="true" @hide="menuOpenId = null" />
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 1040px; margin: 0 auto; padding: 40px 0 80px; }

/* Header */
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
.titles { display: grid; gap: 4px; }
h1 { margin: 0; font: 600 28px/36px var(--fd-font-serif); letter-spacing: -.005em; color: var(--fd-ink); }
.lead { margin: 0; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }

/* Buttons: rectangular, quiet */
.btn {
  display: inline-flex; align-items: center; gap: 8px; height: 34px; padding: 0 12px; border-radius: 6px; flex-shrink: 0;
  border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; white-space: nowrap;
  font: 500 14px/20px var(--fd-font-sans); transition: background-color .12s, border-color .12s;
}
.btn .pi { font-size: 12px; }
.btn:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.btn.primary { border-color: transparent; background: var(--fd-accent); color: var(--fd-on-accent); }
.btn.primary:hover { background: var(--fd-accent-hover); }
.btn.ghost { border-color: transparent; background: transparent; color: var(--fd-muted); }
.btn.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.btn:focus-visible, .utab:focus-visible, .link-btn:focus-visible, .icon-act:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 1px; }

/* Toolbar: underline tabs */
.toolbar { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 24px 0 0; border-bottom: 1px solid var(--fd-line); }
.utabs { display: flex; gap: 20px; }
.utab {
  position: relative; display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 2px; border: 0; background: transparent;
  color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); transition: color .12s;
}
.utab:hover { color: var(--fd-ink); }
.utab.on { color: var(--fd-ink); }
.utab.on::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--fd-accent); }
.utab .n { color: var(--fd-muted); font-weight: 400; font-variant-numeric: tabular-nums; }
.tools { display: flex; align-items: center; gap: 6px; padding-bottom: 6px; }
.search { display: flex; align-items: center; gap: 8px; width: 240px; height: 32px; padding: 0 6px 0 10px; border-radius: 6px; cursor: text; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.search:focus-within { border-color: var(--fd-accent); }
.search > .pi { font-size: 12px; color: var(--fd-muted); }
.search input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 14px/20px var(--fd-font-sans); }
.search input::placeholder { color: var(--fd-muted); }
.search input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 4px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear .pi { font-size: 10px; }
.tools .btn.ghost { height: 32px; }

/* Table */
.table { margin-top: 0; }
.thead, .tr { display: grid; grid-template-columns: 32px minmax(0, 1fr) 220px 84px 96px 72px; align-items: center; gap: 12px; padding: 0 8px; }
.thead { height: 40px; border-bottom: 1px solid var(--fd-line); }
.th { color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .03em; text-transform: uppercase; }
.tr { min-height: 52px; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 55%, transparent); transition: background-color .1s; }
.tr:hover, .tr.menu-open { background: color-mix(in srgb, var(--fd-ink) 3%, transparent); }
.tr.sel { background: color-mix(in srgb, var(--fd-accent) 8%, transparent); }
.tr.skel { grid-template-columns: 32px 1fr; }
.thead.drafts, .tr.drafts { grid-template-columns: minmax(0, 1fr) 220px 96px 180px; padding-left: 12px; }

.check { position: relative; display: grid; place-items: center; width: 20px; height: 20px; cursor: pointer; }
.check input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
.check span { position: relative; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid color-mix(in srgb, var(--fd-muted) 75%, transparent); transition: opacity .1s, background-color .1s, border-color .1s; }
.check input:checked + span, .check input:indeterminate + span { background: var(--fd-accent); border-color: var(--fd-accent); }
.check input:checked + span::after { content: ''; width: 4px; height: 8px; margin-top: -2px; border: solid var(--fd-on-accent); border-width: 0 2px 2px 0; transform: rotate(45deg); }
.check input:indeterminate + span::after { content: ''; width: 8px; height: 2px; border-radius: 1px; background: var(--fd-on-accent); }
.check input:focus-visible + span { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
/* row checkboxes are always visible; hidden only while a file is still uploading */
.tr.uploading .check span { opacity: 0; }

.td { min-width: 0; }
.td.name { display: flex; align-items: center; gap: 12px; }
.ficon { flex-shrink: 0; width: 18px; font-size: 16px; text-align: center; color: var(--fd-muted); }
.name-text { display: grid; gap: 2px; min-width: 0; }
.fname { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans); }
.sub { display: none; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.tr.uploading .sub, .tr.drafts .sub { display: block; }
.progress { width: min(260px, 100%); height: 3px; margin: 2px 0; border-radius: 2px; background: var(--fd-line); overflow: hidden; }
.progress span { display: block; height: 100%; background: var(--fd-accent); transition: width .12s linear; }
.case-link { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); text-decoration: none; font: 400 14px/20px var(--fd-font-sans); }
.case-link:hover { color: var(--fd-accent-text); text-decoration: underline; text-underline-offset: 3px; }
.none { color: color-mix(in srgb, var(--fd-muted) 50%, transparent); }
.td.size, .td.date { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); font-variant-numeric: tabular-nums; white-space: nowrap; }
.td.act { display: flex; justify-content: flex-end; gap: 2px; opacity: 0; transition: opacity .1s; }
.tr:hover .td.act, .tr.menu-open .td.act, .tr:focus-within .td.act, .td.act.always { opacity: 1; }
.icon-act { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.icon-act:hover:not(:disabled) { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.icon-act:disabled { opacity: .3; cursor: default; }
.icon-act .pi { font-size: 13px; }

/* Bulk actions in the header */
.bulk { grid-column: 2 / -1; display: flex; align-items: center; gap: 4px; }
.bulk-n { margin-right: 12px; color: var(--fd-ink); font: 600 13px/18px var(--fd-font-sans); }
.link-btn { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 8px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-ink); cursor: pointer; text-decoration: none; font: 500 13px/18px var(--fd-font-sans); white-space: nowrap; }
.link-btn .pi { font-size: 12px; color: var(--fd-muted); }
.link-btn:hover { background: color-mix(in srgb, var(--fd-ink) 7%, transparent); }
.link-btn.danger, .link-btn.danger .pi { color: var(--fd-red); }
.link-btn.muted { color: var(--fd-muted); }

/* Drafts progress */
.td.prog { display: flex; align-items: center; gap: 10px; }
.bar { width: 64px; height: 4px; border-radius: 2px; background: var(--fd-line); overflow: hidden; flex-shrink: 0; }
.bar span { display: block; height: 100%; background: var(--fd-muted); }
.bar span.full { background: var(--fd-accent); }
.prog-t { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.foot { display: flex; align-items: center; gap: 8px; margin: 12px 0 0 8px; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.foot .pi { font-size: 10px; }

/* Empty / notices: plain, not decorative */
.empty { display: grid; justify-items: center; gap: 8px; padding: 64px 24px; text-align: center; border-bottom: 1px solid var(--fd-line); }
.empty > .pi { font-size: 28px; color: var(--fd-muted); margin-bottom: 4px; }
.empty h2 { margin: 0; color: var(--fd-ink); font: 600 16px/22px var(--fd-font-sans); }
.empty p { margin: 0 0 8px; max-width: 420px; color: var(--fd-muted); font: 400 14px/21px var(--fd-font-sans); text-wrap: balance; }
.notice { display: flex; align-items: center; gap: 12px; margin-top: 16px; padding: 12px 12px 12px 14px; border-radius: 6px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.notice > div { flex: 1; } .notice b { color: var(--fd-ink); font-weight: 600; }
.notice .pi { color: var(--fd-muted); }

@media (max-width: 1023px) {
  .page { padding: 0 24px; }
  .thead, .tr { grid-template-columns: 32px minmax(0, 1fr) 84px 72px; }
  .th.case, .td.case, .th.date, .td.date { display: none; }
  .thead.drafts, .tr.drafts { grid-template-columns: minmax(0, 1fr) 180px 160px; }
  .tr.drafts .td.date, .thead.drafts .th:nth-child(3) { display: none; }
}
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 64px; }
  .head { align-items: flex-start; }
  h1 { font-size: 24px; line-height: 32px; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 0; border-bottom: 0; }
  .utabs { border-bottom: 1px solid var(--fd-line); }
  .tools { padding: 10px 0 0; }
  .search { flex: 1; width: auto; }
  .thead, .tr { grid-template-columns: 28px minmax(0, 1fr) 64px; }
  .th.size, .td.size { display: none; }
  .sub { display: block; }
  .td.act { opacity: 1; }
  .thead.drafts { display: none; }
  .tr.drafts { grid-template-columns: minmax(0, 1fr); gap: 6px; padding: 12px; }
  .tr.drafts .td.act { justify-content: flex-start; }
}
</style>
