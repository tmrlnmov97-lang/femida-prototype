<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps<{ title: string; remaining: number; limit: number; editableTitle?: boolean; sourcesCount?: number | null; sourcesOpen?: boolean }>();
const emit = defineEmits<{ (e: 'menu'): void; (e: 'sources'): void }>();

/* ---------- theme (the brief: users switch it in the top bar) ---------- */
const light = ref(false);
// The page may set the theme after this component mounts (?theme=light), so follow the <html> class.
let themeObs: MutationObserver | undefined;
const syncTheme = () => { light.value = document.documentElement.classList.contains('fd-light'); };
function setTheme(toLight: boolean) { document.documentElement.classList.toggle('fd-light', toLight); }

/* ---------- question counter: one meaning — questions left ---------- */
const ready = ref(false); // skeleton until the number is known (never "0 / 0")
const tone = computed(() => (props.remaining <= 0 ? 'empty' : props.remaining <= 10 ? 'low' : 'normal'));
const share = computed(() => Math.max(0, Math.min(1, props.remaining / props.limit)));
const bump = ref(false);
watch(() => props.remaining, (n, o) => {
  if (n < o) { bump.value = true; setTimeout(() => (bump.value = false), 900); }
});
const usagePop = ref();

/* ---------- chat title: rename in place ---------- */
const localTitle = ref(props.title);
watch(() => props.title, (t) => (localTitle.value = t));
const editing = ref(false);
const draft = ref('');
const titleInput = ref<HTMLInputElement>();
function startRename() {
  if (!props.editableTitle) return;
  draft.value = localTitle.value; editing.value = true;
  nextTick(() => { titleInput.value?.focus(); titleInput.value?.select(); });
}
function commitRename() { if (!editing.value) return; const t = draft.value.trim(); if (t) localTitle.value = t; editing.value = false; }
function cancelRename() { editing.value = false; }

/* ---------- account menu ---------- */
const accountPop = ref();
const lang = ref<'hy' | 'en'>('hy');

