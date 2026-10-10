<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import type { AuthStep } from '~/composables/useAuthDialog';

// Sign-in over the website. Cards are the Figma AuthCard variants 1:1 (Login 28:88 · Register 28:124 · Code 28:171 · Forgot 28:205);
// fields follow Input 10:3 / Password 10:84 / OTP 11:21. Live site: email + password; brief: 6-digit email code valid 15 min.
// Prototype: any 6 digits are accepted; "forgot → code" signs in directly (no "new password" screen in Figma) [ASSUMPTION].
const { auth, closeAuth } = useAuthDialog();
const { state: chat } = useChat();
const A = useLandingAsset();

const step = computed({ get: () => auth.value.step, set: (s: AuthStep) => (auth.value = { ...auth.value, step: s }) });
const codeFor = ref<'signup' | 'reset'>('signup');
const f = reactive({ name: '', email: '', password: '' });
const show = ref(false);
const tried = ref(false);
const busy = ref(false);
const dialog = ref<HTMLElement>();

/* Validation (errors appear after the first submit, under the field) */
const emailOk = computed(() => /^\S+@\S+\.\S+$/.test(f.email.trim()));
const pwOk = computed(() => f.password.length >= 8 && /[a-z]/i.test(f.password) && /\d/.test(f.password));
const errors = computed(() => ({
  name: step.value === 'register' && !f.name.trim() ? 'Enter your full name' : '',
  email: !emailOk.value ? 'Enter a valid email' : '',
  password: step.value === 'register' ? (!pwOk.value ? 'At least 8 characters, a letter and a digit' : '') : step.value === 'login' && !f.password ? 'Enter your password' : '',
}));

/* Password strength (Register): 4 segments + word, never colour alone */
const strength = computed(() => {
  const p = f.password;
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/i.test(p) && /\d/.test(p)) s++;
  if (p.length >= 12) s++;
  if (/[^a-z0-9]/i.test(p) || (/[a-z]/.test(p) && /[A-Z]/.test(p))) s++;
  return Math.max(1, s);
});
const strengthWord = computed(() => (strength.value <= 1 ? 'Weak' : strength.value === 2 ? 'Medium' : 'Strong'));
const strengthTone = computed(() => (strength.value <= 1 ? 'weak' : strength.value === 2 ? 'medium' : 'strong'));

/* OTP: 6 cells, auto-advance, paste, backspace; resend after a timer */
const digits = ref<string[]>(['', '', '', '', '', '']);
const cells = ref<HTMLInputElement[]>([]);
const codeErr = ref('');
const left = ref(59);
const resent = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;
function startTimer() { clearInterval(timer); left.value = 59; timer = setInterval(() => { if (left.value > 0) left.value--; else clearInterval(timer); }, 1000); }
const mmss = computed(() => `0:${String(left.value).padStart(2, '0')}`);
function onCell(i: number, e: Event) {
  const v = (e.target as HTMLInputElement).value.replace(/\D/g, '');
  digits.value[i] = v.slice(-1);
  codeErr.value = '';
  if (v && i < 5) cells.value[i + 1]?.focus();
}
function onCellKey(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) { digits.value[i - 1] = ''; cells.value[i - 1]?.focus(); e.preventDefault(); }
  if (e.key === 'ArrowLeft' && i > 0) cells.value[i - 1]?.focus();
  if (e.key === 'ArrowRight' && i < 5) cells.value[i + 1]?.focus();
  if (e.key === 'Enter') confirmCode();
}
function onPaste(e: ClipboardEvent) {
  const t = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
  if (!t) return;
  e.preventDefault();
  digits.value = Array.from({ length: 6 }, (_, k) => t[k] ?? '');
  cells.value[Math.min(t.length, 5)]?.focus();
}
function resend() { startTimer(); resent.value = true; setTimeout(() => (resent.value = false), 2500); }

