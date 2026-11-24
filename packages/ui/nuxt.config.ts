// @femida/ui — the Nuxt layer both frontends extend (apps/app and apps/landing).
// Holds what they share and nothing else: the --fd-* tokens (synced from ds-app), the PrimeVue 4 Aura preset, the
// v-tie directive, the chat composer + refusal card (the landing hero reuses the app's composer), the chat store and
// the SAMPLE data. Paths are resolved from this folder: inside a layer `~` points at the app that extends it.
// Inside the layer import shared files as `#ui/...` (e.g. `#ui/data/mock`), never `~/...`.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const here = (p: string) => join(dir, p);

export default defineNuxtConfig({
  alias: { '#ui': dir },
  components: [{ path: here('./components'), pathPrefix: false }],
  css: [
    'primeicons/primeicons.css',
    here('./assets/css/fd.css'),
    here('./assets/css/type.css'),
    here('./assets/css/base.css'),
    here('./assets/css/ui.css'),
  ],
  app: {
    head: {
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
