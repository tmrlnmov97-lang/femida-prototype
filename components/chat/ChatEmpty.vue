<template>
  <section class="empty">
    <div class="greeting">
      <span class="mark"><i class="pi pi-sparkles" /></span>
      <h2>What does the law&nbsp;say?</h2>
    </div>
    <div class="hero-composer"><ChatComposer variant="hero" /></div>
    <p class="trust t-caption"><i class="pi pi-shield" />Answers cite legislation, court practice and ECHR decisions. No source — no&nbsp;answer.</p>
  </section>
</template>

<style scoped>
.empty { position: relative; display: flex; flex-direction: column; align-items: center; gap: 28px; width: 100%; max-width: 720px; margin: auto; padding: 32px 0 48px; }
.hero-composer { width: 100%; }
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
