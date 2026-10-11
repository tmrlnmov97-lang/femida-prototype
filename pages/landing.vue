<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Public website · Home v3 — the approved wireframe v2 (Figma MuXNHQVKOE55lGpjzUIOWt, page «Landing · Wireframe» 165:2, frames 170:93 / 170:405)
// in the Sage palette. Order: floating header · hero with the chat · product window (chat with sources + tools) · pricing · FAQ · CTA with the chat · footer.
// Copy comes from the Figma Home (33:2) and the app mock — nothing new is claimed. Sample content is marked SAMPLE.
useHead({ title: 'femid.ai — Legal answers you can verify' });

const light = ref(false);
const menuOpen = ref(false);
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') menuOpen.value = false; }

// Header micro-interactions: a highlight that slides between nav links on hover, the current section marked while
// scrolling (scroll-spy), and a slightly tighter, denser pill once the page moves.
const scrolled = ref(false);
function onScroll(e: Event) { scrolled.value = (e.target as HTMLElement).scrollTop > 8; }
const hl = ref({ x: 0, w: 0, on: false, instant: false });
function onNavEnter(e: MouseEvent) {
  const a = e.currentTarget as HTMLElement;
  const instant = !hl.value.on; // first hover: appear in place, then slide between links
  hl.value = { x: a.offsetLeft, w: a.offsetWidth, on: true, instant };
  if (instant) requestAnimationFrame(() => { hl.value.instant = false; });
}
function onNavLeave() { hl.value.on = false; }
const activeSection = ref('');
let spy: IntersectionObserver | null = null;

onMounted(() => {
  if (useRoute().query.theme === 'light') document.documentElement.classList.add('fd-light'); // same review switch as in the app
  light.value = document.documentElement.classList.contains('fd-light');
  document.addEventListener('keydown', onKey);
  spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) activeSection.value = `#${en.target.id}`; else if (activeSection.value === `#${en.target.id}`) activeSection.value = ''; });
  }, { root: document.querySelector('.site'), rootMargin: '-45% 0px -50% 0px' });
  ['product', 'pricing', 'faq'].forEach((id) => { const el = document.getElementById(id); if (el) spy!.observe(el); });
});
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); spy?.disconnect(); });
function toggleTheme() { light.value = !light.value; document.documentElement.classList.toggle('fd-light', light.value); }
// Every sign-up / log-in entry opens the same dialog; both composers pass the guest's question along
const { openAuth } = useAuthDialog();

const PH = 'Ask a legal question or attach a\u00a0document…';
const HEADLINE = [['Legal', 'answers'], ['you', 'can', 'verify.']];
const NAV = [['Product', '#product'], ['Pricing', '#pricing'], ['FAQ', '#faq'], ['About', '#'], ['Blog', '#']];

