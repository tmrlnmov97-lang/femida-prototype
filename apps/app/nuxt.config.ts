// Femida app — the signed-in product (Chat, cases, documents, notes, account…). Nuxt 3 SPA + PrimeVue 4 via @femida/ui.
// The public website is a separate frontend: apps/landing.
const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3002/';

export default defineNuxtConfig({
  extends: ['@femida/ui'],
  compatibilityDate: '2025-01-01',
  ssr: false,
  devtools: { enabled: false },
  devServer: { port: 3001 },
  components: [{ path: '~/components', pathPrefix: false }],
  // Where "Log out" leaves to — the website (apps/landing).
  runtimeConfig: { public: { siteUrl } },
  app: { head: { title: 'Femida redesign — Chat prototype' } },
});
