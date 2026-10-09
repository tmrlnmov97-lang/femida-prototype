<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { FILES, CASES, STUDIO_TYPES, STUDIO_RESULTS, SOURCES, type StudioKind } from '~/data/mock';

// Studio (live: /studio). Two clear choices on one page — 1. files, 2. material — and the action pinned to the bottom.
// The material opens on its own view: title, what it's based on, actions, the text with citations and its sources.
// Demo: ?state=loading | empty | error (creating fails once).
useHead({ title: 'Studio — Femida redesign prototype' });
const route = useRoute();
const { saveStudio } = useNotes();
const root = ref<HTMLElement>();

/* Screen state */
const phase = ref<'loading' | 'ready'>('loading');
const files = ref(FILES.map((f) => ({ ...f })));
onMounted(() => {
  const s = route.query.state;
  if (s === 'loading') return;
  setTimeout(() => { if (s === 'empty') files.value = []; phase.value = 'ready'; }, 400);
});

/* 1. Files */
const picked = ref<string[]>([]);
const caseName = (id?: string) => (id ? CASES.find((c) => c.id === id)?.name : undefined);
const isWord = (n: string) => /\.docx?$/i.test(n);
function toggle(id: string) { picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]; }
const allOn = computed(() => files.value.length > 0 && picked.value.length === files.value.length);
function toggleAll() { picked.value = allOn.value ? [] : files.value.map((f) => f.id); }
const pickedNames = computed(() => files.value.filter((f) => picked.value.includes(f.id)).map((f) => f.name));
// A short list keeps step 2 in view; the rest is one click away
const FEW = 5;
const showAll = ref(false);
const shownFiles = computed(() => (showAll.value ? files.value : files.value.slice(0, FEW)));

/* 2. Material */
const kind = ref<StudioKind | null>(null);
const type = computed(() => STUDIO_TYPES.find((t) => t.id === kind.value));
const canCreate = computed(() => picked.value.length > 0 && !!kind.value);
const footNote = computed(() => (!picked.value.length ? 'Choose at least one file above' : !kind.value ? 'Choose a material' : `${picked.value.length} ${picked.value.length === 1 ? 'file' : 'files'} · ${kind.value}`));

/* Result */
const view = ref<'pick' | 'result'>('pick');
const creating = ref(false);
const failed = ref(false);
let failOnce = route.query.state === 'error';
let timer: ReturnType<typeof setTimeout> | undefined;
onBeforeUnmount(() => clearTimeout(timer));
function create() {
  if (!canCreate.value) return;
  view.value = 'result'; creating.value = true; failed.value = false; savedId.value = null;
  nextTick(() => root.value?.scrollTo({ top: 0 }));
  timer = setTimeout(() => { creating.value = false; if (failOnce) { failOnce = false; failed.value = true; } }, 1500);
}
function back() { clearTimeout(timer); view.value = 'pick'; creating.value = false; nextTick(() => root.value?.scrollTo({ top: 0 })); }
const items = computed(() => (kind.value ? STUDIO_RESULTS[kind.value] : []));
const segs = (t: string) => t.replace(/ (\[\d+\])/g, '\u00A0$1').split(/(\[\d+\])/).filter(Boolean).map((p) => (/^\[\d+\]$/.test(p) ? { n: Number(p.slice(1, -1)) } : { t: p }));
const cited = computed(() => SOURCES.filter((s) => items.value.some((i) => i.text.includes(`[${s.n}]`))));
const activeSrc = ref<number | null>(null);

/* Actions under the material, same as under an answer */
const copied = ref(false);
function copy() { copied.value = true; setTimeout(() => (copied.value = false), 1500); }
const savedId = ref<string | null>(null);
function save() { if (savedId.value || !kind.value) return; savedId.value = saveStudio(kind.value, items.value, pickedNames.value); }
const downloaded = ref(false);
function download() { downloaded.value = true; setTimeout(() => (downloaded.value = false), 1500); }
</script>