// Pricing (prices from the brief; plan copy 1:1 with the live site). Minimal on purpose (user, 11.10: "minimal and professional,
// not AI-looking"): a price ladder, equal cards, Davit — the only plan on sale — marked by a firmer border and the one green
// button. No monthly/yearly switch — there are no yearly prices [OPEN].
const PLANS = [
  { name: 'Pokr Mher', price: '5,000', desc: 'Basic Q&A for individual\u00a0users', feats: ['Basic Q&A with sources', 'For individual users'], soon: true },
  { name: 'Mets Mher', price: '20,000', desc: 'Extended features for medium\u00a0workloads', feats: ['Extended features', 'For medium workloads'], soon: true },
  { name: 'Davit', price: '200,000', desc: 'In-depth legal research with full\u00a0sources', feats: ['Document analysis', 'Drafting', 'Priority support'], featured: true },
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
  <div v-tie class="site" @scroll.passive="onScroll">
    <div class="glow fade" style="animation-duration: 1.2s" aria-hidden="true" />

    <!-- ============ 00 Header — floating pill ============ -->
    <header class="header" :class="{ scrolled }">
      <div class="pill">
        <a class="logo" href="#top">femid<span>.ai</span></a>
        <nav class="nav" aria-label="Main" @mouseleave="onNavLeave">
          <span class="nav-hl" :class="{ on: hl.on, instant: hl.instant }" :style="{ transform: `translateX(${hl.x}px)`, width: `${hl.w}px` }" aria-hidden="true" />
          <a v-for="[l, h] in NAV" :key="l" :href="h" :class="{ active: activeSection === h }" :aria-current="activeSection === h ? 'location' : undefined"
             @mouseenter="onNavEnter">{{ l }}</a>
        </nav>
        <div class="p-actions">
          <button class="icon-btn hide-m" :aria-label="light ? 'Dark theme' : 'Light theme'" @click="toggleTheme">
            <Transition name="spin" mode="out-in"><i :key="String(light)" class="pi" :class="light ? 'pi-moon' : 'pi-sun'" /></Transition>
          </button>
          <button class="btn ghost hide-m" @click="openAuth('login')">Log in</button>
          <button class="btn primary try" @click="openAuth('register')">Try free<i class="pi pi-arrow-right go" /></button>
          <button class="icon-btn show-m" :aria-label="menuOpen ? 'Close menu' : 'Menu'" :aria-expanded="menuOpen" @click="menuOpen = !menuOpen">
            <Transition name="spin" mode="out-in"><i :key="String(menuOpen)" class="pi" :class="menuOpen ? 'pi-times' : 'pi-bars'" /></Transition>
          </button>
        </div>
      </div>
      <Transition name="drop">
        <div v-if="menuOpen" class="m-menu">
          <a v-for="([l, h], i) in NAV" :key="l" :href="h" :style="{ '--i': i }" @click="menuOpen = false">{{ l }}</a>
          <div class="m-row">
            <button class="btn secondary grow" @click="menuOpen = false; openAuth('login')">Log in</button>
            <button class="icon-btn" :aria-label="light ? 'Dark theme' : 'Light theme'" @click="toggleTheme">
              <Transition name="spin" mode="out-in"><i :key="String(light)" class="pi" :class="light ? 'pi-moon' : 'pi-sun'" /></Transition>
            </button>
          </div>
        </div>
      </Transition>
    </header>

    <!-- ============ 01 Hero — the product is the first thing you see ============ -->
    <section id="top" class="hero container">
      <!-- Intro on open (timings from the Hirael "Coming Soon 2" block): words rise one by one, then the lead, the chat, the notes -->
      <h1 class="h1">
        <span v-for="(line, l) in HEADLINE" :key="l" class="line"><template v-for="(w, i) in line" :key="w"><span class="w" :class="{ grad: l === 1 }" :style="{ animationDelay: `${0.2 + (l ? HEADLINE[0].length + i : i) * 0.08}s` }">{{ w }}</span>{{ i < line.length - 1 ? ' ' : '' }}</template></span>
      </h1>
      <p class="lead hero-lead fade" style="animation-delay: .8s">Ask in Armenian — every answer cites the law, court practice and ECHR decisions behind&nbsp;it.</p>
      <div class="chat-wrap rise" style="animation-delay: 1s"><ChatComposer variant="hero" gate input-id="hero-input" :placeholder="PH" @ask="openAuth('register', $event)" /></div>
      <div class="checks rise" style="animation-delay: 1.1s">
        <span v-for="n in ['50 free questions', 'No card needed', 'Armenian interface']" :key="n" class="check"><i class="pi pi-check" />{{ n }}</span>
      </div>
    </section>

    <!-- ============ 03 Product — one window: an answer with sources, a refusal and the tools (replaced the proof demo and the bento) ============ -->
    <section id="product" class="band">
      <div class="container">
        <div class="head">
          <h2 class="h2">If we can’t cite it, <span class="grad">we don’t say&nbsp;it.</span></h2>
          <p class="lead head-lead">femid.ai answers only when it can point to a law, a court decision or ECHR practice. Otherwise it tells you&nbsp;so.</p>
        </div>
        <ProductTour class="tour-block" />
      </div>
    </section>

    <!-- ============ 05 Pricing ============ -->
    <section id="pricing" class="cap">
      <div class="container col">
        <div class="head">
          <h2 class="h2">Start free. Pay when it works for&nbsp;you.</h2>
          <p class="lead head-lead">Monthly plans in Armenian dram, taxes included. Pay by Visa, Mastercard or&nbsp;ArCa.</p>
        </div>
        <div class="trial">
          <span class="tr-text"><b>Free trial — 50 questions</b><span>No card needed — try it on your own&nbsp;cases.</span></span>
          <button class="btn primary" @click="openAuth('register')">Start free</button>
        </div>
        <div class="plans">
          <div v-for="p in PLANS" :key="p.name" class="plan" :class="{ featured: p.featured }">
            <div class="pl-top">
              <p class="pl-name">{{ p.name }}</p>
              <span v-if="p.featured" class="pl-tag">Most complete</span>
              <span v-else-if="p.soon" class="pl-tag soon">Soon</span>
            </div>
            <p class="pl-desc">{{ p.desc }}</p>
            <p class="pl-price"><span class="pl-num">{{ p.price }}</span><span class="pl-per">AMD / month</span></p>
            <p class="pl-bill">Billed monthly, taxes included</p>
            <ul class="pl-feats"><li v-for="f in p.feats" :key="f"><i class="pi pi-check" />{{ f }}</li></ul>
            <button v-if="p.featured" class="pl-btn go" @click="openAuth('register')">Choose {{ p.name }}<i class="pi pi-arrow-right" /></button>
            <button v-else class="pl-btn" disabled>Coming soon</button>
          </div>
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
.h1 .line { display: block; }
/* Intro on open — rise = fade + 16px up, ease-out, played once; nothing moves with reduced motion */
.w { display: inline-block; animation: fd-rise .5s ease-out both; }
.rise { animation: fd-rise .6s ease-out both; }
.fade { animation: fd-fade .6s ease-out both; }
@keyframes fd-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes fd-fade { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .w, .rise, .fade, .pill, .m-menu a { animation: none; }
  .pill, .header, .header::before, .nav-hl, .try .go, .nav a::after, .spin-enter-active, .spin-leave-active { transition: none; }
}
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
.header { position: sticky; top: 0; z-index: 30; display: flex; justify-content: center; padding-top: 16px; pointer-events: none; transition: padding .3s var(--fd-easing); }
.pill { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; width: min(1320px, calc(100% - 96px)); /* logo · nav in the middle · actions */ height: 60px; padding: 0 8px; /* symmetric so the nav sits exactly in the middle; on the page grid: same edges as the content */ border-radius: 999px; pointer-events: auto;
  border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 82%, transparent); backdrop-filter: blur(16px) saturate(1.2); -webkit-backdrop-filter: blur(16px) saturate(1.2); box-shadow: var(--soft);
  animation: fd-drop .6s var(--fd-easing) .05s both; transition: height .3s var(--fd-easing), background-color .3s, box-shadow .3s; }
