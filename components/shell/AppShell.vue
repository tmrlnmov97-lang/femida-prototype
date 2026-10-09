<script setup lang="ts">
import { ref, onMounted } from 'vue';

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

    <button class="feedback" aria-label="Send feedback" v-tooltip.left="'Feedback'"><i class="pi pi-comment" /></button>
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
}
:global(.nav-drawer.p-drawer) { width: var(--fd-sidebar) !important; background: var(--fd-panel); border: 0; }
:global(.nav-drawer .p-drawer-header) { display: none; }
:global(.nav-drawer .p-drawer-content) { padding: 0; }
@media (max-width: 1279px) { .feedback { display: none; } }
@media (max-width: 767px) { .desk-sidebar { display: none; } }
</style>
