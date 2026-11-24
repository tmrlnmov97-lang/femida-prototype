// Both frontends at once: the app on :3001, the landing on :3002 (sign-in on the landing hands the question to the app).
// One at a time: npm run dev:app / npm run dev:landing.
import { spawn } from 'node:child_process';

const kids = ['@femida/app', '@femida/landing'].map((w) => spawn('npm', ['run', 'dev', '-w', w], { stdio: 'inherit' }));
const stop = () => kids.forEach((k) => k.kill('SIGINT'));
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
kids.forEach((k) => k.on('exit', (code) => { if (code) { stop(); process.exitCode = code; } }));
