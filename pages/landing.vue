<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { SOURCES as SRC, ANSWER } from '~/data/mock';

// Public website · Home v3 — the approved wireframe v2 (Figma MuXNHQVKOE55lGpjzUIOWt, page «Landing · Wireframe» 165:2, frames 170:93 / 170:405)
// in the Sage palette. Order: floating header · hero with the chat · sources · proof demo · capabilities bento · pricing · FAQ · CTA with the chat · footer.
// Copy comes from the Figma Home (33:2) and the app mock — nothing new is claimed. Sample content is marked SAMPLE.
useHead({ title: 'femid.ai — Legal answers you can verify' });

const light = ref(false);
const menuOpen = ref(false);
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') menuOpen.value = false; }
onMounted(() => {
  if (useRoute().query.theme === 'light') document.documentElement.classList.add('fd-light'); // same review switch as in the app
  light.value = document.documentElement.classList.contains('fd-light');
  document.addEventListener('keydown', onKey);
});
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
function toggleTheme() { light.value = !light.value; document.documentElement.classList.toggle('fd-light', light.value); }
// Every sign-up / log-in entry opens the same dialog; both composers pass the guest's question along
const { openAuth } = useAuthDialog();

const PH = 'Ask a legal question or attach a\u00a0document…';
const NAV = [['Product', '#product'], ['Pricing', '#pricing'], ['FAQ', '#faq'], ['About', '#'], ['Blog', '#']];
const SOURCES = [
  { i: 'pi-book', t: 'Legislation of the RA' }, { i: 'pi-building-columns', t: 'Court practice' }, { i: 'pi-percentage', t: 'Tax rulings' },
  { i: 'pi-globe', t: 'ECHR decisions' }, { i: 'pi-folder-open', t: 'Legal library' },
];

// Proof demo — the same SAMPLE answer and sources as the coded Chat (data/mock), real answer pending [OPEN — CTO Q11]
const tab = ref<'answer' | 'refusal'>('answer');
const QUESTION = 'Can an employee contest a dismissal after the one-month deadline if they were in hospital?';
const CITED = SRC.slice(0, 2);
const activeSrc = ref(1);
// Text → segments; a citation keeps the word before it and the punctuation after it on one line ("request [2].")
type Seg = { t: string } | { word: string; n: number; tail: string };
function split(s: string): Seg[] {
  const out: Seg[] = []; const re = /\s*\[(\d+)\]([.,;:]?)/g; let last = 0; let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    const before = s.slice(last, m.index); const sp = before.lastIndexOf(' ');
    if (sp >= 0) out.push({ t: before.slice(0, sp + 1) });
    out.push({ word: before.slice(sp + 1), n: +m[1], tail: m[2] });
    last = re.lastIndex;
  }
  if (last < s.length) out.push({ t: s.slice(last) });
  return out;
}
const PARAS = [split(ANSWER.short), split(ANSWER.paragraphs[0])];
const nb = (s: string) => s.replace(/ (?=\S+$)/, '\u00a0'); // no widows in mock strings

const BIG = [
  { title: 'Document analysis', body: 'Upload a contract or a court decision. Deadlines, obligations and risks come back flagged.', shot: 'Uploaded contract with flagged deadlines and risks', wide: true },
  { title: 'Deep research', body: 'For hard questions it plans the research and works through legislation, cassation practice and ECHR.', shot: 'Deep research in progress, steps and sources found', wide: false },
];
const SMALL = [
  { icon: 'pi-file-edit', title: 'Drafting wizard', body: 'Five steps from a short description to an appeal or a claim, in Word or PDF.' },
  { icon: 'pi-search', title: 'Court practice search', body: 'Find how courts decided cases like yours\u00a0— cassation, appeals, first\u00a0instance.' },
  { icon: 'pi-calendar', title: 'Law on a date', body: 'Pick a date and see which version of the law was in force then.' },
];

const PLANS = [
  { name: 'Pokr Mher', price: '5,000', desc: 'Basic Q&A for individual\u00a0users', feats: ['Basic Q&A with sources', 'For individual users'] },
  { name: 'Mets Mher', price: '20,000', desc: 'Extended features for medium\u00a0workloads', feats: ['Extended features', 'For medium workloads'] },
];
const SAFE = [
  { i: 'pi-lock', t: 'Files up to 25 MB, stored encrypted' },
  { i: 'pi-credit-card', t: 'Payments go through the bank — femid.ai never sees card data' },
  { i: 'pi-building', t: 'FEMIDAI LLC · registration no. 02337069' },
];
const FAQ = [
  { q: 'Where do the answers come\u00a0from?', a: 'From Armenian legislation, court practice, tax rulings and ECHR decisions. Every statement in an answer links to the source it is based on.' },
  { q: 'What happens if there is no\u00a0source?', a: 'We don’t answer. You get a clear “no source found” message with ideas for rephrasing — never a guess.' },
  { q: 'Is my data safe?', a: 'Uploaded files are encrypted, up to 25 MB each. Card details are handled only by the bank; femid.ai never sees or stores them.' },
  { q: 'What does the free trial\u00a0include?', a: '50 questions, no card needed.' },
  { q: 'Can my whole firm use\u00a0it?', a: 'Yes. Organisations get shared seats and invites, and Counsel mode works under an organisation contract.' },
];
const open = ref<number | null>(0);
</script>

