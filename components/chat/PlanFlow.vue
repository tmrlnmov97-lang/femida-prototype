<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AssistantMsg } from '~/composables/useChat';

// Plan first in the thread, the way Claude shows its work: quiet step lines (read the sources → clarifying questions →
// drafting the plan), a Stop while it works, then the plan as a document. The questions and "Would you like to proceed?"
// live in the dock, in place of the composer (PlanQuestions / PlanProceed). A pulse, not a spinner (DS rule).
const props = defineProps<{ msg: AssistantMsg }>();
const { stop } = useChat();
const p = computed(() => props.msg.planning || { phase: 'search', read: 0, steps: 0, secs: 0 });
const searching = computed(() => props.msg.status === 'planning' && p.value.phase === 'search');
const drafting = computed(() => props.msg.status === 'planning' && p.value.phase === 'draft');
const asking = computed(() => props.msg.status === 'asking');
const showAnswers = ref(false);
const answers = computed(() => props.msg.answers || []);
</script>

<template>
  <div class="flow">
    <ol class="trail" aria-live="polite">
      <li :class="{ now: searching }">
        <span class="st"><span v-if="searching" class="pulse" /><i v-else class="pi pi-check" /></span>
        <span class="tx"><span class="nm">Searching the sources</span><span class="mt">Sources read: {{ p.read }} · steps: {{ p.steps }}</span></span>
      </li>
      <li v-if="!msg.noQuestions && (asking || msg.answers)" :class="{ now: asking }">
        <span class="st"><span v-if="asking" class="pulse" /><i v-else class="pi pi-check" /></span>
        <span class="tx">
          <span class="nm">Clarifying questions</span>
          <span v-if="asking" class="mt">Answer below — or skip&nbsp;them</span>
          <button v-else-if="answers.length" class="mt more" :aria-expanded="showAnswers" @click="showAnswers = !showAnswers">
            {{ answers.length }} answered<i class="pi pi-angle-down chev" :class="{ open: showAnswers }" />
          </button>
          <span v-else class="mt">Skipped</span>
          <ul v-if="showAnswers" class="ans"><li v-for="a in answers" :key="a.h"><b>{{ a.h }}</b>{{ a.a }}</li></ul>
        </span>
      </li>
      <li v-if="drafting || msg.status === 'plan'" :class="{ now: drafting }">
        <span class="st"><span v-if="drafting" class="pulse" /><i v-else class="pi pi-check" /></span>
        <span class="tx"><span class="nm">Drafting the research plan<span v-if="drafting" class="secs">· {{ p.secs }}s</span></span></span>
      </li>
    </ol>

    <div v-if="msg.status === 'planning'" class="gen">
      <span class="t-body-sm shimmer">Generating…</span>
      <button class="stop t-label" @click="stop"><i class="pi pi-stop-circle" />Stop</button>
    </div>
    <p v-if="msg.status === 'stopped'" class="stopped t-body-sm"><i class="pi pi-stop-circle" />Stopped. No credits were&nbsp;used.</p>

    <Transition name="fade-up"><PlanDoc v-if="msg.status === 'plan'" :msg="msg" /></Transition>
  </div>
</template>

<style scoped>
p, ol, ul { margin: 0; }
.flow { display: grid; gap: 16px; }
.trail { display: grid; gap: 10px; padding: 0; list-style: none; }
.trail > li { display: flex; align-items: flex-start; gap: 12px; }
.st { display: grid; place-items: center; width: 18px; height: 24px; flex-shrink: 0; color: var(--fd-accent-text); }
.st .pi { font-size: 12px; }
.tx { display: grid; gap: 1px; min-width: 0; }
.nm { color: var(--fd-muted); font: 500 15px/24px var(--fd-font-sans); }
.now .nm { color: var(--fd-ink); font-weight: 600; }
.secs { margin-left: 8px; color: var(--fd-muted); font-weight: 400; font-size: 14px; }
.mt { color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.more { display: inline-flex; align-items: center; gap: 6px; justify-self: start; padding: 0; border: 0; background: none; cursor: pointer; }
.more:hover { color: var(--fd-ink); }
.more:focus-visible, .stop:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 2px; }
.chev { font-size: 10px; transition: transform .2s ease; } .chev.open { transform: rotate(180deg); }
.ans { display: grid; gap: 4px; margin-top: 6px; padding: 10px 12px; list-style: none; border-radius: var(--fd-radius-md); background: var(--fd-panel); border: 1px solid var(--fd-line); }
.ans li { color: var(--fd-ink); font: 400 14px/21px var(--fd-font-sans); }
.ans b { margin-right: 8px; color: var(--fd-muted); font-weight: 500; }
.pulse { position: relative; width: 8px; height: 8px; border-radius: 50%; background: var(--fd-accent); }
.pulse::after { content: ''; position: absolute; inset: -5px; border-radius: 50%; border: 2px solid var(--fd-accent); opacity: 0; animation: ring 1.4s ease-out infinite; }
@keyframes ring { 0% { transform: scale(.5); opacity: .7; } 100% { transform: scale(1.4); opacity: 0; } }
.gen { display: flex; align-items: center; gap: 14px; padding-left: 30px; }
.gen .shimmer { color: var(--fd-muted); }
.stop { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; }
.stop .pi { color: var(--fd-accent-text); font-size: 13px; }
.stop:hover { border-color: color-mix(in srgb, var(--fd-accent) 50%, var(--fd-line)); }
.stopped { display: inline-flex; align-items: center; gap: 8px; color: var(--fd-muted); } .stopped .pi { font-size: 14px; }
@media (prefers-reduced-motion: reduce) { .pulse::after { animation: none; } }
</style>
