<script setup lang="ts">
import { ref } from 'vue';
import { STARTERS } from '~/data/mock';
const composer = ref();
</script>

<template>
  <section class="empty">
    <div class="greeting">
      <span class="mark"><i class="pi pi-sparkles" /></span>
      <h2>What does the law&nbsp;say?</h2>
    </div>
    <div class="hero-composer"><ChatComposer ref="composer" variant="hero" /></div>
    <div class="starters">
      <button v-for="s in STARTERS" :key="s.text" class="pill" @click="composer?.prefill(s.text)">
        <span>{{ s.label }}</span>
        <i class="pi pi-arrow-up-right go" />
      </button>
    </div>
    <p class="trust t-caption"><i class="pi pi-shield" />Answers cite legislation, court practice and ECHR decisions. No source — no&nbsp;answer.</p>
  </section>
</template>

<style scoped>
.empty { position: relative; display: flex; flex-direction: column; align-items: center; gap: 28px; width: 100%; max-width: 720px; margin: auto; padding: 32px 0 48px; }
.hero-composer { width: 100%; }
.glow { position: absolute; top: -80px; left: 50%; width: 900px; height: 520px; transform: translateX(-50%); pointer-events: none;
  background: radial-gradient(closest-side, var(--fd-glow), var(--fd-glow-soft) 45%, transparent); opacity: .65; }
.greeting { position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.mark {
  display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; margin-bottom: 4px;
  background: var(--fd-accent-soft); border: 1px solid color-mix(in srgb, var(--fd-accent) 40%, transparent);
  color: var(--fd-accent-text); font-size: 22px;
}
.mark .pi { font-size: 22px; }
h2 { margin: 0; font: 600 40px/48px var(--fd-font-serif); letter-spacing: -.01em; }
/* One row from the composer's left edge to its right edge: each pill = its text + an equal share of the spare width. */
.starters { position: relative; display: flex; flex-wrap: wrap; gap: 10px; width: 100%; margin-top: -14px; }
.pill {
  flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 0; height: 40px; padding: 0 16px 0 18px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-panel) 70%, transparent); color: var(--fd-muted);
  font: 400 15px/20px var(--fd-font-sans); white-space: nowrap;
  transition: color .15s ease, border-color .15s ease, background-color .15s ease, transform .15s ease, box-shadow .2s ease;
}
.pill:hover, .pill:focus-visible {
  color: var(--fd-ink); background: var(--fd-panel); transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--fd-accent) 45%, transparent); box-shadow: 0 6px 20px rgb(0 0 0 / .18), 0 0 0 3px var(--fd-glow-soft);
}
.go { font-size: 11px; color: var(--fd-accent-text); width: 0; opacity: 0; margin-left: -8px; transition: width .15s ease, opacity .15s ease, margin .15s ease; }
.pill:hover .go, .pill:focus-visible .go { width: 11px; opacity: 1; margin-left: 0; }
.trust { position: relative; display: flex; align-items: center; gap: 8px; margin: 0; color: var(--fd-muted); text-align: center; }
.trust .pi { color: var(--fd-accent-text); font-size: 13px; }
@media (max-width: 767px) {
  .empty { gap: 20px; padding: 16px 0 24px; }
  h2 { font-size: 30px; line-height: 38px; }
  /* Phone: still one row — it scrolls sideways, edge to edge. */
  .starters { flex-wrap: nowrap; gap: 8px; width: calc(100% + 32px); margin: -10px -16px 0; padding: 0 16px; overflow-x: auto; scrollbar-width: none; }
  .starters::-webkit-scrollbar { display: none; }
  .pill { flex: none; }
  .trust { font-size: 13px; }
}
</style>
