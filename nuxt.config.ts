// Femida coded prototype — Nuxt 3 SPA + PrimeVue 4 themed with the --fd-* tokens.
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  ssr: false,
  devtools: { enabled: false },
  css: [
    'primeicons/primeicons.css',
    '~/assets/css/fd.css',
    '~/assets/css/type.css',
    '~/assets/css/base.css',
    '~/assets/css/app.css',
  ],
  components: [{ path: '~/components', pathPrefix: false }],
  app: {
    head: {
      title: 'Femida redesign — Chat prototype',
      // PrimeVue dark scheme is bound to `[lang]:not(.fd-light)` (see plugins/primevue.ts).
      htmlAttrs: { lang: 'hy' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        // Shared by link for review — keep it out of search results (client work, sample legal content).
        { name: 'robots', content: 'noindex, nofollow' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@400;500;600;700&family=Noto+Serif+Armenian:wght@600;700&family=Noto+Sans:wght@400;500;600;700&family=Noto+Serif:wght@600;700&display=swap',
        },
      ],
    },
  },
});
