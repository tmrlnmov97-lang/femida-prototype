<script setup lang="ts">
// Features bento (Figma 36:336) — six tiles, visuals transcribed 1:1 (absolute positions inside each tile's visual).
const A = useLandingAsset();
</script>

<template>
  <div class="bento">
    <!-- Row 1 -->
    <div class="row">
      <div class="tile w792 h420">
        <div class="visual">
          <img class="glow" :src="A('658fa')" alt="" style="left: 39.6px; width: 712.8px" />
          <p class="answer">An employee can contest a dismissal in court within one month of receiving the order <b>[1]</b>. If the order was not handed over, the period runs from the day they learned of it <b>[2]</b>.</p>
          <div class="src-card">
            <div class="src-top"><span class="cite on">1</span><span class="tag">Law</span></div>
            <p class="src-title">Labour Code of the Republic of Armenia</p>
            <p class="src-meta">Article 265</p>
            <div class="quote">“…a claim may be filed with the court within one month of the day the order was handed over…”</div>
            <div class="link">Open official text<img :src="A('83908')" alt="" width="16" height="16" /></div>
          </div>
        </div>
        <div class="text"><p class="t">Answers with citations</p><p class="b">Each statement carries a marker. Tap it and the exact article or decision opens beside the answer — highlighted.</p></div>
      </div>

      <div class="tile w384 h420">
        <div class="visual">
          <img class="glow" :src="A('4195d')" alt="" style="left: 19.2px; width: 345.6px" />
          <div class="date"><img :src="A('db2ef')" alt="" width="18" height="18" /><span>15 March 2019</span></div>
          <div class="abs line" style="left: 40px; top: 176px; width: 304px; height: 2px" />
          <div class="abs acc" style="left: 172px; top: 176px; width: 128px; height: 2px" />
          <div class="abs acc" style="left: 216px; top: 94px; width: 1px; height: 82px" />
          <img class="abs" :src="A('baf05')" alt="" width="14" height="14" style="left: 33px; top: 170px" />
          <span class="abs cap" style="left: 33px; top: 194px">Edition 1</span>
          <span class="abs dot-on" style="left: 165px; top: 170px"><img :src="A('7e445')" alt="" width="38" height="38" /></span>
          <span class="abs cap on" style="left: 143px; top: 194px">Edition 2</span>
          <img class="abs" :src="A('baf05')" alt="" width="14" height="14" style="left: 329px; top: 170px" />
          <span class="abs cap" style="left: 285px; top: 194px">Edition 3</span>
          <span class="abs cap on" style="left: 148.5px; top: 224px">In force on that date</span>
        </div>
        <div class="text"><p class="t">Law on a date</p><p class="b">Pick a date and see which version of the law was in force then.</p></div>
      </div>
    </div>

    <!-- Row 2 -->
    <div class="row">
      <div class="tile w384 h400">
        <div class="visual">
          <img class="glow" :src="A('4195d')" alt="" style="left: 19.2px; width: 345.6px" />
          <div class="file abs" style="left: 32px; top: 36px">
            <img :src="A('067e5')" alt="" width="24" height="24" />
            <div class="f-meta"><p class="f-name">Appeal_Avagyan_v_Poghosyan.pdf</p><p class="f-sub">2.4 MB · encrypted</p></div>
            <img :src="A('7a3ea')" alt="" width="20" height="20" />
          </div>
          <div class="clause abs" style="top: 112px"><span class="tag amber">Deadline</span><span class="bone8" style="width: 170px" /></div>
          <div class="clause abs" style="top: 160px"><span class="tag accent">Obligation</span><span class="bone8" style="width: 150px" /></div>
          <div class="clause abs" style="top: 208px"><span class="tag red">Risk</span><span class="bone8" style="width: 190px" /></div>
        </div>
        <div class="text"><p class="t">Document analysis</p><p class="b">Upload a contract or a decision. Deadlines, obligations and risks come back flagged.</p></div>
      </div>

      <div class="tile w384 h400">
        <div class="visual">
          <img class="glow" :src="A('4195d')" alt="" style="left: 19.2px; width: 345.6px" />
          <div class="abs line" style="left: 44px; top: 55px; width: 296px; height: 2px" />
          <div class="abs acc" style="left: 44px; top: 55px; width: 222px; height: 2px" />
          <span class="abs step done" style="left: 32px"><img :src="A('5ccdc')" alt="" width="14" height="14" /></span>
          <span class="abs cap" style="left: 28px; top: 76px">Type</span>
          <span class="abs step done" style="left: 106px"><img :src="A('5ccdc')" alt="" width="14" height="14" /></span>
          <span class="abs cap" style="left: 95.5px; top: 76px">Source</span>
          <span class="abs step done" style="left: 180px"><img :src="A('5ccdc')" alt="" width="14" height="14" /></span>
          <span class="abs cap" style="left: 165px; top: 76px">Analysis</span>
          <span class="abs step now" style="left: 254px" />
          <span class="abs cap on" style="left: 231.5px; top: 76px">Grounds</span>
          <span class="abs step next" style="left: 328px" />
          <span class="abs cap" style="left: 307px; top: 76px">Document</span>
          <div class="doc abs">
            <p class="kind">APPEAL · DRAFT</p>
            <span class="bone6" style="width: 288px" /><span class="bone6" style="width: 260px" /><span class="bone6" style="width: 280px" /><span class="bone6" style="width: 180px" />
            <div class="export">
              <span class="chip"><img :src="A('b78bc')" alt="" width="14" height="14" />Word</span>
              <span class="chip"><img :src="A('b78bc')" alt="" width="14" height="14" />PDF</span>
            </div>
          </div>
        </div>
        <div class="text"><p class="t">Drafting wizard</p><p class="b">Five steps from a short description to an appeal or a claim. Export to Word or PDF.</p></div>
      </div>

      <div class="tile w384 h400">
        <div class="visual">
          <img class="glow" :src="A('4195d')" alt="" style="left: 19.2px; width: 345.6px" />
          <div class="search abs"><img :src="A('d38e7')" alt="" width="18" height="18" /><span>missed deadline restored, illness</span></div>
          <div class="result abs" style="top: 96px"><div class="r-top"><span class="tag">Cassation</span><span class="r-meta">Civil · 2021</span></div><p class="r-title">Deadline restored: hospital stay</p></div>
          <div class="result abs" style="top: 168px"><div class="r-top"><span class="tag">Appeal</span><span class="r-meta">Civil · 2020</span></div><p class="r-title">Restoration refused: no proof</p></div>
        </div>
        <div class="text"><p class="t">Court practice search</p><p class="b">Find how courts actually decided cases like yours — Court of Cassation, appeals, first instance.</p></div>
      </div>
    </div>

    <!-- Row 3 -->
    <div class="row">
      <div class="tile w792 h400">
        <div class="visual">
          <img class="glow" :src="A('658fa')" alt="" style="left: 39.6px; width: 712.8px" />
          <div class="deep abs">
            <div class="d-head"><img :src="A('9e325')" alt="" width="20" height="20" /><p class="d-title">Deep research · about 4 min left</p><span class="d-found">12 sources found</span></div>
            <div class="bar"><span style="width: 112px" /></div>
            <div class="d-steps">
              <div class="d-step"><img :src="A('109fc')" alt="" width="20" height="20" /><span>Plan the research</span></div>
              <div class="d-step"><img :src="A('109fc')" alt="" width="20" height="20" /><span>Search legislation in force</span></div>
              <div class="d-step"><img :src="A('5c46d')" alt="" width="20" height="20" /><span>Search court practice (Court of Cassation)</span></div>
              <div class="d-step muted"><img :src="A('c12c8')" alt="" width="20" height="20" /><span>Check ECHR practice</span></div>
              <div class="d-step muted"><img :src="A('c12c8')" alt="" width="20" height="20" /><span>Write the answer with sources</span></div>
            </div>
            <p class="d-note">You can leave this page — we'll notify you and mark the chat when the answer is ready.</p>
          </div>
          <div class="fade abs" />
        </div>
        <div class="text"><p class="t">Deep research</p><p class="b">For hard questions it plans the research, works through legislation, cassation practice and ECHR — and you can leave while it works.</p></div>
      </div>

      <div class="tile w384 h400">
        <div class="visual">
          <img class="glow" :src="A('4195d')" alt="" style="left: 19.2px; width: 345.6px" />
          <div class="avatars abs"><span class="av">AH</span><span class="av">DK</span><span class="av">MS</span><span class="av more">+3</span></div>
          <div class="invite abs"><img :src="A('82125')" alt="" width="16" height="16" /><span>Invite a colleague</span></div>
          <div class="seats abs"><p>Organisation seats</p><div class="bar"><span style="width: 224px" /></div></div>
        </div>
        <div class="text"><p class="t">Built for firms</p><p class="b">Shared seats and invites for your team. Counsel mode works under an organisation contract.</p></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
