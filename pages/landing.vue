<script setup lang="ts">
import { ref, onMounted } from 'vue';

// Public website · Home (Figma MuXNHQVKOE55lGpjzUIOWt, node 33:2 "Home · 1440 · Dark"), transcribed 1:1 from get_design_context.
// Colours use the --fd-* tokens the Figma variables are named after; icons/glows are the exported Figma SVGs (public/landing).
useHead({ title: 'femid.ai — Legal answers you can verify' });
const A = useLandingAsset();

const light = ref(false);
onMounted(() => {
  if (useRoute().query.theme === 'light') document.documentElement.classList.add('fd-light'); // same review switch as in the app
  light.value = document.documentElement.classList.contains('fd-light');
});
function toggleTheme() { light.value = !light.value; document.documentElement.classList.toggle('fd-light', light.value); }
// Every sign-up / log-in entry opens the same dialog; the hero composer passes the guest's question along
const { openAuth } = useAuthDialog();

const SOURCES = [
  { i: 'c261e', t: 'Legislation of the RA' }, { i: '30ee6', t: 'Court practice' }, { i: '7ff71', t: 'Tax rulings' },
  { i: 'bc9d9', t: 'ECHR decisions' }, { i: 'f9264', t: 'Legal library' },
];
const POINTS = ['Every statement linked to its source', 'Sources you can open and check yourself', 'An honest “no” instead of a confident guess'];
const TRUST = [
  { i: '3ec64', t: 'Encrypted documents', b: 'Files up to 25 MB, stored encrypted.' },
  { i: '38a39', t: 'Your card stays with the bank', b: 'Payments go through the bank — femid.ai never sees card data.' },
  { i: '4c9f1', t: 'An Armenian company', b: 'FEMIDAI LLC · registration no. 02337069' },
];
const PLANS = [
  { name: 'Pokr Mher', price: '5,000', desc: 'Basic Q&A for individual users', feats: ['Basic Q&A with sources', 'For individual users'] },
  { name: 'Mets Mher', price: '20,000', desc: 'Extended features for medium workloads', feats: ['Extended features', 'For medium workloads'] },
];
const FAQ = [
  { q: 'Where do the answers come from?', a: 'From Armenian legislation, court practice, tax rulings and ECHR decisions. Every statement in an answer links to the source it is based on.' },
  { q: 'What happens if there is no source?', a: 'We don’t answer. You get a clear “no source found” message with ideas for rephrasing — never a guess.' },
  { q: 'Is my data safe?', a: 'Uploaded files are encrypted, up to 25 MB each. Card details are handled only by the bank; femid.ai never sees or stores them.' },
  { q: 'What does the free trial include?', a: '50 questions, no card needed.' },
  { q: 'Can my whole firm use it?', a: 'Yes. Organisations get shared seats and invites, and Counsel mode works under an organisation contract.' },
];
const open = ref<number | null>(0);
</script>

