// Landing assets are the exact SVGs exported from Figma (file MuXNHQVKOE55lGpjzUIOWt, node 33:2), stored in public/landing/<hash>.svg.
// Prefixed with the app base URL so they also resolve on GitHub Pages (/femida-prototype/).
export function useLandingAsset() {
  const base = useRuntimeConfig().app.baseURL || '/';
  return (hash: string) => `${base}landing/${hash}.svg`;
}
