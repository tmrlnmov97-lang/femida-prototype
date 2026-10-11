<script setup lang="ts">
import type { PlanProgress } from '~/composables/useChat';
// Plan first, while the plan is being drafted (live product, 11.10): search the sources → draft the plan, with a Stop.
// A pulse instead of the live spinner (DS rule: no spinners).
defineProps<{ p: PlanProgress }>();
const emit = defineEmits<{ (e: 'stop'): void }>();
</script>

<template>
  <div class="pp">
    <ol class="card" aria-live="polite">
      <li class="row" :class="{ done: p.phase === 'draft' }">
        <span class="st"><i v-if="p.phase === 'draft'" class="pi pi-check" /><span v-else class="pulse" /></span>
        <span class="txt">
          <span class="name">Searching the sources</span>
          <span class="meta">Sources read: {{ p.read }} · steps: {{ p.steps }}</span>
        </span>
      </li>
      <Transition name="fade-up">
        <li v-if="p.phase === 'draft'" class="row now">
          <span class="st"><span class="pulse" /></span>
          <span class="txt"><span class="name">Drafting the research plan<span class="secs">· {{ p.secs }}s</span></span></span>
        </li>
      </Transition>
    </ol>
    <div class="gen">
      <span class="t-body-sm shimmer">Generating…</span>
      <button class="stop t-label" @click="emit('stop')"><i class="pi pi-stop-circle" />Stop</button>
    </div>
  </div>
</template>

<style scoped>
.pp { display: grid; gap: 12px; }
.card { display: grid; gap: 14px; margin: 0; padding: 18px 20px; list-style: none; border-radius: var(--fd-radius-lg); border: 1px solid var(--fd-line); background: var(--fd-panel); }
.row { display: flex; align-items: flex-start; gap: 14px; }
.st { display: grid; place-items: center; width: 22px; height: 26px; flex-shrink: 0; color: var(--fd-accent-text); }
.st .pi { font-size: 14px; }
.txt { display: grid; gap: 2px; }
.name { color: var(--fd-ink); font: 500 16px/26px var(--fd-font-sans); }
.now .name { font-weight: 600; }
.secs { margin-left: 8px; color: var(--fd-muted); font-weight: 400; font-size: 14px; }
.meta { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.pulse { position: relative; width: 10px; height: 10px; border-radius: 50%; background: var(--fd-accent); }
.pulse::after { content: ''; position: absolute; inset: -5px; border-radius: 50%; border: 2px solid var(--fd-accent); opacity: 0; animation: ring 1.4s ease-out infinite; }
@keyframes ring { 0% { transform: scale(.5); opacity: .7; } 100% { transform: scale(1.4); opacity: 0; } }
.gen { display: flex; align-items: center; gap: 16px; padding-left: 4px; }
.gen .shimmer { color: var(--fd-muted); }
.stop { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; }
.stop .pi { color: var(--fd-accent-text); font-size: 14px; }
.stop:hover { border-color: color-mix(in srgb, var(--fd-accent) 50%, var(--fd-line)); }
.stop:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .pulse::after { animation: none; } }
</style>