<template>
  <div class="site">
    <!-- ============ Hero ============ -->
    <section class="hero">
      <img class="hero-glow-top" :src="A('b18b6')" alt="" />

      <header class="header">
        <div class="h-in">
          <p class="logo">femid<span>.ai</span></p>
          <nav class="h-nav"><a href="#features">Product</a><a href="#pricing">Pricing</a><a href="#">About</a><a href="#">Blog</a></nav>
          <div class="grow" />
          <div class="h-actions">
            <button class="theme" :aria-label="light ? 'Dark theme' : 'Light theme'" @click="toggleTheme"><img :src="A('462e3')" alt="" width="20" height="20" /></button>
            <button class="btn secondary" @click="openAuth('login')">Log in</button>
            <button class="btn primary" @click="openAuth('register')">Try free</button>
          </div>
        </div>
      </header>

      <div class="intro">
        <h1 class="headline"><span class="l1">Legal answers</span><span class="l2 grad">you can verify.</span></h1>
        <p class="lead hero-lead">Ask in Armenian. femid.ai searches legislation, court practice and ECHR decisions — and cites the exact source behind every statement.</p>
        <!-- The landing starts with the chat: type a question, sending it asks to sign up (or log in) first -->
        <div class="hero-chat"><ChatComposer variant="hero" gate @ask="openAuth('register', $event)" /></div>
        <div class="notes">
          <span v-for="n in ['50 free questions', 'No card needed', 'Armenian interface']" :key="n" class="note"><img :src="A('d13ff')" alt="" width="16" height="16" />{{ n }}</span>
        </div>
      </div>

    </section>

    <!-- ============ Grounded in ============ -->
    <section class="grounded">
      <p class="eyebrow muted">Every answer is grounded in official Armenian sources</p>
      <div class="g-list">
        <span v-for="s in SOURCES" :key="s.t" class="g-item"><img :src="A(s.i)" alt="" width="24" height="24" />{{ s.t }}</span>
      </div>
    </section>

    <!-- ============ Features ============ -->
    <section id="features" class="features">
      <div class="container">
        <div class="f-head">
          <p class="eyebrow">What femid.ai does</p>
          <h2 class="section-title" style="width: 760px">One assistant for the whole legal question.</h2>
          <p class="lead" style="width: 620px">From a quick answer to a drafted appeal — every step stays tied to the law it rests on.</p>
        </div>
        <FeatureBento />
      </div>
    </section>

    <!-- ============ Manifesto ============ -->
    <section class="manifesto">
      <img class="m-glow" :src="A('8e75c')" alt="" />
      <div class="container m-row">
        <div class="m-copy">
          <p class="eyebrow">Our one rule</p>
          <h2 class="section-title m-title"><span>If we can’t cite it,</span><span class="grad">we don’t say it.</span></h2>
          <p class="lead">General chatbots answer every question — even when they have to guess. femid.ai answers only when it can point to a law, a court decision or ECHR practice. Otherwise it&nbsp;tells&nbsp;you&nbsp;so.</p>
          <div class="points">
            <span v-for="p in POINTS" :key="p" class="point"><span class="p-mark"><img :src="A('d13ff')" alt="" width="16" height="16" /></span>{{ p }}</span>
          </div>
        </div>
        <div class="refusal">
          <div class="r-head"><span class="r-mark"><img :src="A('d2fe0')" alt="" width="20" height="20" /></span><p>No source found — so no answer</p></div>
          <p class="r-body">We only answer when we can point to a law, a court decision or ECHR practice. For this question we found nothing we can stand behind, so we won't guess. Your question wasn't counted.</p>
          <p class="r-try">Try one of these</p>
          <div class="r-sugs">
            <span v-for="s in ['Rephrase with the article or law name', 'Narrow it to one situation', 'Search court practice instead']" :key="s" class="sug">{{ s }}<img :src="A('bad6f')" alt="" width="16" height="16" /></span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ How it works ============ -->
    <section id="how" class="how">
      <div class="container how-in">
        <div class="how-head">
          <p class="eyebrow">How it works</p>
          <h2 class="section-title center" style="width: 820px">From question to verified answer in a minute.</h2>
        </div>
        <div class="steps">
          <div class="step">
            <div class="s-visual"><div class="s-stage">
              <img class="s-ellipse" :src="A('83fdb')" alt="" />
              <div class="s-composer">
                <p>Can I still contest my dismissal after six weeks?</p>
                <div class="s-row"><img :src="A('dc98d')" alt="" width="18" height="18" /><span class="s-spacer" /><span class="s-send"><img :src="A('fe5e6')" alt="" width="16" height="16" /></span></div>
              </div>
            </div></div>
            <div class="s-head"><span class="grad">01</span><span>Ask in Armenian</span></div>
            <p class="s-body">Type the question the way you would ask a colleague. Attach a contract or a decision if you have one.</p>
          </div>
          <div class="step">
            <div class="s-visual"><div class="s-stage">
              <img class="s-ellipse" :src="A('83fdb')" alt="" />
              <div class="s-src" style="top: 35px"><img :src="A('71232')" alt="" width="18" height="18" /><span>Labour Code · Art. 265</span><img :src="A('6987b')" alt="" width="18" height="18" /></div>
              <div class="s-src" style="top: 83px"><img :src="A('a728b')" alt="" width="18" height="18" /><span>Court of Cassation · 2021</span><img :src="A('6987b')" alt="" width="18" height="18" /></div>
              <div class="s-src" style="top: 131px"><img :src="A('496e6')" alt="" width="18" height="18" /><span>ECHR · Article 6</span><img :src="A('12f8b')" alt="" width="18" height="18" /></div>
            </div></div>
            <div class="s-head"><span class="grad">02</span><span>We find the sources</span></div>
            <p class="s-body">femid.ai searches legislation in force, court practice and ECHR decisions for exactly your situation.</p>
          </div>
          <div class="step">
            <div class="s-visual"><div class="s-stage">
              <img class="s-ellipse" :src="A('83fdb')" alt="" />
              <p class="s-answer">Yes, if you learned of the order late: the one-month period runs from the day you learned of it <b>[1]</b>, and courts restore it for a valid reason <b>[2]</b>.</p>
            </div></div>
            <div class="s-head"><span class="grad">03</span><span>Get an answer you can check</span></div>
            <p class="s-body">A reasoned answer where every statement links to its source — or an honest “no source found”.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Trust ============ -->
    <section class="trust">
      <div class="container t-box">
        <div v-for="t in TRUST" :key="t.t" class="t-item">
          <span class="t-mark"><img :src="A(t.i)" alt="" width="20" height="20" /></span>
          <span class="t-text"><b>{{ t.t }}</b><span>{{ t.b }}</span></span>
        </div>
      </div>
    </section>

    <!-- ============ Pricing ============ -->
    <section id="pricing" class="pricing">
      <div class="container pr-in">
        <div class="pr-head">
          <p class="eyebrow">Pricing</p>
          <h2 class="section-title center">Start free. Pay when it works for you.</h2>
          <p class="lead center">Monthly plans in Armenian dram, taxes included. Pay by Visa, Mastercard or ArCa.</p>
        </div>
        <div class="trial">
          <img :src="A('d50e7')" alt="" width="24" height="24" />
          <span class="tr-text"><b>Free trial — 50 questions</b><span>No card needed — try it on your own cases.</span></span>
          <button class="btn primary" @click="openAuth('register')">Start free</button>
        </div>
        <div class="plans">
          <div v-for="p in PLANS" :key="p.name" class="plan">
            <div class="pl-top"><p class="pl-name">{{ p.name }}</p><span class="tag amber">Soon</span></div>
            <div class="pl-price"><span class="pl-num">{{ p.price }}</span><span class="pl-per">AMD / month</span></div>
            <p class="pl-desc">{{ p.desc }}</p>
            <div class="pl-div" />
            <div class="pl-feats"><span v-for="f in p.feats" :key="f" class="pl-feat"><img :src="A('109fc')" alt="" width="20" height="20" />{{ f }}</span></div>
            <button class="btn disabled" disabled>Coming soon</button>
          </div>
          <div class="plan featured">
            <div class="pl-top"><p class="pl-name">Davit</p><span class="tag accent">Most complete</span></div>
            <div class="pl-price"><span class="pl-num">200,000</span><span class="pl-per">AMD / month</span></div>
            <p class="pl-desc">In-depth legal research with full sources</p>
            <div class="pl-div" />
            <div class="pl-feats"><span v-for="f in ['Document analysis', 'Drafting', 'Priority support']" :key="f" class="pl-feat"><img :src="A('109fc')" alt="" width="20" height="20" />{{ f }}</span></div>
            <button class="btn primary full" @click="openAuth('register')">Choose Davit</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ FAQ ============ -->
    <section class="faq">
      <div class="container faq-in">
        <div class="faq-intro">
          <p class="eyebrow">FAQ</p>
          <h2 class="section-title">Questions lawyers ask us</h2>
          <p class="body">Something else on your mind? Write to us and we’ll&nbsp;answer.</p>
          <a class="mail" href="mailto:femidai@femid.ai">femidai@femid.ai<img :src="A('298b7')" alt="" width="16" height="16" /></a>
        </div>
        <div class="faq-items">
          <div v-for="(f, i) in FAQ" :key="f.q" class="faq-item">
            <button class="faq-row" :aria-expanded="open === i" @click="open = open === i ? null : i">
              <span>{{ f.q }}</span><img :src="A(open === i ? '7a3ea' : '0721d')" alt="" width="20" height="20" />
            </button>
            <p v-if="open === i" class="faq-a">{{ f.a }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ CTA ============ -->
    <section class="cta">
      <div class="container band">
        <img class="b-glow" :src="A('36420')" alt="" />
        <div class="b-grid" :style="{ maskImage: `url(${A('570f2')})`, WebkitMaskImage: `url(${A('570f2')})` }" />
        <h2 class="section-title center b-title"><span>Ask your first question</span><span class="grad">today.</span></h2>
        <p class="lead nowrap">For lawyers, advocates and law firms in Armenia.</p>
        <div class="ctas">
          <button class="btn primary" @click="openAuth('register')">Start free</button>
          <a class="btn secondary" href="mailto:femidai@femid.ai">Talk to us</a>
        </div>
        <p class="b-note">50 free questions · No card needed</p>
      </div>
    </section>

    <!-- ============ Footer ============ -->
    <footer class="footer">
      <div class="container ft-in">
        <div class="ft-top">
          <div class="ft-brand"><p class="logo">femid<span>.ai</span></p><p class="ft-tag">Armenian legal AI platform</p></div>
          <div class="grow" />
          <div class="ft-col"><b>Product</b><a href="#features">Product</a><a href="#pricing">Pricing</a><a href="#">Blog</a></div>
          <div class="ft-col"><b>Company</b><a href="#">About</a><a href="#">Contact</a></div>
          <div class="ft-col"><b>Legal</b><a href="#">Terms</a><a href="#">Privacy</a><a href="#">Personal data</a><a href="#">Cancellation / refund</a></div>
        </div>
        <div class="ft-bottom">
          <p>© 2026 FEMIDAI LLC · registration no. 02337069 · femidai@femid.ai</p>
          <div class="grow" />
          <div class="marks"><span>VISA</span><span>Mastercard</span><span>ArCa</span></div>
        </div>
      </div>
    </footer>
    <div class="wordmark"><p>femid.ai</p></div>
    <AuthDialog />
  </div>
</template>

<style scoped>
/* Typography from the Figma text styles: fd/hero 88/92 serif · fd/section 56/62 serif · fd/lead 20/32 · fd/h3 22/30 · fd/h4 18/26 ·
   fd/body 16/26 · fd/body-sm 15/24 · fd/label 15/20 medium · fd/caption 14/20 · fd/eyebrow 14/20 semibold, tracking 1.12px, caps */
.site { height: 100dvh; overflow-y: auto; overflow-x: hidden; background: var(--fd-bg); color: var(--fd-ink); scroll-behavior: smooth; }
p { margin: 0; }
img { display: block; flex-shrink: 0; max-width: none; }
a { color: inherit; text-decoration: none; }
.grow { flex: 1; min-width: 1px; }
/* Content width: up to 1320 with 48px side gutters (was a fixed 1200 — the page looked squeezed) */
.container { width: min(1320px, calc(100% - 96px)); margin: 0 auto; }
.grad { background: linear-gradient(90deg, #cfe6d9, #7fb89a); -webkit-background-clip: text; background-clip: text; color: transparent; }
.eyebrow { color: var(--fd-accent-text); font: 600 14px/20px var(--fd-font-sans); letter-spacing: 1.12px; text-transform: uppercase; white-space: nowrap; }
.eyebrow.muted { color: var(--fd-muted); }
.section-title { margin: 0; color: var(--fd-ink); font: 600 56px/62px var(--fd-font-serif); letter-spacing: -.84px; }
.center { text-align: center; }
.lead { color: var(--fd-muted); font: 400 20px/32px var(--fd-font-sans); }
.nowrap { white-space: nowrap; }
.body { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.logo { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); white-space: nowrap; }
.logo span { color: var(--fd-accent-text); }

/* Buttons: Size M — padding 12 20, radius 8, label 15/20 medium */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 8px; border: 0; cursor: pointer; white-space: nowrap; font: 500 15px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s; }
.btn.primary { background: var(--fd-accent); color: var(--fd-on-accent); }
.btn.primary:hover { background: var(--fd-accent-hover); }
.btn.secondary { border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.btn.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.btn.disabled { width: 100%; background: var(--fd-panel-2); color: var(--fd-muted); cursor: default; }
.btn.full { width: 100%; }
.btn:focus-visible, .theme:focus-visible, .faq-row:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.tag { display: inline-flex; align-items: center; flex-shrink: 0; padding: 2px 8px; border-radius: 999px; font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.tag.amber { background: var(--fd-amber-soft); color: var(--fd-amber); }
.tag.accent { background: var(--fd-accent-soft); color: var(--fd-accent-text); }

/* ============ Hero ============ */
/* Header + intro with the chat box (the static product shot was removed on user request); height follows the content */
.hero { position: relative; display: flex; flex-direction: column; align-items: center; gap: 51px; padding-bottom: 96px; overflow: hidden; }
.hero-glow-top { position: absolute; left: calc(50% - 650px); top: -300px; width: 1300px; height: 780px; }
.header { position: relative; display: flex; justify-content: center; width: 100%; height: 72px; flex-shrink: 0; background: var(--fd-bg); }
.h-in { display: flex; align-items: center; gap: 32px; width: min(1320px, calc(100% - 96px)); }
.h-nav { display: flex; gap: 32px; color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.h-nav a:hover { color: var(--fd-ink); }
.h-actions { display: flex; align-items: center; gap: 12px; }
.theme { display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); cursor: pointer; }
.intro { position: relative; display: flex; flex-direction: column; align-items: center; gap: 24px; padding-top: 96px; flex-shrink: 0; }
.headline { display: flex; flex-direction: column; align-items: center; margin: 0; font: 600 88px/92px var(--fd-font-serif); letter-spacing: -1.76px; text-align: center; white-space: nowrap; }
.headline .l1 { color: var(--fd-ink); }
.hero-lead { width: 580px; text-align: center; }
.ctas { display: flex; gap: 12px; align-items: flex-start; }
.hero-chat { width: 760px; text-align: left; }
.notes { display: flex; align-items: center; gap: 24px; }
.note { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }

/* ============ Grounded in ============ */
.grounded { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 48px 0; }
.g-list { display: flex; align-items: center; gap: 48px; }
.g-item { display: flex; align-items: center; gap: 12px; color: var(--fd-muted); font: 600 18px/26px var(--fd-font-sans); white-space: nowrap; }

/* ============ Features ============ */
.features { padding: 96px 0; }
.f-head { display: flex; flex-direction: column; gap: 16px; margin-bottom: 48px; }

/* ============ Manifesto ============ */
.manifesto { position: relative; padding: 96px 0; background: var(--fd-panel); overflow: hidden; }
.m-glow { position: absolute; left: calc(50% - 120px); top: 260px; width: 900px; height: 500px; }
.m-row { position: relative; display: flex; align-items: center; gap: 64px; }
.m-copy { display: flex; flex-direction: column; gap: 24px; flex: 1; min-width: 0; }
.m-title { display: flex; flex-direction: column; white-space: nowrap; }
.points { display: flex; flex-direction: column; gap: 16px; }
.point { display: flex; align-items: center; gap: 12px; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); white-space: nowrap; }
.p-mark { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; background: var(--fd-accent-soft); }
.refusal { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; width: 560px; padding: 20px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); filter: drop-shadow(0 24px 60px rgba(127, 184, 154, .1)); }
.r-head { display: flex; align-items: center; gap: 12px; }
.r-head p { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); white-space: nowrap; }
.r-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 999px; background: var(--fd-accent-soft); }
.r-body { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.r-try { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.r-sugs { display: flex; flex-wrap: wrap; gap: 8px; }
.sug { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }

/* ============ How it works ============ */
.how { padding: 96px 0; }
.how-in { display: flex; flex-direction: column; align-items: center; gap: 48px; }
.how-head { display: flex; flex-direction: column; align-items: center; gap: 16px; }
.steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; gap: 24px; width: 100%; }
.step { display: flex; flex-direction: column; gap: 24px; min-width: 0; }
.s-visual { position: relative; width: 100%; height: 200px; overflow: hidden; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.s-stage { position: absolute; top: 0; bottom: 0; left: 50%; width: 384px; transform: translateX(-50%); } /* Figma composition, centred */
.s-ellipse { position: absolute; left: 21px; top: -151px; width: 340px; height: 240px; }
.s-composer { position: absolute; left: 31px; top: 35px; display: flex; flex-direction: column; gap: 12px; width: 320px; padding: 16px 16px 12px; border-radius: 8px; border: 1.5px solid var(--fd-accent); background: var(--fd-panel-2); }
.s-composer p { color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.s-row { display: flex; align-items: center; }
.s-spacer { flex: 1; height: 100px; }
.s-send { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--fd-accent); }
.s-src { position: absolute; left: 31px; display: flex; align-items: center; gap: 12px; width: 320px; height: 40px; padding: 0 12px; border-radius: 8px; background: var(--fd-panel-2); }
.s-src span { flex: 1; min-width: 1px; color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.s-answer { position: absolute; left: 31px; top: 39px; width: 320px; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.s-answer b { color: var(--fd-accent-text); font-weight: 600; }
.s-head { display: flex; align-items: center; gap: 12px; font: 600 22px/30px var(--fd-font-sans); white-space: nowrap; }
.s-head span:last-child { color: var(--fd-ink); }
.s-body { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }

/* ============ Trust ============ */
.trust { padding: 48px 0; }
.t-box { display: flex; align-items: flex-start; overflow: hidden; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.t-item { display: flex; gap: 16px; flex: 1; min-width: 1px; padding: 24px 32px; }
.t-item + .t-item { border-left: 1px solid var(--fd-line); }
.t-mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 8px; background: var(--fd-accent-soft); }
.t-text { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 1px; }
.t-text b { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.t-text span { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }

/* ============ Pricing ============ */
.pricing { padding: 96px 0; }
.pr-in { display: flex; flex-direction: column; align-items: center; gap: 48px; }
.pr-head { display: flex; flex-direction: column; align-items: center; gap: 16px; white-space: nowrap; }
.trial { display: flex; align-items: center; gap: 16px; width: 100%; height: 80px; padding: 24px 24px 24px 32px; border-radius: 16px; border: 1px solid rgba(143, 199, 168, .55); background: var(--fd-accent-soft); }
.tr-text { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 1px; white-space: nowrap; }
.tr-text b { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.tr-text span { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.plans { display: flex; align-items: flex-end; gap: 24px; width: 100%; }
.plan { display: flex; flex-direction: column; gap: 16px; flex: 1; min-width: 1px; padding: 24px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.plan.featured { border: 2px solid var(--fd-accent); filter: drop-shadow(0 24px 60px rgba(127, 184, 154, .1)); }
.pl-top { display: flex; align-items: center; gap: 8px; }
.pl-name { flex: 1; color: var(--fd-ink); font: 600 22px/30px var(--fd-font-sans); }
.pl-price { display: flex; align-items: baseline; gap: 8px; white-space: nowrap; }
.pl-num { color: var(--fd-ink); font: 700 36px/44px var(--fd-font-serif); }
.pl-per { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.pl-desc { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.pl-div { height: 1px; background: var(--fd-line); }
.pl-feats { display: flex; flex-direction: column; gap: 12px; }
.pl-feat { display: flex; align-items: flex-start; gap: 8px; color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }

/* ============ FAQ ============ */
.faq { padding: 96px 0; }
.faq-in { display: flex; align-items: flex-start; gap: 64px; }
.faq-intro { display: flex; flex-direction: column; gap: 16px; width: 400px; flex-shrink: 0; }
.mail { display: flex; align-items: center; gap: 8px; color: var(--fd-accent-text); font: 500 15px/20px var(--fd-font-sans); }
.faq-items { display: flex; flex-direction: column; flex: 1; min-width: 1px; }
.faq-item { display: flex; flex-direction: column; gap: 12px; padding: 20px; border-bottom: 1px solid var(--fd-line); }
.faq-row { display: flex; align-items: center; gap: 16px; width: 100%; padding: 0; border: 0; background: none; cursor: pointer; text-align: left; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.faq-row span { flex: 1; min-width: 1px; }
.faq-a { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }

/* ============ CTA ============ */
.cta { padding: 48px 0; }
.band { position: relative; display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 96px 0; overflow: hidden; border-radius: 16px; border: 1px solid rgba(143, 199, 168, .55); background: var(--fd-panel); }
.b-glow { position: absolute; left: calc(50% - 501px); top: -201px; width: 1000px; height: 520px; }
.b-grid { position: absolute; left: -1px; top: -41px; width: calc(100% + 1px); height: 520px; pointer-events: none;
  background-image: linear-gradient(90deg, var(--fd-ink) 1px, transparent 1px), linear-gradient(180deg, var(--fd-ink) 1px, transparent 1px); background-size: 60px 60px;
  -webkit-mask-size: 100% 520px; mask-size: 100% 520px; -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat; mask-mode: alpha; }
.b-title { position: relative; display: flex; flex-direction: column; align-items: center; white-space: nowrap; }
.band > .lead, .band > .ctas, .band > .b-note { position: relative; }
.b-note { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }

/* ============ Footer ============ */
.footer { padding: 40px 0; background: var(--fd-bg); }
.ft-in { display: flex; flex-direction: column; gap: 24px; }
.ft-top { display: flex; align-items: flex-start; gap: 48px; }
.ft-brand { display: flex; flex-direction: column; gap: 8px; }
.ft-tag { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }
.ft-col { display: flex; flex-direction: column; gap: 12px; white-space: nowrap; }
.ft-col b { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.ft-col a { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.ft-col a:hover { color: var(--fd-ink); }
.ft-bottom { display: flex; align-items: center; }
.ft-top > .grow, .ft-bottom > .grow { height: 100px; } /* the Figma spacers are 100px tall — they set the row heights */
.ft-bottom p { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.marks { display: flex; gap: 8px; }
.marks span { display: flex; align-items: center; height: 32px; padding: 0 12px; border-radius: 8px; border: 1px dashed var(--fd-line); background: var(--fd-panel-2); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.wordmark { display: flex; justify-content: center; height: 200px; overflow: hidden; }
.wordmark p { font: 600 300px/300px var(--fd-font-serif); letter-spacing: -9px; white-space: nowrap;
  background: linear-gradient(180deg, rgba(236, 237, 238, .1) 0%, rgba(236, 237, 238, 0) 75%); -webkit-background-clip: text; background-clip: text; color: transparent; }
</style>
