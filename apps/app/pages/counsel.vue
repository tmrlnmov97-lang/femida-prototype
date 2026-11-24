<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';

// Counsel (live: /counsel). Works only with an organisation contract, so for everyone else this page is a sales door
// (brief): what it is, why you can't use it yet, and one clear way forward — a short request form. Never blank while
// we check the account (skeleton). Title and intro 1:1 with the live page; the pitch is ours [ASSUMPTION — CTO to confirm].
// Demo: ?state=loading | sent
useHead({ title: 'Counsel — Femida redesign prototype' });
const route = useRoute();

const phase = ref<'loading' | 'ready'>('loading');
onMounted(() => { if (route.query.state !== 'loading') setTimeout(() => (phase.value = 'ready'), 400); });

const tip = ref(false);
const company = ref('');
const email = ref('dev@femid.ai');
const message = ref('');
const sending = ref(false);
const sent = ref(route.query.state === 'sent');
const companyEl = ref<HTMLInputElement>();
const formEl = ref<HTMLElement>();
function toForm() { formEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }); nextTick(() => setTimeout(() => companyEl.value?.focus(), 350)); }
function send() {
  if (!company.value.trim() || !email.value.trim() || sending.value) return;
  sending.value = true;
  setTimeout(() => { sending.value = false; sent.value = true; }, 900);
}
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <header class="head">
          <h1>Counsel</h1>
          <p class="lead">The company’s in-house lawyer: preliminary analysis that prepares your lawyer’s&nbsp;work.</p>
        </header>

        <!-- Why you can't use it yet — calm, with a way forward (not a blue error bar) -->
        <div v-if="phase === 'loading'" class="card status skel" aria-busy="true" aria-label="Checking your account">
          <PSkeleton width="40px" height="40px" border-radius="10px" /><div class="grow"><PSkeleton width="55%" height="18px" /><PSkeleton width="80%" height="14px" /></div>
        </div>
        <div v-else class="card status">
          <span class="s-ic"><i class="pi pi-building" /></span>
          <div class="grow">
            <h2>Counsel works with an organisation contract</h2>
            <p>No organisation is linked to your account yet. Contact us to connect your company.</p>
            <div class="s-actions">
              <button class="primary" @click="toForm">Contact us<i class="pi pi-arrow-right" /></button>
              <button class="ghost" :aria-expanded="tip" @click="tip = !tip">Already in an organisation?</button>
            </div>
            <p v-if="tip" class="tip"><i class="pi pi-info-circle" /><span>Ask your organisation’s admin to invite <b>{{ email }}</b>. Once you’re added, Counsel opens right&nbsp;here.</span></p>
          </div>
        </div>

        <!-- What it does, in three steps -->
        <section class="how" aria-labelledby="how-h">
          <h2 id="how-h">How Counsel helps</h2>
          <ol>
            <li><span class="n">1</span><b>Your team asks</b><span>People in the company bring legal questions as they come&nbsp;up.</span></li>
            <li><span class="n">2</span><b>Counsel prepares the groundwork</b><span>A preliminary analysis with the law and court practice it relies&nbsp;on.</span></li>
            <li><span class="n">3</span><b>Your lawyer decides</b><span>They start from a prepared analysis, not a blank&nbsp;page.</span></li>
          </ol>
        </section>

        <!-- One way forward -->
        <section ref="formEl" class="card form" aria-labelledby="form-h">
          <template v-if="!sent">
            <h2 id="form-h">Request Counsel for your company</h2>
            <p class="sub">Tell us a little about your team and we’ll get back to you by&nbsp;email.</p>
            <form @submit.prevent="send">
              <div class="two">
                <label class="f"><span class="lbl">Company</span><input ref="companyEl" v-model="company" class="input" placeholder="Company name" autocomplete="organization" /></label>
                <label class="f"><span class="lbl">Work email</span><input v-model="email" class="input" type="email" autocomplete="email" /></label>
              </div>
              <label class="f"><span class="lbl">Message <span class="opt">Optional</span></span>
                <textarea v-model="message" class="input area" rows="3" placeholder="How many people would use it, what kind of questions come up…" />
              </label>
              <div class="f-foot">
                <span class="meta">We reply by&nbsp;email.</span>
                <button type="submit" class="primary" :disabled="!company.trim() || !email.trim() || sending">
                  <span v-if="sending" class="dots" aria-hidden="true"><i /><i /><i /></span>{{ sending ? 'Sending' : 'Send request' }}
                </button>
              </div>
            </form>
          </template>
          <div v-else class="done" role="status">
            <span class="d-ic"><i class="pi pi-check" /></span>
            <h2>Request sent</h2>
            <p>We’ll reply to <b>{{ email }}</b>. Meanwhile, the chat and the other tools work as&nbsp;usual.</p>
            <NuxtLink to="/" class="secondary">Back to chat</NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
