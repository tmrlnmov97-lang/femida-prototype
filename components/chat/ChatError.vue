<script setup lang="ts">
import type { ErrorKind } from '~/composables/useChat';
const props = defineProps<{ kind: ErrorKind }>();
const emit = defineEmits<{ (e: 'retry'): void }>();
const COPY: Record<ErrorKind, { icon: string; title: string; body: string; action: string; actionIcon: string }> = {
  temporary: { icon: 'pi-refresh', title: 'Couldn’t get an answer — this is temporary', body: 'The connection dropped before the answer arrived. Your question is saved and wasn’t counted.', action: 'Try again', actionIcon: 'pi-refresh' },
  quota: { icon: 'pi-bolt', title: 'This question wasn’t sent: your plan limit is reached', body: 'Your question is saved and wasn’t counted. Choose a plan to send it.', action: 'View plans', actionIcon: 'pi-arrow-right' },
  service: { icon: 'pi-exclamation-circle', title: 'A problem on our side — we’re fixing it', body: 'This isn’t something you can fix by retrying. Your question is saved; we’ll be back shortly.', action: 'Check status', actionIcon: 'pi-external-link' },
};
const c = COPY[props.kind];
</script>

<template>
  <div class="err" :class="props.kind" role="alert">
    <i class="pi icon" :class="c.icon" />
    <div class="body">
      <h3 class="t-label">{{ c.title }}</h3>
      <p class="t-body-sm">{{ c.body }}</p>
      <PButton :label="c.action" :icon="'pi ' + c.actionIcon" icon-pos="right" size="small" :severity="props.kind === 'service' ? 'secondary' : undefined" @click="props.kind === 'temporary' && emit('retry')" />
    </div>
  </div>
</template>

<style scoped>
.err { display: flex; gap: 12px; padding: 16px; border-radius: var(--fd-radius-lg); }
.icon { font-size: 18px; margin-top: 2px; }
.body { display: grid; gap: 8px; justify-items: start; }
h3 { margin: 0; }
p { margin: 0; color: var(--fd-ink); }
.temporary { background: var(--fd-panel-2); } .temporary .icon { color: var(--fd-muted); } .temporary h3 { color: var(--fd-ink); }
.quota { background: var(--fd-amber-soft); } .quota .icon, .quota h3 { color: var(--fd-amber); }
.service { background: var(--fd-red-soft); } .service .icon, .service h3 { color: var(--fd-red); }
</style>