/* Steps */
function go(s: AuthStep) { step.value = s; tried.value = false; codeErr.value = ''; show.value = false; focusFirst(); }
function toCode(kind: 'signup' | 'reset') {
  codeFor.value = kind; digits.value = ['', '', '', '', '', '']; codeErr.value = ''; resent.value = false;
  step.value = 'code'; startTimer(); focusFirst();
}
function submit() {
  tried.value = true;
  const keys = step.value === 'register' ? (['name', 'email', 'password'] as const) : step.value === 'login' ? (['email', 'password'] as const) : (['email'] as const);
  const bad = keys.find((k) => errors.value[k]);
  if (bad) { nextTick(() => dialog.value?.querySelector<HTMLElement>(`[data-f="${bad}"]`)?.focus()); return; }
  busy.value = true;
  setTimeout(() => {
    busy.value = false;
    if (step.value === 'register') toCode('signup');
    else if (step.value === 'forgot') toCode('reset');
    else finish();
  }, 700);
}
function confirmCode() {
  if (digits.value.join('').length < 6) { codeErr.value = 'Enter all 6 digits'; return; }
  busy.value = true;
  setTimeout(() => { busy.value = false; finish(); }, 700);
}
function changeEmail() { go(codeFor.value === 'reset' ? 'forgot' : 'register'); nextTick(() => dialog.value?.querySelector<HTMLElement>('[data-f="email"]')?.focus()); }
function finish() {
  const q = auth.value.question;
  clearInterval(timer);
  closeAuth();
  chat.pendingAsk = q; // the app sends it on arrival; mode and attached file are already in the shared chat store
  navigateTo('/');
}