<template>
  <div class="site">
    <div class="glow" aria-hidden="true" />

    <!-- ============ 00 Header — floating pill ============ -->
    <header class="header">
      <div class="pill">
        <a class="logo" href="#top">femid<span>.ai</span></a>
        <nav class="nav" aria-label="Main"><a v-for="[l, h] in NAV" :key="l" :href="h">{{ l }}</a></nav>
        <div class="grow" />
        <button class="icon-btn hide-m" :aria-label="light ? 'Dark theme' : 'Light theme'" @click="toggleTheme"><i class="pi" :class="light ? 'pi-moon' : 'pi-sun'" /></button>
        <button class="btn ghost hide-m" @click="openAuth('login')">Log in</button>
        <button class="btn primary" @click="openAuth('register')">Try free</button>
        <button class="icon-btn show-m" :aria-label="menuOpen ? 'Close menu' : 'Menu'" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen"><i class="pi" :class="menuOpen ? 'pi-times' : 'pi-bars'" /></button>
      </div>
      <Transition name="drop">
        <div v-if="menuOpen" class="m-menu">
          <a v-for="[l, h] in NAV" :key="l" :href="h" @click="menuOpen = false">{{ l }}</a>
          <div class="m-row">
            <button class="btn secondary grow" @click="menuOpen = false; openAuth('login')">Log in</button>
            <button class="icon-btn" :aria-label="light ? 'Dark theme' : 'Light theme'" @click="toggleTheme"><i class="pi" :class="light ? 'pi-moon' : 'pi-sun'" /></button>
          </div>
        </div>
      </Transition>
    </header>

    <!-- ============ 01 Hero — the product is the first thing you see ============ -->
    <section id="top" class="hero container">
      <span class="badge"><span class="b-ic"><i class="pi pi-shield" /></span>AI legal assistant for Armenia</span>
      <h1 class="h1">Legal answers<br /><span class="grad">you can verify.</span></h1>
      <p class="lead hero-lead">Ask in Armenian — every answer cites the law, court practice and ECHR decisions behind&nbsp;it.</p>
      <div class="chat-wrap"><ChatComposer variant="hero" gate input-id="hero-input" :placeholder="PH" @ask="openAuth('register', $event)" /></div>
      <div class="checks">
        <span v-for="n in ['50 free questions', 'No card needed', 'Armenian interface']" :key="n" class="check"><i class="pi pi-check" />{{ n }}</span>
      </div>
    </section>

    <!-- ============ 02 Sources — where a logo strip usually goes ============ -->
    <section class="sources container">
      <p class="s-label">Grounded in official Armenian sources</p>
      <div class="s-list">
        <span v-for="s in SOURCES" :key="s.t" class="s-chip"><i class="pi" :class="s.i" />{{ s.t }}</span>
      </div>
      <!-- [OPEN — CTO Q5] the size of the source base goes here once the CTO confirms the numbers -->
    </section>

    <!-- ============ 03 Proof — one product frame, two tabs ============ -->
    <section class="band">
      <div class="container col">
        <div class="head">
          <p class="eyebrow">How femid.ai answers</p>
          <h2 class="h2">If we can’t cite it, <span class="grad">we don’t say&nbsp;it.</span></h2>
          <p class="lead head-lead">femid.ai answers only when it can point to a law, a court decision or ECHR practice. Otherwise it tells you&nbsp;so.</p>
        </div>
        <div class="tabs" role="tablist" aria-label="Example">
          <button class="tab" role="tab" :class="{ on: tab === 'answer' }" :aria-selected="tab === 'answer'" @click="tab = 'answer'"><i class="pi pi-verified" />Answer with sources</button>
          <button class="tab" role="tab" :class="{ on: tab === 'refusal' }" :aria-selected="tab === 'refusal'" @click="tab = 'refusal'"><i class="pi pi-shield" />No source → no answer</button>
        </div>

        <div class="demo">
          <div class="d-bar">
            <span class="dots"><span /><span /><span /></span>
            <span class="d-title">{{ tab === 'answer' ? 'Contesting a dismissal' : 'New chat' }}</span>
            <span class="tag sample">SAMPLE</span>
          </div>
          <Transition name="swap" mode="out-in">
            <div v-if="tab === 'answer'" key="a" class="d-body">
              <div class="d-chat">
                <p class="bubble">{{ nb(QUESTION) }}</p>
                <div class="who"><span class="who-ic"><i class="pi pi-shield" /></span><b>femid.ai</b><span class="tag">2 sources</span></div>
                <div class="answer">
                  <p v-for="(p, pi) in PARAS" :key="pi" :class="{ first: pi === 0 }">
                    <template v-for="(seg, si) in p" :key="si">
                      <span v-if="'n' in seg" class="nw">{{ seg.word }}&nbsp;<button class="cite" :class="{ on: activeSrc === seg.n }" :aria-label="`Source ${seg.n}`" @click="activeSrc = seg.n">{{ seg.n }}</button>{{ seg.tail }}</span>
                      <template v-else>{{ seg.t }}</template>
                    </template>
                  </p>
                </div>
                <div class="acts" aria-hidden="true">
                  <span><i class="pi pi-copy" />Copy</span><span><i class="pi pi-bookmark" />Save to notes</span><span><i class="pi pi-sitemap" />How this answer was found</span>
                </div>
              </div>
              <aside class="d-src" aria-label="Sources">
                <p class="d-src-h">Sources</p>
                <button v-for="s in CITED" :key="s.n" class="src" :class="{ on: activeSrc === s.n }" @click="activeSrc = s.n">
                  <span class="src-k"><span class="src-n">{{ s.n }}</span>{{ s.kind }}</span>
                  <span class="src-t">{{ nb(s.title) }}</span>
                  <span class="src-r">{{ s.ref }}</span>
                  <span v-if="activeSrc === s.n" class="src-q">{{ nb(s.quote) }}</span>
                </button>
              </aside>
            </div>
            <div v-else key="r" class="d-body solo">
              <div class="d-chat narrow">
                <p class="bubble">How to bake a cake?</p>
                <RefusalCard />
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </section>

    <!-- ============ 04 Capabilities — bento ============ -->
    <section id="product" class="cap">
      <div class="container">
        <div class="head">
          <p class="eyebrow">What femid.ai does</p>
          <h2 class="h2 cap-title">One assistant for the whole legal&nbsp;question.</h2>
        </div>
        <div class="bento">
          <article v-for="b in BIG" :key="b.title" class="tile big" :class="{ wide: b.wide }">
            <!-- Place for a real product screenshot [OPEN] -->
            <figure class="shot" :aria-label="`Screenshot placeholder: ${b.shot}`">
              <span class="shot-ic"><i class="pi pi-image" /></span>
              <span class="shot-t">Screenshot</span>
              <span class="shot-d">{{ b.shot }}</span>
            </figure>
            <div class="t-copy"><h3 class="t-title">{{ b.title }}</h3><p class="t-body">{{ b.body }}</p></div>
          </article>
          <article v-for="s in SMALL" :key="s.title" class="tile small">
            <span class="t-ic"><i class="pi" :class="s.icon" /></span>
            <h3 class="t-title">{{ s.title }}</h3>
            <p class="t-body">{{ s.body }}</p>
          </article>
          <article class="firms">
            <span class="f-ic"><i class="pi pi-users" /></span>
            <div class="f-copy"><h3 class="t-title">Built for firms</h3><p class="t-body">Shared seats and invites. Counsel works under an organisation&nbsp;contract.</p></div>
            <a class="btn secondary" href="mailto:femidai@femid.ai">Talk to us</a>
          </article>
        </div>
      </div>
    </section>

    <!-- ============ 05 Pricing ============ -->
    <section id="pricing" class="band">
      <div class="container col">
        <div class="head">
          <p class="eyebrow">Pricing</p>
          <h2 class="h2">Start free. Pay when it works for&nbsp;you.</h2>
          <p class="lead head-lead">Monthly plans in Armenian dram, taxes included. Pay by Visa, Mastercard or&nbsp;ArCa.</p>
        </div>
        <div class="trial">
          <span class="tr-text"><b>Free trial — 50 questions</b><span>No card needed — try it on your own&nbsp;cases.</span></span>
          <button class="btn primary" @click="openAuth('register')">Start free</button>
        </div>
        <div class="plans">
          <div v-for="p in PLANS" :key="p.name" class="plan">
            <div class="pl-top"><p class="pl-name">{{ p.name }}</p><span class="tag amber">Soon</span></div>
            <p class="pl-price"><span class="pl-num">{{ p.price }}</span><span class="pl-per">AMD / month</span></p>
            <p class="pl-desc">{{ p.desc }}</p>
            <ul class="pl-feats"><li v-for="f in p.feats" :key="f"><span class="tick"><i class="pi pi-check" /></span>{{ f }}</li></ul>
            <button class="btn disabled" disabled>Coming soon</button>
          </div>
          <div class="plan featured">
            <div class="pl-top"><p class="pl-name">Davit</p><span class="tag accent">Most complete</span></div>
            <p class="pl-price"><span class="pl-num">200,000</span><span class="pl-per">AMD / month</span></p>
            <p class="pl-desc">In-depth legal research with full&nbsp;sources</p>
            <ul class="pl-feats"><li v-for="f in ['Document analysis', 'Drafting', 'Priority support']" :key="f"><span class="tick"><i class="pi pi-check" /></span>{{ f }}</li></ul>
            <button class="btn primary" @click="openAuth('register')">Choose Davit</button>
          </div>
        </div>
        <div class="safe">
          <span v-for="s in SAFE" :key="s.t"><i class="pi" :class="s.i" />{{ s.t }}</span>
        </div>
      </div>
    </section>

    <!-- ============ 06 FAQ — one centred column ============ -->
    <section id="faq" class="faq">
      <div class="container">
        <div class="head"><p class="eyebrow">FAQ</p><h2 class="h2">Questions lawyers ask&nbsp;us</h2></div>
        <div class="faq-list">
          <div v-for="(f, i) in FAQ" :key="f.q" class="faq-item" :class="{ open: open === i }">
            <button class="faq-row" :aria-expanded="open === i" @click="open = open === i ? null : i">
              <span>{{ f.q }}</span><span class="faq-ic"><i class="pi pi-plus" /></span>
            </button>
            <p v-if="open === i" class="faq-a">{{ f.a }}</p>
          </div>
        </div>
        <p class="faq-more">Something else? Write to <a href="mailto:femidai@femid.ai">femidai@femid.ai</a></p>
      </div>
    </section>

    <!-- ============ 07 CTA — the chat right here ============ -->
    <section class="cta container">
      <div class="cta-panel">
        <h2 class="h2">Ask your first&nbsp;question</h2>
        <p class="lead">For lawyers, advocates and law firms in&nbsp;Armenia.</p>
        <div class="chat-wrap cta-chat"><ChatComposer variant="hero" gate input-id="cta-input" :placeholder="PH" @ask="openAuth('register', $event)" /></div>
        <p class="cta-note">50 free questions · No card needed</p>
      </div>
    </section>

    <!-- ============ 08 Footer ============ -->
    <footer class="footer">
      <div class="container">
        <div class="ft-top">
          <div class="ft-brand"><p class="logo">femid<span>.ai</span></p><p class="ft-tag">Armenian legal AI platform</p></div>
          <div class="grow" />
          <div class="ft-cols">
            <div class="ft-col"><b>Product</b><a href="#product">Product</a><a href="#pricing">Pricing</a><a href="#">Blog</a></div>
            <div class="ft-col"><b>Company</b><a href="#">About</a><a href="#">Contact</a></div>
            <div class="ft-col"><b>Legal</b><a href="#">Terms</a><a href="#">Privacy</a><a href="#">Personal data</a><a href="#">Cancellation / refund</a></div>
          </div>
        </div>
        <div class="ft-bottom">
          <p>© 2026 FEMIDAI LLC · registration no.&nbsp;02337069&nbsp;·&nbsp;femidai@femid.ai</p>
          <div class="grow" />
          <div class="marks"><span>VISA</span><span>Mastercard</span><span>ArCa</span></div>
        </div>
      </div>
    </footer>
    <AuthDialog />
  </div>