/* scrolled: a little tighter and denser */
.header.scrolled { padding-top: 10px; }
/* veil behind the pill: page colour across the full width, fading out just below it — nothing shows through above or
   beside the header while scrolling; off at the very top so the hero glow stays */
.header::before { content: ''; position: absolute; left: 0; right: 0; top: 0; height: calc(100% + 24px); z-index: -1; pointer-events: none;
  background: linear-gradient(180deg, var(--fd-bg) 0%, var(--fd-bg) 62%, color-mix(in srgb, var(--fd-bg) 0%, transparent) 100%);
  opacity: 0; transition: opacity .3s; }
.header.scrolled::before { opacity: 1; }
.header.scrolled .pill { height: 52px; background: color-mix(in srgb, var(--fd-panel) 94%, transparent); box-shadow: var(--lift); }
@keyframes fd-drop { from { opacity: 0; transform: translateY(-14px) scale(.985); } to { opacity: 1; transform: none; } }
.pill .logo { justify-self: start; margin-left: 16px; }
.p-actions { display: flex; align-items: center; justify-self: end; gap: 8px; }
.nav { position: relative; display: flex; gap: 4px; color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.nav a { position: relative; z-index: 1; padding: 7px 12px; border-radius: 999px; transition: color .2s; } /* no per-link entrance: Chrome stops painting them under the pill's backdrop blur */
.nav a:hover, .nav a.active { color: var(--fd-ink); }
/* current section: a small accent dot under the link */
.nav a::after { content: ''; position: absolute; left: 50%; bottom: -1px; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: var(--fd-accent);
  opacity: 0; transform: scale(0); transition: opacity .2s, transform .25s var(--fd-easing); }
.nav a.active::after { opacity: 1; transform: scale(1); }
/* hover: a soft pill that slides between links */
.nav-hl { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 999px; background: color-mix(in srgb, var(--fd-ink) 8%, transparent); opacity: 0; pointer-events: none;
  transition: transform .28s var(--fd-easing), width .28s var(--fd-easing), opacity .18s; }
.nav-hl.on { opacity: 1; }
.nav-hl.instant { transition: opacity .18s; }
/* Try free: an arrow slides in on hover; every header button gives a little on press */
.header .btn, .header .icon-btn { transition: background-color .15s, color .15s, transform .12s; }
/* the button keeps its width: the label slides left and the arrow fades in on the right */
.header .try { position: relative; padding: 10px 22px; transition: padding .22s var(--fd-easing), background-color .15s, transform .12s; }
.header .try:hover, .header .try:focus-visible { padding-left: 10px; padding-right: 34px; }
.try .go { position: absolute; right: 14px; top: 50%; margin-top: -6px; font-size: 12px; opacity: 0; transform: translateX(-6px); transition: opacity .2s, transform .22s var(--fd-easing); }
.try:hover .go, .try:focus-visible .go { opacity: 1; transform: none; }
.header .btn:active, .header .icon-btn:active { transform: scale(.96); }
.header .icon-btn .pi-sun { transition: transform .4s var(--fd-easing); }
.header .icon-btn:hover .pi-sun { transform: rotate(45deg); }
.spin-enter-active, .spin-leave-active { transition: opacity .16s, transform .22s var(--fd-easing); }
.spin-enter-from { opacity: 0; transform: rotate(-90deg) scale(.6); }
.spin-leave-to { opacity: 0; transform: rotate(90deg) scale(.6); }
.m-menu { position: absolute; top: 84px; left: 16px; right: 16px; display: flex; flex-direction: column; gap: 2px; padding: 10px; border-radius: 24px; pointer-events: auto;
  border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--lift); }
