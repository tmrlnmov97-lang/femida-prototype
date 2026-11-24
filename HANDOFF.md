# Femida frontend: developer handoff

This is the coded redesign of femid.ai, built on your stack (Nuxt 3 + PrimeVue 4, Aura preset). Use it as the reference for the real build. Layout, components, states, theming and copy are final for this phase. Data, auth and payments are **mocked**: there is no backend and no API call anywhere.

- **App (live):** https://tmrlnmov97-lang.github.io/femida-prototype/
- **Website (live):** https://tmrlnmov97-lang.github.io/femida-prototype/landing/
- **Repo:** https://github.com/tmrlnmov97-lang/femida-prototype

## 1. Run it

Node **20.19+ or 22.12+** (`.nvmrc` = 22).

```bash
npm install        # npm workspaces, one install for everything
npm run dev        # app → http://localhost:3001, website → http://localhost:3002
```

`npm run dev:app` / `npm run dev:landing` start one at a time. `npm run generate` writes static builds to `apps/*/.output/public`.

## 2. Structure: two frontends, one design system

| Folder | What it is | Rendering |
|---|---|---|
| `apps/app` | The signed-in product: Chat (`pages/index.vue`), My cases, Documents, My notes, Account, tools (Watch, Studio, Law on a date, Drafting wizard, Counsel, Work plan) | SPA |
| `apps/landing` | The public website: hero with the chat field, product tour, pricing, FAQ, sign-in dialog | SPA |
| `packages/ui` | Nuxt layer `@femida/ui` that both apps `extends`. It holds the design tokens, the PrimeVue preset, plugins, the chat composer, the refusal card, the chat store and the SAMPLE data | — |

Rules:

- Neither app imports from the other. Anything both need goes into `packages/ui`.
- Import shared files as `#ui/...` (e.g. `#ui/data/mock`). Inside a layer `~` points at the app that extends it, so `~/...` only ever means the app's own files.
- Components register globally without a path prefix (`<ChatComposer>`, not `<ChatChatComposer>`). PrimeVue components are registered with a `P` prefix (`<PButton>`, `<PDrawer>`…) in `packages/ui/plugins/primevue.ts`.

## 3. Take as-is

- **Theme.** All colours come from CSS variables in `packages/ui/assets/css/fd.css` (`--fd-bg`, `--fd-panel`, `--fd-ink`, `--fd-muted`, `--fd-line`, `--fd-accent`…). Dark is the default. Light = the `fd-light` class on `<html>`. `theme/preset.ts` points PrimeVue Aura at those variables, so PrimeVue components follow the theme with no hex values in components. `fd.css`, `type.css`, `base.css` and `preset.ts` are generated from the design-token source, which lives outside this repo (`npm run sync` skips when it is absent). Ask the designer for colour changes instead of editing the copies.
- **Typography:** `type.css` with Noto Sans/Serif Armenian from Google Fonts. Body text is ≥ 15px.
- **Breakpoints:** 1440 / 1024 / 390.
  - 1024: the sidebar becomes an icon rail.
  - 390: the sidebar becomes a drawer and Sources becomes a bottom sheet.
- **Icons:** PrimeIcons only. Do not mix in another set.
- **States.** Every screen has loading (skeletons, never spinners), empty and error.

## 4. Replace with the real backend

| What | Where | What the prototype does now |
|---|---|---|
| **Chat answer** | `packages/ui/composables/useChat.ts` → `send()` | Streams one SAMPLE answer (`ANSWER`, `SOURCES` in `data/mock.ts`) with timers. Citation chips appear as the text that cites them is written. A question containing "cake / bake / recipe" triggers the refusal. Modes: Auto + 8 (`MODES`). Plan first and Deep research are timer-driven too. |
| **Errors** | `useChat` → `AssistantMsg.errorKind` | Three distinct kinds: `temporary` (retry), `quota` (out of credits), `service` (our problem). Keep them separate; never show one generic error. |
| **Credits** | `useChat` → `state.remaining` (42), `LIMIT` (50) | 1 answered question = 1 credit; a refusal is free [ASSUMPTION]. At 0 the plans dialog opens. Show one number with one meaning (remaining), the same in the top bar, Account and emails. |
| **Sign-in** | `apps/landing/components/site/AuthDialog.vue` | Steps: register → 6-digit email code (resend timer) · log in (+ Remember me) · forgot. Any 6 digits pass. "Forgot → code" signs in directly, because there is no new-password screen yet. |
| **Website → app** | `AuthDialog.vue` `finish()` → `apps/app/pages/index.vue` `onMounted` | After sign-in the guest's question goes to the app in the URL (`?ask&mode&file&size&theme`). The app sends it on arrival and clears the query. Real build: upload the attached file first and pass its id [ASSUMPTION]. |
| **File upload** | `packages/ui/components/chat/ChatComposer.vue` | Fake progress bar. The FAQ promises encryption and ≤ 25 MB per file. |
| **Cases, notes, documents** | `apps/app/composables/useCases.ts`, `useNotes.ts`, `data/mock.ts` | In-memory stores seeded from mock data. Lost on reload. |
| **Payment** | `apps/app/components/chat/UpgradeDialog.vue` | Stops at "Opening payment…". Payment happens on the bank's page (Visa / Mastercard / ArCa); the checkout itself is not designed yet [OPEN]. |
| **Send a request** | `apps/app/components/shell/RequestForm.vue` | Generates a fake ticket number. |
| **Log out** | `apps/app/composables/useSignOut.ts` | Goes to the website. Add the session end there. |
| **Addresses** | env at build time | `NUXT_PUBLIC_APP_URL` (website → app), `NUXT_PUBLIC_SITE_URL` (app → website), `NUXT_APP_BASE_URL` per app. |

## 5. Remove before production

These are reviewer tools, not product features:

- the **States** button, bottom-left in the app (`apps/app/components/chat/DemoStates.vue`);
- the `?demo=…` URL switch on Chat;
- the `?state=loading|empty|error` switch on the library and tool pages;
- the `?theme=light` and `?palette=…` URL switches;
- `robots: noindex` in `packages/ui/nuxt.config.ts`;
- everything in `packages/ui/data/mock.ts`. All answers, sources, case names and chat titles there are SAMPLE.

## 6. Copy and language

- The product UI is **Armenian only**. The strings in the code are English placeholders.
- Every string has an Armenian counterpart in a copy map (`copy-map.hy-en.json`). It is not in this repo and will be provided for the swap.
- Allow about 25% more width for Armenian.
- `v-tie` (`packages/ui/plugins/tie.ts`) keeps short words off line ends. Its word list is English and needs an Armenian one at the swap.

## 7. Product rules (from the brief, please keep)

1. **Chat is the core screen.**
2. **«No source, no answer».** An answer always shows its citations and the Sources panel. A refusal reads as a feature, not a failure.
3. **Errors are honest and distinct.** "Temporary, retry", "out of credits" and "service problem" are three different messages.
4. **One counter, one meaning** (remaining credits), the same everywhere.

## 8. Open points

- The answer text is SAMPLE. It is waiting for a real verified answer from the femid.ai team.
- 1 question = 1 credit; Remember me needs a longer session on the backend; passing the file from the website to the app. All three are [ASSUMPTION].
- The checkout screen is not designed [OPEN].
- The website is an SPA. Prerendering it for SEO needs `@primevue/nuxt-module` so the theme CSS lands in the HTML.