</template>

<style scoped>
/* Page-level helpers: --band = the tinted full-width sections, --lift = the big soft shadow (darker in the dark theme) */
.site { --band: color-mix(in srgb, var(--fd-panel) 50%, var(--fd-bg)); --lift: 0 30px 80px rgb(0 0 0 / .45); --soft: 0 10px 30px rgb(0 0 0 / .3);
  position: relative; height: 100dvh; overflow-y: auto; overflow-x: hidden; background: var(--fd-bg); color: var(--fd-ink); scroll-behavior: smooth; }
:global(html.fd-light .site) { --band: var(--fd-panel-2); --lift: 0 30px 80px rgb(23 24 26 / .1); --soft: 0 10px 30px rgb(23 24 26 / .08); }
p, h1, h2, h3, ul, figure { margin: 0; }
a { color: inherit; text-decoration: none; }
section { scroll-margin-top: 88px; }
.grow { flex: 1; min-width: 1px; }
.container { width: min(1320px, calc(100% - 96px)); margin: 0 auto; }
.col { display: flex; flex-direction: column; align-items: center; gap: 40px; }
.glow { position: absolute; top: -360px; left: 50%; width: 1500px; height: 960px; transform: translateX(-50%); pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--fd-accent) 16%, transparent), transparent); }

