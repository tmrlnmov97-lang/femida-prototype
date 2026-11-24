// Single source of truth: ds-artifacts/tokens.json → ds-app generates fd.css/type.css.
// This copies the generated CSS + base styles + the PrimeVue preset into the shared layer (packages/ui), so the app and
// the landing never drift. Outside the workspace (e.g. the prototype shipped as a zip) ds-app is absent — keep the copies.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const ui = fileURLToPath(new URL('..', import.meta.url)); // packages/ui/
const ds = fileURLToPath(new URL('../../../../ds-app/src/', import.meta.url)); // sayko-lesson/ds-app/src/
if (!existsSync(ds)) {
  console.log('ds-app not found — using the tokens already in packages/ui/assets/css');
} else {
  mkdirSync(ui + 'assets/css', { recursive: true });
  for (const [from, to] of [['tokens/fd.css', 'fd.css'], ['tokens/type.css', 'type.css'], ['theme/base.css', 'base.css']]) {
    copyFileSync(ds + from, ui + 'assets/css/' + to);
  }
  copyFileSync(ds + 'theme/preset.ts', ui + 'theme/preset.ts');
  console.log('tokens synced from ds-app → packages/ui');
}
