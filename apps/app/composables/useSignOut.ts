// The website is a separate frontend (apps/landing): Log out / Sign out leaves the app for it, keeping the theme.
export function useSignOut() {
  const site = useRuntimeConfig().public.siteUrl as string;
  return () => navigateTo(document.documentElement.classList.contains('fd-light') ? `${site}?theme=light` : site, { external: true });
}
