/**
 * Femida PrimeVue preset — Aura, re-pointed at the --fd-* CSS variables.
 *
 * No colour values live here: every colour is `var(--fd-…)`, defined in the generated
 * src/tokens/fd.css (dark on :root, light on :root.fd-light). PrimeVue's dark scheme is
 * bound to "no .fd-light on <html>" (see main.ts), so the class on <html> drives both.
 *
 * Aura's tonal palettes (primary 50–950, surface 0–950) have no 1:1 counterpart in the
 * 16-token Femida set. They are mapped by role per scheme so that any Aura component
 * we did not override explicitly still lands on a Femida token.
 */
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

const v = (name: string) => `var(--fd-${name})`;

const focusRing = { width: '2px', style: 'solid', color: v('focus'), offset: '2px', shadow: 'none' };

/* ---------- semantic, shared by both schemes (values swap via fd.css) ---------- */
const scheme = {
  primary: {
    color: v('accent'),
    contrastColor: v('on-accent'),
    hoverColor: v('accent-hover'),
    activeColor: v('accent'), // no pressed token in Femida → same as rest
  },
  highlight: {
    background: v('accent-soft'),
    focusBackground: v('accent-soft'),
    color: v('accent-text'),
    focusColor: v('accent-text'),
  },
  formField: {
    background: v('panel'),
    disabledBackground: v('panel-2'),
    filledBackground: v('panel-2'),
    filledHoverBackground: v('panel-2'),
    filledFocusBackground: v('panel-2'),
    borderColor: v('line'),
    hoverBorderColor: v('muted'),
    focusBorderColor: v('accent'),
    invalidBorderColor: v('red'),
    color: v('ink'),
    disabledColor: v('muted'),
    placeholderColor: v('muted'),
    invalidPlaceholderColor: v('red'),
    floatLabelColor: v('muted'),
    floatLabelFocusColor: v('accent-text'),
    floatLabelActiveColor: v('muted'),
    floatLabelInvalidColor: v('red'),
    iconColor: v('muted'),
    shadow: 'none',
  },
  text: {
    color: v('ink'),
    hoverColor: v('ink'),
    mutedColor: v('muted'),
    hoverMutedColor: v('ink'),
  },
  content: {
    background: v('panel'),
    hoverBackground: v('panel-2'),
    borderColor: v('line'),
    color: v('ink'),
    hoverColor: v('ink'),
  },
  overlay: {
    select: { background: v('panel'), borderColor: v('line'), color: v('ink') },
    popover: { background: v('panel'), borderColor: v('line'), color: v('ink') },
    modal: { background: v('panel'), borderColor: v('line'), color: v('ink') },
  },
  list: {
    option: {
      focusBackground: v('panel-2'),
      selectedBackground: v('accent-soft'),
      selectedFocusBackground: v('accent-soft'),
      color: v('ink'),
      focusColor: v('ink'),
      selectedColor: v('accent-text'),
      selectedFocusColor: v('accent-text'),
      icon: { color: v('muted'), focusColor: v('ink') },
    },
    optionGroup: { background: 'transparent', color: v('muted') },
  },
  navigation: {
    item: {
      focusBackground: v('panel-2'),
      activeBackground: v('panel-2'),
      color: v('ink'),
      focusColor: v('ink'),
      activeColor: v('ink'),
      icon: { color: v('muted'), focusColor: v('ink'), activeColor: v('accent-text') },
    },
    submenuLabel: { background: 'transparent', color: v('muted') },
    submenuIcon: { color: v('muted'), focusColor: v('ink'), activeColor: v('accent-text') },
  },
};

