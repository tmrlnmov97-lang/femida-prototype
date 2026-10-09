<script setup lang="ts">
import { computed } from 'vue';
import type { Source } from '~/data/mock';
const props = defineProps<{ sources: Source[]; loading?: boolean }>();
const { state } = useChat();
const active = computed(() => props.sources.find((s) => s.n === state.activeSource) || null);
const KIND_ICON: Record<Source['kind'], string> = { Law: 'pi-book', 'Court decision': 'pi-briefcase', ECHR: 'pi-globe' };
function close() { state.sourcesOpen = false; state.activeSource = null; }
</script>

<template>
  <aside class="sources" aria-label="Sources">
    <div class="grab" aria-hidden="true" />
    <header class="head">
      <button v-if="active" class="icon-btn" aria-label="Back to all sources" @click="state.activeSource = null"><i class="pi pi-arrow-left" /></button>
      <i v-else class="pi pi-book lead" />
      <h2 class="t-label">{{ active ? `Source ${active.n}` : 'Sources' }}</h2>
      <span v-if="!active && props.sources.length" class="count t-label">{{ props.sources.length }}</span>
      <div class="grow" />
      <button class="icon-btn" aria-label="Close sources" @click="close"><i class="pi pi-times" /></button>
    </header>

    <div class="body scroll">
      <template v-if="active">
        <article class="card active">
          <div class="top"><span class="num">{{ active.n }}</span><span class="tag"><i class="pi" :class="KIND_ICON[active.kind]" />{{ active.kind }}</span></div>
          <h3 class="t-label">{{ active.title }}</h3>
          <p class="t-caption muted">{{ active.ref }}</p>
          <blockquote class="t-body-sm">{{ active.quote }}</blockquote>
          <a href="#" class="link t-label" @click.prevent>Open official text <i class="pi pi-external-link" /></a>
        </article>
      </template>
      <template v-else>
        <p class="note t-body-sm muted">Every statement in the answer links to one of&nbsp;these.</p>
        <TransitionGroup name="fade-up">
          <button v-for="s in props.sources" :key="s.n" class="card" @click="state.activeSource = s.n">
            <div class="top"><span class="num">{{ s.n }}</span><span class="tag"><i class="pi" :class="KIND_ICON[s.kind]" />{{ s.kind }}</span></div>
            <h3 class="t-label">{{ s.title }}</h3>
            <p class="t-caption muted">{{ s.ref }}</p>
          </button>
        </TransitionGroup>
        <div v-if="props.loading" class="sk">
          <div v-for="i in Math.max(1, 3 - props.sources.length)" :key="i" class="sk-card">
            <PSkeleton width="40%" height="12px" /><PSkeleton width="85%" height="14px" /><PSkeleton width="55%" height="12px" />
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<style scoped>
.sources { display: flex; flex-direction: column; width: var(--fd-sources); height: 100%; background: var(--fd-panel); border-left: 1px solid var(--fd-line); }
.grab { display: none; }
.head { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 12px 0 16px; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); }
.head h2 { margin: 0; font-size: 17px; }
.lead { color: var(--fd-accent-text); }
.count { color: var(--fd-muted); }
.grow { flex: 1; }
.body { flex: 1; display: flex; flex-direction: column; gap: 10px; padding: 16px; }
.note { margin: 0 0 4px; }
.card {
  display: grid; gap: 6px; width: 100%; padding: 14px; border-radius: var(--fd-radius-md); text-align: left; cursor: pointer;
  background: var(--fd-panel); border: 1px solid var(--fd-line); color: var(--fd-ink); transition: border-color .15s, background-color .15s;
}
.card:hover { background: var(--fd-panel-2); border-color: color-mix(in srgb, var(--fd-accent) 40%, transparent); }
.card.active { cursor: default; border-color: var(--fd-accent); box-shadow: 0 0 0 4px color-mix(in srgb, var(--fd-accent) 10%, transparent); }
.top { display: flex; align-items: center; gap: 8px; }
.num { display: grid; place-items: center; min-width: 20px; height: 20px; border-radius: var(--fd-radius-sm); background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.card.active .num { background: var(--fd-accent); color: var(--fd-on-accent); }
.tag .pi { font-size: 11px; }
h3 { margin: 0; } p { margin: 0; }
blockquote { margin: 6px 0 0; padding: 10px 12px; border-radius: var(--fd-radius-sm); background: color-mix(in srgb, var(--fd-accent-soft) 70%, transparent); color: var(--fd-ink); border-left: 2px solid var(--fd-accent); }
.link { display: inline-flex; align-items: center; gap: 6px; color: var(--fd-accent-text); text-decoration: none; margin-top: 4px; }
.link .pi { font-size: 12px; }
.sk { display: grid; gap: 10px; }
.sk-card { display: grid; gap: 8px; padding: 14px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-line); }
@media (max-width: 767px) {
  .sources { width: 100%; height: auto; max-height: 72vh; border-left: 0; border-top: 1px solid var(--fd-line); border-radius: 20px 20px 0 0; box-shadow: 0 -16px 40px rgb(0 0 0 / .4); }
  .grab { display: block; width: 40px; height: 4px; margin: 8px auto 0; border-radius: 4px; background: var(--fd-line); }
}
</style>