/* Dialog behaviour (same as RequestForm): focus on open, trap Tab, Esc / backdrop / × close */
let opener: HTMLElement | null = null;
function focusFirst() { nextTick(() => dialog.value?.querySelector<HTMLElement>('[data-first], input')?.focus()); }
watch(() => auth.value.open, (v) => {
  if (v) { opener = document.activeElement as HTMLElement | null; tried.value = false; busy.value = false; show.value = false; if (step.value === 'code') startTimer(); focusFirst(); }
  else { clearInterval(timer); nextTick(() => opener?.focus?.()); }
});
function onKey(e: KeyboardEvent) {
  if (!auth.value.open) return;
  if (e.key === 'Escape') { e.preventDefault(); closeAuth(); }
  if (e.key === 'Tab' && dialog.value) {
    const els = [...dialog.value.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
}
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => { document.removeEventListener('keydown', onKey); clearInterval(timer); });

const HEAD = {
  register: { tag: 'Sign up', title: 'Create an account', sub: '50 free questions. No card needed.' },
  login: { tag: 'Log in', title: 'Welcome back', sub: 'Log in to continue with your account.' },
  forgot: { tag: 'Password reset', title: 'Forgot your password?', sub: 'Enter your email and we\'ll send you a code to reset it.' },
  code: { tag: 'Check your email', title: 'Enter the code', sub: '' },
} as const;
</script>

<template>
  <Teleport to="body">
    <Transition name="au">
      <div v-if="auth.open" class="au-wrap" @pointerdown.self="closeAuth">
        <div ref="dialog" class="au-col" role="dialog" aria-modal="true" aria-labelledby="au-title">
          <!-- The guest's question stays in view -->
          <div v-if="auth.question" class="au-q">
            <span class="au-q-label">Your question</span>
            <p class="au-q-text">{{ auth.question }}</p>
          </div>

          <div class="card">
            <button class="au-x" aria-label="Close" @click="closeAuth"><i class="pi pi-times" /></button>
            <p class="logo">femid<span>.ai</span></p>
            <div class="head">
              <span class="tag">{{ HEAD[step].tag }}</span>
              <h2 id="au-title" class="title">{{ HEAD[step].title }}</h2>
              <p v-if="step !== 'code'" class="sub">{{ HEAD[step].sub }}</p>
              <p v-else class="sub">We sent a 6-digit code to {{ f.email.trim() || 'your email' }}. It is valid for 15&nbsp;minutes.</p>
            </div>

            <!-- Register / Login / Forgot -->
            <form v-if="step !== 'code'" class="fields" novalidate @submit.prevent="submit">
              <label v-if="step === 'register'" class="field">
                <span class="label">Full name</span>
                <input v-model="f.name" data-f="name" data-first class="box" :class="{ bad: tried && errors.name }" placeholder="Ani Hakobyan" autocomplete="name" />
                <span v-if="tried && errors.name" class="err"><i class="pi pi-exclamation-circle" />{{ errors.name }}</span>
              </label>
              <label class="field">
                <span class="label">Email</span>
                <input v-model="f.email" data-f="email" :data-first="step !== 'register' ? '' : undefined" class="box" :class="{ bad: tried && errors.email }" type="email" placeholder="anun@grasenyak.am" autocomplete="email" />
                <span v-if="tried && errors.email" class="err"><i class="pi pi-exclamation-circle" />{{ errors.email }}</span>
              </label>
              <label v-if="step !== 'forgot'" class="field">
                <span class="label">Password</span>
                <span class="box pw" :class="{ bad: tried && errors.password }">
                  <input v-model="f.password" data-f="password" :type="show ? 'text' : 'password'" placeholder="At least 8 characters" :autocomplete="step === 'register' ? 'new-password' : 'current-password'" />
                  <button type="button" class="eye" :class="{ on: show }" :aria-label="show ? 'Hide password' : 'Show password'" @click="show = !show"><img :src="A('b64b9')" alt="" width="20" height="20" /></button>
                </span>
                <span v-if="step === 'register' && f.password" class="strength" :class="strengthTone" aria-live="polite">
                  <span v-for="i in 4" :key="i" class="seg" :class="{ on: i <= strength }" /><span class="word">{{ strengthWord }}</span>
                </span>
                <span v-if="tried && errors.password" class="err"><i class="pi pi-exclamation-circle" />{{ errors.password }}</span>
                <span v-else-if="step === 'register'" class="helper">At least 8 characters, a letter and a&nbsp;digit</span>
              </label>
              <button type="submit" class="btn" :disabled="busy">
                <span v-if="busy" class="dots" aria-hidden="true"><i /><i /><i /></span>{{ step === 'register' ? 'Sign up free' : step === 'login' ? 'Log in' : 'Send code' }}
              </button>
            </form>

            <!-- Code -->
            <div v-else class="fields">
              <div class="otp">
                <div class="cells" :class="{ bad: codeErr }" @paste="onPaste">
                  <input v-for="(d, i) in digits" :key="i" ref="cells" :value="d" class="cell" :data-first="i === 0 ? '' : undefined" inputmode="numeric" autocomplete="one-time-code" maxlength="1"
                         :aria-label="`Digit ${i + 1}`" @input="onCell(i, $event)" @keydown="onCellKey(i, $event)" />
                </div>
                <span v-if="codeErr" class="err"><i class="pi pi-exclamation-circle" />{{ codeErr }}</span>
                <span v-else-if="left > 0" class="resend"><img :src="A('66b00')" alt="" width="16" height="16" />New code in {{ mmss }}<template v-if="resent"> · Sent</template></span>
                <button v-else type="button" class="link" @click="resend">Resend code</button>
              </div>
              <button class="btn" :disabled="busy" @click="confirmCode"><span v-if="busy" class="dots" aria-hidden="true"><i /><i /><i /></span>Confirm</button>
            </div>

            <button v-if="step === 'login'" type="button" class="link" @click="go('forgot')">Forgot your password?</button>
            <div class="footer">
              <template v-if="step === 'register'"><span>Already have an account?</span><button type="button" class="link" @click="go('login')">Log in</button></template>
              <template v-else-if="step === 'login'"><span>No account?</span><button type="button" class="link" @click="go('register')">Sign up</button></template>
              <template v-else-if="step === 'forgot'"><span>Remembered it?</span><button type="button" class="link" @click="go('login')">Log in</button></template>
              <template v-else><span>Wrong email?</span><button type="button" class="link" @click="changeEmail">Change it</button></template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
p { margin: 0; }
.au-wrap { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; overflow-y: auto; background: rgb(0 0 0 / .55); backdrop-filter: blur(2px); }
.au-col { display: flex; flex-direction: column; gap: 12px; width: 400px; max-width: 100%; }
.au-q { display: grid; gap: 2px; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel-2); }
.au-q-label { color: var(--fd-muted); font: 500 13px/18px var(--fd-font-sans); }
.au-q-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: var(--fd-ink); font: 400 15px/22px var(--fd-font-sans); }

