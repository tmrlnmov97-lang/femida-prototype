<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

// "Send a request" — a proper form in a centred dialog (user: "a request form, not a chat"). Opened by the floating
// button bottom-right and by "Send a request" in the account menu (phone / tablet). The draft survives closing.
const open = useState('fd-request-open', () => false);

const subject = ref('');
const details = ref('');
const email = ref('dev@femid.ai');
const files = ref<{ name: string; size: string }[]>([]);
const tried = ref(false);
const sending = ref(false);
const sentNo = ref<string | null>(null);
const errors = computed(() => ({
  subject: !subject.value.trim() ? 'Add a short subject' : '',
  details: !details.value.trim() ? 'Describe it in a few words' : '',
  email: !/^\S+@\S+\.\S+$/.test(email.value.trim()) ? 'Enter an email we can reply to' : '',
}));

const dialog = ref<HTMLElement>();
let opener: HTMLElement | null = null;
watch(open, (v) => {
  if (v) {
    opener = document.activeElement as HTMLElement | null;
    if (sentNo.value) reset(); // a fresh form after a sent request
    nextTick(() => dialog.value?.querySelector<HTMLElement>('[data-first]')?.focus());
  } else nextTick(() => opener?.focus?.());
});
function close() { open.value = false; }
function reset() { subject.value = ''; details.value = ''; files.value = []; tried.value = false; sentNo.value = null; }
function attach() { files.value.push({ name: files.value.length ? `Screenshot_${files.value.length + 1}.png` : 'Screenshot.png', size: '240 KB' }); }
function submit() {
  tried.value = true;
  const firstBad = (['subject', 'details', 'email'] as const).find((k) => errors.value[k]);
  if (firstBad) { nextTick(() => dialog.value?.querySelector<HTMLElement>(`[data-f="${firstBad}"]`)?.focus()); return; }
  sending.value = true;
  setTimeout(() => { sending.value = false; sentNo.value = `FD-${1000 + Math.floor(Math.random() * 9000)}`; }, 900);
}
function onKey(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  if (e.key === 'Tab' && dialog.value) { // keep focus inside the dialog
    const els = [...dialog.value.querySelectorAll<HTMLElement>('button, input, textarea, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
}
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <Transition name="rq">
      <div v-if="open" class="rq-wrap" @pointerdown.self="close">
        <div ref="dialog" class="rq" role="dialog" aria-modal="true" aria-labelledby="rq-title">
          <button class="rq-x" aria-label="Close" @click="close"><i class="pi pi-times" /></button>

          <template v-if="!sentNo">
            <header class="rq-head">
              <h2 id="rq-title">Send a request</h2>
              <p>A problem, a question or an idea — we reply by&nbsp;email.</p>
            </header>

            <form class="rq-form" novalidate @submit.prevent="submit">
              <label class="f">
                <span class="lbl">Subject</span>
                <input v-model="subject" data-f="subject" data-first class="in" :class="{ bad: tried && errors.subject }" placeholder="Briefly, what is it about?" maxlength="120" :aria-invalid="!!(tried && errors.subject)" />
                <span v-if="tried && errors.subject" class="err"><i class="pi pi-exclamation-circle" />{{ errors.subject }}</span>
              </label>

              <label class="f">
                <span class="lbl">Details</span>
                <textarea v-model="details" data-f="details" class="in area" :class="{ bad: tried && errors.details }" rows="4" placeholder="What happened, or what you need" :aria-invalid="!!(tried && errors.details)" />
                <span v-if="tried && errors.details" class="err"><i class="pi pi-exclamation-circle" />{{ errors.details }}</span>
              </label>

              <div class="f">
                <span class="lbl">Attachments <span class="opt">Optional</span></span>
                <div v-if="files.length" class="chips">
                  <span v-for="(f, i) in files" :key="f.name" class="chip"><i class="pi pi-image" />{{ f.name }}<span class="muted">{{ f.size }}</span>
                    <button type="button" :aria-label="`Remove ${f.name}`" @click="files.splice(i, 1)"><i class="pi pi-times" /></button>
                  </span>
                </div>
                <button type="button" class="attach" @click="attach"><i class="pi pi-paperclip" />Add a screenshot or file<span class="muted">PNG, JPG or PDF · up to 25&nbsp;MB</span></button>
              </div>

              <label class="f">
                <span class="lbl">Email for the reply</span>
                <input v-model="email" data-f="email" type="email" class="in" :class="{ bad: tried && errors.email }" autocomplete="email" :aria-invalid="!!(tried && errors.email)" />
                <span v-if="tried && errors.email" class="err"><i class="pi pi-exclamation-circle" />{{ errors.email }}</span>
              </label>

              <div class="rq-foot">
                <button type="button" class="btn ghost" @click="close">Cancel</button>
                <button type="submit" class="btn primary" :disabled="sending">
                  <span v-if="sending" class="dots" aria-hidden="true"><i /><i /><i /></span>{{ sending ? 'Sending' : 'Send request' }}
                </button>
              </div>
            </form>
          </template>

          <div v-else class="rq-done" role="status">
            <span class="ok"><i class="pi pi-check" /></span>
            <h2 id="rq-title">Request sent</h2>
            <p>Your request <b>{{ sentNo }}</b> is with the Femida team. We’ll reply to <b>{{ email }}</b>.</p>
            <button class="btn primary" data-first @click="close">Done</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.rq-wrap { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; background: rgb(0 0 0 / .55); backdrop-filter: blur(2px); }
.rq { position: relative; width: 100%; max-width: 560px; max-height: calc(100dvh - 48px); overflow-y: auto; padding: 28px; border-radius: 20px; border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); scrollbar-width: thin; }
.rq-x { position: absolute; top: 16px; right: 16px; display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.rq-x:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.rq-x .pi { font-size: 12px; }
.rq-head { display: grid; gap: 4px; margin: 0 40px 24px 0; }
h2 { margin: 0; color: var(--fd-ink); font: 600 20px/28px var(--fd-font-sans); }
.rq-head p { margin: 0; color: var(--fd-muted); font: 400 14px/22px var(--fd-font-sans); }

.rq-form { display: grid; gap: 18px; }
.f { display: grid; gap: 8px; min-width: 0; margin: 0; padding: 0; border: 0; }
.lbl { display: flex; align-items: baseline; gap: 8px; padding: 0; color: var(--fd-ink); font: 500 14px/20px var(--fd-font-sans); }
.opt, .muted { color: var(--fd-muted); font-weight: 400; font-size: 13px; }
.in { width: 100%; height: 44px; padding: 0 14px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
.in.area { height: auto; min-height: 112px; padding: 10px 14px; resize: vertical; line-height: 24px; }
.in::placeholder { color: var(--fd-muted); }
.in:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.in.bad { border-color: var(--fd-red); }
.in.bad:focus { box-shadow: 0 0 0 3px var(--fd-red-soft); }
.err { display: flex; align-items: center; gap: 6px; color: var(--fd-red); font: 400 13px/18px var(--fd-font-sans); }
.err .pi { font-size: 12px; }
.attach { display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 14px; border-radius: 12px; border: 1px dashed color-mix(in srgb, var(--fd-ink) 22%, transparent); background: transparent; color: var(--fd-ink); cursor: pointer; text-align: left; font: 500 14px/20px var(--fd-font-sans); transition: border-color .15s, background-color .15s; }
.attach .pi { font-size: 13px; color: var(--fd-muted); }
.attach .muted { margin-left: auto; }
.attach:hover { border-color: var(--fd-accent); background: color-mix(in srgb, var(--fd-accent) 5%, transparent); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 8px; height: 32px; padding: 0 4px 0 10px; border-radius: 8px; background: var(--fd-panel-2); color: var(--fd-ink); font: 500 13px/18px var(--fd-font-sans); }
.chip .pi-image { font-size: 12px; color: var(--fd-muted); }
.chip button { display: grid; place-items: center; width: 24px; height: 24px; border: 0; border-radius: 6px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.chip button:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 8%, transparent); }
.chip button .pi { font-size: 9px; }

.rq-foot { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; padding-top: 18px; border-top: 1px solid var(--fd-line); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 18px; border-radius: 10px; cursor: pointer; font: 500 14px/20px var(--fd-font-sans); }
.btn.primary { border: 0; background: var(--fd-accent); color: var(--fd-on-accent); font-weight: 600; }
.btn.primary:hover:not(:disabled) { background: var(--fd-accent-hover); }
.btn.primary:disabled { opacity: .6; cursor: default; }
.btn.ghost { border: 0; background: transparent; color: var(--fd-muted); }
.btn.ghost:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.btn:focus-visible, .attach:focus-visible, .rq-x:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.dots { display: inline-flex; gap: 3px; }
.dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: blink 1s infinite; }
.dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 50% { opacity: .25; } }

.rq-done { display: grid; justify-items: center; gap: 8px; padding: 24px 8px 8px; text-align: center; }
.rq-done p { margin: 0 0 16px; max-width: 400px; color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: balance; }
.rq-done b { color: var(--fd-ink); font-weight: 600; }
.ok { display: grid; place-items: center; width: 48px; height: 48px; margin-bottom: 8px; border-radius: 50%; background: var(--fd-accent); color: var(--fd-on-accent); }
.ok .pi { font-size: 18px; }

.rq-enter-active, .rq-leave-active { transition: opacity .18s ease; }
.rq-enter-active .rq, .rq-leave-active .rq { transition: transform .18s ease; }
.rq-enter-from, .rq-leave-to { opacity: 0; }
.rq-enter-from .rq, .rq-leave-to .rq { transform: translateY(8px) scale(.98); }

@media (max-width: 767px) {
  .rq-wrap { align-items: end; padding: 12px; }
  .rq { max-height: calc(100dvh - 24px); padding: 20px; border-radius: 20px; }
    .attach .muted { display: none; }
}
</style>
