<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { MODES } from '~/data/mock';
import type { AssistantMsg } from '~/composables/useChat';

const { state, isEmpty, outOfQuestions, low, newChat, demo, LIMIT } = useChat();
const route = useRoute();
const scroller = ref<HTMLElement>();
const dockComposer = ref();

const lastAssistant = computed(() => [...state.messages].reverse().find((m) => m.role === 'assistant') as AssistantMsg | undefined);
const sourcesVisible = computed(() => !isEmpty.value && state.sourcesOpen && lastAssistant.value && !['refused', 'error'].includes(lastAssistant.value.status));
// Top-bar Sources toggle: shown once the answer has sources (the count grows while it streams)
const sourcesCount = computed(() => {
  const a = lastAssistant.value;
  if (isEmpty.value || !a || ['refused', 'error', 'plan'].includes(a.status)) return null;
  return a.sources?.length ? a.sources.length : null;
});
// Sidebar status dot for the open chat while deep research runs
const activeStatus = computed(() => (lastAssistant.value?.status === 'deep' ? 'running' : null));
// Breadcrumbs (like a chat inside a Claude project): My cases / Case / Chat
const crumbs = computed(() => (state.caseCtx
  ? [{ label: 'My cases', to: '/cases' }, { label: state.caseCtx.name, to: `/cases/${state.caseCtx.id}` }, { label: state.chatTitle || 'New chat' }]
  : undefined));
const sourcesLoading = computed(() => !!lastAssistant.value && ['searching', 'deep', 'streaming'].includes(lastAssistant.value.status));
const modeLabel = (id: string) => MODES.find((m) => m.id === id)?.label;

/* Scrolling, like ChatGPT / Claude today: a new question moves to the top of the view and the answer is written below it.
   Nothing auto-scrolls while it streams, so the text never jumps. A spacer under the thread gives the question room to
   reach the top; it shrinks as the answer grows. The pinned position is held (the browser would otherwise clamp it when
   the thread shrinks for a frame, e.g. skeleton → first words) until you scroll yourself. If the answer runs below the
   view, a "↓" button appears above the composer. */
const thread = ref<HTMLElement>();
const tail = ref<HTMLElement>();
const below = ref(false); // part of the conversation is under the fold
const PIN = 16; // gap above the pinned question
let pinTarget: number | null = null; // where the last question sits at the top
let pinHeld = false; // true once we've arrived there; cleared when you scroll yourself
function lastUser() { const all = thread.value?.querySelectorAll<HTMLElement>('.user-msg'); return all?.[all.length - 1]; }
function measure() {
  const sc = scroller.value, th = thread.value, u = lastUser();
  if (!sc || !th || !u) { if (tail.value) tail.value.style.height = '0px'; below.value = false; return; }
  const thR = th.getBoundingClientRect();
  // set synchronously (not via Vue) so the room exists in the same frame we restore the scroll
  if (tail.value) tail.value.style.height = `${Math.max(0, Math.round(sc.clientHeight - (thR.bottom - u.getBoundingClientRect().top) - PIN))}px`;
  if (pinHeld && pinTarget != null && Math.abs(sc.scrollTop - pinTarget) > 1) sc.scrollTop = pinTarget;
  below.value = th.getBoundingClientRect().bottom - sc.getBoundingClientRect().bottom > 24;
}
async function pinLast(behavior: ScrollBehavior = 'smooth') {
  await nextTick();
  const sc = scroller.value, u = lastUser();
  pinHeld = false; measure();
  if (!sc || !u) return;
  pinTarget = Math.round(u.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - PIN);
  sc.scrollTo({ top: pinTarget, behavior });
  if (behavior === 'auto' || Math.abs(sc.scrollTop - pinTarget) <= 1) pinHeld = true;
}
function onScroll() {
  const sc = scroller.value;
  if (sc && !pinHeld && pinTarget != null && Math.abs(sc.scrollTop - pinTarget) <= 1) pinHeld = true; // smooth scroll arrived
  measure();
}
function release() { pinHeld = false; pinTarget = null; } // you took over the scroll
// Typing in the composer is not scrolling: only scroll keys outside a text field, and a press on the scrollbar, count
const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
function onKey(e: KeyboardEvent) { if (!(e.target as HTMLElement).closest('textarea, input, [contenteditable]') && SCROLL_KEYS.includes(e.key)) release(); }
function onPointer(e: PointerEvent) { if (e.target === scroller.value) release(); }
function toBottom() {
  const sc = scroller.value, th = thread.value; if (!sc || !th) return;
  release();
  sc.scrollTo({ top: sc.scrollTop + th.getBoundingClientRect().bottom - sc.getBoundingClientRect().bottom + 24, behavior: 'smooth' });
}
watch(() => state.messages.length, (n, o) => { if (n > (o ?? 0)) pinLast(); else nextTick(measure); });
let ro: ResizeObserver | undefined;
watch(thread, (el, old) => { if (old) ro?.unobserve(old); if (el) ro?.observe(el); });
onBeforeUnmount(() => ro?.disconnect());
onMounted(() => {
  ro = new ResizeObserver(() => measure());
  if (thread.value) ro.observe(thread.value);
  window.addEventListener('resize', measure, { passive: true });
  const d = route.query.demo; if (typeof d === 'string') demo(d);
  // opened from a case page: keep the case for the breadcrumbs
  const cs = typeof route.query.case === 'string' ? useCases().byId(route.query.case) : undefined;
  if (cs) { state.caseCtx = { id: cs.id, name: cs.name, docs: cs.files.length }; state.chatTitle = typeof route.query.chat === 'string' ? route.query.chat : null; }
  // phone: the sources sheet opens only on demand (citation tap / Sources button)
  if (window.innerWidth < 768 && d !== 'fragment' && d !== 'sheet') state.sourcesOpen = false;
  if (d === 'sheet') { demo('answer'); state.sourcesOpen = true; }
  pinLast('auto'); // an opened chat starts at its last question, not cut off at the bottom
});
onBeforeUnmount(() => window.removeEventListener('resize', measure));
</script>

