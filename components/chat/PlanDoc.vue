<script setup lang="ts">
import { ref, computed } from 'vue';
import { RESEARCH_PLAN as P } from '~/data/mock';
import type { AssistantMsg } from '~/composables/useChat';

// The research plan as a plain document, like Claude's plan: headings, numbered lists, no form fields. Changes are asked
// for in words ("No, keep planning" in the dock). Content = the live product's sample (data/mock RESEARCH_PLAN).
// collapsed: after approval it folds into one line above the answer.
const props = defineProps<{ msg: AssistantMsg; collapsed?: boolean }>();
const open = ref(false);
const summary = computed(() => `${P.issues.length} issues · ${P.steps.length} steps · ${P.sources.length} sources`);
const acts = computed(() => [...new Map(P.sources.map((s) => [s.act, s.meta]))]);
</script>

<template>
  <article class="doc" :class="{ folded: props.collapsed }">
    <button v-if="props.collapsed" class="fold" :aria-expanded="open" @click="open = !open">
      <i class="pi pi-check-circle ok" />
      <span class="f-t">Research plan approved</span><span class="f-s">· {{ summary }}</span>
      <i class="pi pi-angle-down chev" :class="{ open }" />
    </button>

    <div v-if="!props.collapsed || open" class="body">
      <h3 v-if="!props.collapsed" class="title"><i class="pi pi-list-check" />Research plan</h3>

      <h4>Goal</h4>
      <p>{{ P.goal }}</p>

      <h4>Legal issues to resolve</h4>
      <ol class="num"><li v-for="t in P.issues" :key="t">{{ t }}</li></ol>

      <h4>Sources to check</h4>
      <ul class="dot"><li v-for="s in P.sources" :key="s.article"><b>{{ s.act }}, {{ s.article }}</b> — {{ s.note }}</li></ul>
      <p v-for="[act, meta] in acts" :key="act" class="meta">{{ act }}: {{ meta }}</p>

      <h4>Research steps</h4>
      <ol class="num"><li v-for="t in P.steps" :key="t">{{ t }}</li></ol>

      <template v-if="msg.answers?.length">
        <h4>Facts from your answers</h4>
        <ul class="dot"><li v-for="a in msg.answers" :key="a.h"><b>{{ a.h }}:</b> {{ a.a }}</li></ul>
      </template>

      <h4>Assumptions</h4>
      <ul class="dot"><li v-for="a in P.assumptions" :key="a">{{ a }}</li></ul>

      <template v-if="msg.revisions?.length">
        <h4>Changes you asked for</h4>
        <ul class="dot"><li v-for="r in msg.revisions" :key="r">{{ r }}</li></ul>
      </template>

      <div class="notes">
        <p class="note"><i class="pi pi-info-circle" />This is a research plan, not legal advice. The answer will cite verified sources&nbsp;only.</p>
        <p class="note warn"><i class="pi pi-exclamation-triangle" />Items that stated the law were left out of the&nbsp;plan.</p>
      </div>
    </div>
  </article>
</template>

<style scoped>
h3, h4, p, ol, ul { margin: 0; }
.doc { border-radius: var(--fd-radius-lg); border: 1px solid var(--fd-line); background: var(--fd-panel); }
.body { display: grid; gap: 10px; padding: 22px 24px 20px; }
.folded .body { padding-top: 4px; border-top: 1px solid var(--fd-line); }
.title { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; color: var(--fd-ink); font: 600 19px/26px var(--fd-font-sans); }
.title .pi { color: var(--fd-accent-text); font-size: 16px; }
h4 { margin-top: 12px; color: var(--fd-ink); font: 600 16px/24px var(--fd-font-sans); }
p, li { color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.num, .dot { display: grid; gap: 6px; padding-left: 22px; }
.num li::marker { color: var(--fd-muted); font-weight: 500; }
.dot { list-style: disc; } .dot li::marker { color: var(--fd-muted); }
b { font-weight: 600; }
.meta { color: var(--fd-muted); font-size: 13px; line-height: 19px; }
.notes { display: grid; gap: 4px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--fd-line); }
.note { display: flex; align-items: flex-start; gap: 8px; color: var(--fd-muted); font-size: 13px; line-height: 19px; }
.note .pi { margin-top: 3px; font-size: 12px; }
.note.warn { color: var(--fd-amber); }

.fold { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 16px; border: 0; border-radius: var(--fd-radius-lg); background: none; cursor: pointer; text-align: left; }
.fold:hover { background: color-mix(in srgb, var(--fd-ink) 4%, transparent); }
.fold:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.ok { color: var(--fd-accent-text); font-size: 14px; }
.f-t { color: var(--fd-ink); font: 500 15px/22px var(--fd-font-sans); }
.f-s { flex: 1; min-width: 0; overflow: hidden; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); text-overflow: ellipsis; white-space: nowrap; }
.chev { color: var(--fd-muted); font-size: 12px; transition: transform .2s ease; } .chev.open { transform: rotate(180deg); }
@media (max-width: 767px) { .body { padding: 18px 16px 16px; } }
</style>