/* Surface palette by role. Aura reads it "upside down" in dark vs light. */
const surfaceLight = {
  0: v('panel'),
  50: v('panel-2'),
  100: v('panel-2'),
  200: v('line'),
  300: v('line'),
  400: v('muted'),
  500: v('muted'),
  600: v('muted'),
  700: v('ink'),
  800: v('ink'),
  900: v('ink'),
  950: v('ink'),
};
const surfaceDark = {
  0: v('ink'),
  50: v('ink'),
  100: v('ink'),
  200: v('ink'),
  300: v('ink'),
  400: v('muted'),
  500: v('muted'),
  600: v('line'),
  700: v('line'),
  800: v('panel-2'),
  900: v('panel'),
  950: v('bg'),
};

/* ---------- component overrides (identical in both schemes) ---------- */
const buttonScheme = {
  root: {
    primary: {
      background: v('accent'),
      hoverBackground: v('accent-hover'),
      activeBackground: v('accent'),
      borderColor: v('accent'),
      hoverBorderColor: v('accent-hover'),
      activeBorderColor: v('accent'),
      color: v('on-accent'),
      hoverColor: v('on-accent'),
      activeColor: v('on-accent'),
      focusRing: { color: v('focus'), shadow: 'none' },
    },
    secondary: {
      background: v('panel-2'),
      hoverBackground: v('line'),
      activeBackground: v('line'),
      borderColor: v('line'),
      hoverBorderColor: v('line'),
      activeBorderColor: v('line'),
      color: v('ink'),
      hoverColor: v('ink'),
      activeColor: v('ink'),
      focusRing: { color: v('focus'), shadow: 'none' },
    },
  },
  outlined: {
    primary: { hoverBackground: v('accent-soft'), activeBackground: v('accent-soft'), borderColor: v('accent'), color: v('accent-text') },
    secondary: { hoverBackground: v('panel-2'), activeBackground: v('panel-2'), borderColor: v('line'), color: v('ink') },
  },
  text: {
    primary: { hoverBackground: v('accent-soft'), activeBackground: v('accent-soft'), color: v('accent-text') },
    secondary: { hoverBackground: v('panel-2'), activeBackground: v('panel-2'), color: v('muted') },
  },
  link: { color: v('accent-text'), hoverColor: v('accent-text'), activeColor: v('accent-text') },
};

const closeBtn = (hover: string, ring: string) => ({ hoverBackground: v(hover), focusRing: { color: v(ring), shadow: 'none' } });

const severity = {
  info: {
    background: v('panel-2'),
    borderColor: v('line'),
    color: v('ink'),
    shadow: 'none',
    closeButton: closeBtn('line', 'focus'),
    outlined: { color: v('ink'), borderColor: v('line') },
    simple: { color: v('ink') },
  },
  warn: {
    background: v('amber-soft'),
    borderColor: v('amber'),
    color: v('amber'),
    shadow: 'none',
    closeButton: closeBtn('panel-2', 'focus'),
    outlined: { color: v('amber'), borderColor: v('amber') },
    simple: { color: v('amber') },
  },
  error: {
    background: v('red-soft'),
    borderColor: v('red'),
    color: v('red'),
    shadow: 'none',
    closeButton: closeBtn('panel-2', 'focus'),
    outlined: { color: v('red'), borderColor: v('red') },
    simple: { color: v('red') },
  },
  success: {
    background: v('accent-soft'),
    borderColor: v('accent'),
    color: v('accent-text'),
    shadow: 'none',
    closeButton: closeBtn('panel-2', 'focus'),
    outlined: { color: v('accent-text'), borderColor: v('accent') },
    simple: { color: v('accent-text') },
  },
  secondary: {
    background: v('panel-2'),
    borderColor: v('line'),
    color: v('ink'),
    shadow: 'none',
    closeButton: closeBtn('line', 'focus'),
    outlined: { color: v('muted'), borderColor: v('line') },
    simple: { color: v('muted') },
  },
};

const toastSeverity = Object.fromEntries(
  Object.entries(severity).map(([k, s]) => [
    k,
    { background: s.background, borderColor: s.borderColor, color: s.color, detailColor: v('ink'), shadow: v('shadow'), closeButton: s.closeButton },
  ])
);

