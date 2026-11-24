<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';

// Numbered options like Claude's question picker: click, ↑/↓ + Enter, or press the number. Optional "Type something" row.
const props = defineProps<{ options: { label: string; desc?: string }[]; selected?: string | null; other?: boolean; autofocus?: boolean }>();
const emit = defineEmits<{ (e: 'pick', label: string, i: number): void }>();
const root = ref<HTMLElement>();
const isOther = computed(() => !!props.selected && !props.options.some((o) => o.label === props.selected));
const otherText = ref(props.other && isOther.value ? props.selected! : '');

const items = () => [...(root.value?.querySelectorAll<HTMLElement>('[data-choice]') || [])];
function move(d: number) {
  const all = items(); const i = all.indexOf(document.activeElement as HTMLElement);
  all[(i + d + all.length) % all.length]?.focus();
}
function onKey(e: KeyboardEvent) {
  const typing = (e.target as HTMLElement).tagName === 'INPUT';
  if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
  else if (!typing && /^[1-9]$/.test(e.key)) {
    const k = +e.key - 1;
    if (k < props.options.length) { e.preventDefault(); emit('pick', props.options[k].label, k); }
    else if (props.other && k === props.options.length) { e.preventDefault(); items()[k]?.focus(); }
  }
}
function useOther() { const t = otherText.value.trim(); if (t) emit('pick', t, props.options.length); }
onMounted(() => {
  if (!props.autofocus) return;
  nextTick(() => {
    const sel = isOther.value ? props.options.length : props.options.findIndex((o) => o.label === props.selected);
    items()[Math.max(0, sel)]?.focus({ preventScroll: true });
  });
});
</script>

<template>
  <div ref="root" class="choices" @keydown="onKey">
    <button v-for="(o, k) in props.options" :key="o.label" data-choice class="ch" :class="{ sel: props.selected === o.label }" :aria-pressed="props.selected === o.label" @click="emit('pick', o.label, k)">
      <span class="n">{{ k + 1 }}</span>
      <span class="t"><span class="l">{{ o.label }}</span><span v-if="o.desc" class="d">{{ o.desc }}</span></span>
      <i v-if="props.selected === o.label" class="pi pi-check ok" />
    </button>
    <div v-if="props.other" class="ch other" :class="{ sel: isOther }">
      <span class="n">{{ props.options.length + 1 }}</span>
      <input v-model="otherText" data-choice class="in" placeholder="Type something…" aria-label="Your own answer" @keydown.enter.prevent="useOther" />
      <button v-if="otherText.trim()" class="go" aria-label="Use this answer" @click="useOther"><i class="pi pi-arrow-right" /></button>
    </div>
  </div>
</template>

<style scoped>
.choices { display: grid; gap: 4px; }
.ch { position: relative; display: flex; align-items: flex-start; gap: 12px; width: 100%; padding: 10px 12px; border: 1px solid transparent; border-radius: var(--fd-radius-md);
  background: none; color: var(--fd-ink); cursor: pointer; text-align: left; outline: none; transition: background-color .12s, border-color .12s; }
.ch:hover, .ch:focus-visible, .ch:focus-within { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.ch:focus-visible, .ch.other:focus-within { border-color: color-mix(in srgb, var(--fd-accent) 55%, transparent); }
.ch.sel { background: var(--fd-accent-soft); border-color: color-mix(in srgb, var(--fd-accent) 45%, transparent); }
.n { display: grid; place-items: center; min-width: 22px; height: 22px; margin-top: 1px; border-radius: 6px; background: var(--fd-panel-2); color: var(--fd-muted); font: 600 12px/1 var(--fd-font-sans); }
.sel .n { background: var(--fd-accent); color: var(--fd-on-accent); }
.t { display: grid; gap: 1px; flex: 1; min-width: 0; }
.l { font: 500 15px/22px var(--fd-font-sans); }
.d { color: var(--fd-muted); font: 400 13px/19px var(--fd-font-sans); }
.ok { margin-top: 5px; color: var(--fd-accent-text); font-size: 12px; }
.other { align-items: center; cursor: text; }
.in { flex: 1; min-width: 0; padding: 0; border: 0; background: none; color: var(--fd-ink); outline: none; font: 400 15px/22px var(--fd-font-sans); }
.in::placeholder { color: var(--fd-muted); }
.go { display: grid; place-items: center; width: 28px; height: 28px; flex-shrink: 0; padding: 0; border: 0; border-radius: 50%; background: var(--fd-accent); color: var(--fd-on-accent); cursor: pointer; }
.go .pi { font-size: 11px; }
/* phone: the panel sits over the plan — labels only, so more of the plan stays visible */
@media (max-width: 767px) { .d { display: none; } .ch { padding: 9px 10px; } }
</style>
