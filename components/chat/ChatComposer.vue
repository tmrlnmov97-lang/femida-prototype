<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { MODES, FILES, CASES } from '~/data/mock';

// gate: on the website the guest can type and pick a mode, but sending opens sign-in instead (emits `ask`)
const props = withDefaults(defineProps<{ variant?: 'hero' | 'dock'; placeholder?: string; gate?: boolean }>(), { variant: 'hero', placeholder: 'Ask a legal question or attach a document…', gate: false });
const emit = defineEmits<{ (e: 'lift', px: number): void; (e: 'ask', text: string): void }>();
const { state, modeObj, send } = useChat();

const text = ref('');
const menu = ref<null | 'mode' | 'attach'>(null);
const root = ref<HTMLElement>();
const uploading = ref(100); // 100 = nothing uploading (files picked from Documents arrive ready)
const canSend = computed(() => (text.value.trim().length > 0 || !!state.file) && !state.busy);

function submit() {
  if (!canSend.value) return;
  if (props.gate) { emit('ask', text.value.trim() || 'Please analyse the attached document.'); return; } // text stays in the field
  send(text.value);
  text.value = '';
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); }
}
const modePop = ref(); const attachPop = ref(); const modeBtn = ref<HTMLElement>(); const plusBtn = ref<HTMLElement>();
const modeSheet = ref(false);
const menuEl = ref<HTMLElement>();
const dropStyle = ref<Record<string, string>>({});
const moreBelow = ref(false); // list continues below the fold → fade the bottom edge
function checkMore() { const el = menuEl.value; moreBelow.value = !!el && el.scrollTop + el.clientHeight < el.scrollHeight - 2; }
const focusIdx = ref(0);
function onPanelKey(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') { e.preventDefault(); focusIdx.value = (focusIdx.value + 1) % MODES.length; }
  else if (e.key === 'ArrowUp') { e.preventDefault(); focusIdx.value = (focusIdx.value - 1 + MODES.length) % MODES.length; }
  else if (e.key === 'Enter') { e.preventDefault(); pickMode(MODES[focusIdx.value].id); }
  else return;
  nextTick(() => (menuEl.value?.querySelector(`[data-mode-idx="${focusIdx.value}"]`) as HTMLElement | null)?.focus());
}
function openModes() {
  if (window.innerWidth < 768) { modeSheet.value = true; return; } // phone: bottom sheet
  // desktop: dropdown under the mode button; flips up only when there is no room below (docked composer)
  const r = modeBtn.value!.getBoundingClientRect();
  const below = window.innerHeight - r.bottom - 12, above = r.top - 64 - 12;
  const down = below >= 200 || below >= above;
  const left = `${Math.max(12, Math.min(r.left - 6, window.innerWidth - 360 - 12))}px`;
  dropStyle.value = down
    ? { left, top: `${r.bottom + 6}px`, maxHeight: `${below}px` }
    : { left, bottom: `${window.innerHeight - r.top + 6}px`, maxHeight: `${above}px` };
  focusIdx.value = Math.max(0, MODES.findIndex((m) => m.id === state.mode));
  menu.value = menu.value === 'mode' ? null : 'mode';
  if (menu.value) nextTick(() => {
    (menuEl.value?.querySelector(`[data-mode-idx="${focusIdx.value}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
    // Empty chat: the hero stays centred; if the list doesn't fit below, lift the whole block just enough (back on close)
    if (props.variant === 'hero' && down && menuEl.value) {
      const deficit = menuEl.value.scrollHeight - below;
      const block = root.value?.closest('.empty')?.querySelector('.greeting')?.getBoundingClientRect(); // top of the visible hero, not its padding
      const shift = block ? Math.round(Math.max(0, Math.min(deficit, block.top - 64 - 16))) : 0;
      if (shift > 0) {
        emit('lift', shift);
        dropStyle.value = { ...dropStyle.value, top: `${r.bottom + 6 - shift}px`, maxHeight: `${below + shift}px` };
        setTimeout(checkMore, 280);
      }
    }
    checkMore();
  });
}
watch(menu, (v) => { if (props.variant === 'hero' && v !== 'mode') emit('lift', 0); });
function pickMode(id: typeof state.mode) { state.mode = id; menu.value = null; modeSheet.value = false; }
function onDocDown(e: PointerEvent) {
  const t = e.target as Node;
  if (menu.value === 'mode' && !root.value?.contains(t) && !menuEl.value?.contains(t)) menu.value = null;
}
function onViewportChange(e?: Event) {
  if (e && menuEl.value && e.target instanceof Node && menuEl.value.contains(e.target)) return;
  if (menu.value === 'mode') menu.value = null;
}
function onDocKey(e: KeyboardEvent) { if (e.key === 'Escape' && menu.value === 'mode') { menu.value = null; modeBtn.value?.focus(); } }
function attach(name: string, size: string) {
  attachPop.value?.hide(); state.file = { name, size }; uploading.value = 0;
  const t = setInterval(() => { uploading.value = Math.min(100, uploading.value + 9); if (uploading.value >= 100) clearInterval(t); }, 60);
}
/* "Choose from Documents": the same popover switches to a searchable list of your files (like Claude's file picker).
   A file from Documents is already uploaded, so it attaches at once — no progress bar. */
const attachView = ref<'menu' | 'docs'>('menu');
const docQuery = ref('');
const docSearch = ref<HTMLInputElement>();
const isWord = (n: string) => /\.docx?$/i.test(n);
const caseOf = (id?: string) => (id ? CASES.find((c) => c.id === id)?.name : undefined);
const docs = computed(() => { const q = docQuery.value.trim().toLowerCase(); return [...FILES].sort((a, b) => b.ts - a.ts).filter((f) => !q || f.name.toLowerCase().includes(q) || (caseOf(f.caseId) ?? '').toLowerCase().includes(q)); });
function openDocs() {
  attachView.value = 'docs'; docQuery.value = '';
  nextTick(() => { attachPop.value?.alignOverlay?.(); docSearch.value?.focus({ preventScroll: true }); });
}
function backToMenu() { attachView.value = 'menu'; nextTick(() => attachPop.value?.alignOverlay?.()); }
function pickDoc(f: { name: string; size: string }) { attachPop.value?.hide(); state.file = { name: f.name, size: f.size }; uploading.value = 100; }
function onAttachHide() { menu.value = null; setTimeout(() => (attachView.value = 'menu'), 150); }
const route = useRoute();
onMounted(() => {
  document.addEventListener('pointerdown', onDocDown); document.addEventListener('keydown', onDocKey);
  window.addEventListener('resize', onViewportChange); document.addEventListener('scroll', onViewportChange, true);
  if (props.variant !== 'hero') return;
  if (route.query.menu === 'mode') setTimeout(() => modeBtn.value?.click(), 600);
  if (route.query.menu === 'attach') setTimeout(() => plusBtn.value?.click(), 300);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocDown); document.removeEventListener('keydown', onDocKey);
  window.removeEventListener('resize', onViewportChange); document.removeEventListener('scroll', onViewportChange, true);
});

/** Lets starter cards prefill the composer. */
function prefill(q: string) { text.value = q; nextTick(() => root.value?.querySelector('textarea')?.focus()); }
// A draft handed over from another page (e.g. Watch → Ask about it) lands in the composer once
onMounted(() => { if (state.draft) { prefill(state.draft); state.draft = ''; } });
defineExpose({ prefill });
</script>

<template>
  <div ref="root" class="composer" :class="[`is-${props.variant}`, { focus: !!text, menuOpen: !!menu }]">
    <!-- attached file -->
    <Transition name="fade-up">
      <div v-if="state.file" class="file">
        <span class="file-icon"><i class="pi" :class="state.file.name.endsWith('.pdf') ? 'pi-file-pdf' : 'pi-file-word'" /></span>
        <span class="file-meta">
          <span class="t-label name">{{ state.file.name }}</span>
          <span class="t-caption muted">{{ uploading < 100 ? `Uploading… ${uploading}%` : `${state.file.size} · encrypted` }}</span>
          <span v-if="uploading < 100" class="bar"><span :style="{ width: uploading + '%' }" /></span>
        </span>
        <button class="icon-btn" aria-label="Remove file" @click="state.file = null"><i class="pi pi-times" /></button>
      </div>
    </Transition>

    <label class="sr-only" for="composer-input">Your question</label>
    <PTextarea id="composer-input" v-model="text" class="input" :placeholder="props.placeholder" auto-resize rows="1" @keydown="onKey" />

    <div class="toolbar">
      <button ref="plusBtn" class="plus" :class="{ open: menu === 'attach' }" aria-label="Attach" aria-haspopup="menu" :aria-expanded="menu === 'attach'" @click="attachPop.toggle($event)">
        <i class="pi pi-plus" />
      </button>
      <PPopover ref="attachPop" class="fd-pop" @show="menu = 'attach'" @hide="onAttachHide">
        <div v-if="attachView === 'menu'" class="menu-body" role="menu" style="min-width: 260px">
          <div class="menu-title t-eyebrow">Attach</div>
          <button class="menu-item" role="menuitem" @click="attach('Appeal_Avagyan_v_Poghosyan.pdf', '2.4 MB')">
            <i class="pi pi-paperclip" /><span class="text"><span class="t-label">Upload file</span><span class="hint">PDF, Word · up to 25 MB, encrypted</span></span>
          </button>
          <button v-if="!props.gate" class="menu-item" role="menuitem" aria-haspopup="listbox" @click="openDocs">
            <i class="pi pi-folder" /><span class="text"><span class="t-label">Choose from Documents</span><span class="hint">Files you already uploaded</span></span><i class="pi pi-angle-right go" />
          </button>
        </div>

        <!-- Your Documents, searchable; one click attaches -->
        <div v-else class="docs" @keydown.esc.stop="backToMenu">
          <div class="docs-head">
            <button class="docs-back" aria-label="Back" @click="backToMenu"><i class="pi pi-arrow-left" /></button>
            <span class="t-label">Choose from Documents</span>
          </div>
          <label class="docs-search">
            <i class="pi pi-search" />
            <input ref="docSearch" v-model="docQuery" type="search" placeholder="Search files or cases" aria-label="Search your documents" />
          </label>
          <div class="docs-list" role="listbox" aria-label="Your documents">
            <button v-for="f in docs" :key="f.id" class="doc" role="option" :aria-selected="state.file?.name === f.name" @click="pickDoc(f)">
              <span class="doc-ic"><i class="pi" :class="isWord(f.name) ? 'pi-file-word' : 'pi-file-pdf'" /></span>
              <span class="doc-text">
                <span class="doc-name">{{ f.name }}</span>
                <span class="doc-meta">{{ caseOf(f.caseId) ? `${caseOf(f.caseId)} · ` : '' }}{{ f.size }} · {{ f.date }}</span>
              </span>
              <i v-if="state.file?.name === f.name" class="pi pi-check doc-check" />
            </button>
            <p v-if="!docs.length" class="docs-empty">No files match «{{ docQuery.trim() }}»</p>
          </div>
          <NuxtLink to="/documents" class="docs-foot" @click="attachPop?.hide()">Open Documents<i class="pi pi-arrow-right" /></NuxtLink>
        </div>
      </PPopover>

      <button ref="modeBtn" class="mode" :class="{ open: menu === 'mode' }" aria-haspopup="menu" :aria-expanded="menu === 'mode'" aria-label="Mode" @click="openModes">
          <i :class="modeObj.icon" class="mode-icon" /><span class="t-label">{{ modeObj.label }}</span><i class="pi pi-angle-down chev" />
        </button>
        <Teleport to="body">
          <Transition name="drop">
            <div v-if="menu === 'mode'" ref="menuEl" class="mode-drop" :class="{ 'more-below': moreBelow }" role="menu" aria-label="Task for the next question" :style="dropStyle" @keydown="onPanelKey" @scroll="checkMore">
              <template v-for="(m, i) in MODES" :key="m.id">
                <button class="mp-row" :class="{ active: m.id === state.mode, focused: i === focusIdx }" :data-mode-idx="i" role="menuitemradio" :aria-checked="m.id === state.mode"
                        @mouseenter="focusIdx = i" @focus="focusIdx = i" @click="pickMode(m.id)">
                  <i :class="m.icon" class="mp-icon" />
                  <span class="mp-row-text">
                    <span class="t-label mp-row-name">{{ m.label }}</span>
                    <span class="mp-row-hint">{{ m.hint }}</span>
                  </span>
                  <i v-if="m.id === state.mode" class="pi pi-check mp-check" />
                </button>
                <div v-if="i === 0" class="mp-sep" />
              </template>
            </div>
          </Transition>
        </Teleport>
      <PDrawer v-model:visible="modeSheet" position="bottom" class="fd-sheet" :show-close-icon="false" :block-scroll="true">
        <div class="menu-body modes in-sheet" role="menu">
            <div class="menu-title t-label">Task for the next question</div>
            <template v-for="(m, i) in MODES" :key="m.id">
              <button class="menu-item mode-item" :class="{ active: m.id === state.mode }" role="menuitemradio" :aria-checked="m.id === state.mode" @click="pickMode(m.id)">
                <i :class="m.icon" class="lead" />
                <span class="text">
                  <span class="name"><span class="t-label">{{ m.label }}</span>
                    <span v-if="m.badge === 'recommended'" class="badge-rec t-caption">recommended</span>
                    <span v-else-if="m.badge === 'classic'" class="badge-classic">classic</span>
                  </span>
                  <span class="hint">{{ m.hint }}</span>
                </span>
                <i v-if="m.id === state.mode" class="pi pi-check check" />
              </button>
              <div v-if="i === 0" class="divider" />
            </template>
          </div>
        
      </PDrawer>

      <div class="grow" />

      <PButton class="send" :class="{ ready: canSend }" label="Ask" icon="pi pi-send" icon-pos="right" rounded :disabled="!canSend" @click="submit" />
    </div>
  </div>
</template>

<style scoped>
.composer {
  container-type: inline-size;
  position: relative; display: flex; flex-direction: column; width: 100%; border-radius: var(--fd-radius-xl);
  border: 1px solid transparent;
  background:
    linear-gradient(var(--fd-panel), var(--fd-panel)) padding-box,
    linear-gradient(180deg, var(--fd-rim-top), var(--fd-rim-bottom)) border-box;
  box-shadow: 0 2px 20px rgb(0 0 0 / .35);
  transition: box-shadow .25s ease, background .25s ease;
}
.composer:focus-within {
  background:
    linear-gradient(var(--fd-panel), var(--fd-panel)) padding-box,
    linear-gradient(180deg, color-mix(in srgb, var(--fd-accent) 70%, transparent), var(--fd-line) 60%) border-box;
  box-shadow: 0 2px 20px rgb(0 0 0 / .35), 0 16px 60px var(--fd-glow-soft), 0 0 0 4px color-mix(in srgb, var(--fd-accent) 10%, transparent);
}
.input { padding: 20px 20px 8px; min-height: 76px; }
.is-dock .input { min-height: 56px; padding-top: 16px; }
:deep(.p-textarea.input), .input {
  width: 100%; border: 0 !important; background: transparent !important; box-shadow: none !important; outline: none !important;
  resize: none; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); max-height: 220px;
}
:deep(.p-textarea.input::placeholder) { color: var(--fd-muted); }
.toolbar { display: flex; align-items: center; gap: 4px; padding: 4px 12px 12px; }
.anchor { position: relative; }
.grow { flex: 1; }
.plus {
  display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 0; cursor: pointer;
  background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-muted); transition: background-color .15s, color .15s;
}
.plus .pi { font-size: 13px; transition: transform .2s ease; }
.plus:hover, .plus.open { background: color-mix(in srgb, var(--fd-ink) 14%, transparent); color: var(--fd-ink); }
.plus.open .pi { transform: rotate(45deg); }
.mode {
  display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 10px; border: 0; border-radius: 999px; cursor: pointer;
  background: transparent; color: var(--fd-muted); transition: background-color .15s, color .15s;
}
.mode:hover, .mode.open { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); color: var(--fd-ink); }
.mode-icon { color: var(--fd-accent-text); font-size: 14px; }
.chev { font-size: 12px; transition: transform .2s ease; }
.mode.open .chev { transform: rotate(180deg); }
.modes { width: 380px; max-width: calc(100vw - 24px); overflow-y: auto; padding: 4px; scrollbar-width: thin; scrollbar-color: var(--fd-line) transparent; }
.modes.in-sheet { width: 100%; max-width: none; max-height: none; padding: 0 4px 8px; }
.modes .menu-title { padding: 6px 12px 8px; color: var(--fd-muted); }
.mode-item { align-items: flex-start; gap: 14px; padding: 10px 12px; }
.mode-item .lead { margin-top: 2px; font-size: 17px !important; }
.mode-item.active { background: color-mix(in srgb, var(--fd-accent-soft) 85%, transparent); }
.mode-item.active .lead { color: var(--fd-accent-text) !important; }
.mode-item .check { margin-top: 2px; font-size: 15px !important; }
.mode-item .name { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.mode-item .hint { margin-top: 2px; font: 400 14px/20px var(--fd-font-sans); }
.badge-rec { color: var(--fd-accent-text); }
.badge-classic { display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px; border: 1px solid var(--fd-line); color: var(--fd-muted); font: 500 12px/1 var(--fd-font-sans); letter-spacing: .02em; }
.divider { height: 1px; margin: 6px 12px; background: var(--fd-line); }
/* Mode dropdown: compact list under the mode button (teleported to <body>, flips up only without room below) */
.mode-drop {
  position: fixed; z-index: 60; display: flex; flex-direction: column; gap: 2px; width: 360px; max-width: calc(100vw - 24px); padding: 8px; overflow-y: auto;
  border-radius: var(--fd-radius-lg); border: 1px solid var(--fd-line);
  background: color-mix(in srgb, var(--fd-panel) 97%, transparent); backdrop-filter: blur(24px) saturate(140%);
  box-shadow: var(--fd-overlay-shadow); scrollbar-width: thin; scrollbar-color: var(--fd-line) transparent;
}
.mode-drop.more-below { mask-image: linear-gradient(180deg, #000 calc(100% - 36px), transparent); }
.mp-row {
  position: relative; display: flex; flex-shrink: 0; align-items: center; gap: 14px; width: 100%; padding: 10px 14px 10px 12px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-muted); text-align: left; cursor: pointer; outline: none; transition: background-color .12s ease, color .12s ease;
}
.mp-row.focused { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); color: var(--fd-ink); }
.mp-row:focus-visible { box-shadow: inset 0 0 0 1px var(--fd-focus); }
.mp-row.active { color: var(--fd-ink); }
.mp-row.active .mp-icon { color: var(--fd-accent-text); }
.mp-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; color: var(--fd-muted); transition: color .12s ease; }
.mp-row.focused .mp-icon { color: var(--fd-ink); }
.mp-row-text { display: grid; gap: 2px; flex: 1; min-width: 0; }
.mp-row-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mp-row-hint { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); text-wrap: pretty; }
.mp-check { flex-shrink: 0; font-size: 13px; color: var(--fd-accent-text); }
.mp-sep { flex-shrink: 0; height: 1px; margin: 4px 12px; background: color-mix(in srgb, var(--fd-line) 70%, transparent); }
.mode-drop { transition: top .25s var(--fd-easing, ease), max-height .25s var(--fd-easing, ease); }
.drop-enter-active, .drop-leave-active { transition: opacity .14s ease, transform .14s ease, top .25s var(--fd-easing, ease), max-height .25s var(--fd-easing, ease); }
.drop-enter-from, .drop-leave-to { opacity: 0; transform: translateY(-4px); }

:deep(.p-button.send) { height: 36px; padding: 0 16px; gap: 8px; margin-left: 4px; font: 500 15px/20px var(--fd-font-sans); transition: box-shadow .25s ease, opacity .2s ease, transform .1s ease; }
:deep(.p-button.send:disabled) { opacity: .4; }
:deep(.p-button.send.ready) { box-shadow: 0 0 22px var(--fd-glow); }
:deep(.p-button.send:active:not(:disabled)) { transform: scale(.97); }
:deep(.p-button.send .p-button-icon) { font-size: 13px; }
/* Attach → Choose from Documents */
.menu-item .go { margin-left: auto; font-size: 12px !important; }
.docs { display: flex; flex-direction: column; width: min(360px, calc(100vw - 56px)); padding: 4px; } /* fits a 390 phone with the popover's own padding */
.docs-head { display: flex; align-items: center; gap: 6px; padding: 4px 8px 8px 4px; color: var(--fd-ink); }
.docs-back { display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; }
.docs-back:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.docs-back .pi { font-size: 12px; }
.docs-search { display: flex; align-items: center; gap: 10px; height: 40px; margin: 0 4px 6px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--fd-line); background: var(--fd-bg); cursor: text; }
.docs-search:focus-within { border-color: var(--fd-accent); }
.docs-search .pi { font-size: 13px; color: var(--fd-muted); }
.docs-search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans); }
.docs-search input::placeholder { color: var(--fd-muted); }
.docs-search input::-webkit-search-cancel-button { display: none; }
.docs-list { display: flex; flex-direction: column; gap: 2px; height: 264px; /* fixed: filtering must not resize (and re-place) the popover */ overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--fd-line) transparent; }
.doc { display: flex; align-items: center; gap: 12px; width: 100%; padding: 8px; border: 0; border-radius: var(--fd-radius-md); background: transparent; color: var(--fd-ink); text-align: left; cursor: pointer; }
.doc:hover, .doc:focus-visible { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); outline: none; }
.doc-ic { display: grid; place-items: center; flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px; background: var(--fd-panel-2); color: var(--fd-muted); }
.doc-ic .pi { font-size: 14px; }
.doc-text { display: grid; gap: 1px; flex: 1; min-width: 0; }
.doc-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 500 14px/20px var(--fd-font-sans); }
.doc-meta { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.doc-check { flex-shrink: 0; font-size: 13px; color: var(--fd-accent-text); }
.docs-empty { margin: 0; padding: 20px 12px; color: var(--fd-muted); text-align: center; font: 400 14px/20px var(--fd-font-sans); }
.docs-foot { display: flex; align-items: center; justify-content: center; gap: 6px; height: 40px; margin-top: 4px; border-top: 1px solid var(--fd-line); color: var(--fd-muted); text-decoration: none; font: 500 13px/18px var(--fd-font-sans); }
.docs-foot:hover { color: var(--fd-ink); }
.docs-foot .pi { font-size: 11px; }
.file {
  display: flex; align-items: center; gap: 12px; margin: 12px 12px 0; padding: 8px 8px 8px 12px; border-radius: var(--fd-radius-md);
  background: var(--fd-panel-2); max-width: 360px;
}
.file-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--fd-radius-md); background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.file-meta { display: grid; flex: 1; min-width: 0; gap: 2px; }
.name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.bar { height: 3px; border-radius: 3px; background: var(--fd-line); overflow: hidden; }
.bar span { display: block; height: 100%; background: var(--fd-accent); transition: width .06s linear; }
</style>