.m-menu a { padding: 12px 14px; border-radius: 14px; color: var(--fd-ink); font: 500 16px/24px var(--fd-font-sans); animation: fd-slide .28s var(--fd-easing) both; animation-delay: calc(var(--i) * 35ms); }
@keyframes fd-slide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.m-menu a:hover { background: var(--fd-panel-2); }
.header.scrolled .m-menu { top: 72px; }
.m-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--fd-line); }
.drop-enter-active, .drop-leave-active { transition: opacity .15s, transform .15s var(--fd-easing); }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-6px); }

/* ============ 01 Hero ============ */
.hero { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; min-height: calc(100dvh - 76px); padding: 40px 0 88px; } /* the first screen is the chat only — the next section starts below the fold */
.hero-lead { max-width: 580px; }
.chat-wrap { width: min(800px, 100%); margin-top: 12px; text-align: left; }
.chat-wrap :deep(.composer) { border-radius: 24px; }
:global(html.fd-light .chat-wrap .composer:not(:focus-within)) { box-shadow: 0 2px 6px rgb(23 24 26 / .05), 0 18px 50px rgb(23 24 26 / .09); }
.checks { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 28px; }
.check { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }
.check .pi { color: var(--fd-accent-text); font-size: 12px; }

/* ============ 03 Product ============ */
.band { padding: 120px 0; background: var(--band); }
.cap { padding: 120px 0; }
.tour-block { margin-top: 56px; }

