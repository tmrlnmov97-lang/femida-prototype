# Femida — coded prototype (Chat)

**Live:** https://tmrlnmov97-lang.github.io/femida-prototype/ · redesign prototype for review, not the production app.

Nuxt 3 SPA + PrimeVue 4, themed with the Femida tokens (`--fd-*`). Chat screen rebuilt from the live product (hz.femid.ai, 08.10.2026) at the premium level of the Figma redesign.

## Run

Needs Node 18+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Inside the full workspace, `npm run sync` (runs before dev/build) copies the generated tokens (`ds-app/src/tokens/*.css`) and the PrimeVue preset (`ds-app/src/theme/preset.ts`) into this app — ds-app stays the single source. Without ds-app next to it (e.g. this folder on its own), the copies already in `assets/css` and `theme/` are used.

## What works

- **Palette:** Sage (approved 08.10.2026). Dark is the default; light via the account menu → Theme, or `?theme=light`.
- **Top bar:** Home › Chat › chat name (click to rename). Sources (n) toggle. Credit counter "N of 50 credits" (1 question = 1 credit): skeleton while loading, amber at ≤10, click for the usage card + "See plans". Account menu (Account / Plans / Organisation, Theme dark/light, Log out). No language switch: the product is Armenian-only.
- **Sidebar:**
  - Search chats and New chat; Library (with Watch · Soon); Tools open a panel with one-line descriptions.
  - The chat list is on one 36px rhythm: status dots (deep research running / answer ready), case icon, ⋯ → Rename / Delete.
  - 1024: icon rail with Search, Tools and Chats panels. 390: drawer.
- **Empty chat:** "What does the law say?", a centered composer, 4 starter pills (click = prefill), and the "No source — no answer" line.
- **Composer:**
  - auto-growing field (Enter sends, Shift+Enter = new line);
  - `+` attach menu (upload / from Documents, chip with progress);
  - the mode dropdown 1:1 with the live menu: Auto + 8 modes incl. "Plan first", each with a short description; it opens downward and flips up when docked;
  - "Skip clarifying"; **Ask**.
- **Answer:** "searching…" shimmer, then streaming text with a caret, and citation chips appear as they are written. Click a chip and the Sources panel opens the exact fragment (highlighted quote, official-text link). Copy / Save to notes / "How this answer was found".
- **Plan first:** a research plan card (edit / approve), then the answer.
- **Deep research:** step progress, then the answer.
- **Counter:** at 0 the composer is replaced by the "out of questions" panel.
- **Refusal** ("No source found — so no answer"): ask something non-legal, e.g. "How to bake a cake?". It isn't counted.
- **Three distinct errors** (temporary / quota / service): via the **States** button (bottom-left, reviewer tool) or `?demo=error-temporary|error-quota|error-service`.
- **Responsive:** 1440 (full) · 1024 (icon rail, sources beside the answer) · 390 (drawer nav, sources as a bottom sheet).

All copy is an English placeholder until the Armenian pass. Answers, sources, chat titles and case names are SAMPLE.

Demo URLs: `?demo=answer`, `fragment`, `streaming`, `searching`, `deep`, `plan`, `refused`, `error-temporary`, `error-quota`, `error-service`, `low`, `out`, `sheet` (phone).

## Deploy (GitHub Pages)

`npm run deploy` builds with the `/femida-prototype/` base path and publishes `.output/public` to the `gh-pages` branch.

## Screenshots

`npm run generate && node scripts/shot.mjs` → `shots/*.png` (headless Chrome; phones are rendered in a 390px iframe).

## Notes

- Answer text and sources are **SAMPLE** content (`data/mock.ts`) — replace with a real verified answer (open question 11 to the CTO).
- PrimeVue used: Button, Textarea (autoResize), Drawer, Skeleton, Menu, Tooltip; custom Femida components: composer, citation chip, sources panel, answer, states.
