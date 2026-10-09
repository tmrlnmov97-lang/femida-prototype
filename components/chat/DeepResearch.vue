<script setup lang="ts">
import { DEEP_STEPS } from '~/data/mock';
const props = defineProps<{ step: number; found: number }>();
</script>

<template>
  <div class="deep">
    <div class="head">
      <i class="pi pi-search" />
      <h3 class="t-label">Deep research · about {{ Math.max(1, 5 - props.step) }} min left</h3>
      <span class="t-label found">{{ props.found }} sources found</span>
    </div>
    <div class="bar"><span :style="{ width: (props.step / DEEP_STEPS.length) * 100 + '%' }" /></div>
    <ol class="steps">
      <li v-for="(s, i) in DEEP_STEPS" :key="s" :class="{ done: i < props.step, now: i === props.step }">
        <i class="pi" :class="i < props.step ? 'pi-check' : i === props.step ? 'pi-spinner pi-spin' : 'pi-clock'" />
        <span class="t-body-sm">{{ s }}</span>
      </li>
    </ol>
    <p class="t-caption muted">You can leave this page — we’ll mark the chat when the answer is ready.</p>
  </div>
</template>

<style scoped>
.deep { display: grid; gap: 14px; padding: 20px; border-radius: var(--fd-radius-lg); background: var(--fd-panel); border: 1px solid var(--fd-line); }
.head { display: flex; align-items: center; gap: 10px; }
.head .pi { color: var(--fd-accent-text); }
.head h3 { margin: 0; flex: 1; font-size: 17px; }
.found { color: var(--fd-accent-text); }
.bar { height: 4px; border-radius: 4px; background: var(--fd-line); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--fd-accent); transition: width .6s ease; box-shadow: 0 0 12px var(--fd-glow); }
.steps { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.steps li { display: flex; align-items: center; gap: 12px; color: var(--fd-muted); }
.steps li .pi { width: 16px; font-size: 13px; }
.steps li.done { color: var(--fd-ink); } .steps li.done .pi { color: var(--fd-accent-text); }
.steps li.now { color: var(--fd-ink); } .steps li.now .pi { color: var(--fd-accent); }
p { margin: 0; }
</style>
