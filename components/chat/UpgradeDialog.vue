<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

// Out of credits → a plan picker over the chat, the way Claude offers an upgrade when the limit is reached (user, 11.10).
// Opens when the last credit is used, when someone tries to ask with none left, or from "View plans". Plans and prices are
// the brief's (Davit on sale, the other two "Soon"); payment happens on the bank's page (Visa / Mastercard / ArCa).
// The prototype stops at "Opening the bank's payment page…" — checkout itself is not designed yet [OPEN].
const { state, LIMIT } = useChat();
const PLANS = [
  { id: 'davit', name: 'Davit', price: '200,000', desc: 'In-depth legal research with full sources', tag: 'Most complete', on: true },
  { id: 'mets', name: 'Mets Mher', price: '20,000', desc: 'Extended features for medium workloads', tag: 'Soon', on: false },
  { id: 'pokr', name: 'Pokr Mher', price: '5,000', desc: 'Basic Q&A for individual users', tag: 'Soon', on: false },
];
const busy = ref(false);
const card = ref<HTMLElement>();
let opener: HTMLElement | null = null;

function close() { if (!busy.value) state.upsell = false; }
function choose() { busy.value = true; } // → the bank's payment page (not part of the prototype)
function onKey(e: KeyboardEvent) {
  if (!state.upsell) return;
  if (e.key === 'Escape') { e.preventDefault(); close(); }
  if (e.key === 'Tab' && card.value) {
    const els = [...card.value.querySelectorAll<HTMLElement>('button:not([disabled])')];
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }
}
watch(() => state.upsell, (v) => {
  if (v) { busy.value = false; opener = document.activeElement as HTMLElement | null; nextTick(() => card.value?.focus({ preventScroll: true })); } // focus the dialog, not a button: no ring until the keyboard is used
  else nextTick(() => opener?.focus?.());
});
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <Teleport to="body">
    <Transition name="up">
      <div v-if="state.upsell" class="up-wrap" @pointerdown.self="close">
        <div ref="card" class="card" role="dialog" aria-modal="true" aria-labelledby="up-title" tabindex="-1">
          <button class="x" aria-label="Close" @click="close"><i class="pi pi-times" /></button>
          <div class="head">
            <h2 id="up-title" class="title">You’ve used all {{ LIMIT }}&nbsp;credits</h2>
            <p class="sub">Choose a plan to keep asking — your chats and documents&nbsp;stay.</p>
          </div>

          <ul class="plans">
            <li v-for="p in PLANS" :key="p.id" class="plan" :class="{ on: p.on, off: !p.on }" :aria-disabled="!p.on">
              <span class="radio" aria-hidden="true"><span v-if="p.on" /></span>
              <span class="p-txt">
                <span class="p-top"><b>{{ p.name }}</b><span class="tag" :class="{ soon: !p.on }">{{ p.tag }}</span></span>
                <span class="p-desc">{{ p.desc }}</span>
              </span>
              <span class="p-price"><b>{{ p.price }}</b><span>AMD / month</span></span>
            </li>
          </ul>

          <div class="foot">
            <button class="later" :disabled="busy" @click="close">Maybe later</button>
            <button class="go" :disabled="busy" @click="choose">
              <template v-if="busy"><span class="dots" aria-hidden="true"><i /><i /><i /></span>Opening the bank’s payment page…</template>
              <template v-else>Choose Davit<i class="pi pi-arrow-right" /></template>
            </button>
          </div>
          <p class="fine">Billed monthly, taxes included. Pay by Visa, Mastercard or&nbsp;ArCa.</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
p, ul { margin: 0; }
ul { padding: 0; list-style: none; }
.up-wrap { position: fixed; inset: 0; z-index: 90; display: grid; place-items: center; padding: 24px; background: rgb(0 0 0 / .55); backdrop-filter: blur(3px); }
.card { position: relative; display: flex; flex-direction: column; gap: 24px; width: min(520px, calc(100vw - 24px)); padding: 36px 32px 28px; border-radius: 20px;
  border: 1px solid var(--fd-line); background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); }
