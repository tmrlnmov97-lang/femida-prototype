<script setup lang="ts">
// Static product shot in the hero (Figma 33:65 "window") — transcribed 1:1, not interactive.
const A = useLandingAsset();
const SHELVES = [
  { i: '0b974', t: 'Documents' }, { i: 'b5625', t: 'My notes' }, { i: '8d8ba', t: 'Watch', soon: true },
  { i: 'e002b', t: 'Plans' }, { i: '4ded5', t: 'Account' },
];
const TOOLS = [{ i: '09803', t: 'Document wizard' }, { i: 'f6e7b', t: 'Materials studio' }, { i: '09ca0', t: 'Law on a date' }, { i: '8e016', t: 'Counsel' }];
const SOURCES = [
  { n: 1, tag: 'Law', title: 'Labour Code of the Republic of Armenia', meta: 'Article 265' },
  { n: 2, tag: 'Court decision', title: 'Court of Cassation decision', meta: 'Civil chamber · 2021', hover: true },
  { n: 3, tag: 'ECHR', title: 'ECHR judgment', meta: 'Article 6 · fair trial' },
];
</script>

<template>
  <div class="window" aria-hidden="true">
    <!-- Sidebar -->
    <div class="sb">
      <p class="logo">femid<span>.ai</span></p>
      <div class="new"><img :src="A('7b304')" alt="" width="20" height="20" /><span>New chat</span></div>
      <div class="group">
        <p class="g-label">SHELVES</p>
        <div v-for="s in SHELVES" :key="s.t" class="nav"><img :src="A(s.i)" alt="" width="20" height="20" /><span class="n-t">{{ s.t }}</span><span v-if="s.soon" class="soon">Soon</span></div>
      </div>
      <div class="group">
        <p class="g-label">TOOLS</p>
        <div v-for="s in TOOLS" :key="s.t" class="nav"><img :src="A(s.i)" alt="" width="20" height="20" /><span class="n-t">{{ s.t }}</span></div>
      </div>
      <div class="chats">
        <p class="g-label">CHATS</p>
        <div class="empty-chats"><p class="ec-t">No chats yet</p><p class="ec-s">Ask your first question — your chats will be saved here.</p></div>
      </div>
      <div class="nav"><img :src="A('e7f7e')" alt="" width="20" height="20" /><span class="n-t">Collapse</span></div>
    </div>

    <div class="content">
      <!-- Top bar -->
      <div class="top">
        <div class="crumbs">
          <img :src="A('e98ce')" alt="" width="20" height="20" />
          <img :src="A('99740')" alt="" width="16" height="16" />
          <span class="c-muted">Chat</span>
          <img :src="A('a1451')" alt="" width="16" height="16" />
          <span class="c-ink">Contesting a dismissal</span>
        </div>
        <div class="grow" />
        <div class="counter"><img :src="A('4ae5c')" alt="" width="16" height="16" /><span>42 of 50 left</span></div>
        <div class="theme"><img :src="A('462e3')" alt="" width="20" height="20" /></div>
        <div class="user">
          <span class="av">DE</span>
          <span class="meta"><span class="mail">dev@femid.ai</span><span class="plan">Trial</span></span>
          <img :src="A('252a2')" alt="" width="20" height="20" />
        </div>
      </div>

      <div class="body">
        <!-- Chat -->
        <div class="chat">
          <div class="msg-user">
            <div class="bubble">What is the deadline for contesting a dismissal?</div>
            <div class="mode"><img :src="A('249f9')" alt="" width="14" height="14" /><span>Legal analysis</span></div>
          </div>
          <div class="msg-answer">
            <div class="a-head">
              <span class="mark"><img :src="A('0ec46')" alt="" width="16" height="16" /></span>
              <span class="a-name">femid.ai</span><span class="a-meta">3 sources</span>
            </div>
            <p class="a-text">An employee can contest a dismissal in court within one month of receiving the dismissal order <b>[1]</b>. If the order was not handed over, the period runs from the day the employee learned of it <b>[2]</b>. Courts treat the deadline strictly but restore it for a valid reason, such as illness <b>[3]</b>.</p>
            <div class="acts">
              <span class="act"><img :src="A('13b57')" alt="" width="16" height="16" />Copy</span>
              <span class="act"><img :src="A('a3820')" alt="" width="16" height="16" />Save to notes</span>
              <span class="act"><img :src="A('a5e0e')" alt="" width="16" height="16" />How this answer was found</span>
            </div>
          </div>
          <div class="grow" />
          <div class="composer">
            <div class="box">
              <div class="in-row">
                <span class="attach"><img :src="A('62f03')" alt="" width="20" height="20" /></span>
                <p class="ph">Ask a legal question or attach a document…</p>
                <span class="send"><img :src="A('285e9')" alt="" width="20" height="20" /></span>
              </div>
            </div>
            <div class="cb"><span class="cb-box" /><span>Skip clarifying questions</span></div>
          </div>
        </div>

        <!-- Sources -->
        <div class="sources">
          <div class="s-head">
            <img :src="A('3ae98')" alt="" width="20" height="20" />
            <p class="s-title">Sources</p><span class="s-n">3</span>
            <img :src="A('7a3ea')" alt="" width="20" height="20" />
          </div>
          <p class="s-desc">Every statement in the answer links to one of these.</p>
          <div v-for="s in SOURCES" :key="s.n" class="src" :class="{ hover: s.hover }">
            <div class="src-top"><span class="cite">{{ s.n }}</span><span class="tag">{{ s.tag }}</span></div>
            <p class="src-title">{{ s.title }}</p>
            <p class="src-meta">{{ s.meta }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
img { display: block; flex-shrink: 0; }
p { margin: 0; }
.window { display: flex; flex-shrink: 0; width: 1200px; height: 720px; overflow: hidden; border-radius: 16px; border: 1px solid rgba(143, 199, 168, .55); background: var(--fd-bg);
  box-shadow: 0 0 160px 0 rgba(127, 184, 154, .08), 0 40px 100px 0 rgba(0, 0, 0, .55); text-align: left; }

/* Sidebar */
.sb { display: flex; flex-direction: column; gap: 16px; flex-shrink: 0; width: 264px; height: 720px; padding: 16px; background: var(--fd-panel); border-right: 1px solid var(--fd-line); }
.logo { color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.logo span { color: var(--fd-accent-text); }
.new { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.group { display: flex; flex-direction: column; gap: 2px; }
.g-label { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.nav { display: flex; align-items: center; gap: 12px; height: 40px; padding: 8px 12px; border-radius: 8px; }
.n-t { flex: 1; min-width: 0; color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); }
.soon { padding: 2px 8px; border-radius: 999px; border: 1px solid var(--fd-accent); background: var(--fd-accent-soft); color: var(--fd-amber); font: 400 14px/20px var(--fd-font-sans); }
.chats { display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 0; overflow: hidden; }
.empty-chats { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-radius: 8px; background: var(--fd-bg); }
.ec-t { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.ec-s { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }

/* Content */
.content { display: flex; flex-direction: column; flex: 1; min-width: 0; height: 100%; overflow: hidden; }
.top { display: flex; align-items: center; gap: 12px; flex-shrink: 0; height: 56px; padding: 0 24px; background: var(--fd-bg); border-bottom: 1px solid var(--fd-line); }
.crumbs { display: flex; align-items: center; gap: 8px; font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.c-muted { color: var(--fd-muted); } .c-ink { color: var(--fd-ink); }
.grow { flex: 1; min-width: 1px; }
.counter { display: flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel); color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.theme { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.user { display: flex; align-items: center; gap: 8px; padding: 4px; border-radius: 8px; }
.av { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--fd-panel-2); color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans); }
.meta { display: flex; flex-direction: column; line-height: 20px; white-space: nowrap; }
.mail { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.plan { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }

.body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
.chat { display: flex; flex-direction: column; gap: 24px; flex: 1; min-width: 0; height: 100%; padding: 32px 32px 24px; overflow: hidden; }
.msg-user { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.bubble { max-width: 560px; padding: 12px 16px; border-radius: 12px; background: var(--fd-panel-2); color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); white-space: nowrap; }
.mode { display: flex; align-items: center; gap: 4px; color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.msg-answer { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
.a-head { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.mark { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--fd-accent-soft); }
.a-name { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.a-meta { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.a-text { color: var(--fd-ink); font: 400 17px/28px var(--fd-font-sans); }
.a-text b { color: var(--fd-accent-text); font-weight: 600; }
.acts { display: flex; align-items: center; gap: 16px; }
.act { display: flex; align-items: center; gap: 4px; color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.composer { display: flex; flex-direction: column; gap: 8px; }
.box { padding: 12px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.in-row { display: flex; align-items: flex-end; gap: 8px; }
.attach, .send { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; }
.send { background: var(--fd-panel-2); }
.ph { flex: 1; min-width: 1px; color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.cb { display: flex; align-items: center; gap: 8px; color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.cb-box { width: 20px; height: 20px; border-radius: 6px; border: 1.5px solid var(--fd-muted); background: var(--fd-panel); }

.sources { display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; width: 336px; height: 100%; padding: 16px; background: var(--fd-panel); border-left: 1px solid var(--fd-line); }
.s-head { display: flex; align-items: center; gap: 8px; }
.s-title { flex: 1; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.s-n { color: var(--fd-muted); font: 500 15px/20px var(--fd-font-sans); }
.s-desc { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.src { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.src.hover { background: var(--fd-panel-2); }
.src-top { display: flex; align-items: center; gap: 8px; }
.cite { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 6px; background: var(--fd-accent-soft); color: var(--fd-accent-text); font: 400 14px/20px var(--fd-font-sans); }
.tag { padding: 2px 8px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.src-title { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.src-meta { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
</style>