/* AuthCard: panel, line border, padding 32, radius 16, gap 20 */
.card { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 20px; padding: 32px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); }
.au-x { position: absolute; top: 28px; right: 24px; display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.au-x:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.au-x .pi { font-size: 12px; }
.logo { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); white-space: nowrap; }
.logo span { color: var(--fd-accent-text); }
.head { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; }
.tag { padding: 2px 8px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.title { margin: 0; color: var(--fd-ink); font: 700 28px/36px var(--fd-font-serif); }
.sub { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); text-wrap: pretty; }

/* Fields: Input 10:3 / Password 10:84 — label 15/20 medium, box 44 tall, radius 8, text 16/26 */
.fields { display: flex; flex-direction: column; gap: 16px; width: 100%; }
.field { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.label { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.box { display: flex; align-items: center; gap: 8px; width: 100%; height: 44px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); outline: none; font: 400 16px/26px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
input.box::placeholder, .pw input::placeholder { color: var(--fd-muted); }
.box:focus, .box:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.box.bad { border-color: var(--fd-red); }
.pw input { flex: 1; min-width: 1px; height: 100%; padding: 0; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: inherit; }
.eye { display: grid; place-items: center; width: 28px; height: 28px; margin-right: -4px; padding: 0; border: 0; border-radius: 6px; background: transparent; cursor: pointer; opacity: .75; }
.eye.on, .eye:hover { opacity: 1; }
.strength { display: flex; align-items: center; gap: 4px; width: 100%; }
.seg { flex: 1; min-width: 1px; height: 4px; border-radius: 999px; background: var(--fd-line); }
.word { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }
.strength.weak .seg.on { background: var(--fd-red); } .strength.weak .word { color: var(--fd-red); }
.strength.medium .seg.on { background: var(--fd-amber); } .strength.medium .word { color: var(--fd-amber); }
.strength.strong .seg.on { background: var(--fd-accent); } .strength.strong .word { color: var(--fd-accent-text); }
.helper { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.err { display: flex; align-items: center; gap: 6px; color: var(--fd-red); font: 400 15px/24px var(--fd-font-sans); }
.err .pi { font-size: 13px; }

/* OTP 11:21 — cells 48×56, radius 8, digit 22/30 semibold; focused cell 2px focus border */
.otp { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
.cells { display: flex; gap: 8px; }
.cell { width: 48px; height: 56px; padding: 0; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); text-align: center; outline: none; caret-color: var(--fd-focus); font: 600 22px/30px var(--fd-font-sans); }
.cell:focus { border: 2px solid var(--fd-focus); }
.cells.bad .cell { border-color: var(--fd-red); }
.resend { display: flex; align-items: center; gap: 4px; color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }

/* Button: primary M, full width */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 12px 20px; border: 0; border-radius: 8px; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 500 15px/20px var(--fd-font-sans); transition: background-color .15s; }
.btn:hover:not(:disabled) { background: var(--fd-accent-hover); }
.btn:disabled { opacity: .7; cursor: default; }
.dots { display: inline-flex; gap: 3px; }
.dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: blink 1s infinite; }
.dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 50% { opacity: .25; } }
.link { padding: 0; border: 0; background: none; color: var(--fd-accent-text); cursor: pointer; font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.link:hover { text-decoration: underline; text-underline-offset: 3px; }
.footer { display: flex; align-items: flex-start; justify-content: center; gap: 4px; width: 100%; white-space: nowrap; }
.footer span { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.footer .link { line-height: 24px; }
.btn:focus-visible, .link:focus-visible, .au-x:focus-visible, .eye:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

.au-enter-active, .au-leave-active { transition: opacity .18s ease; }
.au-enter-active .au-col, .au-leave-active .au-col { transition: transform .18s ease; }
.au-enter-from, .au-leave-to { opacity: 0; }
.au-enter-from .au-col, .au-leave-to .au-col { transform: translateY(8px) scale(.98); }

@media (max-width: 767px) {
  .au-wrap { align-items: end; padding: 12px; }
  .card { padding: 24px; }
  .cells { gap: 6px; }
  .cell { width: calc((100vw - 24px - 48px - 30px) / 6); max-width: 48px; }
}
</style>
