<script setup lang="ts">
import { ref } from 'vue';
const lift = ref(0); // px the hero moves up while the mode list is open (set by the composer)
const { state } = useChat();
</script>

<template>
  <section class="empty" :style="lift ? { transform: `translateY(-${lift}px)` } : undefined">
    <div class="greeting">
      <span class="mark"><i class="pi pi-sparkles" /></span>
      <h2>What does the law&nbsp;say?</h2>
    </div>
    <div class="hero-composer">
      <!-- Asked from My cases: the answer will use this case's documents -->
      <div v-if="state.caseCtx" class="case-ctx">
        <i class="pi pi-briefcase" />
        <span>Asking in <b>{{ state.caseCtx.name }}</b><template v-if="state.caseCtx.docs"> · answers use its {{ state.caseCtx.docs === 1 ? 'document' : `${state.caseCtx.docs} documents` }}</template></span>
        <button aria-label="Ask outside the case" v-tooltip.top="'Ask outside the case'" @click="state.caseCtx = null"><i class="pi pi-times" /></button>
      </div>
      <ChatComposer variant="hero" @lift="lift = $event" />
    </div>
    <p class="trust t-caption"><i class="pi pi-shield" />Answers cite legislation, court practice and ECHR decisions. No source — no&nbsp;answer.</p>
  </section>
</template>

<style scoped>
.empty { position: relative; display: flex; flex-direction: column; align-items: center; gap: 28px; width: 100%; max-width: 720px; margin: auto; padding: 32px 0 48px; transition: transform .25s var(--fd-easing, ease); }
.hero-composer { width: 100%; display: grid; gap: 10px; }
.case-ctx {
  display: inline-flex; align-items: center; gap: 10px; justify-self: start; max-width: 100%; height: 36px; padding: 0 6px 0 12px; border-radius: 999px;
  background: var(--fd-accent-soft); color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fd-accent) 30%, transparent);
}
.case-ctx > .pi { font-size: 13px; color: var(--fd-accent-text); }
.case-ctx span { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.case-ctx b { font-weight: 600; }
.case-ctx button { display: grid; place-items: center; width: 24px; height: 24px; flex-shrink: 0; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.case-ctx button:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.case-ctx button .pi { font-size: 10px; }
.greeting { position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; }
.mark {
  display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; margin-bottom: 4px;
  background: var(--fd-accent-soft); border: 1px solid color-mix(in srgb, var(--fd-accent) 40%, transparent);
  color: var(--fd-accent-text); font-size: 22px;
}
.mark .pi { font-size: 22px; }
h2 { margin: 0; font: 600 40px/48px var(--fd-font-serif); letter-spacing: -.01em; }
.trust { position: relative; display: flex; align-items: center; gap: 8px; margin: 0; color: var(--fd-muted); text-align: center; }
.trust .pi { color: var(--fd-accent-text); font-size: 13px; }
@media (max-width: 767px) {
  .empty { gap: 20px; padding: 16px 0 24px; }
  h2 { font-size: 30px; line-height: 38px; }
  .trust { font-size: 13px; }
}
</style>
