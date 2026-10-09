// Screenshots of the generated prototype with headless Chrome.
// Usage: npm run generate && node scripts/shot.mjs [name=query@WxH ...]
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = root + 'shots/';
mkdirSync(out, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 4173;
const BASE = process.env.BASE || `http://localhost:${PORT}`; // BASE=http://localhost:3000 → use the running dev server
const defaults = [
  'empty=@1440x900', 'answer=demo=answer@1440x900', 'fragment=demo=fragment@1440x900', 'streaming=demo=streaming@1440x900',
  'refused=demo=refused@1440x900', 'error-service=demo=error-service@1440x900', 'out=demo=out@1440x900', 'deep=demo=deep@1440x900',
  'empty-light=theme=light@1440x900', 'answer-light=demo=answer%26theme=light@1440x900',
  'tablet-answer=demo=answer@1024x768', 'phone-empty=@390x844', 'phone-answer=demo=answer@390x844', 'phone-sheet=demo=sheet@390x844',
];
const jobs = (process.argv.slice(2).length ? process.argv.slice(2) : defaults).map((s) => {
  const [name, rest] = s.split('='); const [q, size] = s.slice(name.length + 1).split('@');
  const [w, h] = size.split('x'); return { name, query: q.replace(/%26/g, '&'), w, h };
});
const server = process.env.BASE ? null : spawn('python3', ['-m', 'http.server', String(PORT), '-d', root + '.output/public'], { stdio: 'ignore' });
const frameDir = process.env.BASE ? root + 'public/' : root + '.output/public/';
await new Promise((r) => setTimeout(r, 800));
try {
  for (const j of jobs) {
    let url = `${BASE}/${j.query ? '?' + j.query : ''}`;
    let win = j.w;
    // headless Chrome won't make a window narrower than ~500px: render phones inside an iframe, then crop
    if (Number(j.w) < 500) {
      writeFileSync(frameDir + '__frame.html', `<body style="margin:0;background:#000"><iframe src="/${j.query ? '?' + j.query : ''}" style="width:${j.w}px;height:${j.h}px;border:0;display:block"></iframe></body>`);
      url = `${BASE}/__frame.html`; win = 520;
    }
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      `--window-size=${win},${j.h}`, '--virtual-time-budget=8000', `--screenshot=${out}${j.name}.png`, url], { stdio: 'ignore' });
    if (win !== j.w) execFileSync('python3', ['-c', `from PIL import Image;im=Image.open('${out}${j.name}.png');im.crop((0,0,${j.w},${j.h})).save('${out}${j.name}.png')`]);
    console.log('shot', j.name, url);
  }
} finally { server?.kill(); }
