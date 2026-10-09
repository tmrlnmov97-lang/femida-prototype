import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Popover from 'primevue/popover';
import Drawer from 'primevue/drawer';
import Skeleton from 'primevue/skeleton';
import Menu from 'primevue/menu';
import FemidaPreset from '~/theme/preset';

export default defineNuxtPlugin((nuxtApp) => {
  const app = nuxtApp.vueApp;
  app.use(PrimeVue, {
    theme: {
      preset: FemidaPreset,
      options: {
        // Dark by default; light = `fd-light` class on <html> (needs <html lang>).
        darkModeSelector: '[lang]:not(.fd-light)[lang]',
        cssLayer: false,
      },
    },
  });
  app.directive('tooltip', Tooltip);
  app.component('PButton', Button);
  app.component('PTextarea', Textarea);
  app.component('PPopover', Popover);
  app.component('PDrawer', Drawer);
  app.component('PSkeleton', Skeleton);
  app.component('PMenu', Menu);
});
