<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
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
const sourcesLoading = computed(() => !!lastAssistant.value && ['searching', 'deep', 'streaming'].includes(lastAssistant.value.status));
const modeLabel = (id: string) => MODES.find((m) => m.id === id)?.label;

watch(() => [state.messages.length, lastAssistant.value?.progress, lastAssistant.value?.deepStep], async () => {
  await nextTick(); scroller.value?.scrollTo({ top: scroller.value.scrollHeight, behavior: 'smooth' });
});
onMounted(() => {
  const d = route.query.demo; if (typeof d === 'string') demo(d);
  // phone: the sources sheet opens only on demand (citation tap / Sources button)
  if (window.innerWidth < 768 && d !== 'fragment' && d !== 'sheet') state.sourcesOpen = false;
  if (d === 'sheet') { demo('answer'); state.sourcesOpen = true; }
});
</script>

<template>
  <AppShell :active-chat="isEmpty ? null : 'c1'" :active-status="activeStatus" :sources-count="sourcesCount" :sources-open="!!sourcesVisible"
            @new-chat="newChat()" @sources="state.sourcesOpen = !sourcesVisible">
        <div class="column">
          <div ref="scroller" class="scroll conversation">
            <ChatEmpty v-if="isEmpty" />
            <div v-else class="thread">
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
          </div>
          <div v-if="!isEmpty" class="dock">
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
.conversation { flex: 1; display: flex; flex-direction: column; padding: 0 24px; }
.thread { display: flex; flex-direction: column; gap: 32px; width: 100%; max-width: 720px; margin: 0 auto; padding: 32px 0 24px; }
.user-msg { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.bubble { max-width: 560px; padding: 12px 16px; border-radius: 16px 16px 4px 16px; background: var(--fd-panel-2); color: var(--fd-ink); }
.file-ref { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: var(--fd-accent-text); }
.mode { display: inline-flex; align-items: center; gap: 6px; } .mode .pi { font-size: 11px; color: var(--fd-accent-text); }
.dock { position: relative; padding: 0 24px 20px; }
.dock::before { content: ''; position: absolute; left: 0; right: 0; top: -48px; height: 48px; pointer-events: none; background: linear-gradient(180deg, transparent, var(--fd-bg)); }
.dock-inner { display: grid; gap: 10px; max-width: 720px; margin: 0 auto; }
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
  .dock { padding: 0 12px 12px; }
  .sources-wrap { position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; box-shadow: none; }
  .backdrop { display: block; position: absolute; inset: 0; background: rgb(0 0 0 / .5); }
  .sources-wrap :deep(.sources) { position: relative; }
  .slide-enter-from, .slide-leave-to { transform: translateY(40px); }
}
</style>
