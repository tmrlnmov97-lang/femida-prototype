<script setup lang="ts">
// Features (replaces the bento of fake mini-UIs, user: "ужас"). Three key features as alternating rows — text + a large
// product screenshot — then four compact cards. Screenshots are marked placeholders until real ones are taken [OPEN].
// Copy is the Figma copy (node 36:330) plus bullets taken only from the brief / site facts.
const SPOT = [
  {
    n: '01', title: 'Answers with citations',
    body: 'Each statement carries a marker. Tap it and the exact article or decision opens beside the answer — highlighted.',
    points: ['Legislation, court practice, tax rulings and ECHR', 'The quoted fragment, with a link to the official text', 'No source found — no answer, never a guess'],
    shot: 'Chat answer with the Sources panel open',
  },
  {
    n: '02', title: 'Document analysis',
    body: 'Upload a contract or a court decision. Deadlines, obligations and risks come back flagged.',
    points: ['PDF or Word, up to 25 MB', 'Files are stored encrypted', 'Ask follow-up questions about the document'],
    shot: 'Uploaded contract with flagged deadlines and risks',
  },
  {
    n: '03', title: 'Deep research',
    body: 'For hard questions it plans the research and works through legislation, cassation practice and ECHR.',
    points: ['You see the plan and every step', 'Sources are collected as it works', 'Leave the page — the answer waits in your chats'],
    shot: 'Deep research in progress, steps and sources found',
  },
];
const MORE = [
  { icon: 'pi pi-calendar', title: 'Law on a date', body: 'Pick a date and see which version of the law was in force then.' },
  { icon: 'pi pi-search', title: 'Court practice search', body: 'Find how courts decided cases like yours — cassation, appeals, first instance.' },
  { icon: 'pi pi-file-edit', title: 'Drafting wizard', body: 'Five steps from a short description to an appeal or a claim, in Word or PDF.' },
  { icon: 'pi pi-users', title: 'Built for firms', body: 'Shared seats and invites. Counsel works under an organisation contract.' },
];
</script>

<template>
  <div class="showcase">
    <article v-for="(s, i) in SPOT" :key="s.n" class="spot" :class="{ flip: i % 2 === 1 }">
      <div class="copy">
        <span class="num">{{ s.n }}</span>
        <h3 class="title">{{ s.title }}</h3>
        <p class="body">{{ s.body }}</p>
        <ul class="points">
          <li v-for="p in s.points" :key="p"><span class="tick"><i class="pi pi-check" /></span>{{ p }}</li>
        </ul>
      </div>
      <!-- Place for a real product screenshot -->
      <figure class="shot" :aria-label="`Screenshot placeholder: ${s.shot}`">
        <div class="shot-in">
          <span class="shot-ic"><i class="pi pi-image" /></span>
          <span class="shot-t">Screenshot</span>
          <span class="shot-d">{{ s.shot }}</span>
          <span class="shot-s">1600 × 1000 · dark theme</span>
        </div>
      </figure>
    </article>

    <div class="more">
      <p class="more-label">More in femid.ai</p>
      <div class="cards">
        <div v-for="m in MORE" :key="m.title" class="card">
          <span class="c-ic"><i :class="m.icon" /></span>
          <h4 class="c-title">{{ m.title }}</h4>
          <p class="c-body">{{ m.body }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p, h3, h4, ul, figure { margin: 0; }
.showcase { display: flex; flex-direction: column; gap: 120px; }

/* Spotlight rows: text 5 / screenshot 7, alternating */
.spot { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); align-items: center; gap: 72px; }
.spot.flip { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } /* screenshot keeps the wide column */
.spot.flip .copy { order: 2; }
.copy { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }
.num { color: var(--fd-accent-text); font: 600 15px/20px var(--fd-font-sans); letter-spacing: 1.12px; }
.title { color: var(--fd-ink); font: 600 40px/48px var(--fd-font-serif); letter-spacing: -.5px; }
.body { max-width: 480px; color: var(--fd-muted); font: 400 18px/30px var(--fd-font-sans); text-wrap: pretty; }
.points { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; padding: 0; list-style: none; }
.points li { display: flex; align-items: center; gap: 12px; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); }
.tick { display: grid; place-items: center; flex-shrink: 0; width: 24px; height: 24px; border-radius: 999px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.tick .pi { font-size: 10px; }

/* Screenshot placeholder: 16:10 frame, clearly marked */
.shot { position: relative; aspect-ratio: 16 / 10; overflow: hidden; border-radius: 20px; border: 1px solid var(--fd-line);
  background: radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--fd-accent) 10%, transparent), transparent 60%), var(--fd-panel);
  box-shadow: 0 30px 80px rgb(0 0 0 / .35); }
.shot::before { content: ''; position: absolute; inset: 14px; border-radius: 12px; border: 1.5px dashed color-mix(in srgb, var(--fd-ink) 16%, transparent); }
.shot-in { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 32px; text-align: center; }
.shot-ic { display: grid; place-items: center; width: 52px; height: 52px; margin-bottom: 8px; border-radius: 14px; background: var(--fd-panel-2); color: var(--fd-muted); }
.shot-ic .pi { font-size: 20px; }
.shot-t { color: var(--fd-muted); font: 600 13px/18px var(--fd-font-sans); letter-spacing: 1.12px; text-transform: uppercase; }
.shot-d { max-width: 380px; color: var(--fd-ink); font: 500 17px/26px var(--fd-font-sans); text-wrap: balance; }
.shot-s { color: var(--fd-muted); font: 400 13px/18px var(--fd-font-sans); }

/* More: four equal cards */
.more { display: flex; flex-direction: column; gap: 24px; padding-top: 8px; }
.more-label { color: var(--fd-muted); font: 600 14px/20px var(--fd-font-sans); letter-spacing: 1.12px; text-transform: uppercase; }
.cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
.card { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; padding: 28px; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); transition: border-color .15s; }
.card:hover { border-color: color-mix(in srgb, var(--fd-accent) 45%, var(--fd-line)); }
.c-ic { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: 8px; border-radius: 12px; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.c-ic .pi { font-size: 18px; }
.c-title { color: var(--fd-ink); font: 600 19px/26px var(--fd-font-sans); }
.c-body { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); text-wrap: pretty; }

@media (max-width: 1023px) {
  .spot, .spot.flip { grid-template-columns: 1fr; gap: 32px; }
  .spot.flip .copy { order: 0; }
  .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .showcase { gap: 80px; }
}
@media (max-width: 767px) {
  .title { font-size: 30px; line-height: 38px; }
  .cards { grid-template-columns: 1fr; }
}
</style>
