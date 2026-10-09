<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ANSWER, SOURCES } from '~/data/mock';
import { rel } from '~/composables/useCases';

// A note reads like the answer in the chat: title, text with sources, and one row of actions under it.
const route = useRoute();
const { byId } = useCases();
const { state: ns, remove } = useNotes();
const n = computed(() => ns.notes.find((x) => x.id === String(route.params.id)));
useHead(() => ({ title: `${n.value?.title ?? 'Note'} — Femida redesign prototype` }));

const ready = ref(false);
onMounted(() => setTimeout(() => (ready.value = true), 300));

const segs = (t: string) => t.split(/(\[\d+\])/).filter(Boolean).map((p) => (/^\[\d+\]$/.test(p) ? { n: Number(p.slice(1, -1)) } : { t: p }));
const activeSrc = ref<number | null>(null);
const copied = ref(false);
function copy() { copied.value = true; setTimeout(() => (copied.value = false), 1500); }
function openChat() { if (!n.value) return; navigateTo({ path: '/', query: { demo: 'answer', ...(n.value.caseId ? { case: n.value.caseId, chat: n.value.chat ?? n.value.title } : {}) } }); }
function removeNote() { if (!n.value) return; remove(n.value.id); navigateTo('/notes'); }
</script>

<template>
  <AppShell>
    <div class="scroll page">
      <div class="wrap">
        <NuxtLink to="/notes" class="back"><i class="pi pi-arrow-left" />My notes</NuxtLink>

        <div v-if="!n" class="state">
          <h2>Note not found</h2>
          <p>It may have been removed.</p>
          <NuxtLink to="/notes" class="act">Back to My notes</NuxtLink>
        </div>

        <div v-else-if="!ready" class="skel"><PSkeleton width="80%" height="30px" /><PSkeleton width="35%" height="13px" /><PSkeleton height="80px" /><PSkeleton height="120px" /></div>

        <article v-else>
          <h1>{{ n.title }}</h1>
          <p class="meta">
            Saved {{ rel(n.saved) }}<template v-if="n.caseId && byId(n.caseId)"> · <NuxtLink :to="`/cases/${n.caseId}`" class="link">{{ byId(n.caseId)!.name }}</NuxtLink></template>
          </p>

          <template v-if="n.kind === 'answer'">
            <p class="short"><template v-for="(s, i) in segs(ANSWER.short)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
            <p v-for="(para, pi) in ANSWER.paragraphs" :key="pi" class="para"><template v-for="(s, i) in segs(para)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></p>
            <ul class="list"><li v-for="(st, si) in ANSWER.steps" :key="si"><template v-for="(s, i) in segs(st)" :key="i"><span v-if="'t' in s">{{ s.t }}</span><button v-else class="cite" :class="{ active: activeSrc === s.n }" @click="activeSrc = s.n">{{ s.n }}</button></template></li></ul>
          </template>
          <template v-else>
            <ol v-if="n.studio === 'Timeline'" class="timeline"><li v-for="(it, i) in n.items" :key="i"><span class="d">{{ it.label }}</span><span>{{ it.text }}</span></li></ol>
            <ol v-else-if="n.studio === 'Question list'" class="list"><li v-for="(it, i) in n.items" :key="i">{{ it.text }}</li></ol>
            <ul v-else class="list"><li v-for="(it, i) in n.items" :key="i"><b v-if="it.label">{{ it.label }}. </b>{{ it.text }}</li></ul>
          </template>

          <!-- One row of actions under the text, like under an answer in the chat -->
          <div class="actions">
            <button class="act" @click="copy"><i class="pi" :class="copied ? 'pi-check' : 'pi-copy'" />{{ copied ? 'Copied' : 'Copy' }}</button>
            <button v-if="n.kind === 'answer'" class="act" @click="openChat"><i class="pi pi-comments" />Open chat</button>
            <NuxtLink v-else-if="n.caseId" :to="`/cases/${n.caseId}`" class="act"><i class="pi pi-briefcase" />Open case</NuxtLink>
            <button class="act danger" @click="removeNote"><i class="pi pi-trash" />Remove</button>
          </div>

          <section v-if="n.kind === 'answer'" class="block">
            <h2>Sources</h2>
            <ol class="sources">
              <li v-for="src in SOURCES" :key="src.n" :class="{ hl: activeSrc === src.n }" @click="activeSrc = src.n">
                <span class="sn">{{ src.n }}</span>
                <span class="st"><b>{{ src.title }}</b><span>{{ src.kind }} · {{ src.ref }}</span></span>
              </li>
            </ol>
          </section>
          <section v-else-if="n.files?.length" class="block">
            <h2>Based on</h2>
            <div class="files"><span v-for="f in n.files" :key="f" class="file"><i :class="/\.docx?$/i.test(f) ? 'pi pi-file-word' : 'pi pi-file-pdf'" />{{ f }}</span></div>
          </section>
        </article>
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page { flex: 1; padding: 0 40px; }
.wrap { width: 100%; max-width: 760px; margin: 0 auto; padding: 20px 0 72px; }
.back { display: inline-flex; align-items: center; gap: 8px; height: 32px; margin: 0 0 24px -8px; padding: 0 10px; border-radius: 8px; color: var(--fd-muted); text-decoration: none; font: 500 14px/20px var(--fd-font-sans); }
.back:hover { color: var(--fd-ink); background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.back .pi { font-size: 12px; }
.skel { display: grid; gap: 14px; }

h1 { margin: 0 0 8px; color: var(--fd-ink); font: 600 28px/36px var(--fd-font-serif); letter-spacing: -.01em; text-wrap: balance; }
.meta { margin: 0 0 24px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.link { color: var(--fd-muted); text-decoration: underline; text-decoration-color: var(--fd-line); text-underline-offset: 3px; }
.link:hover { color: var(--fd-ink); }

.short { margin: 0 0 18px; padding: 14px 18px; border-left: 2px solid var(--fd-accent); background: color-mix(in srgb, var(--fd-ink) 3%, transparent); color: var(--fd-ink); font: 400 17px/28px var(--fd-font-sans); }
.para { margin: 0 0 14px; color: var(--fd-ink); font: 400 16px/27px var(--fd-font-sans); }
.list { margin: 0 0 8px; padding-left: 22px; color: var(--fd-ink); font: 400 16px/27px var(--fd-font-sans); }
.list li { margin-bottom: 6px; }
.timeline { display: grid; margin: 0 0 8px; padding: 0; list-style: none; }
.timeline li { display: grid; grid-template-columns: 120px 1fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent); color: var(--fd-ink); font: 400 16px/24px var(--fd-font-sans); }
.timeline .d { color: var(--fd-muted); font-size: 14px; }

/* Same look as the actions under an answer in the chat */
.actions { display: flex; flex-wrap: wrap; gap: 4px; margin: 16px 0 28px -10px; }
.act { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--fd-muted); cursor: pointer; text-decoration: none; font: 500 14px/20px var(--fd-font-sans); transition: background-color .15s, color .15s; }
.act .pi { font-size: 13px; }
.act:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); color: var(--fd-ink); }
.act.danger:hover { color: var(--fd-red); }
.act:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: 1px; }