/* Same frame and scale as the other tools: 760 column · H1 32 serif · section 18/600 · body 15 · meta 13 */
.page { flex: 1; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 48px 0 80px; }
.head { display: grid; gap: 8px; margin-bottom: 32px; }
h1 { margin: 0; color: var(--fd-ink); font: 600 32px/40px var(--fd-font-serif); letter-spacing: -.01em; }
.lead { margin: 0; max-width: 600px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }
h2 { margin: 0; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.card { border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }

/* Status */
.status { display: flex; align-items: flex-start; gap: 16px; padding: 24px; }
.status.skel { align-items: center; }
.grow { display: grid; gap: 6px; flex: 1; min-width: 0; }
.s-ic { display: grid; place-items: center; flex-shrink: 0; width: 40px; height: 40px; border-radius: 10px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.s-ic .pi { font-size: 16px; }
.status p { margin: 0; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: pretty; }
.s-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.tip { display: flex; align-items: flex-start; gap: 8px; margin-top: 12px !important; padding: 12px 14px; border-radius: 10px; background: var(--fd-panel-2); color: var(--fd-ink) !important; font-size: 14px !important; line-height: 22px !important; }
.tip .pi { margin-top: 4px; font-size: 13px; color: var(--fd-accent-text); }
.tip b { font-weight: 600; }

/* How it helps */
.how { margin-top: 48px; }
.how h2 { margin-bottom: 16px; }
.how ol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 0; padding: 0; list-style: none; }
.how li { display: grid; align-content: start; gap: 4px; padding: 20px; border-radius: 12px; border: 1px solid var(--fd-line); }
.how .n { display: grid; place-items: center; width: 24px; height: 24px; margin-bottom: 8px; border-radius: 50%; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.how b { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.how li > span:last-child { color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); text-wrap: pretty; }

/* Form */
.form { margin-top: 48px; padding: 24px; scroll-margin-top: 24px; }
.sub { margin: 4px 0 20px; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }
form { display: grid; gap: 16px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.f { display: grid; gap: 8px; min-width: 0; }
.lbl { display: flex; align-items: baseline; gap: 8px; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.opt { color: var(--fd-muted); font-weight: 400; font-size: 13px; }
.input { width: 100%; height: 48px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
.input.area { height: auto; min-height: 96px; padding: 12px 14px; resize: vertical; line-height: 24px; }
.input::placeholder { color: var(--fd-muted); }
.input:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.f-foot { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.meta { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.done { display: grid; justify-items: center; gap: 6px; padding: 16px 0; text-align: center; }
.done p { margin: 0 0 12px; max-width: 440px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }
.done b { color: var(--fd-ink); font-weight: 500; }
.d-ic { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 6px; border-radius: 50%; background: var(--fd-accent); color: var(--fd-on-accent); }
.dots { display: inline-flex; gap: 3px; }
.dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: blink 1s infinite; }
.dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 50% { opacity: .25; } }

/* Buttons */
.primary, .secondary, .ghost { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px; cursor: pointer; white-space: nowrap; text-decoration: none; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, border-color .15s, color .15s, opacity .15s; }
.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.primary:disabled { opacity: .4; cursor: default; }
.secondary { border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); }
.secondary:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.ghost { border: 0; background: transparent; color: var(--fd-muted); padding: 0 12px; }
.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.primary .pi, .secondary .pi { font-size: 12px; }
.primary:focus-visible, .secondary:focus-visible, .ghost:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 24px 0 56px; }
  .head { margin-bottom: 24px; }
  h1 { font-size: 26px; line-height: 34px; }
  .lead { font-size: 15px; line-height: 24px; }
  .status { flex-direction: column; padding: 20px; }
  .how { margin-top: 32px; }
  .how ol { grid-template-columns: 1fr; gap: 8px; }
  .form { margin-top: 32px; padding: 20px; }
  .two { grid-template-columns: 1fr; }
  .f-foot { flex-direction: column-reverse; align-items: stretch; }
}
</style>
