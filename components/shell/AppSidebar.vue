<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { NAV, TOOLS, CHATS } from '~/data/mock';

const props = defineProps<{ collapsed?: boolean; activeChat?: string | null; activeStatus?: 'running' | null; mobile?: boolean }>();
const emit = defineEmits<{ (e: 'toggle'): void; (e: 'new-chat'): void; (e: 'select', id: string): void }>();
const periods = ['Today', 'Previous 7 days'] as const;
const root = ref<HTMLElement>();
const route = useRoute();
const NuxtLinkC = resolveComponent('NuxtLink');

/* Library folds away to give the chat list room; remembered per viewer */
const open = reactive<Record<string, boolean>>(Object.fromEntries(NAV.map((g) => [g.label, true])));
function toggleGroup(label: string) {
  open[label] = !open[label];
  try { localStorage.setItem('fd-nav-open', JSON.stringify(open)); } catch {}
}

/* ---------- chats (local copy so rename / delete / read work in the prototype) ---------- */
const chats = ref(CHATS.map((c) => ({ ...c })));
const statusOf = (c: (typeof chats.value)[number]) => (c.id === props.activeChat && props.activeStatus ? props.activeStatus : c.status);
const query = ref('');
const flySearch = ref<HTMLInputElement>();
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? chats.value.filter((c) => c.title.toLowerCase().includes(q) || c.caseName?.toLowerCase().includes(q)) : chats.value;
});
const byPeriod = computed(() => periods.map((p) => ({ p, items: filtered.value.filter((c) => c.period === p) })).filter((g) => g.items.length));
function clearSearch(e?: Event) { query.value = ''; (e?.target as HTMLInputElement | undefined)?.blur?.(); }
function select(id: string) {
  const c = chats.value.find((x) => x.id === id);
  if (c?.status === 'ready') c.status = undefined; // opened → read
  flyout.value = null;
  emit('select', id);
}
/* Phone drawer (like Claude's app): the account lives at the bottom of the drawer and opens a bottom sheet */
const { state: chatState, LIMIT } = useChat();
const acctSheet = ref(false);
const light = ref(false);
function openAccount() { light.value = document.documentElement.classList.contains('fd-light'); acctSheet.value = true; }
function setTheme(toLight: boolean) { document.documentElement.classList.toggle('fd-light', toLight); light.value = toLight; }
const requestOpen = useState('fd-request-open', () => false);
function goAccount(to: string) { acctSheet.value = false; emit('toggle'); navigateTo(to); }
function sendRequest() { acctSheet.value = false; emit('toggle'); requestOpen.value = true; }
// Skeleton rows only on the first load of the session — moving between pages must not make the list blink and jump
const ready = useState('fd-chats-ready', () => false);

const menu = ref();
const menuChat = ref<string | null>(null);
const menuItems = [
  { label: 'Rename', icon: 'pi pi-pencil', command: () => startRename(menuChat.value!) },
  { label: 'Delete chat', icon: 'pi pi-trash', class: 'fd-danger', command: () => { chats.value = chats.value.filter((c) => c.id !== menuChat.value); } },
];
function openMenu(e: Event, id: string) { menuChat.value = id; menu.value.toggle(e); }

const editingId = ref<string | null>(null);
const draft = ref('');
const renameInput = ref<HTMLInputElement[]>();
function startRename(id: string) {
  draft.value = chats.value.find((c) => c.id === id)?.title ?? '';
  editingId.value = id;
  nextTick(() => { const el = renameInput.value?.[0]; el?.focus(); el?.select(); });
}
function commitRename() {
  const c = chats.value.find((x) => x.id === editingId.value);
  if (c && draft.value.trim()) c.title = draft.value.trim();
  editingId.value = null;
}