/* Type */
.h1 { font: 600 84px/88px var(--fd-font-serif); letter-spacing: -1.7px; text-align: center; }
.h2 { color: var(--fd-ink); font: 600 52px/58px var(--fd-font-serif); letter-spacing: -.8px; text-align: center; text-wrap: balance; }
.grad { background: linear-gradient(90deg, var(--fd-accent-text), var(--fd-accent)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.eyebrow { color: var(--fd-accent-text); font: 600 13px/18px var(--fd-font-sans); letter-spacing: 1.4px; text-transform: uppercase; }
.lead { color: var(--fd-muted); font: 400 19px/30px var(--fd-font-sans); text-align: center; text-wrap: pretty; }
.logo { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); white-space: nowrap; }
.logo span { color: var(--fd-accent-text); }
.head { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.head-lead { max-width: 640px; }

/* Buttons — pills */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 18px; border-radius: 999px; border: 1px solid transparent; cursor: pointer; white-space: nowrap;
  font: 500 15px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, color .15s; }
.btn.primary { background: var(--fd-accent); color: var(--fd-on-accent); }
.btn.primary:hover { background: var(--fd-accent-hover); }
.btn.secondary { border-color: var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.btn.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 30%, transparent); }
.btn.ghost { background: none; color: var(--fd-ink); }
.btn.ghost:hover { background: var(--fd-panel-2); }
.btn.disabled { background: var(--fd-panel-2); color: var(--fd-muted); cursor: default; }
.icon-btn { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border-radius: 999px; border: 0; background: none; color: var(--fd-muted); cursor: pointer; flex-shrink: 0; }
.icon-btn:hover { background: var(--fd-panel-2); color: var(--fd-ink); }
.btn:focus-visible, .icon-btn:focus-visible, .tab:focus-visible, .cite:focus-visible, .src:focus-visible, .faq-row:focus-visible, a:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.tag { display: inline-flex; align-items: center; flex-shrink: 0; padding: 2px 10px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-muted); font: 500 13px/20px var(--fd-font-sans); white-space: nowrap; }
.tag.amber { background: var(--fd-amber-soft); color: var(--fd-amber); }
.tag.accent { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.tag.sample { border: 1px dashed var(--fd-line); background: none; font-size: 12px; letter-spacing: .8px; }
.show-m { display: none; }

/* ============ 00 Header ============ */
.header { position: sticky; top: 0; z-index: 30; display: flex; justify-content: center; padding-top: 16px; pointer-events: none; }
.pill { display: flex; align-items: center; gap: 8px; width: min(980px, calc(100% - 32px)); height: 60px; padding: 0 8px 0 24px; border-radius: 999px; pointer-events: auto;
  border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 82%, transparent); backdrop-filter: blur(16px) saturate(1.2); -webkit-backdrop-filter: blur(16px) saturate(1.2); box-shadow: var(--soft); }
