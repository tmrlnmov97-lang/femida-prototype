<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { WIZARD_STEPS, WIZARD_TYPES, WIZARD_ANALYSIS, WIZARD_FACTS, WIZARD_GROUNDS, SOURCES, FILES } from '~/data/mock';

// Document wizard (live: /wizard, 5 steps). One step on screen at a time, the five steps as one quiet row on top,
// Back / Continue pinned to the bottom so the next action is always in view. Demo: ?step=1..5 · ?state=error (analysis fails once).
useHead({ title: 'Document wizard — Femida redesign prototype' });
const route = useRoute();

const step = ref(1);
const reached = ref(1);
const root = ref<HTMLElement>();

/* 1. Type */
const type = ref('appeal');
const caseName = ref('');
const desc = ref('');
const typeDoc = computed(() => WIZARD_TYPES.find((t) => t.id === type.value)!.doc);

/* 2. Source */
interface Pick { id: string; name: string; meta: string; uploading?: number }
const library = ref<Pick[]>(FILES.slice(0, 5).map((f) => ({ id: f.id, name: f.name, meta: `${f.size} · ${f.date}` })));
const picked = ref<string[]>([]);
const isWord = (n: string) => /\.docx?$/i.test(n);
function togglePick(id: string) { picked.value = picked.value.includes(id) ? picked.value.filter((x) => x !== id) : [...picked.value, id]; analysed.value = false; generated.value = false; }
let upTimer: ReturnType<typeof setInterval> | undefined;
function upload() {
  const f: Pick = { id: `u${Date.now()}`, name: 'Judgment_first_instance.pdf', meta: '1.2 MB · Just now', uploading: 0 };
  library.value.unshift(f); picked.value.push(f.id); analysed.value = false; generated.value = false;
  clearInterval(upTimer);
  upTimer = setInterval(() => { const x = library.value.find((l) => l.id === f.id); if (!x) return clearInterval(upTimer); x.uploading = Math.min(100, (x.uploading ?? 0) + 20); if (x.uploading >= 100) { delete x.uploading; clearInterval(upTimer); } }, 180);
}
const dragOver = ref(false);
function onDrop() { dragOver.value = false; upload(); }
const pickedFiles = computed(() => library.value.filter((l) => picked.value.includes(l.id)));

/* 3. Analysis — runs by itself when you reach the step */
const analysed = ref(false);
const analysing = ref(false);
const analysisDone = ref(0);
const analysisError = ref(false);
let failOnce = route.query.state === 'error';
let aTimer: ReturnType<typeof setInterval> | undefined;
function runAnalysis() {
  clearInterval(aTimer); analysisError.value = false; analysing.value = true; analysisDone.value = 0;
  aTimer = setInterval(() => {
    analysisDone.value++;
    if (failOnce && analysisDone.value === 2) { clearInterval(aTimer); failOnce = false; analysing.value = false; analysisError.value = true; return; }
    if (analysisDone.value >= WIZARD_ANALYSIS.length) { clearInterval(aTimer); analysing.value = false; analysed.value = true; }
  }, 650);
}
const shortSrc = (n: number) => { const s = SOURCES.find((x) => x.n === n)!; return `${s.title.replace(' of the Republic of Armenia', '')} · ${s.ref}`; };

/* 4. Grounds */
const grounds = ref(WIZARD_GROUNDS.map((g) => ({ ...g, on: true, own: false })));
const ownDraft = ref('');
function addOwn() { const t = ownDraft.value.trim(); if (!t) return; grounds.value.push({ text: t, cites: [], on: true, own: true }); ownDraft.value = ''; generated.value = false; }
const keptGrounds = computed(() => grounds.value.filter((g) => g.on));

/* 5. Document — drafted when you reach the step */
const generated = ref(false);
const generating = ref(false);
let gTimer: ReturnType<typeof setTimeout> | undefined;
function runGenerate() { clearTimeout(gTimer); generating.value = true; gTimer = setTimeout(() => { generating.value = false; generated.value = true; }, 1600); }
const downloaded = ref<'' | 'word' | 'pdf'>('');
function download(k: 'word' | 'pdf') { downloaded.value = k; setTimeout(() => (downloaded.value = ''), 1600); }

onBeforeUnmount(() => { clearInterval(upTimer); clearInterval(aTimer); clearTimeout(gTimer); });