/* ---------- flyouts: Tools (always) and Chats (icon rail) open to the right of the sidebar ---------- */
const flyout = ref<null | 'tools' | 'chats'>(null);
const flyEl = ref<HTMLElement>();
const flyStyle = ref<Record<string, string>>({});
const toolsInline = ref(false); // phone (inside the drawer): tools expand in place instead of flying out
function openFlyout(kind: 'tools' | 'chats', e: Event, focusSearch = false) {
  if (kind === 'tools' && window.innerWidth < 768) { toolsInline.value = !toolsInline.value; return; }
  if (flyout.value === kind) { flyout.value = null; return; }
  const el = e.currentTarget as HTMLElement;
  el.dispatchEvent(new MouseEvent('mouseleave')); // hide the rail tooltip so it doesn't sit over the flyout
  const btn = el.getBoundingClientRect();
  const side = root.value!.getBoundingClientRect();
  flyStyle.value = { left: `${side.right + 8}px`, top: `${Math.max(12, Math.min(btn.top - 8, window.innerHeight - 420))}px`, maxHeight: `${window.innerHeight - 24}px` };
  flyout.value = kind;
  if (focusSearch) nextTick(() => flySearch.value?.focus());
}
function onDocDown(e: PointerEvent) {
  const t = e.target as Node;
  if (flyout.value && !flyEl.value?.contains(t) && !(t as HTMLElement).closest?.('[data-flyout-btn]')) flyout.value = null;
}
function onKey(e: KeyboardEvent) { if (e.key === 'Escape') flyout.value = null; }
const closeFly = () => (flyout.value = null);

onMounted(() => {
  try { Object.assign(open, JSON.parse(localStorage.getItem('fd-nav-open') || '{}')); } catch {}
  if (!ready.value) setTimeout(() => (ready.value = true), 500);
  document.addEventListener('pointerdown', onDocDown, true);
  document.addEventListener('keydown', onKey);
  window.addEventListener('resize', closeFly);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocDown, true);
  document.removeEventListener('keydown', onKey);
  window.removeEventListener('resize', closeFly);
});
</script>