.nav { display: flex; gap: 28px; margin-left: 28px; color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.nav a:hover { color: var(--fd-ink); }
.m-menu { position: absolute; top: 84px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 2px; padding: 10px; border-radius: 24px; pointer-events: auto;
  border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--lift); }
.m-menu a { padding: 12px 14px; border-radius: 14px; color: var(--fd-ink); font: 500 16px/24px var(--fd-font-sans); }
.m-menu a:hover { background: var(--fd-panel-2); }
.m-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--fd-line); }
.drop-enter-active, .drop-leave-active { transition: opacity .15s, transform .15s var(--fd-easing); }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }

/* ============ 01 Hero ============ */
.hero { position: relative; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 112px 0 56px; }
.badge { display: inline-flex; align-items: center; gap: 10px; padding: 5px 16px 5px 5px; border-radius: 999px; border: 1px solid var(--fd-line);
  background: color-mix(in srgb, var(--fd-panel) 70%, transparent); color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.b-ic { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.b-ic .pi { font-size: 12px; }
.hero-lead { max-width: 580px; }
.chat-wrap { width: min(800px, 100%); margin-top: 12px; text-align: left; }
.chat-wrap :deep(.composer) { border-radius: 24px; }
:global(html.fd-light .chat-wrap .composer:not(:focus-within)) { box-shadow: 0 2px 6px rgb(23 24 26 / .05), 0 18px 50px rgb(23 24 26 / .09); }
.checks { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 28px; }
.check { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }
.check .pi { color: var(--fd-accent-text); font-size: 12px; }

/* ============ 02 Sources ============ */
.sources { display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 24px 0 120px; }
.s-label { color: var(--fd-muted); font: 600 13px/18px var(--fd-font-sans); letter-spacing: 1.4px; text-transform: uppercase; text-align: center; }
.s-list { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; }
.s-chip { display: flex; align-items: center; gap: 10px; padding: 8px 18px 8px 8px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel);
  color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.s-chip .pi { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font-size: 13px; }

/* ============ 03 Proof ============ */
.band { padding: 120px 0; background: var(--band); }
.tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tab { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 18px; border-radius: 999px; border: 0; background: none; cursor: pointer; white-space: nowrap;
  color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); transition: background-color .15s, color .15s; }
.tab .pi { font-size: 13px; }
.tab:hover { color: var(--fd-ink); }
.tab.on { background: var(--fd-accent-soft); color: var(--fd-accent-text); font-weight: 600; }
.demo { width: 100%; overflow: hidden; border-radius: 28px; border: 1px solid var(--fd-line); background: var(--fd-bg); box-shadow: var(--lift); }
.d-bar { display: flex; align-items: center; gap: 12px; height: 52px; padding: 0 20px; border-bottom: 1px solid var(--fd-line); background: var(--fd-panel); }
.dots { display: flex; gap: 6px; width: 90px; }
.dots span { width: 10px; height: 10px; border-radius: 50%; background: var(--fd-line); }
.d-title { flex: 1; overflow: hidden; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); text-align: center; text-overflow: ellipsis; white-space: nowrap; }
.d-bar .tag { width: 90px; justify-content: center; }
.d-body { display: grid; grid-template-columns: minmax(0, 1fr) 380px; min-height: 440px; }
.d-body.solo { grid-template-columns: minmax(0, 1fr); }
.d-chat { display: flex; flex-direction: column; gap: 20px; padding: 36px 44px; }
.d-chat.narrow { width: min(760px, 100%); margin: 0 auto; }
.bubble { align-self: flex-end; max-width: min(520px, 90%); padding: 12px 18px; border-radius: 20px 20px 6px 20px; background: var(--fd-panel-2); color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.who { display: flex; align-items: center; gap: 10px; color: var(--fd-ink); font: 600 15px/20px var(--fd-font-sans); }
.who-ic { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.who-ic .pi { font-size: 13px; }
.answer { display: flex; flex-direction: column; gap: 14px; color: var(--fd-ink); font: 400 17px/28px var(--fd-font-sans); }
.answer .first { font-weight: 500; }
.nw { white-space: nowrap; }
.cite { display: inline-grid; place-items: center; min-width: 22px; height: 22px; margin: 0 2px; padding: 0 6px; border-radius: 6px; border: 0; vertical-align: 2px; cursor: pointer;
  background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); transition: background-color .15s, color .15s; }
.cite.on, .cite:hover { background: var(--fd-accent); color: var(--fd-on-accent); }
.acts { display: flex; flex-wrap: wrap; gap: 4px 18px; margin-top: auto; color: var(--fd-muted); font: 500 14px/20px var(--fd-font-sans); }
.acts span { display: flex; align-items: center; gap: 7px; }
.acts .pi { font-size: 13px; }
.d-src { display: flex; flex-direction: column; gap: 10px; padding: 24px; border-left: 1px solid var(--fd-line); background: var(--fd-panel); }
.d-src-h { color: var(--fd-ink); font: 600 15px/20px var(--fd-font-sans); }
.src { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 14px 16px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-bg); cursor: pointer; text-align: left;
  transition: border-color .2s, box-shadow .2s; }
