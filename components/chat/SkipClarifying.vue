<script setup lang="ts">
// Under the composer in Plan first (live product): leave the "Questions for you" out of the plan
const { state } = useChat();
</script>

<template>
  <label v-if="state.mode === 'plan'" class="skip t-body-sm">
    <input v-model="state.skipClarifying" type="checkbox" class="cb" />Skip clarifying questions
  </label>
</template>

<style scoped>
.skip { display: inline-flex; align-items: center; gap: 8px; justify-self: start; padding-left: 4px; color: var(--fd-muted); cursor: pointer; }
.skip:hover { color: var(--fd-ink); }
.cb { width: 16px; height: 16px; margin: 0; accent-color: var(--fd-accent); cursor: pointer; }
.cb:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
</style>