onMounted(() => {
  syncTheme();
  themeObs = new MutationObserver(syncTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  setTimeout(() => (ready.value = true), 500);
});
onBeforeUnmount(() => themeObs?.disconnect());
</script>

<template>
  <header class="topbar">
    <button class="icon-btn menu-btn" aria-label="Open navigation" @click="emit('menu')"><i class="pi pi-bars" /></button>

    <!-- Breadcrumbs: section › chat (the chat name is editable) -->
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="#" class="home-btn" aria-label="Home" v-tooltip.bottom="'Home'" @click.prevent><i class="pi pi-home" /></a>
      <i class="pi pi-angle-right sep home-sep" aria-hidden="true" />
      <span class="crumb section t-label">Chat</span>
      <i class="pi pi-angle-right sep section" aria-hidden="true" />
      <input v-if="editing" ref="titleInput" v-model="draft" class="title-input t-label" aria-label="Chat name" maxlength="80"
             @keydown.enter.prevent="commitRename" @keydown.esc.prevent="cancelRename" @blur="commitRename" />
      <button v-else-if="props.editableTitle" class="crumb current title-btn t-label" aria-current="page" v-tooltip.bottom="'Rename'" @click="startRename">
        <span class="title-text">{{ localTitle }}</span><i class="pi pi-pencil edit-ic" aria-hidden="true" />
      </button>
      <h1 v-else class="crumb current t-label" aria-current="page">{{ localTitle }}</h1>
    </nav>

    <div class="spacer" />

    <!-- Sources: a stable toggle (doesn't appear/disappear), count = sources in the answer -->
    <button v-if="props.sourcesCount != null" class="ctrl sources-btn t-label" :class="{ on: props.sourcesOpen }" :aria-pressed="!!props.sourcesOpen"
            :aria-label="`Sources, ${props.sourcesCount}`" @click="emit('sources')">
      <i class="pi pi-book" /><span class="lbl">Sources</span><span class="count">{{ props.sourcesCount }}</span>
    </button>

    <!-- Question counter -->
    <PSkeleton v-if="!ready" class="counter-skel" width="200px" height="38px" border-radius="999px" />
    <button v-else class="ctrl counter t-label" :class="[tone, { bump }]" aria-haspopup="dialog" :aria-label="`${props.remaining} of ${props.limit} questions remaining`"
            @click="usagePop.toggle($event)">
      <i class="pi pi-database c-ic" aria-hidden="true" />
      <span class="full"><b :key="props.remaining" class="num">{{ props.remaining }}</b> of {{ props.limit }} <span class="word">questions</span></span>
      <span class="short"><b :key="props.remaining" class="num">{{ props.remaining }}</b></span>
      <i class="pi pi-info-circle c-info" aria-hidden="true" />
    </button>
    <PPopover ref="usagePop" class="fd-pop">
      <div class="usage" :class="tone">
        <div class="u-head">
          <span class="t-eyebrow muted">Questions</span>
          <span class="tag">Trial</span>
        </div>
        <div class="u-big"><b>{{ props.remaining }}</b><span class="muted"> of {{ props.limit }} remaining</span></div>
        <div class="u-bar" role="progressbar" :aria-valuenow="props.remaining" aria-valuemin="0" :aria-valuemax="props.limit" aria-label="Questions remaining">
          <span :style="{ width: `${share * 100}%` }" />
        </div>
        <p v-if="tone === 'low'" class="u-note"><i class="pi pi-exclamation-circle" />Running low. Choose a plan so you aren't stopped in the middle of a&nbsp;case.</p>
        <p v-else-if="tone === 'empty'" class="u-note"><i class="pi pi-exclamation-circle" />You're out of questions. Choose a plan to keep&nbsp;asking.</p>
        <p v-else class="u-hint t-caption muted">Your Trial includes {{ props.limit }} questions. You'll see the same number in Account and in&nbsp;emails.</p>
        <PButton label="See plans" icon="pi pi-arrow-right" icon-pos="right" size="small" class="u-cta" :severity="tone === 'normal' ? 'secondary' : undefined" @click="usagePop.hide()" />
      </div>
    </PPopover>

    <div class="ctrl lang" role="group" aria-label="Interface language">
      <button :class="{ on: lang === 'hy' }" :aria-pressed="lang === 'hy'" @click="lang = 'hy'">ՀԱՅ</button>
      <button :class="{ on: lang === 'en' }" :aria-pressed="lang === 'en'" @click="lang = 'en'">EN</button>
    </div>

    <button class="ctrl theme-btn" :aria-label="light ? 'Switch to dark theme' : 'Switch to light theme'" v-tooltip.bottom="light ? 'Dark theme' : 'Light theme'" @click="setTheme(!light)">
      <i class="pi" :class="light ? 'pi-moon' : 'pi-sun'" :key="String(light)" />
    </button>

    <span class="divider" />

    <!-- Account -->
    <button class="user" aria-haspopup="menu" aria-label="Account menu" @click="accountPop.toggle($event)">
      <span class="avatar">DE</span>
      <span class="meta"><span class="email">dev@femid.ai</span><span class="plan">Trial</span></span>
      <i class="pi pi-angle-down chev" />
    </button>
    <PPopover ref="accountPop" class="fd-pop">
      <div class="account" role="menu">
        <div class="a-head">
          <span class="avatar lg">DE</span>
          <span class="a-id"><span class="email">dev@femid.ai</span><span class="t-caption muted">Trial plan · {{ props.remaining }} of {{ props.limit }} questions</span></span>
        </div>
        <div class="a-sep" />
        <button class="a-item" role="menuitem"><i class="pi pi-user" />Account</button>
        <button class="a-item" role="menuitem"><i class="pi pi-credit-card" />Plans</button>
        <button class="a-item" role="menuitem"><i class="pi pi-building" />Organisation</button>
        <div class="a-sep" />
        <div class="a-row phone-only">
          <span class="a-row-label"><i class="pi pi-language" />Language</span>
          <div class="seg" role="group" aria-label="Interface language">
            <button :class="{ on: lang === 'hy' }" :aria-pressed="lang === 'hy'" @click="lang = 'hy'">ՀԱՅ</button>
            <button :class="{ on: lang === 'en' }" :aria-pressed="lang === 'en'" @click="lang = 'en'">EN</button>
          </div>
        </div>
        <div class="a-row phone-only">
          <span class="a-row-label"><i class="pi pi-palette" />Theme</span>
          <div class="seg" role="group" aria-label="Theme">
            <button :class="{ on: !light }" :aria-pressed="!light" @click="setTheme(false)">Dark</button>
            <button :class="{ on: light }" :aria-pressed="light" @click="setTheme(true)">Light</button>
          </div>
        </div>
        <button class="a-item narrow-only" role="menuitem"><i class="pi pi-comment" />Send feedback</button>
        <div class="a-sep" />
        <button class="a-item danger" role="menuitem"><i class="pi pi-sign-out" />Log out</button>
      </div>
    </PPopover>
  </header>
</template>

<style scoped>
.topbar {
  display: flex; align-items: center; gap: 12px; height: var(--fd-topbar); padding: 0 20px 0 24px; flex-shrink: 0;
  border-bottom: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent);
}
.spacer { flex: 1; }
.menu-btn { display: none; }

/* Breadcrumbs */
.crumbs { display: flex; align-items: center; gap: 10px; min-width: 0; }
.home-btn {
  display: grid; place-items: center; width: 40px; height: 40px; margin-left: -4px; margin-right: 2px; border-radius: 10px; flex-shrink: 0;
  background: var(--fd-panel); color: var(--fd-ink); text-decoration: none; transition: background-color .15s;
}
.home-btn .pi { font-size: 16px; }
.home-btn:hover { background: var(--fd-panel-2); }
.sep { font-size: 11px; color: var(--fd-muted); }
.crumb { margin: 0; color: var(--fd-muted); white-space: nowrap; }
.crumb.current { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--fd-ink); font-weight: 600; }
.title-btn {
  display: inline-flex; align-items: center; gap: 8px; max-width: 520px; height: 32px; margin-left: -8px; padding: 0 8px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; cursor: text; transition: background-color .15s;
}
.title-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.edit-ic { font-size: 12px; color: var(--fd-muted); opacity: 0; transition: opacity .15s; }
.title-btn:hover, .title-btn:focus-visible { background: var(--fd-panel-2); }
.title-btn:hover .edit-ic, .title-btn:focus-visible .edit-ic { opacity: 1; }
.title-input {
  width: min(420px, 50vw); height: 32px; margin-left: -8px; padding: 0 8px; border-radius: var(--fd-radius-md);
  border: 1px solid var(--fd-accent); background: var(--fd-panel); color: var(--fd-ink); outline: none;
  box-shadow: 0 0 0 3px var(--fd-accent-soft);
}