<template>
  <aside ref="root" class="sidebar" :class="{ collapsed: props.collapsed, mobile: props.mobile }" aria-label="Navigation">
    <div class="top">
      <span v-if="!props.collapsed" class="wordmark">femid<span>.ai</span></span>
      <span v-else class="wordmark small">f<span>.</span></span>
      <button v-if="props.mobile" class="icon-btn collapse" aria-label="Close menu" @click="emit('toggle')"><i class="pi pi-times" /></button>
      <button v-else class="icon-btn collapse" :aria-label="props.collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
              v-tooltip.right="props.collapsed ? 'Expand' : 'Collapse'" @click="emit('toggle')">
        <i class="pi" :class="props.collapsed ? 'pi-angle-double-right' : 'pi-angle-double-left'" />
      </button>
    </div>

    <div class="quick">
      <label v-if="!props.collapsed" class="search-field">
        <i class="pi pi-search" />
        <input v-model="query" type="search" placeholder="Search chats" aria-label="Search chats" @keydown.esc.prevent="clearSearch" />
        <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="clearSearch()"><i class="pi pi-times" /></button>
      </label>
      <button v-else class="nav-item" :class="{ on: flyout === 'chats' }" data-flyout-btn aria-label="Search chats" v-tooltip.right="flyout !== 'chats' ? 'Search chats' : null" @click="openFlyout('chats', $event, true)">
        <i class="pi pi-search" />
      </button>
      <button class="nav-item new-row" v-tooltip.right="props.collapsed ? 'New chat' : null" @click="emit('new-chat')">
        <span class="new-ic"><i class="pi pi-plus" /></span><span v-if="!props.collapsed" class="lbl">New chat</span>
      </button>
    </div>

    <nav class="groups">
      <section v-for="g in NAV" :key="g.label" class="group">
        <button v-if="!props.collapsed" class="heading" :aria-expanded="open[g.label]" @click="toggleGroup(g.label)">
          <span>{{ g.label }}</span><i class="pi pi-chevron-down fold" :class="{ shut: !open[g.label] }" />
        </button>
        <div class="items" :class="{ shut: !props.collapsed && !open[g.label] }">
          <div class="items-inner">
            <template v-for="it in g.items" :key="it.label">
              <NuxtLink v-if="it.to" :to="it.to" class="nav-item" :class="{ current: route.path.startsWith(it.to) }" :aria-current="route.path.startsWith(it.to) ? 'page' : undefined"
                        v-tooltip.right="props.collapsed ? it.label : null">
                <i :class="it.icon" /><span v-if="!props.collapsed" class="lbl">{{ it.label }}</span>
              </NuxtLink>
              <a v-else href="#" class="nav-item" :class="{ soon: it.badge === 'Soon' }"
                 v-tooltip.right="props.collapsed ? (it.badge ? `${it.label} · ${it.badge}` : it.label) : null" @click.prevent>
                <i :class="it.icon" /><span v-if="!props.collapsed" class="lbl">{{ it.label }}</span>
                <span v-if="!props.collapsed && it.badge" class="badge">{{ it.badge }}</span>
              </a>
            </template>
          </div>
        </div>
      </section>

      <!-- Tools: one row → flyout with what each tool does (they overlap with chat modes otherwise) -->
      <section class="group">
        <button class="nav-item tools-row" :class="{ on: flyout === 'tools' || toolsInline }" data-flyout-btn aria-haspopup="menu" :aria-expanded="flyout === 'tools' || toolsInline"
                v-tooltip.right="props.collapsed && flyout !== 'tools' ? 'Tools' : null" @click="openFlyout('tools', $event)">
          <i class="pi pi-th-large" /><span v-if="!props.collapsed" class="lbl">Tools</span>
          <i v-if="!props.collapsed" class="pi pi-angle-right go" :class="{ down: toolsInline }" />
        </button>
        <div v-if="toolsInline" class="tools-inline">
          <component :is="t.to ? NuxtLinkC : 'a'" v-for="t in TOOLS" :key="t.label" :to="t.to" :href="t.to ? undefined : '#'" class="tool" @click="!t.to && $event.preventDefault()">
            <span class="tool-ic"><i :class="t.icon" /></span>
            <span class="tool-text">
              <span class="tool-name">{{ t.label }}<span v-if="t.badge" class="badge">{{ t.badge }}</span></span>
              <span v-if="t.hint" class="tool-hint">{{ t.hint }}</span>
            </span>
          </component>
        </div>
        <button v-if="props.collapsed" class="nav-item" :class="{ on: flyout === 'chats' }" data-flyout-btn aria-haspopup="menu" :aria-expanded="flyout === 'chats'"
                v-tooltip.right="flyout !== 'chats' ? 'Chats' : null" @click="openFlyout('chats', $event)">
          <i class="pi pi-comments" />
          <span v-if="chats.some((c) => statusOf(c))" class="rail-dot" />
        </button>
      </section>
    </nav>

    <div v-if="!props.collapsed" class="chats scroll">

      <div v-if="!ready" class="skel" aria-busy="true" aria-label="Loading chats">
        <PSkeleton v-for="w in ['78%', '92%', '64%', '86%', '70%']" :key="w" :width="w" height="14px" border-radius="6px" />
      </div>

      <div v-else-if="!chats.length" class="empty">
        <i class="pi pi-comments" />
        <p class="t-caption">No chats yet. Ask a question and it will show up&nbsp;here.</p>
      </div>

      <p v-else-if="!byPeriod.length" class="no-match t-caption">No chats match «{{ query.trim() }}».</p>

      <template v-else>
        <div v-for="g in byPeriod" :key="g.p" class="period-group">
          <div class="period">{{ g.p }}</div>
          <div v-for="c in g.items" :key="c.id" class="chat-row"
               :class="{ active: c.id === props.activeChat, 'menu-open': menuChat === c.id }">
            <input v-if="editingId === c.id" ref="renameInput" v-model="draft" class="rename" aria-label="Chat name" maxlength="80"
                   @keydown.enter.prevent="commitRename" @keydown.esc.prevent="editingId = null" @blur="commitRename" />
            <template v-else>
              <button class="chat-item" :title="c.caseName ? `${c.title} · Case: ${c.caseName}` : c.title" :aria-current="c.id === props.activeChat ? 'page' : undefined"
                      @click="select(c.id)" @contextmenu.prevent="openMenu($event, c.id)">
                <span class="title">{{ c.title }}</span>
              </button>
              <span class="slot">
                <span v-if="statusOf(c)" class="status" :class="statusOf(c)" role="img"
                      :aria-label="statusOf(c) === 'running' ? 'Deep research in progress' : 'Answer ready'"
                      v-tooltip.top="statusOf(c) === 'running' ? 'Deep research in progress' : 'Answer ready'" />
                <i v-else-if="c.caseName" class="pi pi-briefcase case-ic" role="img" :aria-label="`Case: ${c.caseName}`" v-tooltip.top="`Case: ${c.caseName}`" />
              </span>
              <button class="more" :aria-label="`Actions for ${c.title}`" aria-haspopup="menu" @click.stop="openMenu($event, c.id)">
                <i class="pi pi-ellipsis-h" />
              </button>
            </template>
          </div>
        </div>
      </template>
    </div>
    <div v-else class="spacer" />
    <PMenu ref="menu" :model="menuItems" :popup="true" @hide="menuChat = null" />

    <!-- Phone: account at the bottom of the drawer → bottom sheet -->
    <template v-if="props.mobile">
      <button class="acct-row" aria-haspopup="dialog" @click="openAccount">
        <span class="acct-av">DE</span>
        <span class="acct-text"><span class="acct-mail">dev@femid.ai</span><span class="acct-plan">Trial · {{ chatState.remaining }} of {{ LIMIT }} credits</span></span>
        <i class="pi pi-angle-up" />
      </button>
      <PDrawer v-model:visible="acctSheet" position="bottom" class="fd-sheet" :show-close-icon="false" :block-scroll="true">
        <div class="acct-sheet" role="menu">
          <div class="as-head">
            <span class="acct-av lg">DE</span>
            <span class="acct-text"><span class="acct-mail">dev@femid.ai</span><span class="acct-plan">Trial plan · {{ chatState.remaining }} of {{ LIMIT }} credits</span></span>
          </div>
          <button class="as-item" role="menuitem" @click="goAccount('/account')"><i class="pi pi-user" />Account</button>
          <button class="as-item" role="menuitem" @click="goAccount('/account?tab=plan')"><i class="pi pi-credit-card" />Plans</button>
          <button class="as-item" role="menuitem"><i class="pi pi-building" />Organisation</button>
          <div class="as-row">
            <span class="as-label"><i class="pi pi-palette" />Theme</span>
            <div class="as-seg" role="group" aria-label="Theme">
              <button :class="{ on: !light }" :aria-pressed="!light" @click="setTheme(false)"><i class="pi pi-moon" />Dark</button>
              <button :class="{ on: light }" :aria-pressed="light" @click="setTheme(true)"><i class="pi pi-sun" />Light</button>
            </div>
          </div>
          <button class="as-item" role="menuitem" @click="sendRequest"><i class="pi pi-envelope" />Send a request</button>
          <div class="as-sep" />
          <button class="as-item danger" role="menuitem"><i class="pi pi-sign-out" />Log out</button>
        </div>
      </PDrawer>
    </template>

    <Teleport to="body">
      <Transition name="fly">
        <div v-if="flyout" ref="flyEl" class="flyout" :class="flyout" :style="flyStyle" role="menu" :aria-label="flyout === 'tools' ? 'Tools' : 'Chats'">
          <template v-if="flyout === 'tools'">
            <div class="fly-title">Tools</div>
            <component :is="t.to ? NuxtLinkC : 'a'" v-for="t in TOOLS" :key="t.label" :to="t.to" :href="t.to ? undefined : '#'" class="tool" role="menuitem" @click="!t.to && $event.preventDefault(); flyout = null">
              <span class="tool-ic"><i :class="t.icon" /></span>
              <span class="tool-text">
                <span class="tool-name">{{ t.label }}<span v-if="t.badge" class="badge">{{ t.badge }}</span></span>
                <span v-if="t.hint" class="tool-hint">{{ t.hint }}</span>
              </span>
            </component>
          </template>
          <template v-else>
            <label class="search-field in-fly">
              <i class="pi pi-search" />
              <input ref="flySearch" v-model="query" type="search" placeholder="Search chats" aria-label="Search chats" />
              <button v-if="query" class="clear" aria-label="Clear search" @click.prevent="clearSearch()"><i class="pi pi-times" /></button>
            </label>
            <p v-if="!byPeriod.length" class="no-match t-caption">No chats match «{{ query.trim() }}».</p>
            <div v-for="g in byPeriod" :key="g.p" class="fly-group">
              <div class="period">{{ g.p }}</div>
              <button v-for="c in g.items" :key="c.id" class="fly-chat" :class="{ active: c.id === props.activeChat }" role="menuitem" @click="select(c.id)">
                <span class="title">{{ c.title }}</span>
                <span v-if="statusOf(c)" class="status" :class="statusOf(c)" />
              </button>
            </div>
          </template>
        </div>
      </Transition>
    </Teleport>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex; flex-direction: column; gap: 16px; width: var(--fd-sidebar); height: 100%; padding: 14px 12px 16px;
  background: var(--fd-panel); border-right: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); transition: width .2s var(--fd-easing, ease);
}
.sidebar.collapsed { width: 72px; padding: 14px 12px; align-items: center; }
.top { display: flex; align-items: center; justify-content: space-between; height: 36px; padding: 0 0 0 8px; }
.collapsed .top { flex-direction: column; height: auto; gap: 8px; padding: 0; }
.wordmark { font: 600 19px/26px var(--fd-font-sans); letter-spacing: -.01em; color: var(--fd-ink); }
.wordmark span { color: var(--fd-accent-text); }
.wordmark.small { font-size: 22px; }
.collapse { width: 32px; height: 32px; }