<template>
  <AppShell>
    <div ref="root" class="scroll page">
      <!-- ========== Choose ========== -->
      <div v-if="view === 'pick'" class="wrap">
        <header class="head">
          <h1>Studio</h1>
          <p class="lead">Choose your files and get a ready material: a summary, memo, timeline and&nbsp;more.</p>
        </header>

        <!-- 1. Files -->
        <section class="sec" aria-labelledby="s-files">
          <div class="sec-head">
            <h2 id="s-files"><span class="n">1</span>Choose files</h2>
            <button v-if="phase === 'ready' && files.length" class="ghost sm" @click="toggleAll">{{ allOn ? 'Clear' : 'Select all' }}</button>
          </div>

          <div v-if="phase === 'loading'" class="card rows" aria-busy="true" aria-label="Loading files">
            <div v-for="i in 4" :key="i" class="row skel"><PSkeleton width="18px" height="18px" /><PSkeleton :width="`${40 + (i % 3) * 14}%`" height="14px" /></div>
          </div>
          <div v-else-if="!files.length" class="card empty">
            <span class="e-ic"><i class="pi pi-folder-open" /></span>
            <h3>No files yet</h3>
            <p>Upload them in Documents, then come back&nbsp;here.</p>
            <NuxtLink to="/documents" class="secondary">Go to Documents<i class="pi pi-arrow-right" /></NuxtLink>
          </div>
          <ul v-else class="card rows">
            <li v-for="f in shownFiles" :key="f.id">
              <label class="row" :class="{ on: picked.includes(f.id) }">
                <input type="checkbox" class="cb" :checked="picked.includes(f.id)" @change="toggle(f.id)" />
                <i class="fi" :class="isWord(f.name) ? 'pi pi-file-word' : 'pi pi-file-pdf'" />
                <span class="fname">{{ f.name }}</span>
                <span class="fmeta"><template v-if="caseName(f.caseId)">{{ caseName(f.caseId) }} · </template>{{ f.size }}</span>
              </label>
            </li>
            <li v-if="files.length > FEW" class="more-row">
              <button class="more" :aria-expanded="showAll" @click="showAll = !showAll">
                <i class="pi pi-angle-down" :class="{ up: showAll }" />{{ showAll ? 'Show fewer' : `Show all ${files.length} files` }}
              </button>
            </li>
          </ul>
        </section>

        <!-- 2. Material -->
        <section class="sec" aria-labelledby="s-kind">
          <div class="sec-head"><h2 id="s-kind"><span class="n">2</span>Choose a material</h2></div>
          <div class="kinds" role="radiogroup" aria-labelledby="s-kind">
            <button v-for="t in STUDIO_TYPES" :key="t.id" class="kind" :class="{ on: kind === t.id }" role="radio" :aria-checked="kind === t.id" @click="kind = t.id">
              <span class="ic"><i :class="t.icon" /></span>
              <b>{{ t.id }}</b>
              <span class="hint">{{ t.hint }}</span>
            </button>
          </div>
        </section>
      </div>

      <!-- ========== Result ========== -->
      <div v-else class="wrap">
        <button class="back" @click="back"><i class="pi pi-arrow-left" />Studio</button>
        <header class="r-head">
          <span class="r-ic"><i :class="type?.icon" /></span>
          <h1 :class="{ shimmer: creating }">{{ creating ? `Creating the ${kind!.toLowerCase()}…` : kind }}</h1>
        </header>
        <p class="based">Based on <span v-for="(n, i) in pickedNames" :key="n"><b>{{ n }}</b><template v-if="i < pickedNames.length - 1">, </template></span></p>

        <div v-if="creating" class="skel-body" aria-busy="true">
          <PSkeleton width="96%" height="15px" /><PSkeleton width="88%" height="15px" /><PSkeleton width="92%" height="15px" />
          <PSkeleton width="70%" height="15px" /><PSkeleton width="84%" height="15px" />
        </div>

        <div v-else-if="failed" class="card state" role="alert">
          <h3>Couldn’t create the material</h3>
          <p>This is temporary. Your files are&nbsp;safe.</p>
          <button class="secondary" @click="create"><i class="pi pi-refresh" />Try again</button>
        </div>

        <template v-else>
          <article class="material" :class="type?.layout">
            <template v-for="(it, i) in items" :key="i">
              <!-- sections / terms / timeline: label + text; paras / list / numbered: text only -->
              <div class="item">
                <span v-if="type?.layout === 'numbered'" class="num">{{ i + 1 }}</span>
                <span v-else-if="type?.layout === 'list'" class="bullet" />
                <span v-else-if="type?.layout === 'timeline'" class="tl-dot" />
                <div class="item-body">
                  <span v-if="it.label" class="label">{{ it.label }}</span>
                  <p><template v-for="(s, k) in segs(it.text)" :key="k"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" :aria-label="`Source ${s.n}`" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
                </div>
              </div>
            </template>
          </article>

          <div class="actions">
            <button class="act" @click="copy"><i class="pi" :class="copied ? 'pi-check' : 'pi-copy'" />{{ copied ? 'Copied' : 'Copy' }}</button>
            <button class="act" :class="{ on: savedId }" @click="save"><i class="pi" :class="savedId ? 'pi-bookmark-fill' : 'pi-bookmark'" />{{ savedId ? 'Saved to notes' : 'Save to notes' }}</button>
            <NuxtLink v-if="savedId" :to="`/notes/${savedId}`" class="act">Open note<i class="pi pi-arrow-right" /></NuxtLink>
            <button class="act" @click="download"><i class="pi" :class="downloaded ? 'pi-check' : 'pi-file-word'" />{{ downloaded ? 'Downloaded' : 'Download Word' }}</button>
          </div>

          <section v-if="cited.length" class="sources" aria-labelledby="src-h">
            <h2 id="src-h">Sources</h2>
            <ol>
              <li v-for="s in cited" :key="s.n" :class="{ hl: activeSrc === s.n }" @click="activeSrc = s.n">
                <span class="sn">{{ s.n }}</span><span class="st"><b>{{ s.title }}</b><span>{{ s.kind }} · {{ s.ref }}</span></span>
              </li>
            </ol>
          </section>
        </template>
      </div>

      <!-- Always in view: what you've chosen and the one action -->
      <footer class="foot">
        <div class="foot-in">
          <template v-if="view === 'pick'">
            <span class="note" :class="{ ready: canCreate }">{{ footNote }}</span>
            <button class="primary" :disabled="!canCreate" @click="create">{{ kind ? `Create ${kind.toLowerCase()}` : 'Create' }}<i class="pi pi-arrow-right" /></button>
          </template>
          <template v-else>
            <span class="note">{{ creating ? 'Takes a few seconds' : failed ? '' : `Ready · based on ${pickedNames.length} ${pickedNames.length === 1 ? 'file' : 'files'}` }}</span>
            <button class="secondary" @click="back"><i class="pi pi-plus" />Create another</button>
          </template>
        </div>
      </footer>
    </div>
  </AppShell>
