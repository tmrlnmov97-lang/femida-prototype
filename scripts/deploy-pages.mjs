// GitHub Pages: one repo, two frontends, the same public links as before the split —
//   app     → https://tmrlnmov97-lang.github.io/femida-prototype/
//   landing → https://tmrlnmov97-lang.github.io/femida-prototype/landing/
// Each is generated with its own base URL and the other's address, then both are pushed to the gh-pages branch.
// Hosting them apart (e.g. femid.ai + app.femid.ai) needs only other values for the four env vars below.
import { execSync } from 'node:child_process';
import { cpSync, copyFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const BASE = '/femida-prototype/';
const run = (cmd, env = {}) => execSync(cmd, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

run('npm run generate -w @femida/app', { NUXT_APP_BASE_URL: BASE, NUXT_PUBLIC_SITE_URL: `${BASE}landing/` });
run('npm run generate -w @femida/landing', { NUXT_APP_BASE_URL: `${BASE}landing/`, NUXT_PUBLIC_APP_URL: BASE });

const out = root + 'dist-pages/';
rmSync(out, { recursive: true, force: true });
cpSync(root + 'apps/app/.output/public', out, { recursive: true });
cpSync(root + 'apps/landing/.output/public', out + 'landing', { recursive: true });
copyFileSync(out + 'index.html', out + '404.html'); // SPA fallback: deep links into the app (/cases/…) load the app
writeFileSync(out + '.nojekyll', '');
if (process.argv.includes('--dry')) console.log('dry run: dist-pages/ is ready, nothing published'); // npm run deploy -- --dry
else run('npx gh-pages -d dist-pages --dotfiles');