/* Navigation */
function go(n: number) {
  if (n < 1 || n > 5 || n > reached.value) return;
  step.value = n;
  if (n === 3 && !analysed.value && !analysing.value) runAnalysis();
  if (n === 5 && !generated.value && !generating.value) runGenerate();
  nextTick(() => root.value?.scrollTo({ top: 0, behavior: 'smooth' }));
}
function next() { if (!canNext.value) return; reached.value = Math.max(reached.value, step.value + 1); go(step.value + 1); }
function restart() { step.value = 1; reached.value = 1; type.value = 'appeal'; caseName.value = ''; desc.value = ''; picked.value = []; analysed.value = false; generated.value = false; grounds.value = WIZARD_GROUNDS.map((g) => ({ ...g, on: true, own: false })); }

const canNext = computed(() => (step.value === 1 ? !!desc.value.trim() : step.value === 2 ? !library.value.some((l) => picked.value.includes(l.id) && l.uploading !== undefined) : step.value === 3 ? analysed.value : step.value === 4 ? keptGrounds.value.length > 0 : false));
const nextLabel = computed(() => (step.value === 4 ? 'Draft the document' : step.value === 2 && !picked.value.length ? 'Continue without files' : 'Continue'));
const footNote = computed(() => {
  if (step.value === 1 && !desc.value.trim()) return 'Describe what you need to continue';
  if (step.value === 2 && !canNext.value) return 'Wait for the upload to finish';
  if (step.value === 3 && analysing.value) return 'Analysing — this takes a few seconds';
  if (step.value === 3 && analysisError.value) return 'Try the analysis again to continue';
  if (step.value === 4 && !keptGrounds.value.length) return 'Keep at least one ground';
  return '';
});

/* Demo deep links: ?step=N opens a filled wizard on that step (used by "Continue" on a draft in Documents) */
onMounted(() => {
  const n = Number(route.query.step);
  if (n >= 2 && n <= 5) {
    caseName.value = 'Avagyan v. Poghosyan';
    desc.value = 'An appeal against a first-instance judgment on the ground of incorrect assessment of evidence.';
    picked.value = [library.value[0].id];
    if (n > 3) analysed.value = true;
    reached.value = n; go(n);
  }
});
</script>