/* ============ 05 Pricing ============ */
.trial { display: flex; align-items: center; gap: 24px; padding: 8px 8px 8px 24px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.tr-text { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.tr-text b { color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
.tr-text span { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
/* plans in the landing's own style (rounded panels like the product window and FAQ, pill buttons, serif figures, hairlines,
   no glow / fills); from the user's reference: the billing line under the price and the action at the bottom.
   Davit, the plan on sale, gets a firmer border, the accent tag and the one accent button. */
.plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; width: 100%; }
.plan { display: flex; flex-direction: column; padding: 32px 32px 28px; border-radius: 24px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.plan.featured { border-color: color-mix(in srgb, var(--fd-ink) 26%, var(--fd-line)); }
.pl-top { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.pl-name { flex: 1; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.pl-tag { flex-shrink: 0; padding: 3px 10px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/18px var(--fd-font-sans); }
.pl-tag.soon { background: var(--fd-panel-2); color: var(--fd-muted); }
.pl-desc { min-height: 46px; margin-top: 8px; color: var(--fd-muted); font: 400 15px/23px var(--fd-font-sans); }
.pl-price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; margin-top: 24px; }
.pl-num { color: var(--fd-ink); font: 600 46px/1.05 var(--fd-font-serif); letter-spacing: -.6px; white-space: nowrap; }
.pl-per { color: var(--fd-muted); font: 400 15px/22px var(--fd-font-sans); white-space: nowrap; }
.pl-bill { margin-top: 8px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.pl-feats { display: flex; flex-direction: column; gap: 12px; margin: 24px 0 28px; padding: 24px 0 0; border-top: 1px solid var(--fd-line); list-style: none; }
.pl-feats li { display: flex; align-items: center; gap: 12px; color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.pl-feats .pi { color: var(--fd-accent-text); font-size: 12px; }
.pl-btn { display: flex; align-items: center; justify-content: center; gap: 8px; height: 46px; margin-top: auto; border: 1px solid var(--fd-line); border-radius: 999px; background: none;
  color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); cursor: not-allowed; }
.pl-btn .pi { font-size: 12px; transition: transform .2s var(--fd-easing); }
.pl-btn.go { border-color: transparent; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; transition: background-color .15s; }
.pl-btn.go:hover { background: var(--fd-accent-hover); }
.pl-btn.go:hover .pi { transform: translateX(3px); }
.pl-btn:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

/* ============ 06 FAQ ============ */
.faq { padding: 120px 0; background: var(--band); } /* sections alternate: hero · product (band) · pricing · FAQ (band) · CTA */
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
  .nav { gap: 20px; }
  .h1 { font-size: 68px; line-height: 72px; }
  .h2 { font-size: 44px; line-height: 50px; }
  .pl-num { font-size: 38px; }
  .pl-per { flex-basis: 100%; } /* same wrap in every card, so the rows stay aligned */
  .plan { padding: 28px 24px 24px; }
}

/* ============ 390 ============ */
@media (max-width: 767px) {
  .container { width: calc(100% - 32px); }
  section { scroll-margin-top: 80px; }
  .hide-m, .nav { display: none; }
  .show-m { display: grid; }
  .pill { grid-template-columns: 1fr auto; width: calc(100% - 32px); height: 56px; }
  .pill .logo { margin-left: 12px; }
  .h1 { font-size: 44px; line-height: 48px; letter-spacing: -.9px; }
  .h2 { font-size: 32px; line-height: 38px; letter-spacing: -.4px; }
  .lead { font-size: 17px; line-height: 27px; }
  .hero { gap: 20px; min-height: calc(100dvh - 72px); padding: 32px 0 64px; }
  .checks { gap: 6px 18px; }
  .check { font-size: 14px; }
  .band, .cap { padding: 72px 0; }
  .col { gap: 28px; }
  .tour-block { margin-top: 36px; }
  .trial { flex-direction: column; gap: 12px; width: 100%; padding: 18px; border-radius: 22px; text-align: center; }
  .tr-text { justify-content: center; }
  .plans { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .plan { padding: 28px 22px 24px; }
  .plan.featured { order: -1; } /* the plan you can buy comes first on a phone */
  .pl-desc { min-height: 0; margin-top: 10px; }
  .pl-price { margin-top: 24px; }
  .pl-num { font-size: 44px; }
  .pl-feats { margin: 22px 0 26px; padding-top: 22px; }
  .faq { padding: 72px 0; }
  .faq-list { margin-top: 32px; gap: 10px; }
  .faq-row { padding: 16px 16px 16px 18px; font-size: 16px; line-height: 24px; }
  .faq-a { padding: 0 18px 18px; font-size: 15px; line-height: 24px; }
  .cta { padding: 16px 0 72px; }
  .cta-panel { padding: 48px 18px 36px; border-radius: 24px; }
  .ft-top { flex-direction: column; gap: 28px; }
  .ft-bottom { flex-direction: column; align-items: flex-start; }
}
</style>