const tagScheme = {
  primary: { background: v('accent-soft'), color: v('accent-text') },
  secondary: { background: v('panel-2'), color: v('ink') },
  success: { background: v('accent-soft'), color: v('accent-text') },
  info: { background: v('panel-2'), color: v('ink') },
  warn: { background: v('amber-soft'), color: v('amber') },
  danger: { background: v('red-soft'), color: v('red') },
  contrast: { background: v('ink'), color: v('bg') },
};

const both = <T,>(x: T) => ({ light: x, dark: x });

export const FemidaPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: v('radius-sm'), // no xs in Femida → sm
      sm: v('radius-sm'),
      md: v('radius-md'),
      lg: v('radius-lg'),
      xl: v('radius-xl'),
    },
  },
  semantic: {
    transitionDuration: v('motion-base'),
    focusRing,
    primary: {
      // No tonal accent scale in Femida — mapped by role.
      50: v('accent-soft'),
      100: v('accent-soft'),
      200: v('accent-soft'),
      300: v('accent-hover'),
      400: v('accent-hover'),
      500: v('accent'),
      600: v('accent-text'),
      700: v('accent-text'),
      800: v('accent-text'),
      900: v('accent-text'),
      950: v('accent-text'),
    },
    formField: {
      borderRadius: v('radius-md'),
      focusRing,
      sm: { fontSize: v('type-body-sm-size') },
      lg: { fontSize: v('type-body-lg-size') },
    },
    content: { borderRadius: v('radius-lg') },
    overlay: {
      select: { borderRadius: v('radius-md'), shadow: v('shadow') },
      popover: { borderRadius: v('radius-lg'), shadow: v('shadow') },
      modal: { borderRadius: v('radius-xl'), shadow: v('shadow') },
      navigation: { shadow: v('shadow') },
    },
    colorScheme: {
      light: { ...scheme, surface: surfaceLight },
      dark: { ...scheme, surface: surfaceDark },
    },
  },
  components: {
    button: {
      root: { label: { fontWeight: v('type-label-weight') }, focusRing: { width: '2px', style: 'solid', offset: '2px' } },
      colorScheme: both(buttonScheme),
    },
    message: {
      root: { borderRadius: v('radius-md') },
      text: { fontSize: v('type-body-size'), fontWeight: '400' },
      colorScheme: both(severity),
    },
    toast: {
      summary: { fontSize: v('type-body-size'), fontWeight: v('type-label-weight') },
      detail: { fontSize: v('type-body-sm-size'), fontWeight: '400' },
      colorScheme: both(toastSeverity),
    },
    tag: {
      root: { fontSize: v('type-caption-size'), fontWeight: v('type-label-weight'), roundedBorderRadius: v('radius-full') },
      colorScheme: both(tagScheme),
    },
    skeleton: {
      root: { borderRadius: v('radius-md') },
      colorScheme: both({ root: { background: v('panel-2') } }),
    },
    progressbar: {
      root: { background: v('line'), borderRadius: v('radius-full') },
      value: { background: v('accent') },
      label: { color: v('on-accent'), fontSize: v('type-caption-size') },
    },
    password: {
      colorScheme: both({ strength: { weakBackground: v('red'), mediumBackground: v('amber'), strongBackground: v('accent') } }),
    },
    tabs: {
      tab: {
        activeColor: v('accent-text'),
        activeBorderColor: v('accent'),
        fontWeight: v('type-label-weight'),
        // Tablist scrolls horizontally (overflow) → an outset ring would be clipped; drawn inset instead.
        focusRing: { width: '2px', style: 'solid', color: v('focus'), offset: '-2px', shadow: 'none' },
      },
      activeBar: { background: v('accent') },
    },
    avatar: {
      root: { background: v('accent-soft'), color: v('accent-text') },
    },
    dialog: {
      title: { fontSize: v('type-h3-size'), fontWeight: v('type-h3-weight') },
    },
  },
});

export default FemidaPreset;