<template>
  <AppShell>
    <div ref="root" class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>Document wizard</h1>
          <p class="lead">Step by step, from a description to a finished&nbsp;document.</p>
          <ol class="flow" aria-label="Steps">
            <li v-for="(s, i) in WIZARD_STEPS" :key="s" :class="{ on: step === i + 1, ok: i + 1 < reached && step !== i + 1 }">
              <button v-if="i + 1 <= reached && step !== i + 1" class="flow-btn" @click="go(i + 1)">
                <span class="n"><i v-if="i + 1 < reached" class="pi pi-check" /><template v-else>{{ i + 1 }}</template></span><span class="lbl">{{ s }}</span>
              </button>
              <span v-else class="flow-btn" :aria-current="step === i + 1 ? 'step' : undefined"><span class="n">{{ i + 1 }}</span><span class="lbl">{{ s }}</span></span>
            </li>
          </ol>
        </header>

        <!-- 1. Type -->
        <section v-if="step === 1" class="step" aria-labelledby="s1">
          <h2 id="s1">What are you drafting?</h2>
          <p class="sub">Choose the type and describe the task in a few&nbsp;sentences.</p>

          <div class="field">
            <span class="label" id="type-label">Document type</span>
            <div class="types" role="radiogroup" aria-labelledby="type-label">
              <button v-for="t in WIZARD_TYPES" :key="t.id" class="type" :class="{ on: type === t.id }" role="radio" :aria-checked="type === t.id" @click="type = t.id; generated = false">
                <span class="ic"><i :class="t.icon" /></span>
                <span class="tt"><b>{{ t.label }}</b><span>{{ t.hint }}</span></span>
                <span class="radio" />
              </button>
            </div>
          </div>
          <label class="field">
            <span class="label">Case name <span class="opt">Optional</span></span>
            <input v-model="caseName" class="input" placeholder="E.g. “Avagyan v. Poghosyan”" @input="generated = false" />
          </label>
          <label class="field">
            <span class="label">Briefly describe what you need</span>
            <textarea v-model="desc" class="input area" rows="5" placeholder="E.g. an appeal against a first-instance judgment on the ground of incorrect assessment of evidence…" @input="generated = false" />
          </label>
        </section>

        <!-- 2. Source -->
        <section v-else-if="step === 2" class="step" aria-labelledby="s2">
          <h2 id="s2">Add the source</h2>
          <p class="sub">The judgment, contract or letters the document should rely on. You can skip this&nbsp;step.</p>

          <div class="drop" :class="{ over: dragOver }" @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="onDrop">
            <span class="drop-ic"><i class="pi pi-upload" /></span>
            <p class="drop-t">Drop files here or <button class="link" @click="upload">choose files</button></p>
            <p class="drop-m">PDF or Word · Up to 25&nbsp;MB · encrypted</p>
          </div>

          <div class="field">
            <span class="label">From your Documents<span v-if="picked.length" class="count">{{ picked.length }} selected</span></span>
            <ul class="card rows">
              <li v-for="f in library" :key="f.id">
                <label class="row-pick" :class="{ on: picked.includes(f.id) }">
                  <input type="checkbox" class="cb" :checked="picked.includes(f.id)" @change="togglePick(f.id)" />
                  <i class="fi" :class="isWord(f.name) ? 'pi pi-file-word' : 'pi pi-file-pdf'" />
                  <span class="fname">{{ f.name }}</span>
                  <span v-if="f.uploading !== undefined" class="up"><span class="up-bar"><span :style="{ width: `${f.uploading}%` }" /></span>Uploading…</span>
                  <span v-else class="fmeta">{{ f.meta }}</span>
                </label>
              </li>
            </ul>
          </div>
        </section>

        <!-- 3. Analysis -->
        <section v-else-if="step === 3" class="step" aria-labelledby="s3">
          <h2 id="s3" :class="{ shimmer: analysing }">{{ analysing ? 'Analysing…' : analysisError ? 'Analysis' : 'What Femida found' }}</h2>
          <p class="sub">{{ analysing ? 'Femida reads your files and checks the law and court practice.' : 'Check it before choosing the grounds. Every point links to its&nbsp;source.' }}</p>

          <div v-if="analysisError" class="card state" role="alert">
            <h3>Couldn’t finish the analysis</h3>
            <p>This is temporary. Your description and files are&nbsp;saved.</p>
            <button class="secondary" @click="runAnalysis"><i class="pi pi-refresh" />Try again</button>
          </div>
          <ol v-else-if="analysing" class="card progress" aria-live="polite">
            <li v-for="(a, i) in WIZARD_ANALYSIS" :key="a" :class="{ ok: i < analysisDone, run: i === analysisDone }">
              <span class="si"><i v-if="i < analysisDone" class="pi pi-check" /><span v-else-if="i === analysisDone" class="pulse" /><span v-else class="dot" /></span>{{ a }}
            </li>
          </ol>
          <div v-else class="card found">
            <div class="blk">
              <h3>Key facts</h3>
              <ul class="facts"><li v-for="f in WIZARD_FACTS" :key="f">{{ f }}</li></ul>
            </div>
            <div class="blk">
              <h3>Applicable law and practice</h3>
              <ol class="srcs">
                <li v-for="s in SOURCES" :key="s.n"><span class="sn">{{ s.n }}</span><span class="st"><b>{{ s.title }}</b><span>{{ s.kind }} · {{ s.ref }}</span></span></li>
              </ol>
            </div>
          </div>
        </section>

        <!-- 4. Grounds -->
        <section v-else-if="step === 4" class="step" aria-labelledby="s4">
          <h2 id="s4">Choose the grounds</h2>
          <p class="sub">Proposed from the analysis. Keep the ones the document should argue, or add your&nbsp;own.</p>

          <ul class="card rows grounds">
            <li v-for="(g, i) in grounds" :key="i">
              <label class="row-pick top" :class="{ on: g.on }">
                <input v-model="g.on" type="checkbox" class="cb" @change="generated = false" />
                <span class="g">
                  <span class="gt">{{ g.text }}</span>
                  <span class="cites">
                    <span v-for="c in g.cites" :key="c" class="cite" :title="shortSrc(c)"><b>{{ c }}</b><span class="ct">{{ shortSrc(c) }}</span></span>
                    <span v-if="g.own" class="cite own">Your ground — add a source in the&nbsp;text</span>
                  </span>
                </span>
              </label>
            </li>
            <li class="add-row">
              <i class="pi pi-plus" />
              <input v-model="ownDraft" placeholder="Add your own ground" aria-label="Add your own ground" @keydown.enter.prevent="addOwn" />
              <button v-if="ownDraft.trim()" class="secondary sm" @click="addOwn">Add</button>
            </li>
          </ul>
        </section>

        <!-- 5. Document -->
        <section v-else class="step" aria-labelledby="s5">
          <h2 id="s5" :class="{ shimmer: generating }">{{ generating ? 'Drafting the document…' : 'Your document is ready' }}</h2>
          <p class="sub">{{ generating ? 'It takes a few seconds.' : 'Check the text, then download it. Word to edit, PDF to&nbsp;file.' }}</p>

          <div v-if="generating" class="paper skel" aria-busy="true">
            <PSkeleton width="46%" height="22px" class="c" /><PSkeleton width="30%" height="14px" class="c" />
            <PSkeleton width="100%" height="14px" /><PSkeleton width="94%" height="14px" /><PSkeleton width="88%" height="14px" />
            <PSkeleton width="100%" height="14px" /><PSkeleton width="72%" height="14px" />
          </div>
          <template v-else>
            <div class="actions">
              <button class="primary" @click="download('word')"><i class="pi" :class="downloaded === 'word' ? 'pi-check' : 'pi-file-word'" />{{ downloaded === 'word' ? 'Downloaded' : 'Download Word' }}</button>
              <button class="secondary" @click="download('pdf')"><i class="pi" :class="downloaded === 'pdf' ? 'pi-check' : 'pi-file-pdf'" />{{ downloaded === 'pdf' ? 'Downloaded' : 'Download PDF' }}</button>
            </div>

            <article class="paper" aria-label="Document preview">
              <div class="to">
                <span>To: [{{ type === 'opinion' ? 'Client' : 'Court name' }}]</span>
                <span>From: [Your details from Account]</span>
              </div>
              <h3 class="doc-title">{{ typeDoc }}</h3>
              <p class="doc-case">{{ caseName.trim() || 'Avagyan v. Poghosyan' }}</p>

              <h4>Facts</h4>
              <p v-for="f in WIZARD_FACTS" :key="f" class="dp">{{ f }}</p>
              <h4>Grounds</h4>
              <ol class="dl">
                <li v-for="(g, i) in keptGrounds" :key="i">{{ g.text }} <span v-for="c in g.cites" :key="c" class="dc">{{ c }}</span></li>
              </ol>
              <h4>{{ type === 'opinion' ? 'Conclusion' : 'Request' }}</h4>
              <p class="dp">{{ type === 'opinion' ? 'The missed deadline can be restored if the hospital stay is confirmed by medical records.' : 'Restore the missed deadline for contesting the dismissal.' }} <span class="dc">2</span></p>
              <template v-if="pickedFiles.length">
                <h4>Attachments</h4>
                <ol class="dl"><li v-for="f in pickedFiles" :key="f.id">{{ f.name }}</li></ol>
              </template>
            </article>
          </template>
        </section>
      </div>

      <!-- Always in view: where you are, why you can't go on (if so), Back / Continue -->
      <footer class="foot">
        <div class="foot-in">
          <span class="note" :class="{ warn: footNote }">
            <template v-if="footNote">{{ footNote }}</template>
            <template v-else-if="step === 5 && generated"><i class="pi pi-check" />Saved to <NuxtLink to="/documents" class="a">Documents</NuxtLink></template>
            <template v-else>Step {{ step }} of 5<template v-if="reached > 1"> · <i class="pi pi-check" />Draft saved</template></template>
          </span>
          <div class="btns">
            <button v-if="step > 1" class="secondary" @click="go(step - 1)"><i class="pi pi-arrow-left" />Back</button>
            <button v-if="step < 5" class="primary" :disabled="!canNext" @click="next">{{ nextLabel }}<i class="pi pi-arrow-right" /></button>
            <button v-else class="secondary" @click="restart"><i class="pi pi-plus" />New document</button>
          </div>
        </div>
      </footer>
    </div>
  </AppShell>