</template>

<style scoped>
/* Same frame and scale as Work plan / Document wizard: 760 column · H1 32 serif · section 18/600 · body 15 · meta 13 */
.page { flex: 1; display: flex; flex-direction: column; }
.wrap { flex: 1; width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 40px; }
.head { display: grid; gap: 8px; margin-bottom: 40px; }
h1 { margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; }
.lead { margin: 0; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }

.sec + .sec { margin-top: 40px; }
.sec-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
h2 { display: flex; align-items: center; gap: 12px; margin: 0; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
h2 .n { display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }

/* Files */
.card { margin: 0; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); overflow: hidden; }
.rows { padding: 0; list-style: none; }
.rows li + li, .row.skel + .row.skel { border-top: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.row { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 16px; cursor: pointer; transition: background-color .12s; }
.row:hover { background: color-mix(in srgb, var(--fd-ink) 3%, transparent); }
.row.on { background: color-mix(in srgb, var(--fd-accent-soft) 35%, transparent); }
.row.skel { cursor: default; }
.cb { flex-shrink: 0; width: 18px; height: 18px; margin: 0; accent-color: var(--fd-accent); cursor: pointer; }
.fi { color: var(--fd-muted); font-size: 15px; }
.fname { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.fmeta { flex-shrink: 0; max-width: 45%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.more-row { padding: 4px 8px; }
.more { display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 8px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.more:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.more .pi { font-size: 12px; transition: transform .15s; } .more .pi.up { transform: rotate(180deg); }
.empty { display: grid; justify-items: center; gap: 4px; padding: 40px 24px; text-align: center; }
.e-ic { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 8px; border-radius: 50%; background: var(--fd-panel-2); color: var(--fd-muted); }
.empty h3, .state h3 { margin: 0; color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.empty p, .state p { margin: 0 0 12px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }

/* Material cards */
.kinds { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.kind { display: grid; align-content: start; justify-items: start; gap: 4px; min-height: 120px; padding: 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; text-align: left; transition: border-color .15s, background-color .15s; }
.kind:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.kind.on { border-color: var(--fd-accent); background: color-mix(in srgb, var(--fd-accent-soft) 45%, var(--fd-panel)); }
.ic { display: grid; place-items: center; width: 32px; height: 32px; margin-bottom: 8px; border-radius: 8px; background: var(--fd-panel-2); color: var(--fd-muted); }
.kind.on .ic { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.ic .pi { font-size: 14px; }
.kind b { font: 600 15px/22px var(--fd-font-sans); }
.kind .hint { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); text-wrap: pretty; }

/* Result */
.back { display: inline-flex; align-items: center; gap: 8px; height: 32px; margin: -16px 0 24px -10px; padding: 0 10px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.back:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.back .pi { font-size: 12px; }
.r-head { display: flex; align-items: center; gap: 12px; }
.r-ic { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.r-ic .pi { font-size: 16px; }
.r-head h1 { font-size: 28px; line-height: 36px; }
.based { margin: 12px 0 32px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }
.based b { color: var(--fd-ink); font-weight: 500; }
.skel-body { display: grid; gap: 14px; }

.material { display: grid; gap: 20px; }
.item { display: flex; gap: 14px; }
.item-body { display: grid; gap: 4px; min-width: 0; }
.item p { margin: 0; color: var(--fd-ink); font: 400 16px/27px var(--fd-font-sans); text-wrap: pretty; }
.label { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.sections .label, .timeline .label { color: var(--fd-muted); font: 600 12px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.terms .item { padding-bottom: 20px; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.terms .item:last-child { padding-bottom: 0; border-bottom: 0; }
.num { display: grid; place-items: center; flex-shrink: 0; width: 26px; height: 26px; margin-top: 1px; border-radius: 50%; border: 1px solid var(--fd-line); color: var(--fd-muted); font: 600 13px/1 var(--fd-font-sans); }
.bullet { flex-shrink: 0; width: 6px; height: 6px; margin: 11px 4px 0; border-radius: 50%; background: var(--fd-amber); }
.timeline { position: relative; gap: 24px; }
.timeline::before { content: ''; position: absolute; left: 5px; top: 8px; bottom: 8px; width: 1px; background: var(--fd-line); }
.tl-dot { position: relative; flex-shrink: 0; width: 11px; height: 11px; margin-top: 3px; border-radius: 50%; border: 2px solid var(--fd-accent); background: var(--fd-bg); }
.cite { display: inline-grid; place-items: center; min-width: 20px; height: 20px; margin: 0 2px; padding: 0 5px; border: 0; border-radius: 5px; background: var(--fd-accent-soft); color: var(--fd-accent-text); cursor: pointer; vertical-align: 2px; font: 600 12px/1 var(--fd-font-sans); }
.cite:hover, .cite.active { background: var(--fd-accent); color: var(--fd-on-accent); }

.actions { display: flex; flex-wrap: wrap; gap: 4px; margin: 24px 0 32px -10px; }
.act { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--fd-muted); cursor: pointer; text-decoration: none; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, color .15s; }
.act .pi { font-size: 13px; }
.act:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); color: var(--fd-ink); }
.act.on { color: var(--fd-accent-text); }

.sources { padding-top: 20px; border-top: 1px solid var(--fd-line); }
.sources h2 { margin-bottom: 12px; color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.sources ol { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.sources li { display: flex; align-items: flex-start; gap: 12px; margin: 0 -8px; padding: 8px; border-radius: 8px; cursor: pointer; }
.sources li:hover, .sources li.hl { background: color-mix(in srgb, var(--fd-accent) 7%, transparent); }
.sn { display: grid; place-items: center; flex-shrink: 0; min-width: 20px; height: 20px; margin-top: 1px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.st { display: grid; gap: 2px; }
.st b { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.st span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.state { display: grid; justify-items: center; gap: 4px; padding: 32px 24px; text-align: center; }

/* Buttons */
.primary, .secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; text-decoration: none; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, opacity .15s; }
.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .4; cursor: default; }
.secondary { border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.primary .pi, .secondary .pi { font-size: 12px; }
.ghost { border: 0; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 13px/18px var(--fd-font-sans); }
.ghost.sm { height: 28px; margin-right: -10px; padding: 0 10px; border-radius: 8px; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.primary:focus-visible, .secondary:focus-visible, .kind:focus-visible, .act:focus-visible, .back:focus-visible, .cite:focus-visible, .ghost:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* Pinned footer */
.foot { position: sticky; bottom: 0; z-index: 2; border-top: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-bg) 92%, transparent); backdrop-filter: blur(8px); }
.foot-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; max-width: 760px; margin: 0 auto; padding: 12px 0; }
.note { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.note.ready { color: var(--fd-ink); font-weight: 500; }

.shimmer { background: linear-gradient(90deg, var(--fd-muted) 0%, var(--fd-ink) 50%, var(--fd-muted) 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 1.6s linear infinite; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 1023px) { .wrap, .foot-in { padding-left: 24px; padding-right: 24px; max-width: 808px; } .kinds { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 767px) {
  .wrap { padding: 24px 16px 32px; }
  .foot-in { padding: 12px 16px; }
  .head { margin-bottom: 28px; }
  h1 { font-size: 26px; line-height: 34px; }
  .r-head h1 { font-size: 22px; line-height: 30px; }
  .lead { font-size: 15px; line-height: 24px; }
  .kinds { grid-template-columns: 1fr 1fr; gap: 8px; }
  .kind { min-height: 0; }
  .fmeta { display: none; }
  .foot-in .primary { flex: 1; }
  .note:not(.ready) { flex: 1; }
}
</style>