<template>
  <AppShell :active-chat="isEmpty || state.caseCtx ? null : 'c1'" :active-status="activeStatus" :sources-count="sourcesCount" :sources-open="!!sourcesVisible" :crumbs="crumbs"
            @new-chat="newChat()" @sources="state.sourcesOpen = !sourcesVisible">
        <div class="column">
          <div ref="scroller" class="scroll conversation" @scroll.passive="onScroll" @wheel.passive="release" @touchmove.passive="release" @keydown="onKey" @pointerdown="onPointer">
            <ChatEmpty v-if="isEmpty" />
            <div v-else ref="thread" class="thread">
              <template v-for="m in state.messages" :key="m.id">
                <div v-if="m.role === 'user'" class="user-msg">
                  <div class="bubble t-body">
                    <span v-if="m.file" class="file-ref t-caption"><i class="pi pi-paperclip" />{{ m.file }}</span>
                    {{ m.text }}
                  </div>
                  <span class="t-caption muted mode"><i class="pi pi-sparkles" />{{ modeLabel(m.mode) }}</span>
                </div>
                <AnswerMessage v-else :msg="m" />
              </template>
            </div>
            <div v-if="!isEmpty" ref="tail" class="tail" aria-hidden="true" />
          </div>
          <div v-if="!isEmpty" class="dock">
            <Transition name="fade">
              <button v-if="below" class="to-bottom" aria-label="Scroll to the end of the answer" v-tooltip.top="'Scroll down'" @click="toBottom"><i class="pi pi-arrow-down" /></button>
            </Transition>
            <div class="dock-inner">
              <div v-if="low" class="low t-body-sm"><i class="pi pi-database" />{{ state.remaining }} of {{ LIMIT }} credits left<a href="#" class="t-label" @click.prevent>View plans</a></div>
              <OutOfQuestions v-if="outOfQuestions" />
              <ChatComposer v-else ref="dockComposer" variant="dock" placeholder="Ask a follow-up…" />
            </div>
          </div>
        </div>
        <Transition name="slide">
          <div v-if="sourcesVisible" class="sources-wrap">
            <div class="backdrop" @click="state.sourcesOpen = false" />
            <SourcesPanel :sources="lastAssistant!.sources" :loading="sourcesLoading" />
          </div>
        </Transition>
    <template #overlay><DemoStates /></template>
  </AppShell>
</template>

<style scoped>
.column { position: relative; display: flex; flex-direction: column; flex: 1; min-width: 0; }
.conversation { flex: 1; display: flex; flex-direction: column; padding: 0 24px; overflow-anchor: none; } /* we place the scroll ourselves */
.thread { display: flex; flex-direction: column; gap: 32px; width: 100%; max-width: 720px; margin: 0 auto; padding: 32px 0 24px; animation: appear .22s ease both; }
.tail { flex-shrink: 0; }
/* the first question: the thread and the docked composer fade in instead of snapping from the centred hero */
@keyframes appear { from { opacity: 0; } }
@keyframes rise { from { opacity: 0; transform: translateY(8px); } }
.to-bottom { position: absolute; left: 50%; top: -52px; z-index: 3; display: grid; place-items: center; width: 36px; height: 36px; margin-left: -18px; border-radius: 50%;
  border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; box-shadow: var(--fd-overlay-shadow); }
.to-bottom:hover { background: var(--fd-panel-2); }
.to-bottom:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.to-bottom .pi { font-size: 13px; }
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease, transform .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(4px); }
.user-msg { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.bubble { max-width: 560px; padding: 12px 16px; border-radius: 16px 16px 4px 16px; background: var(--fd-panel-2); color: var(--fd-ink); }
.file-ref { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: var(--fd-accent-text); }
.mode { display: inline-flex; align-items: center; gap: 6px; } .mode .pi { font-size: 11px; color: var(--fd-accent-text); }
.dock { position: relative; padding: 0 24px 20px; }
.dock::before { content: ''; position: absolute; left: 0; right: 0; top: -48px; height: 48px; pointer-events: none; background: linear-gradient(180deg, transparent, var(--fd-bg)); }
.dock-inner { display: grid; gap: 10px; max-width: 720px; margin: 0 auto; animation: rise .22s var(--fd-easing, ease) both; }
.low { display: flex; align-items: center; gap: 8px; color: var(--fd-amber); padding-left: 4px; }
.low a { color: var(--fd-accent-text); text-decoration: none; margin-left: 4px; }
.sources-wrap { position: relative; display: flex; }
.backdrop { display: none; }
.slide-enter-active, .slide-leave-active { transition: transform .25s var(--fd-easing, ease), opacity .25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(24px); opacity: 0; }
/* tablet: sources overlay the conversation */
@media (max-width: 959px) and (min-width: 768px) {
  .sources-wrap { position: absolute; right: 0; top: 0; bottom: 0; z-index: 20; box-shadow: var(--fd-overlay-shadow); }
}
/* phone: drawer nav, sources as a bottom sheet */
@media (max-width: 767px) {
  .conversation { padding: 0 16px; }
  .thread { padding-top: 20px; }
  .dock { padding: 0 16px calc(12px + env(safe-area-inset-bottom)); }
  .sources-wrap { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; box-shadow: none; }
  .backdrop { display: block; position: absolute; inset: 0; background: rgb(0 0 0 / .5); }
  .sources-wrap :deep(.sources) { position: relative; }
  .slide-enter-from, .slide-leave-to { transform: translateY(40px); }
}
</style>
