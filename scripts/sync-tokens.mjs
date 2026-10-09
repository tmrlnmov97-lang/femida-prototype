// Single source of truth: ds-artifacts/tokens.json → ds-app generates fd.css/type.css.
// This copies the generated CSS + base styles into the prototype so values never drift.
// Outside the workspace (e.g. the prototype shipped as a zip) ds-app is absent — keep the copies already in assets/.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('..', import.meta.url));
const ds = fileURLToPath(new URL('../../ds-app/src/', import.meta.url));
if (!existsSync(ds)) {
  console.log('ds-app not found — using the tokens already in assets/css');
} else {
  mkdirSync(root + 'assets/css', { recursive: true });
  for (const [from, to] of [['tokens/fd.css', 'fd.css'], ['tokens/type.css', 'type.css'], ['theme/base.css', 'base.css']]) {
    copyFileSync(ds + from, root + 'assets/css/' + to);
  }
  copyFileSync(ds + 'theme/preset.ts', root + 'theme/preset.ts');
  console.log('tokens synced from ds-app');
}