.block { padding-top: 18px; border-top: 1px solid var(--fd-line); }
.block h2 { margin: 0 0 10px; color: var(--fd-muted); font: 500 12px/16px var(--fd-font-sans); letter-spacing: .04em; text-transform: uppercase; }
.sources { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.sources li { display: flex; align-items: flex-start; gap: 12px; padding: 8px; margin: 0 -8px; border-radius: 8px; cursor: pointer; }
.sources li:hover, .sources li.hl { background: color-mix(in srgb, var(--fd-accent) 7%, transparent); }
.sn { display: grid; place-items: center; min-width: 20px; height: 20px; margin-top: 1px; border-radius: 4px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 600 12px/1 var(--fd-font-sans); }
.st { display: grid; gap: 1px; }
.st b { color: var(--fd-ink); font: 500 15px/21px var(--fd-font-sans); }
.st span { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.files { display: flex; flex-wrap: wrap; gap: 6px; }
.file { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--fd-line); color: var(--fd-ink); font: 400 13px/18px var(--fd-font-sans); }
.file .pi { font-size: 12px; color: var(--fd-muted); }

.state { display: grid; justify-items: center; gap: 8px; padding: 48px 24px; text-align: center; border: 1px dashed var(--fd-line); border-radius: 16px; }
.state h2 { margin: 0; font: 600 17px/24px var(--fd-font-sans); color: var(--fd-ink); }
.state p { margin: 0 0 6px; color: var(--fd-muted); }

@media (max-width: 1023px) { .page { padding: 0 24px; } }
@media (max-width: 767px) {
  .page { padding: 0 16px; }
  .wrap { padding: 12px 0 48px; }
  h1 { font-size: 24px; line-height: 32px; }
  .timeline li { grid-template-columns: 96px 1fr; }
}
</style>
