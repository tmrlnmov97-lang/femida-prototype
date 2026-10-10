<script setup lang="ts">
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue';

// Shared app frame: sidebar (desktop rail / phone drawer) + top bar + feedback button. Pages put their body in the slot.
const props = defineProps<{ activeChat?: string | null; activeStatus?: 'running' | null; sourcesCount?: number | null; sourcesOpen?: boolean; crumbs?: { label: string; to?: string }[] }>();
const emit = defineEmits<{ (e: 'new-chat'): void; (e: 'sources'): void }>();
const { state, newChat, LIMIT } = useChat();
const route = useRoute();
const collapsed = ref(false);
const drawer = ref(false);

onMounted(() => {
  if (route.query.theme === 'light') document.documentElement.classList.add('fd-light');
  if (route.query.palette === 'jade') document.documentElement.classList.add('palette-jade');
  collapsed.value = window.innerWidth < 1280; // tablet: icon rail
});
function start() {
  drawer.value = false;
  if (route.path === '/') emit('new-chat');
  else { newChat(); navigateTo('/'); }
}
/* Feedback (brief: a floating button bottom-right). A small panel above the button: type, text, send → thanks. */
const fbOpen = ref(false);
const FB_KINDS = ['Problem', 'Idea', 'Other'] as const;
const fbKind = ref<typeof FB_KINDS[number]>('Problem');
const fbText = ref('');
const fbPage = ref(true);
const fbSent = ref(false);
const fbSending = ref(false);
const fbPanel = ref<HTMLElement>(); const fbBtn = ref<HTMLElement>(); const fbInput = ref<HTMLTextAreaElement>();
let fbTimer: ReturnType<typeof setTimeout> | undefined;
function toggleFeedback() {
  fbOpen.value = !fbOpen.value;
  if (fbOpen.value) { fbSent.value = false; nextTick(() => fbInput.value?.focus()); }
}
function closeFeedback() { fbOpen.value = false; clearTimeout(fbTimer); }
function sendFeedback() {
  if (!fbText.value.trim() || fbSending.value) return;
  fbSending.value = true;
  setTimeout(() => {
    fbSending.value = false; fbSent.value = true; fbText.value = ''; fbKind.value = 'Problem';
    fbTimer = setTimeout(closeFeedback, 2400);
  }, 700);
}
function onFbDoc(e: PointerEvent) { const t = e.target as Node; if (fbOpen.value && !fbPanel.value?.contains(t) && !fbBtn.value?.contains(t)) closeFeedback(); }
function onFbKey(e: KeyboardEvent) { if (e.key === 'Escape' && fbOpen.value) { closeFeedback(); fbBtn.value?.focus(); } }
onMounted(() => { document.addEventListener('pointerdown', onFbDoc); document.addEventListener('keydown', onFbKey); });
onBeforeUnmount(() => { document.removeEventListener('pointerdown', onFbDoc); document.removeEventListener('keydown', onFbKey); clearTimeout(fbTimer); });
function select() {
  drawer.value = false;
  state.caseCtx = null; state.chatTitle = null; // a sidebar chat is not inside a case → no breadcrumbs
  if (route.path !== '/') navigateTo({ path: '/', query: { demo: 'answer' } }); // prototype: any past chat opens the sample answer
}
</script>