/* Right-side controls: one height, one surface */
.ctrl {
  display: inline-flex; align-items: center; height: 38px; border-radius: 999px; flex-shrink: 0; cursor: pointer;
  border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); white-space: nowrap;
  transition: border-color .15s, background-color .15s, color .15s;
}
.ctrl:hover { border-color: color-mix(in srgb, var(--fd-ink) 22%, transparent); }

.sources-btn { gap: 8px; padding: 0 6px 0 12px; }
.sources-btn .pi { color: var(--fd-accent-text); font-size: 14px; }
.sources-btn .count {
  display: grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px;
  background: var(--fd-panel-2); color: var(--fd-muted); font: 600 12px/1 var(--fd-font-sans);
}
.sources-btn.on { background: var(--fd-accent-soft); border-color: color-mix(in srgb, var(--fd-accent) 35%, transparent); }
.sources-btn.on .count { background: var(--fd-accent); color: var(--fd-on-accent); }

.counter-skel { flex-shrink: 0; }
.counter { gap: 8px; padding: 0 10px 0 12px; }
.c-ic { font-size: 16px; color: var(--fd-ink); }
.c-info { font-size: 14px; color: var(--fd-muted); margin-left: 2px; transition: color .15s; }
.counter:hover .c-info { color: var(--fd-ink); }
.counter .num { display: inline-block; font-weight: 600; }
.counter.bump .num { animation: tick .5s var(--fd-easing, ease) both; }
.counter.bump { border-color: color-mix(in srgb, var(--fd-accent) 55%, transparent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
@keyframes tick { from { transform: translateY(-8px); opacity: 0; } }
.counter .short { display: none; }
.counter.low, .counter.empty { background: var(--fd-amber-soft); border-color: color-mix(in srgb, var(--fd-amber) 30%, transparent); color: var(--fd-amber); }
.counter.low .c-ic, .counter.empty .c-ic, .counter.low .c-info, .counter.empty .c-info { color: var(--fd-amber); }

/* Language: segmented pill, active = accent */
.lang { gap: 2px; padding: 3px; cursor: default; }
.lang button {
  height: 30px; padding: 0 12px; border: 0; border-radius: 999px; background: transparent; color: var(--fd-muted); cursor: pointer;
  font: 600 13px/20px var(--fd-font-sans); letter-spacing: .03em; transition: color .15s, background-color .15s;
}
.lang button:hover { color: var(--fd-ink); }
.lang button.on { background: var(--fd-accent-soft); color: var(--fd-accent-text); }

.theme-btn { justify-content: center; width: 38px; color: var(--fd-ink); }
.theme-btn .pi { font-size: 16px; animation: spin-in .35s var(--fd-easing, ease); }
@keyframes spin-in { from { transform: rotate(-90deg) scale(.6); opacity: 0; } }

.divider { width: 1px; height: 28px; margin: 0 4px; background: color-mix(in srgb, var(--fd-line) 80%, transparent); flex-shrink: 0; }

.user {
  display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 8px 0 4px; border: 0; border-radius: 999px;
  background: transparent; color: var(--fd-ink); cursor: pointer; flex-shrink: 0; transition: background-color .15s;
}
.user:hover { background: var(--fd-panel-2); }
.avatar {
  display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: var(--fd-accent); color: var(--fd-on-accent); font: 600 14px/1 var(--fd-font-sans); letter-spacing: .02em;
}
.avatar.lg { width: 40px; height: 40px; font-size: 14px; }
.meta { display: grid; text-align: left; }
.email { font: 500 14px/18px var(--fd-font-sans); }
.plan { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); }
.chev { font-size: 12px; color: var(--fd-muted); }

/* Usage card (counter popover) */
.usage { display: grid; gap: 12px; width: 300px; padding: 12px; }
.u-head { display: flex; align-items: center; justify-content: space-between; }
.u-big { font: 400 15px/24px var(--fd-font-sans); }
.u-big b { font: 600 32px/36px var(--fd-font-sans); letter-spacing: -.01em; margin-right: 2px; }
.u-bar { height: 6px; border-radius: 999px; background: var(--fd-panel-2); overflow: hidden; }
.u-bar span { display: block; height: 100%; border-radius: inherit; background: var(--fd-accent); transition: width .5s ease; }
.usage.low .u-bar span, .usage.empty .u-bar span { background: var(--fd-amber); }
.usage.low .u-big b, .usage.empty .u-big b { color: var(--fd-amber); }
.u-hint { margin: 0; text-wrap: pretty; }
.u-note {
  display: flex; gap: 8px; margin: 0; padding: 10px 12px; border-radius: var(--fd-radius-md);
  background: var(--fd-amber-soft); color: var(--fd-amber); font: 400 14px/20px var(--fd-font-sans); text-wrap: pretty;
}
.u-note .pi { margin-top: 3px; font-size: 13px; }
.u-cta { width: 100%; }

/* Account menu */
.account { display: grid; width: 288px; padding: 4px; }
.a-head { display: flex; align-items: center; gap: 12px; padding: 10px 10px 12px; }
.a-id { display: grid; min-width: 0; }
.a-sep { height: 1px; margin: 4px 8px; background: color-mix(in srgb, var(--fd-line) 70%, transparent); }
.a-item {
  display: flex; align-items: center; gap: 12px; width: 100%; height: 38px; padding: 0 10px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-ink); text-align: left; cursor: pointer; font: 400 15px/20px var(--fd-font-sans);
}
.a-item .pi, .a-row-label .pi { width: 16px; font-size: 15px; color: var(--fd-muted); }
.a-item:hover, .a-item:focus-visible { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); outline: none; }
.a-item.danger, .a-item.danger .pi { color: var(--fd-red); }
.a-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 42px; padding: 0 6px 0 10px; }
.a-row-label { display: inline-flex; align-items: center; gap: 12px; font: 400 15px/20px var(--fd-font-sans); }
.seg { display: inline-flex; gap: 2px; padding: 2px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-bg); }
.seg button {
  height: 26px; padding: 0 10px; border: 0; border-radius: 999px; background: transparent; color: var(--fd-muted); cursor: pointer;
  font: 500 13px/20px var(--fd-font-sans); transition: color .15s, background-color .15s;
}
.seg button:hover { color: var(--fd-ink); }
.seg button.on { background: var(--fd-panel-2); color: var(--fd-ink); }
.phone-only { display: none; }
.narrow-only { display: none; }

@media (max-width: 1279px) {
  .meta, .section, .counter .word { display: none; }
  .narrow-only { display: flex; } /* the floating feedback button is hidden below 1280 */
}
@media (max-width: 767px) {
  .topbar { padding: 0 12px; gap: 8px; }
  .menu-btn { display: inline-grid; margin-left: -6px; }
  .title-btn { margin-left: 0; padding: 0; max-width: none; }
  .title-btn:hover { background: transparent; }
  .home-btn, .home-sep, .lang, .theme-btn, .divider, .chev, .c-info, .sources-btn .lbl { display: none; }
  .sources-btn { padding: 0 6px 0 10px; }
  .counter { gap: 6px; padding: 0 12px 0 10px; }
  .counter .full { display: none; } .counter .short { display: inline; }
  .user { padding: 0; height: 38px; }
  .phone-only { display: flex; }
}
</style>