.card:focus { outline: none; }
.x { position: absolute; top: 18px; right: 18px; display: grid; place-items: center; width: 32px; height: 32px; border: 0; border-radius: 999px; background: none; color: var(--fd-muted); cursor: pointer; }
.x:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.x .pi { font-size: 12px; }
.head { display: grid; gap: 8px; padding-right: 28px; }
.title { margin: 0; color: var(--fd-ink); font: 600 28px/34px var(--fd-font-serif); letter-spacing: -.3px; }
.sub { color: var(--fd-muted); font: 400 15px/23px var(--fd-font-sans); }

.plans { display: grid; gap: 8px; }
.plan { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 1px solid var(--fd-line); background: var(--fd-bg); }
.plan.on { border-color: var(--fd-accent); box-shadow: 0 0 0 1px var(--fd-accent) inset; }
.plan.off { opacity: .55; }
.radio { display: grid; place-items: center; width: 18px; height: 18px; flex-shrink: 0; border-radius: 50%; border: 1.5px solid var(--fd-line); }
.on .radio { border-color: var(--fd-accent); }
.radio span { width: 8px; height: 8px; border-radius: 50%; background: var(--fd-accent); }
.p-txt { display: grid; gap: 2px; flex: 1; min-width: 0; }
.p-top { display: flex; align-items: center; gap: 8px; }
.p-top b { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.tag { padding: 1px 8px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 11px/17px var(--fd-font-sans); }
.tag.soon { background: var(--fd-panel-2); color: var(--fd-muted); }
.p-desc { color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.p-price { display: grid; justify-items: end; flex-shrink: 0; }
.p-price b { color: var(--fd-ink); font: 600 18px/24px var(--fd-font-sans); font-variant-numeric: tabular-nums; }
.p-price span { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }

.foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.later { height: 44px; padding: 0 16px; border: 0; border-radius: 999px; background: none; color: var(--fd-muted); cursor: pointer; font: 500 15px/20px var(--fd-font-sans); }
.later:hover:not(:disabled) { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.go { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 44px; padding: 0 20px; border: 0; border-radius: 999px; background: var(--fd-accent); color: var(--fd-on-accent);
  cursor: pointer; font: 600 15px/20px var(--fd-font-sans); transition: background-color .15s; }
.go:hover:not(:disabled) { background: var(--fd-accent-hover); }
.go:disabled { cursor: default; opacity: .85; }
.go .pi { font-size: 12px; transition: transform .2s; }
.go:hover:not(:disabled) .pi { transform: translateX(3px); }
.dots { display: inline-flex; gap: 3px; }
.dots i { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: blink 1s infinite; }
.dots i:nth-child(2) { animation-delay: .15s; } .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes blink { 50% { opacity: .25; } }
.fine { margin-top: -8px; color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); text-align: right; }
.x:focus-visible, .later:focus-visible, .go:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }

.up-enter-active, .up-leave-active { transition: opacity .18s ease; }
.up-enter-active .card, .up-leave-active .card { transition: transform .22s var(--fd-easing, ease); }
.up-enter-from, .up-leave-to { opacity: 0; }
.up-enter-from .card, .up-leave-to .card { transform: translateY(10px) scale(.98); }

@media (max-width: 767px) {
  .up-wrap { align-items: end; padding: 12px; }
  .card { padding: 28px 20px 22px; gap: 20px; }
  .title { font-size: 24px; line-height: 30px; }
  .p-desc { display: none; }
  .foot { flex-direction: column-reverse; align-items: stretch; }
  .go, .later { width: 100%; }
  .fine { text-align: center; }
}
@media (prefers-reduced-motion: reduce) { .up-enter-active, .up-leave-active, .up-enter-active .card, .up-leave-active .card { transition: none; } }
</style>