p { margin: 0; }
img { display: block; flex-shrink: 0; }
.bento { display: flex; flex-direction: column; gap: 24px; }
.row { display: flex; gap: 24px; align-items: flex-start; }
.tile { display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden; border-radius: 16px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.w792 { width: 792px; } .w384 { width: 384px; } .h420 { height: 420px; } .h400 { height: 400px; }
.visual { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.glow { position: absolute; top: -170px; height: 300px; max-width: none; }
.abs { position: absolute; }
.text { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; padding: 0 32px 32px; }
.t { color: var(--fd-ink); font: 600 22px/30px var(--fd-font-sans); }
.b { color: var(--fd-muted); font: 400 16px/26px var(--fd-font-sans); }
.line { background: var(--fd-line); } .acc { background: var(--fd-accent); }
.cap { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.cap.on { color: var(--fd-accent-text); }
.tag { display: inline-flex; align-items: center; flex-shrink: 0; padding: 2px 8px; border-radius: 999px; background: var(--fd-panel-2); color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.tag.amber { background: var(--fd-amber-soft); color: var(--fd-amber); }
.tag.accent { background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.tag.red { background: var(--fd-red-soft); color: var(--fd-red); }

/* Row 1 */
.answer { position: absolute; left: 32px; top: 48px; width: 400px; color: var(--fd-ink); font: 400 17px/28px var(--fd-font-sans); }
.answer b { color: var(--fd-accent-text); font-weight: 600; }
.src-card { position: absolute; left: 460px; top: 28px; display: flex; flex-direction: column; gap: 8px; width: 300px; padding: 12px; border-radius: 8px; border: 1px solid var(--fd-accent); background: var(--fd-panel-2); }
.src-top { display: flex; align-items: center; gap: 8px; }
.cite { display: grid; place-items: center; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 6px; font: 400 14px/20px var(--fd-font-sans); }
.cite.on { background: var(--fd-accent); color: var(--fd-on-accent); }
.src-title { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.src-meta { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.quote { padding: 8px 12px; border-radius: 6px; background: var(--fd-accent-soft); color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); }
.link { display: flex; align-items: center; gap: 4px; color: var(--fd-accent-text); font: 500 15px/20px var(--fd-font-sans); }
.date { position: absolute; left: 135.5px; top: 56px; display: flex; align-items: center; gap: 8px; padding: 8px 16px 8px 12px; border-radius: 999px; border: 1px solid var(--fd-accent); background: var(--fd-panel-2); color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.dot-on { width: 14px; height: 14px; }
.dot-on img { position: absolute; inset: -85.71%; width: auto; height: auto; }

/* Row 2 */
.file { display: flex; align-items: center; gap: 12px; width: 320px; height: 68px; padding: 8px 12px; border-radius: 8px; background: var(--fd-panel-2); }
.f-meta { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.f-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.f-sub { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
.clause { left: 32px; display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 8px; background: var(--fd-panel-2); }
.bone8 { display: block; height: 8px; border-radius: 999px; background: var(--fd-line); }
.bone6 { display: block; height: 6px; border-radius: 999px; background: var(--fd-line); }
.step { top: 44px; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 999px; }
.step.done { background: var(--fd-accent); }
.step.now { background: var(--fd-panel); border: 2px solid var(--fd-accent); box-shadow: 0 0 10px 0 rgba(51, 212, 153, .6); }
.step.next { background: var(--fd-panel-2); border: 1px solid var(--fd-line); }
.doc { left: 32px; top: 112px; display: flex; flex-direction: column; gap: 8px; width: 320px; padding: 16px; border-radius: 8px; border: 1px solid var(--fd-line); background: var(--fd-panel-2); }
.kind { color: var(--fd-muted); font: 600 14px/20px var(--fd-font-sans); letter-spacing: 1.12px; text-transform: uppercase; white-space: nowrap; }
.export { display: flex; gap: 8px; }
.chip { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px; border: 1px solid var(--fd-line); color: var(--fd-ink); font: 400 14px/20px var(--fd-font-sans); }
.search { left: 32px; top: 36px; display: flex; align-items: center; gap: 8px; width: 320px; height: 44px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--fd-accent); background: var(--fd-panel-2); color: var(--fd-ink); font: 400 15px/24px var(--fd-font-sans); white-space: nowrap; }
.result { left: 32px; display: flex; flex-direction: column; gap: 4px; width: 320px; padding: 8px 12px; border-radius: 8px; background: var(--fd-panel-2); }
.r-top { display: flex; align-items: center; gap: 8px; }
.r-meta { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); white-space: nowrap; }
.r-title { color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }

/* Row 3 */
.deep { left: 36px; top: 32px; display: flex; flex-direction: column; gap: 16px; width: 720px; padding: 20px; border-radius: 12px; border: 1px solid var(--fd-line); background: var(--fd-panel); }
.d-head { display: flex; align-items: center; gap: 8px; }
.d-title { flex: 1; color: var(--fd-ink); font: 600 18px/26px var(--fd-font-sans); }
.d-found { color: var(--fd-accent-text); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.bar { height: 6px; overflow: hidden; border-radius: 999px; background: var(--fd-line); }
.bar span { display: block; height: 6px; border-radius: 999px; background: var(--fd-accent); }
.d-steps { display: flex; flex-direction: column; gap: 12px; }
.d-step { display: flex; align-items: center; gap: 12px; color: var(--fd-ink); font: 400 16px/26px var(--fd-font-sans); white-space: nowrap; }
.d-step.muted { color: var(--fd-muted); }
.d-note { color: var(--fd-muted); font: 400 15px/24px var(--fd-font-sans); }
.fade { left: 0; top: 110px; width: 792px; height: 170px; background: linear-gradient(180deg, transparent, var(--fd-panel)); }
.avatars { left: 114px; top: 48px; display: flex; }
.av { display: grid; place-items: center; flex-shrink: 0; width: 48px; height: 48px; margin-right: -12px; border-radius: 999px; border: 3px solid var(--fd-panel); background: var(--fd-panel-2); color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); }
.av.more { margin-right: 0; background: var(--fd-accent-soft); color: var(--fd-accent-text); }
.invite { left: 101.5px; top: 124px; display: flex; align-items: center; gap: 8px; padding: 8px 16px 8px 12px; border-radius: 999px; border: 1px solid var(--fd-line); background: var(--fd-panel-2); color: var(--fd-ink); font: 500 15px/20px var(--fd-font-sans); white-space: nowrap; }
.seats { left: 72px; top: 188px; display: flex; flex-direction: column; gap: 8px; width: 240px; }
.seats p { color: var(--fd-muted); font: 400 14px/20px var(--fd-font-sans); }
</style>
