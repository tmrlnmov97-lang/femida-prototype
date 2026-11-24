# Femida — coded prototype

> Handing this to a developer? Start with **[HANDOFF.md](HANDOFF.md)** — what is real, what is mocked and where to plug the API.

Redesign prototype for review, not the production app. Two separate frontends, one design system:

| | Folder | Dev | Live |
|---|---|---|---|
| **App** (signed-in product: Chat, cases, documents, notes, account) | `apps/app` | http://localhost:3001 | https://tmrlnmov97-lang.github.io/femida-prototype/ |
| **Landing** (public website: hero with the chat, product tour, pricing, FAQ, sign-in) | `apps/landing` | http://localhost:3002 | https://tmrlnmov97-lang.github.io/femida-prototype/landing/ |

Both are Nuxt 3 SPAs + PrimeVue 4 and extend one Nuxt layer, **`packages/ui`** (`@femida/ui`): the `--fd-*` tokens, the PrimeVue Aura preset, the `v-tie` no-widows directive, the chat composer and refusal card (the landing hero reuses the app's composer), the chat store and the SAMPLE data. Each app builds, runs and deploys on its own; neither imports from the other.

```
prototype/
  apps/app/        pages/ (Chat = index, cases, documents, notes, account, tools…) · components/chat, shell · composables/
  apps/landing/    pages/index.vue · components/landing, site (AuthDialog) · composables/ · public/figma/
  packages/ui/     nuxt.config.ts (the layer) · assets/css · theme/preset.ts · plugins/ · components/chat · composables/useChat · data/mock
  scripts/         dev.mjs · deploy-pages.mjs · shot.mjs · interact.mjs
```

Shared files are imported as `#ui/...` (e.g. `#ui/data/mock`). Inside a layer `~` points at the app that extends it, so `~/...` only ever means the app's own files.

## Run

Needs **Node 20.19+ or 22.12+** (`.nvmrc` = 22; Nuxt 3.21 / Vite 8). npm workspaces: one `npm install` at the root.

```bash
npm install
npm run dev            # both: app :3001 + landing :3002
npm run dev:app        # only the app
npm run dev:landing    # only the landing
npm run generate       # static builds → apps/*/.output/public
```

`npm run sync` in each app (runs before dev/generate) copies the generated tokens (`ds-app/src/tokens/*.css`) and the PrimeVue preset (`ds-app/src/theme/preset.ts`) into `packages/ui`, so ds-app stays the single source. Without ds-app next to it (e.g. this folder on its own), the copies already in `packages/ui` are used.

### How the two talk to each other

- **Landing → app.** After sign-in the guest's question goes to the app in the URL: `?ask=…&mode=…&file=…&size=…&theme=light`. The app sends it on arrival and clears the query. Address: `NUXT_PUBLIC_APP_URL` (default `http://localhost:3001/`). Real build: upload the attached file before leaving and pass its id [ASSUMPTION].
- **App → landing.** Log out / Sign out leads to the website, keeping the theme. Address: `NUXT_PUBLIC_SITE_URL` (default `http://localhost:3002/`).

To host them apart (e.g. `femid.ai` + `app.femid.ai`), set the two URLs and `NUXT_APP_BASE_URL` per app at build time.

## What works — app

- **Palette:** Emerald from the brand board (17.10.2026). Dark is the default; light via the account menu → Theme, or `?theme=light`.
- **Top bar:** Sources (n) toggle. Credit counter "N of 50 credits" (1 question = 1 credit): skeleton while loading, amber at ≤10, click for the usage card + "See plans". Account menu (Account / Plans / Organisation, Theme dark/light, Log out). No language switch: the product is Armenian-only.
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

- **My cases** (`/cases`): tabs Active / Archived / All, search, ⋯ Rename / Archive / Delete, New case dialog; states via `/cases?state=loading|empty|error`.

- **Documents** (`/documents`): Files table with upload progress, case links, select → Ask in chat / Download / Delete; Drafts with wizard steps; states via `/documents?state=loading|empty|error`.

- **My notes** (`/notes`): list + reader; saved answers keep clickable citations and sources; Studio materials (timeline, questions, key facts) with the files they are based on; states via `/notes?state=loading|empty|error`.

## What works — landing

- Floating header (nav slider, scroll-spy, theme switch, phone menu), hero with the chat composer in **gate** mode: a guest can type, attach and pick a mode, Ask opens sign-in.
- Product tour (answer with sources, refusal, tools — SAMPLE data from `packages/ui/data/mock`), pricing (Davit is the only plan on sale), FAQ, footer.
- Sign-in dialog: register → 6-digit email code (resend timer) · log in (remember me) · forgot password → then on to the app with the question.
- `?theme=light` as in the app.

All copy is an English placeholder until the Armenian pass. Answers, sources, chat titles and case names are SAMPLE.

Demo URLs (app): `?demo=answer`, `fragment`, `streaming`, `searching`, `deep`, `plan`, `refused`, `error-temporary`, `error-quota`, `error-service`, `low`, `out`, `sheet` (phone).

## Deploy (GitHub Pages)

`npm run deploy` (stop the dev servers first) generates both with their base paths — the app at `/femida-prototype/`, the landing at `/femida-prototype/landing/`, the same links as before the split — puts them in one `dist-pages/` and publishes it to the `gh-pages` branch.

## Screenshots

`npm run generate && node scripts/shot.mjs` → `shots/*.png` (headless Chrome; phones are rendered in a 390px iframe). Landing: `APP=landing node scripts/shot.mjs name=@1440x900`.

## Notes

- Answer text and sources are **SAMPLE** content (`packages/ui/data/mock.ts`) — replace with a real verified answer (open question 11 to the CTO).
- PrimeVue used: Button, Textarea (autoResize), Popover, Drawer, Skeleton, Menu, Tooltip; custom Femida components: composer, citation chip, sources panel, answer, states.
- The landing is an SPA like the app. Prerendering it (SSG, better for SEO) needs `@primevue/nuxt-module` so the theme CSS is in the HTML [ASSUMPTION — later].
