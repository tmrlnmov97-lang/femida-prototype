<template>
  <div class="oq" role="status">
    <span class="mark"><i class="pi pi-database" /></span>
    <div class="text">
      <h3 class="t-label">You’ve used all 50 credits</h3>
      <p class="t-body-sm">Choose a plan to keep asking — your chats and documents&nbsp;stay.</p>
    </div>
    <PButton label="View plans" icon="pi pi-arrow-right" icon-pos="right" rounded />
  </div>
</template>

<style scoped>
.oq { display: flex; align-items: center; gap: 16px; width: 100%; padding: 16px 16px 16px 20px; border-radius: var(--fd-radius-xl); background: var(--fd-amber-soft); }
.mark { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: color-mix(in srgb, var(--fd-amber) 18%, transparent); color: var(--fd-amber); flex-shrink: 0; }
.text { flex: 1; display: grid; gap: 2px; }
h3 { margin: 0; font-size: 17px; color: var(--fd-ink); }
p { margin: 0; color: var(--fd-ink); opacity: .85; }
@media (max-width: 767px) { .oq { flex-wrap: wrap; } }
</style>