/* Search + New chat: quiet rows at the top, like the nav below */
.quick { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
.collapsed .quick { align-items: center; gap: 4px; }
.search-field {
  display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 6px 0 12px; border-radius: 10px; cursor: text;
  border: 1px solid var(--fd-line); background: color-mix(in srgb, var(--fd-ink) 3%, var(--fd-panel)); transition: border-color .15s, box-shadow .15s;
}
.search-field:hover { border-color: color-mix(in srgb, var(--fd-ink) 20%, transparent); }
.search-field:focus-within { border-color: var(--fd-accent); box-shadow: 0 0 0 3px var(--fd-accent-soft); }
.search-field > .pi { font-size: 15px; color: var(--fd-muted); }
.search-field input { flex: 1; min-width: 0; border: 0; background: transparent; color: var(--fd-ink); outline: none; font: 400 15px/20px var(--fd-font-sans); }
.search-field input::placeholder { color: var(--fd-muted); }
.search-field input::-webkit-search-cancel-button { display: none; }
.clear { display: grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 50%; background: transparent; color: var(--fd-muted); cursor: pointer; }
.clear:hover { background: color-mix(in srgb, var(--fd-ink) 8%, transparent); color: var(--fd-ink); }
.clear .pi { font-size: 11px; }
.new-row { color: var(--fd-ink); }
.new-ic {
  display: grid; place-items: center; width: 24px; height: 24px; margin-left: -3px; margin-right: -3px; border-radius: 50%; flex-shrink: 0;
  background: var(--fd-panel-2); box-shadow: inset 0 0 0 1px var(--fd-line); color: var(--fd-ink); transition: background-color .15s, color .15s;
}
.new-ic .pi { font-size: 11px; }
.new-row:hover .new-ic { background: var(--fd-accent); color: var(--fd-on-accent); box-shadow: none; }
.collapsed .new-row .new-ic { margin: 0; width: 28px; height: 28px; }

/* Nav */
.groups { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.group { display: flex; flex-direction: column; gap: 1px; }
.heading {
  display: flex; align-items: center; justify-content: space-between; width: 100%; height: 28px; padding: 0 8px 0 12px; border: 0; border-radius: var(--fd-radius-sm);
  background: transparent; color: var(--fd-muted); cursor: pointer; font: 600 12px/16px var(--fd-font-sans); letter-spacing: .02em; transition: color .15s;
}
.heading:hover { color: var(--fd-ink); }
.heading.static { width: auto; padding: 0; cursor: default; }
.heading.static:hover { color: var(--fd-muted); }
.fold { font-size: 10px; opacity: 0; transition: transform .2s ease, opacity .15s; }
.heading:hover .fold, .heading:focus-visible .fold, .fold.shut { opacity: 1; }
.fold.shut { transform: rotate(-90deg); }
.items { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .22s var(--fd-easing, ease); }
.items.shut { grid-template-rows: 0fr; }
.items-inner { display: flex; flex-direction: column; gap: 1px; min-height: 0; overflow: hidden; }
.nav-item {
  position: relative; display: flex; align-items: center; gap: 12px; width: 100%; height: 36px; padding: 0 12px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-muted); text-decoration: none; text-align: left; cursor: pointer; font: 400 15px/20px var(--fd-font-sans);
  transition: background-color .15s, color .15s;
}
.nav-item > .pi:first-child { font-size: 16px; width: 18px; text-align: center; }
.nav-item .lbl { flex: 1; min-width: 0; }
.nav-item:hover, .nav-item.on { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); color: var(--fd-ink); }
.nav-item.current { background: var(--fd-panel-2); color: var(--fd-ink); font-weight: 500; }
.nav-item.current > .pi:first-child { color: var(--fd-accent-text); }
.nav-item.soon .lbl, .nav-item.soon > .pi:first-child { opacity: .75; }
.badge {
  display: inline-flex; align-items: center; height: 20px; padding: 0 7px; border-radius: 999px; flex-shrink: 0;
  background: var(--fd-panel-2); color: var(--fd-muted); font: 500 11px/1 var(--fd-font-sans); letter-spacing: .02em;
}
.go { font-size: 12px; transition: transform .15s; }
.tools-row.on .go { transform: translateX(2px); color: var(--fd-ink); }
.go.down { transform: rotate(90deg) !important; }
.tools-inline { display: flex; flex-direction: column; gap: 2px; padding: 4px 0 4px 8px; }
.nav-item:focus-visible, .chat-item:focus-visible, .more:focus-visible, .heading:focus-visible { outline: 2px solid var(--fd-focus); outline-offset: -2px; }
.collapsed .nav-item { width: 44px; height: 40px; justify-content: center; padding: 0; }
.collapsed .groups { gap: 12px; align-items: center; }
.collapsed .group + .group { padding-top: 12px; border-top: 1px solid color-mix(in srgb, var(--fd-line) 70%, transparent); }
.rail-dot { position: absolute; top: 9px; right: 10px; width: 7px; height: 7px; border-radius: 50%; background: var(--fd-accent); box-shadow: 0 0 0 2px var(--fd-panel); }