.src.on { border-color: var(--fd-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--fd-accent) 18%, transparent); }
.src-k { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 600 12px/16px var(--fd-font-sans); letter-spacing: .6px; text-transform: uppercase; }
.src-n { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font-size: 11px; letter-spacing: 0; }
.src-t { margin-top: 4px; color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.src-r { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.src-q { margin-top: 8px; padding: 8px 12px; border-left: 2px solid var(--fd-accent); border-radius: 0 8px 8px 0; background: var(--fd-panel-2); color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }
.swap-enter-active, .swap-leave-active { transition: opacity .18s ease; }
.swap-enter-from, .swap-leave-to { opacity: 0; }

/* ============ 04 Capabilities ============ */
.cap { padding: 120px 0; }
.cap-title { max-width: 820px; }
.bento { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 56px; }
.tile { display: flex; flex-direction: column; overflow: hidden; border-radius: 24px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tile.wide { grid-column: span 2; }
.shot { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; height: 280px; padding: 32px; text-align: center; border-bottom: 1px solid var(--fd-line);
  background: radial-gradient(120% 100% at 50% 0%, color-mix(in srgb, var(--fd-accent) 12%, transparent), transparent 65%), var(--fd-panel-2); }
.shot::before { content: ''; position: absolute; inset: 14px; border-radius: 14px; border: 1.5px dashed color-mix(in srgb, var(--fd-ink) 16%, transparent); pointer-events: none; }
.shot-ic { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 6px; border-radius: 14px; background: var(--fd-panel); color: var(--fd-muted); }
.shot-t { color: var(--fd-muted); font: 600 12px/16px var(--fd-font-sans); letter-spacing: 1.2px; text-transform: uppercase; }
.shot-d { max-width: 340px; color: var(--fd-ink); font: 500 16px/24px var(--fd-font-sans); text-wrap: balance; }
.t-copy { display: flex; flex-direction: column; gap: 8px; padding: 24px 28px 28px; }
.t-title { color: var(--fd-ink); font: 600 21px/28px var(--fd-font-sans); }
.t-body { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }
.tile.small { gap: 10px; padding: 28px; }
.t-ic { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 8px; border-radius: 12px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.firms { grid-column: 1 / -1; display: flex; align-items: center; gap: 20px; padding: 28px 32px; border-radius: 24px;
  border: 1px solid color-mix(in srgb, var(--fd-accent) 30%, transparent); background: var(--fd-accent-soft); }
.f-ic { display: grid; place-items: center; width: 52px; height: 52px; flex-shrink: 0; border-radius: 999px; background: var(--fd-panel); color: var(--fd-accent-text); }
.f-ic .pi { font-size: 18px; }
.f-copy { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }

/* ============ 05 Pricing ============ */
.trial { display: flex; align-items: center; gap: 24px; padding: 8px 8px 8px 28px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--fd-accent) 40%, var(--fd-line)); background: var(--fd-panel); }
.tr-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.tr-text b { color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.tr-text span { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; width: 100%; }
.plan { display: flex; flex-direction: column; gap: 16px; padding: 28px; border-radius: 24px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.plan .btn { width: 100%; margin-top: auto; }
.plan.featured { border: 2px solid var(--fd-accent); box-shadow: var(--lift);
  background: linear-gradient(180deg, color-mix(in srgb, var(--fd-accent) 12%, var(--fd-panel)), var(--fd-panel) 55%); }
.pl-top { display: flex; align-items: center; gap: 8px; }
.pl-name { flex: 1; color: var(--fd-ink); font: 600 21px/28px var(--fd-font-sans); }
.pl-price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.pl-num { color: var(--fd-ink); font: 700 40px/48px var(--fd-font-serif); letter-spacing: -.5px; }
.pl-per { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.pl-desc { padding-bottom: 16px; border-bottom: 1px solid var(--fd-line); color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.pl-feats { display: flex; flex-direction: column; gap: 12px; padding: 0 0 8px; list-style: none; }
.pl-feats li { display: flex; align-items: center; gap: 10px; color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.tick { display: grid; place-items: center; width: 22px; height: 22px; flex-shrink: 0; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.tick .pi { font-size: 10px; }
.safe { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 32px; }
.safe span { display: flex; align-items: center; gap: 10px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.safe .pi { color: var(--fd-accent-text); font-size: 14px; }

/* ============ 06 FAQ ============ */
.faq { padding: 120px 0 80px; }
.faq-list { display: flex; flex-direction: column; gap: 12px; width: min(820px, 100%); margin: 48px auto 0; }
.faq-item { border-radius: 20px; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .2s; }
.faq-item.open { border-color: color-mix(in srgb, var(--fd-accent) 45%, var(--fd-line)); }
.faq-row { display: flex; align-items: center; gap: 16px; width: 100%; padding: 20px 20px 20px 24px; border: 0; border-radius: 20px; background: none; cursor: pointer; text-align: left;
  color: var(--fd-ink); font: 600 17px/26px var(--fd-font-sans); }
.faq-row > span:first-child { flex: 1; min-width: 0; }
.faq-ic { display: grid; place-items: center; width: 32px; height: 32px; flex-shrink: 0; border-radius: 999px; border: 1px solid var(--fd-line); color: var(--fd-muted); transition: transform .2s var(--fd-easing), background-color .2s; }
.faq-ic .pi { font-size: 12px; }
.open .faq-ic { transform: rotate(45deg); border-color: transparent; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.faq-a { margin-top: -6px; padding: 0 24px 22px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.faq-more { margin-top: 28px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-align: center; }
.faq-more a { color: var(--fd-accent-text); font-weight: 500; }

/* ============ 07 CTA ============ */
.cta { padding: 40px 0 120px; }
.cta-panel { position: relative; display: flex; flex-direction: column; align-items: center; gap: 16px; overflow: hidden; padding: 88px 48px; border-radius: 32px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.cta-panel::before { content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(90deg, color-mix(in srgb, var(--fd-ink) 7%, transparent) 1px, transparent 1px), linear-gradient(180deg, color-mix(in srgb, var(--fd-ink) 7%, transparent) 1px, transparent 1px);
  background-size: 56px 56px; -webkit-mask-image: radial-gradient(70% 80% at 50% 0%, #000, transparent 75%); mask-image: radial-gradient(70% 80% at 50% 0%, #000, transparent 75%); }
.cta-panel::after { content: ''; position: absolute; top: -260px; left: 50%; width: 900px; height: 520px; transform: translateX(-50%); pointer-events: none;
  background: radial-gradient(closest-side, color-mix(in srgb, var(--fd-accent) 18%, transparent), transparent); }
.cta-panel > * { position: relative; z-index: 1; }
.cta-chat { width: min(720px, 100%); margin-top: 16px; }
.cta-note { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }

/* ============ 08 Footer ============ */
.footer { padding: 48px 0 40px; border-top: 1px solid var(--fd-line); }
.ft-top { display: flex; align-items: flex-start; gap: 48px; }
.ft-brand { display: flex; flex-direction: column; gap: 6px; }
.ft-tag { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.ft-cols { display: flex; flex-wrap: wrap; gap: 32px 64px; }
.ft-col { display: flex; flex-direction: column; gap: 12px; white-space: nowrap; }
.ft-col b { color: var(--fd-ink); font: 600 15px/20px var(--fd-font-sans); }
.ft-col a { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.ft-col a:hover { color: var(--fd-ink); }
.ft-bottom { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--fd-line); }
.ft-bottom p { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.marks { display: flex; gap: 8px; }
.marks span { display: flex; align-items: center; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px dashed var(--fd-line); color: var(--fd-muted); font: 400 13px/20px var(--fd-font-sans); }

/* ============ 1024 ============ */
@media (max-width: 1100px) {
  .nav { gap: 20px; margin-left: 16px; }
  .h1 { font-size: 68px; line-height: 72px; }
  .h2 { font-size: 44px; line-height: 50px; }
  .d-body { grid-template-columns: minmax(0, 1fr) 320px; }
  .d-chat { padding: 28px 32px; }
  .pl-num { font-size: 34px; line-height: 42px; }
  .plan { padding: 24px; }
}

/* ============ 390 ============ */
@media (max-width: 767px) {
  .container { width: calc(100% - 32px); }
  section { scroll-margin-top: 80px; }
  .hide-m, .nav { display: none; }
  .show-m { display: grid; }
  .pill { height: 56px; padding-left: 20px; }
  .h1 { font-size: 44px; line-height: 48px; letter-spacing: -.9px; }
  .h2 { font-size: 32px; line-height: 38px; letter-spacing: -.4px; }
  .lead { font-size: 17px; line-height: 27px; }
  .hero { gap: 20px; padding: 64px 0 40px; }
  .badge { font-size: 13px; }
  .checks { gap: 6px 18px; }
  .check { font-size: 14px; }
  .sources { padding: 16px 0 72px; }
  .s-list { gap: 8px; }
  .s-chip { padding: 6px 14px 6px 6px; font-size: 14px; }
  .s-chip .pi { width: 26px; height: 26px; font-size: 12px; }
  .band, .cap { padding: 72px 0; }
  .col { gap: 28px; }
  .tabs { width: 100%; }
  .tab { flex: 1; padding: 9px 8px; font-size: 13px; }
  .tab .pi { display: none; }
  .demo { border-radius: 22px; }
  .d-bar { height: 46px; padding: 0 14px; }
  .dots { width: 52px; }
  .d-bar .tag { width: auto; }
  .d-body { grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .d-chat { padding: 20px 18px; gap: 16px; }
  .answer { font-size: 16px; line-height: 26px; }
  .d-src { padding: 18px; border-left: 0; border-top: 1px solid var(--fd-line); }
  .bento { grid-template-columns: minmax(0, 1fr); gap: 12px; margin-top: 36px; }
  .tile.wide { grid-column: auto; }
  .shot { height: 200px; }
  .t-copy, .tile.small { padding: 22px; }
  .firms { flex-direction: column; align-items: flex-start; gap: 14px; padding: 24px; }
  .trial { flex-direction: column; gap: 12px; width: 100%; padding: 18px; border-radius: 22px; text-align: center; }
  .tr-text { justify-content: center; }
  .plans { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .safe { flex-direction: column; align-items: flex-start; gap: 10px; }
  .faq { padding: 72px 0 56px; }
  .faq-list { margin-top: 32px; gap: 10px; }
  .faq-row { padding: 16px 16px 16px 18px; font-size: 16px; line-height: 24px; }
  .faq-a { padding: 0 18px 18px; font-size: 15px; line-height: 24px; }
  .cta { padding: 16px 0 72px; }
  .cta-panel { padding: 48px 18px 36px; border-radius: 24px; }
  .ft-top { flex-direction: column; gap: 28px; }
  .ft-bottom { flex-direction: column; align-items: flex-start; }
}
</style>
