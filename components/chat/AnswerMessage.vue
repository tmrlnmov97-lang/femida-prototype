<script setup lang="ts">
import { ref, computed } from 'vue';
import { ANSWER, MODES, DEEP_STEPS } from '~/data/mock';
import { ANSWER_BLOCKS, type AssistantMsg } from '~/composables/useChat';

const props = defineProps<{ msg: AssistantMsg }>();
const { state, openSource, retry, approvePlan } = useChat();
const planned = computed(() => props.msg.mode === 'plan' && props.msg.status !== 'plan');
const showHow = ref(false);
const copied = ref(false);
// "Save to notes" really saves into My notes (shared store)
const notes = useNotes();
const saved = computed(() => !!notes.byQuestion(props.msg.question));
function toggleSave() {
  const n = notes.byQuestion(props.msg.question);
  if (n) notes.remove(n.id);
  else notes.saveAnswer(props.msg.question, { caseId: state.caseCtx?.id, chat: state.chatTitle ?? undefined });
}

const mode = computed(() => MODES.find((m) => m.id === props.msg.mode)!);
// visible slice of each block while streaming
const slices = computed(() => {
  let left = props.msg.progress;
  return ANSWER_BLOCKS.map((b) => { let s = b.slice(0, Math.max(0, left)); if (s.length < b.length) s = s.replace(/\[\d?$/, ''); left -= b.length; return s; });
});
const activeBlock = computed(() => slices.value.findIndex((s, i) => s.length < ANSWER_BLOCKS[i].length));
// Tokens for rendering: plain text, or a "glue" group = last word + citation chip (never wraps apart).
type Tok = { text: string } | { glue: string; cite: number };
const parts = (text: string): Tok[] => {
  const raw = text.split(/(\[\d\])/g).filter(Boolean);
  const out: Tok[] = [];
  raw.forEach((p, i) => {
    const m = p.match(/^\[(\d)\]$/);
    if (!m) { out.push({ text: p }); return; }
    const prev = out[out.length - 1];
    let glue = '';
    if (prev && 'text' in prev) { const mm = prev.text.match(/^(.*\s)?(\S+\s\S+\s?)$/s) || prev.text.match(/^(.*\s)?(\S+\s?)$/s); if (mm) { prev.text = mm[1] || ''; glue = mm[2]; } }
    const next = raw[i + 1]; const punct = next && /^[.,;:]/.test(next) ? next[0] : '';
    if (punct) raw[i + 1] = next.slice(1);
    out.push({ glue: glue + '\u2060', cite: Number(m[1]), punct } as any);
  });
  return out.filter((t) => !('text' in t) || t.text);
};
const streaming = computed(() => props.msg.status === 'streaming');
const nShort = 1, nPar = ANSWER.paragraphs.length;
function copy() { copied.value = true; setTimeout(() => (copied.value = false), 1600); }
</script>

<template>
  <article class="answer" aria-live="polite">
    <header class="head">
      <span class="mark"><i class="pi pi-sparkles" /></span>
      <span class="t-label">femid.ai</span>
      <span v-if="msg.status === 'done' || streaming" class="tag">{{ mode.id === 'auto' ? 'Legal analysis' : mode.label }}</span>
      <span v-if="msg.sources.length" class="tag accent">{{ msg.sources.length }} {{ msg.sources.length === 1 ? 'source' : 'sources' }}</span>
    </header>

    <div v-if="planned" class="plan-done t-caption"><i class="pi pi-check-circle" />Plan approved · 5 steps</div>
    <!-- searching -->
    <div v-if="msg.status === 'searching'" class="searching">
      <span class="t-body-lg shimmer">Searching legislation and court practice…</span>
      <div class="sk"><PSkeleton width="92%" height="14px" /><PSkeleton width="80%" height="14px" /><PSkeleton width="60%" height="14px" /></div>
    </div>

    <!-- plan first: review before answering -->
    <PlanCard v-else-if="msg.status === 'plan'" @approve="approvePlan(msg)" />

    <!-- deep research -->
    <DeepResearch v-else-if="msg.status === 'deep'" :step="msg.deepStep" :found="msg.deepStep * 4" />

    <!-- refused -->
    <RefusalCard v-else-if="msg.status === 'refused'" />

    <!-- errors -->
    <ChatError v-else-if="msg.status === 'error'" :kind="msg.errorKind || 'temporary'" @retry="retry" />

    <!-- answer -->
    <template v-else>
      <div v-if="slices[0]" class="short">
        <span class="t-eyebrow label">Short answer</span>
        <p class="t-body-lg">
          <template v-for="(p, k) in parts(slices[0])" :key="k">
            <span v-if="'cite' in p" class="glue">{{ p.glue }}<button class="cite appear" :class="{ active: state.activeSource === p.cite }" :aria-label="`Source ${p.cite}`" @click="openSource(p.cite)">{{ p.cite }}</button>{{ (p as any).punct }}</span>
            <template v-else>{{ p.text }}</template>
          </template><span v-if="streaming && activeBlock === 0" class="caret" />
        </p>
      </div>
      <p v-for="(s, i) in slices.slice(nShort, nShort + nPar)" v-show="s" :key="'p' + i" class="t-body-lg para">
        <template v-for="(p, k) in parts(s)" :key="k">
          <span v-if="'cite' in p" class="glue">{{ p.glue }}<button class="cite appear" :class="{ active: state.activeSource === p.cite }" :aria-label="`Source ${p.cite}`" @click="openSource(p.cite)">{{ p.cite }}</button>{{ (p as any).punct }}</span>
          <template v-else>{{ p.text }}</template>
        </template><span v-if="streaming && activeBlock === nShort + i" class="caret" />
      </p>
      <ul v-if="slices[nShort + nPar]" class="steps">
        <li v-for="(s, i) in slices.slice(nShort + nPar)" v-show="s" :key="'s' + i" class="t-body-lg">
          <template v-for="(p, k) in parts(s)" :key="k">
            <span v-if="'cite' in p" class="glue">{{ p.glue }}<button class="cite appear" :class="{ active: state.activeSource === p.cite }" :aria-label="`Source ${p.cite}`" @click="openSource(p.cite)">{{ p.cite }}</button>{{ (p as any).punct }}</span>
            <template v-else>{{ p.text }}</template>
          </template><span v-if="streaming && activeBlock === nShort + nPar + i" class="caret" />
        </li>
      </ul>

      <Transition name="fade-up">
        <div v-if="msg.status === 'done'" class="footer">
          <div class="actions">
            <button class="act t-label" @click="copy"><i class="pi" :class="copied ? 'pi-check' : 'pi-copy'" />{{ copied ? 'Copied' : 'Copy' }}</button>
            <button class="act t-label" :class="{ on: saved }" @click="toggleSave"><i class="pi" :class="saved ? 'pi-bookmark-fill' : 'pi-bookmark'" />{{ saved ? 'Saved to notes' : 'Save to notes' }}</button>
            <NuxtLink v-if="saved" to="/notes" class="act t-label open-notes">Open My notes<i class="pi pi-arrow-right" /></NuxtLink>
            <button class="act t-label" :aria-expanded="showHow" @click="showHow = !showHow"><i class="pi pi-shield" />How this answer was found<i class="pi pi-angle-down chev" :class="{ open: showHow }" /></button>
          </div>
          <Transition name="fade-up">
            <ol v-if="showHow" class="how t-body-sm">
              <li v-for="h in ANSWER.howFound" :key="h"><i class="pi pi-check" />{{ h }}</li>
            </ol>
          </Transition>
        </div>
      </Transition>
    </template>
  </article>
</template>

<style scoped>
.answer { display: flex; flex-direction: column; gap: 16px; }
.head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.mark {
  display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%;
  background: var(--fd-accent-soft); border: 1px solid color-mix(in srgb, var(--fd-accent) 40%, transparent); color: var(--fd-accent-text);
}
.mark .pi { font-size: 13px; }
.searching { display: grid; gap: 14px; }
.plan-done { display: inline-flex; align-items: center; gap: 8px; color: var(--fd-accent-text); } .plan-done .pi { font-size: 13px; }
.sk { display: grid; gap: 10px; }
.short {
  display: grid; gap: 4px; padding: 12px 16px; border-radius: var(--fd-radius-md);
  background: color-mix(in srgb, var(--fd-accent-soft) 55%, transparent); border-left: 3px solid var(--fd-accent);
}
.short .label { color: var(--fd-accent-text); }
.short p, .para { margin: 0; color: var(--fd-ink); }
.steps { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.steps li { position: relative; padding-left: 28px; color: var(--fd-ink); }
.steps li::before { content: ''; position: absolute; left: 7px; top: 11px; width: 6px; height: 6px; border-radius: 50%; background: var(--fd-accent); }
.footer { display: grid; gap: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 4px; margin-left: -10px; }
.act {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px;
  background: transparent; color: var(--fd-muted); cursor: pointer; transition: background-color .15s, color .15s;
}
.act.open-notes { text-decoration: none; color: var(--fd-accent-text); }
.act.open-notes .pi { font-size: 11px; }
.act .pi { font-size: 13px; }
.act:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); color: var(--fd-ink); }
.act.on { color: var(--fd-accent-text); }
.chev { transition: transform .2s ease; } .chev.open { transform: rotate(180deg); }
.how { display: grid; gap: 6px; margin: 0; padding: 12px 16px; list-style: none; border-radius: var(--fd-radius-md); background: var(--fd-panel); border: 1px solid var(--fd-line); color: var(--fd-muted); }
.glue { white-space: nowrap; }
.how li { display: flex; align-items: center; gap: 10px; } .how .pi { color: var(--fd-accent-text); font-size: 12px; }
</style>