<template>
  <div class="app" :class="{ collapsed }">
    <AppSidebar class="desk-sidebar" :collapsed="collapsed" :active-chat="props.activeChat" :active-status="props.activeStatus" @toggle="collapsed = !collapsed" @new-chat="start" @select="select" />
    <PDrawer v-model:visible="drawer" class="nav-drawer" :show-close-icon="false" position="left">
      <AppSidebar :active-chat="props.activeChat" :active-status="props.activeStatus" @toggle="drawer = false" @new-chat="start" @select="select" />
    </PDrawer>

    <main class="main">
      <AppTopbar :remaining="state.remaining" :limit="LIMIT" :sources-count="props.sourcesCount" :sources-open="!!props.sourcesOpen" :crumbs="props.crumbs"
                 @menu="drawer = true" @sources="emit('sources')" />
      <div class="body"><slot /></div>
    </main>

    <button ref="fbBtn" class="feedback" :class="{ open: fbOpen }" aria-label="Send feedback" aria-haspopup="dialog" :aria-expanded="fbOpen"
            @click="toggleFeedback"><i class="pi" :class="fbOpen ? 'pi-times' : 'pi-comment'" /></button>
    <Transition name="fb">
      <div v-if="fbOpen" ref="fbPanel" class="fb" role="dialog" aria-labelledby="fb-title">
        <template v-if="!fbSent">
          <div class="fb-head">
            <h2 id="fb-title">Send feedback</h2>
            <span class="fb-sub">It goes straight to the Femida team.</span>
          </div>
          <div class="fb-kinds" role="radiogroup" aria-label="Type of feedback">
            <button v-for="k in FB_KINDS" :key="k" class="fb-kind" :class="{ on: fbKind === k }" role="radio" :aria-checked="fbKind === k" @click="fbKind = k">
              <i class="pi" :class="k === 'Problem' ? 'pi-exclamation-circle' : k === 'Idea' ? 'pi-lightbulb' : 'pi-comment'" />{{ k }}
            </button>
          </div>
          <textarea ref="fbInput" v-model="fbText" class="fb-input" rows="4" aria-label="Your feedback"
                    :placeholder="fbKind === 'Problem' ? 'What happened, and what did you expect?' : fbKind === 'Idea' ? 'What would make Femida better for you?' : 'Tell us anything'"
                    @keydown.enter.meta.prevent="sendFeedback" @keydown.enter.ctrl.prevent="sendFeedback" />
          <label class="fb-check"><input v-model="fbPage" type="checkbox" />Include the address of this page</label>
          <div class="fb-foot">
            <span class="fb-from">From dev@femid.ai</span>
            <button class="fb-send" :disabled="!fbText.trim() || fbSending" @click="sendFeedback">{{ fbSending ? 'Sending…' : 'Send' }}</button>
          </div>
        </template>
        <div v-else class="fb-done" role="status">
          <span class="fb-ok"><i class="pi pi-check" /></span>
          <b>Thanks for your feedback</b>
          <span>It’s on its way to the&nbsp;team.</span>
        </div>
      </div>
    </Transition>
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.app { display: flex; height: 100dvh; background: var(--fd-bg); }
.main { position: relative; display: flex; flex-direction: column; flex: 1; min-width: 0; }
.body { position: relative; display: flex; flex: 1; min-height: 0; }
.feedback {
  position: fixed; right: 20px; bottom: 20px; z-index: 30; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid var(--fd-line); background: var(--fd-panel-2); color: var(--fd-accent-text); cursor: pointer; box-shadow: var(--fd-overlay-shadow);
  transition: background-color .15s, color .15s;
}
.feedback:hover, .feedback.open { background: var(--fd-panel); color: var(--fd-ink); }
.feedback:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.feedback .pi { font-size: 16px; }
/* Feedback panel, above the button */
.fb { position: fixed; right: 20px; bottom: 76px; z-index: 31; display: grid; gap: 12px; width: 360px; padding: 18px; border-radius: 16px; border: 1px solid var(--fd-line);
  background: var(--fd-panel); box-shadow: var(--fd-overlay-shadow); }
.fb-head { display: grid; gap: 2px; }
.fb-head h2 { margin: 0; color: var(--fd-ink); font: 600 16px/22px var(--fd-font-sans); }
.fb-sub { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.fb-kinds { display: flex; gap: 6px; }
.fb-kind { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--fd-line); background: transparent; color: var(--fd-ink); cursor: pointer; font: 500 13px/18px var(--fd-font-sans); transition: border-color .12s, background-color .12s; }
.fb-kind .pi { font-size: 12px; color: var(--fd-muted); }
.fb-kind:hover { border-color: color-mix(in srgb, var(--fd-ink) 25%, transparent); }
.fb-kind.on { border-color: var(--fd-accent); background: var(--fd-accent-soft); }
.fb-kind.on .pi { color: var(--fd-accent-text); }
.fb-input { width: 100%; min-height: 104px; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-bg); color: var(--fd-ink); outline: none; resize: vertical; font: 400 15px/22px var(--fd-font-sans); transition: border-color .15s, box-shadow .15s; }
.fb-input::placeholder { color: var(--fd-muted); }
.fb-input:focus { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.fb-check { display: flex; align-items: center; gap: 8px; color: var(--fd-muted); cursor: pointer; font: 400 13px/18px var(--fd-font-sans); }
.fb-check input { width: 16px; height: 16px; margin: 0; accent-color: var(--fd-accent); }
.fb-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.fb-from { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.fb-send { flex-shrink: 0; height: 36px; padding: 0 16px; border: 0; border-radius: 10px; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; font: 600 14px/20px var(--fd-font-sans); }
.fb-send:hover:not(:disabled) { background: var(--fd-accent-hover); }
.fb-send:disabled { opacity: .4; cursor: default; }
.fb-kind:focus-visible, .fb-send:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.fb-done { display: grid; justify-items: center; gap: 4px; padding: 16px 8px; text-align: center; }
.fb-done b { color: var(--fd-ink); font: 600 15px/22px var(--fd-font-sans); }
.fb-done span:last-child { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.fb-ok { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 6px; border-radius: 50%; background: var(--fd-accent); color: var(--fd-on-accent); }
.fb-enter-active, .fb-leave-active { transition: opacity .16s ease, transform .16s ease; transform-origin: bottom right; }
.fb-enter-from, .fb-leave-to { opacity: 0; transform: translateY(6px) scale(.98); }
:global(.nav-drawer.p-drawer) { width: var(--fd-sidebar) !important; background: var(--fd-panel); border: 0; }
:global(.nav-drawer .p-drawer-header) { display: none; }
:global(.nav-drawer .p-drawer-content) { padding: 0; }
@media (max-width: 1279px) { .feedback, .fb { display: none; } }
@media (max-width: 767px) { .desk-sidebar { display: none; } }
</style>