</template>

<style scoped>
/* Same frame and text scale as Work plan: 760 column · H1 32 serif · step 18/600 · body 15 · secondary 14 · meta 13 · 8px grid */
.page { flex: 1; display: flex; flex-direction: column; }
.wrap { flex: 1; width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 40px; }
.head { display: grid; gap: 8px; margin-bottom: 40px; }
h1 { margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; }
.lead { margin: 0; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }

/* Steps row (as on Work plan); finished steps are buttons to go back */
.flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin: 12px 0 0; padding: 0; list-style: none; }
.flow li { display: inline-flex; align-items: center; gap: 12px; }
.flow li + li::before { content: ''; width: 24px; height: 1px; background: var(--fd-line); }
.flow-btn { display: inline-flex; align-items: center; gap: 8px; height: 28px; margin: 0 -6px; padding: 0 6px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
button.flow-btn { cursor: pointer; }
button.flow-btn:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.flow .n { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--fd-line); font: 600 11px/1 var(--fd-font-sans); }
.flow .n .pi { font-size: 9px; }
.flow li.on .flow-btn { color: var(--fd-ink); }
.flow li.on .n { border-color: transparent; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.flow li.ok .n { border-color: transparent; background: var(--fd-accent); color: var(--fd-on-accent); }

/* Step */
h2 { margin: 0; color: var(--fd-ink); font: 600 20px/28px var(--fd-font-sans); }
.sub { margin: 4px 0 0; max-width: 600px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: pretty; }
.field { display: grid; gap: 8px; margin-top: 24px; }
.label { display: flex; align-items: baseline; gap: 8px; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.label .opt, .label .count { color: var(--fd-muted); font-weight: 400; font-size: 13px; }
.label .count { margin-left: auto; }
.input { width: 100%; height: 48px; padding: 0 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
.input.area { height: auto; min-height: 136px; padding: 12px 16px; resize: vertical; line-height: 24px; }
.input::placeholder { color: var(--fd-muted); }
.input:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }

/* 1. Type cards */
.types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.type { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; text-align: left; transition: border-color .15s, background-color .15s; }
.type:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.type.on { border-color: var(--fd-accent); background: color-mix(in srgb, var(--fd-accent-soft) 45%, var(--fd-panel)); }
.ic { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px; background: var(--fd-panel-2); color: var(--fd-muted); }
.type.on .ic { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.ic .pi { font-size: 14px; }
.tt { display: grid; gap: 2px; min-width: 0; }
.tt b { font: 600 15px/22px var(--fd-font-sans); }
.tt span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.radio { position: absolute; top: 16px; right: 16px; width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid var(--fd-line); }
.type.on .radio { border: 5px solid var(--fd-accent); }

/* 2. Source */
.drop { display: grid; justify-items: center; gap: 4px; margin-top: 24px; padding: 32px 24px; border-radius: 16px; border: 1px dashed color-mix(in srgb, var(--fd-ink) 22%, transparent); text-align: center; transition: border-color .15s, background-color .15s; }
.drop.over { border-color: var(--fd-accent); background: var(--fd-accent-soft); }
.drop-ic { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 8px; border-radius: 50%; background: var(--fd-panel-2); color: var(--fd-muted); }
.drop-t { margin: 0; color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.drop-m { margin: 0; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.link { padding: 0; border: 0; background: none; color: var(--fd-accent-text); cursor: pointer; font: inherit; text-decoration: underline; text-underline-offset: 3px; }

.card { margin: 0; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); overflow: hidden; }
.rows { padding: 0; list-style: none; }
.rows li + li { border-top: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.row-pick { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 16px; cursor: pointer; transition: background-color .12s; }
.row-pick.top { align-items: flex-start; padding-top: 16px; padding-bottom: 16px; }
.row-pick:hover { background: color-mix(in srgb, var(--fd-ink) 3%, transparent); }
.cb { flex-shrink: 0; width: 18px; height: 18px; margin: 0; accent-color: var(--fd-accent); cursor: pointer; }
.row-pick.top .cb { margin-top: 2px; }
.fi { color: var(--fd-muted); font-size: 15px; }
.fname { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.fmeta { flex-shrink: 0; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.up { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.up-bar { width: 64px; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--fd-ink) 10%, transparent); overflow: hidden; }
.up-bar span { display: block; height: 100%; background: var(--fd-accent); transition: width .18s; }

/* 3. Analysis */
.step > .card { margin-top: 24px; }
.progress { padding: 8px 20px; list-style: none; }
.progress li { display: flex; align-items: center; gap: 12px; min-height: 48px; color: color-mix(in srgb, var(--fd-ink) 70%, transparent); font: 400 15px/22px var(--fd-font-sans); }
.progress li + li { border-top: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.progress li.ok { color: var(--fd-muted); }
.progress li.run { color: var(--fd-ink); font-weight: 500; }
.si { display: grid; place-items: center; width: 20px; color: var(--fd-accent-text); }
.si .pi { font-size: 12px; }
.si .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--fd-line); }
.pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--fd-accent); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 50% { transform: scale(.6); opacity: .5; } }
.found .blk { padding: 20px; }
.found .blk + .blk { border-top: 1px solid var(--fd-line); }
h3 { margin: 0 0 12px; color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.facts { display: grid; gap: 8px; margin: 0; padding-left: 20px; color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.srcs { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.srcs li { display: flex; align-items: flex-start; gap: 12px; }
.sn { display: grid; place-items: center; flex-shrink: 0; min-width: 20px; height: 20px; margin-top: 1px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.st { display: grid; gap: 2px; }
.st b { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.st span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.state { display: grid; justify-items: center; gap: 4px; padding: 32px 24px; text-align: center; }
.state h3 { margin: 0; }
.state p { margin: 0 0 12px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }

/* 4. Grounds */
.grounds { margin-top: 24px; }
.g { display: grid; gap: 8px; min-width: 0; }
.gt { color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); text-wrap: pretty; }
.row-pick:not(.on) .gt { color: var(--fd-muted); }
.cites { display: flex; flex-wrap: wrap; gap: 6px; }
.cite { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; height: 24px; padding: 0 8px 0 4px; border-radius: 6px; background: var(--fd-panel-2); color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.cite b { display: grid; place-items: center; min-width: 16px; height: 16px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 11px/1 var(--fd-font-sans); }
.cite.own { padding-left: 8px; }
.ct { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.cite b { flex-shrink: 0; }
.add-row { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 4px 8px 4px 16px; }
.add-row > .pi { width: 18px; color: var(--fd-muted); font-size: 12px; text-align: center; }
.add-row input { flex: 1; min-width: 0; height: 40px; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }
.add-row input::placeholder { color: var(--fd-muted); }

/* 5. Document */
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
.paper { display: grid; gap: 0; margin-top: 16px; padding: 48px 56px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.paper.skel { gap: 14px; margin-top: 24px; }
.paper.skel .c { justify-self: center; }
.to { display: grid; justify-items: end; gap: 2px; margin-bottom: 32px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }
.doc-title { margin: 0; text-align: center; font: 600 22px/30px var(--fd-font-serif); }
.doc-case { margin: 4px 0 24px; text-align: center; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }
.paper h4 { margin: 20px 0 8px; font: 600 15px/22px var(--fd-font-sans); }
.dp { margin: 0 0 8px; font: 400 15px/26px var(--fd-font-sans); }
.dl { margin: 0; padding-left: 20px; font: 400 15px/26px var(--fd-font-sans); }
.dl li + li { margin-top: 6px; }
.dc { display: inline-grid; place-items: center; min-width: 18px; height: 18px; margin-left: 2px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 11px/1 var(--fd-font-sans); vertical-align: 2px; }
.a { color: var(--fd-ink); text-decoration: underline; text-decoration-color: var(--fd-line); text-underline-offset: 3px; }

/* Buttons */
.primary, .secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, opacity .15s; }
.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .4; cursor: default; }
.secondary { border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.secondary.sm { height: 32px; padding: 0 12px; font-size: 13px; }
.primary .pi, .secondary .pi { font-size: 12px; }
.primary:focus-visible, .secondary:focus-visible, .type:focus-visible, button.flow-btn:focus-visible, .link:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* Pinned footer */
.foot { position: sticky; bottom: 0; z-index: 2; border-top: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-bg) 92%, transparent); backdrop-filter: blur(8px); }
.foot-in { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; max-width: 760px; margin: 0 auto; padding: 12px 0; }
.note { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.note .pi { font-size: 11px; color: var(--fd-accent-text); }
.note.warn { color: var(--fd-ink); }
.btns { display: flex; gap: 8px; }

.shimmer { background: linear-gradient(90deg, var(--fd-muted) 0%, var(--fd-ink) 50%, var(--fd-muted) 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: shimmer 1.6s linear infinite; }
@keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

@media (max-width: 1023px) { .wrap, .foot-in { padding-left: 24px; padding-right: 24px; max-width: 808px; } }
@media (max-width: 767px) {
  .wrap { padding: 24px 16px 32px; }
  .foot-in { padding: 12px 16px; }
  .head { margin-bottom: 28px; }
  h1 { font-size: 26px; line-height: 34px; }
  .lead { font-size: 15px; line-height: 24px; }
  .flow { gap: 8px; }
  .flow li { gap: 8px; }
  .flow li + li::before { width: 12px; }
  .flow li:not(.on) .lbl { display: none; }
  .types { grid-template-columns: 1fr; gap: 8px; }
  .type { flex-direction: row; }
  .tt { padding-right: 24px; }
  .paper { padding: 24px 20px; }
  .note { display: none; }
  .note.warn { display: inline-flex; flex: 1; }
  .btns { flex: 1; justify-content: flex-end; }
  .btns .primary { flex: 1; }
}
</style>
