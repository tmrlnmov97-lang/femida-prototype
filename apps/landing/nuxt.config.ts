// Femida website — the public landing (femid.ai): hero with the chat composer, product tour, pricing, FAQ, sign-in dialog.
// Nuxt 3 + PrimeVue 4 via @femida/ui. After sign-in the guest goes to the app (apps/landing → apps/app) with the question.
const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3001/';

export default defineNuxtConfig({
  extends: ['@femida/ui'],
  compatibilityDate: '2025-01-01',
  // SPA like the app: PrimeVue is themed by a client plugin, so prerendered HTML would paint unstyled first.
  // Switching the site to SSG needs @primevue/nuxt-module (collects the theme CSS on the server) [ASSUMPTION — later].
  ssr: false,
  devtools: { enabled: false },
  devServer: { port: 3002 },
  components: [{ path: '~/components', pathPrefix: false }],
  // Where sign-in leads — the app (apps/app).
  runtimeConfig: { public: { appUrl } },
  app: { head: { title: 'femid.ai — Legal answers you can verify' } },
});