/* Chats */
.chats {
  position: relative; display: flex; flex-direction: column; flex: 1; min-height: 0; margin: 0 -12px; padding: 16px 12px 48px;
  border-top: 1px solid color-mix(in srgb, var(--fd-line) 60%, transparent);
  mask-image: linear-gradient(180deg, #000 calc(100% - 56px), transparent);
}

.search-field.in-fly { margin: 0 0 4px; }
.period-group { display: flex; flex-direction: column; }
.period-group + .period-group { margin-top: 20px; }
.period {
  position: sticky; top: -4px; z-index: 1; display: flex; align-items: center; height: 36px; padding: 0 12px; background: var(--fd-panel);
  color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans);
}
.chat-row { position: relative; display: flex; align-items: center; border-radius: var(--fd-radius-md); transition: background-color .15s; }
.chat-row:hover, .chat-row.menu-open { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.chat-row.active { background: var(--fd-panel-2); }
/* Every row: one line, one height, one colour. The only extra is one trailing slot. */
.chat-item {
  display: flex; align-items: center; flex: 1; min-width: 0; height: 36px; padding: 0 4px 0 12px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: color-mix(in srgb, var(--fd-ink) 78%, var(--fd-panel)); text-align: left; cursor: pointer; font: 400 15px/20px var(--fd-font-sans); transition: color .15s;
}
.chat-row:hover .chat-item, .chat-row.active .chat-item { color: var(--fd-ink); }
.title { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.slot { display: grid; place-items: center; flex-shrink: 0; width: 16px; margin-right: 10px; transition: opacity .15s; }
.case-ic { font-size: 12px; color: var(--fd-muted); opacity: .7; }
/* status: a small dot, not a spinner — running breathes, ready is solid */
.status { width: 6px; height: 6px; border-radius: 50%; background: var(--fd-accent); }
.status.running { background: var(--fd-muted); animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 50% { opacity: .3; } }
.more {
  position: absolute; right: 4px; display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: var(--fd-radius-sm);
  background: var(--fd-panel-2); color: var(--fd-muted); cursor: pointer; opacity: 0; transition: opacity .15s, background-color .15s, color .15s;
}
.more .pi { font-size: 13px; }
.chat-row:hover .more, .chat-row.menu-open .more, .more:focus-visible { opacity: 1; }
.chat-row:hover .slot, .chat-row.menu-open .slot { opacity: 0; }
.more:hover { color: var(--fd-ink); }
.rename {
  flex: 1; min-width: 0; height: 36px; padding: 0 11px; border-radius: var(--fd-radius-md); border: 1px solid var(--fd-accent);
  background: var(--fd-bg); color: var(--fd-ink); outline: none; font: 400 15px/20px var(--fd-font-sans); box-shadow: 0 0 0 3px var(--fd-accent-soft);
}
.skel { display: flex; flex-direction: column; gap: 18px; padding: 16px 12px; }
.empty { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-top: 12px; padding: 20px 16px; border-radius: var(--fd-radius-lg);
  border: 1px dashed var(--fd-line); color: var(--fd-muted); text-align: center; }
.empty .pi { font-size: 18px; color: var(--fd-accent-text); }
.empty p { margin: 0; text-wrap: balance; }
.no-match { margin: 8px 12px; color: var(--fd-muted); }
.spacer { flex: 1; }

/* Flyout (teleported to <body>) */
.flyout {
  position: fixed; z-index: 70; display: flex; flex-direction: column; gap: 2px; padding: 8px; overflow-y: auto;
  border-radius: var(--fd-radius-lg); border: 1px solid var(--fd-line);
  background: color-mix(in srgb, var(--fd-panel) 97%, transparent); backdrop-filter: blur(24px) saturate(140%);
  box-shadow: var(--fd-overlay-shadow); color: var(--fd-ink);
}
.flyout.tools { width: 340px; }
.flyout.chats { width: 280px; }
.fly-title { padding: 6px 10px 8px; color: var(--fd-muted); font: 600 12px/16px var(--fd-font-sans); letter-spacing: .02em; }
.tool { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: var(--fd-radius-md); color: var(--fd-ink); text-decoration: none; transition: background-color .15s; }
.tool:hover, .tool:focus-visible { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); outline: none; }
.tool-ic { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; background: var(--fd-panel-2); color: var(--fd-accent-text); }
.tool-ic .pi { font-size: 16px; }
.tool-text { display: grid; gap: 2px; min-width: 0; }
.tool-name { display: flex; align-items: center; gap: 8px; font: 500 15px/20px var(--fd-font-sans); }
.tool-hint { color: var(--fd-muted); font: 400 12px/16px var(--fd-font-sans); text-wrap: pretty; }
.fly-group .period { position: static; background: none; }
.fly-chat {
  display: flex; align-items: center; gap: 8px; width: 100%; height: 36px; padding: 0 10px 0 12px; border: 0; border-radius: var(--fd-radius-md);
  background: transparent; color: var(--fd-muted); text-align: left; cursor: pointer; font: 400 15px/20px var(--fd-font-sans);
}
.fly-chat .title { flex: 1; min-width: 0; }
.fly-chat .status { margin: 0; }
.fly-chat:hover, .fly-chat.active { color: var(--fd-ink); }
.fly-chat:hover { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.fly-chat.active { background: var(--fd-panel-2); font-weight: 500; }
.fly-enter-active, .fly-leave-active { transition: opacity .14s ease, transform .14s ease; }
.fly-enter-from, .fly-leave-to { opacity: 0; transform: translateX(-4px); }

/* touch: no hover, keep the actions reachable */
@media (hover: none) { .more { position: static; opacity: 1; background: transparent; margin-right: 4px; } .slot { margin-right: 4px; } }

/* ---------- Phone drawer ---------- */
.sidebar.mobile { width: 100%; padding: calc(12px + env(safe-area-inset-top)) 12px 0; border-right: 0; gap: 14px; }
.sidebar.mobile .more { display: none; } /* long-press a chat for Rename / Delete, like the Claude app */
.sidebar.mobile .chat-item { min-height: 44px; }
.acct-row { display: flex; align-items: center; gap: 12px; flex-shrink: 0; margin: 0 -12px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); border: 0; border-top: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); cursor: pointer; text-align: left; }
.acct-row > .pi { margin-left: auto; font-size: 12px; color: var(--fd-muted); }
.acct-av { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 50%; background: var(--fd-accent); color: var(--fd-on-accent); font: 600 13px/1 var(--fd-font-sans); }
.acct-av.lg { width: 44px; height: 44px; font-size: 15px; }
.acct-text { display: grid; gap: 1px; min-width: 0; }
.acct-mail { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 500 15px/20px var(--fd-font-sans); }
.acct-plan { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }
.acct-sheet { display: grid; gap: 2px; padding: 4px 8px calc(12px + env(safe-area-inset-bottom)); }
.as-head { display: flex; align-items: center; gap: 12px; padding: 4px 8px 14px; margin-bottom: 6px; border-bottom: 1px solid var(--fd-line); color: var(--fd-ink); }
.as-item { display: flex; align-items: center; gap: 14px; min-height: 48px; padding: 0 8px; border: 0; border-radius: 10px; background: transparent; color: var(--fd-ink); cursor: pointer; text-align: left; font: 400 16px/22px var(--fd-font-sans); }
.as-item .pi { width: 20px; font-size: 16px; color: var(--fd-muted); text-align: center; }
.as-item:active { background: color-mix(in srgb, var(--fd-ink) 6%, transparent); }
.as-item.danger, .as-item.danger .pi { color: var(--fd-red); }
.as-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; padding: 0 8px; }
.as-label { display: flex; align-items: center; gap: 14px; color: var(--fd-ink); font: 400 16px/22px var(--fd-font-sans); }
.as-label .pi { width: 20px; font-size: 16px; color: var(--fd-muted); text-align: center; }
.as-seg { display: flex; gap: 2px; padding: 3px; border-radius: 10px; background: var(--fd-panel-2); }
.as-seg button { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 12px; border: 0; border-radius: 8px; background: transparent; color: var(--fd-muted); cursor: pointer; font: 500 14px/18px var(--fd-font-sans); }
.as-seg button .pi { font-size: 12px; }
.as-seg button.on { background: var(--fd-panel); color: var(--fd-ink); box-shadow: 0 1px 2px rgb(0 0 0 / .2); }
.as-sep { height: 1px; margin: 6px 8px; background: var(--fd-line); }
</style>
