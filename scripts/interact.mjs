// Real interaction checks with the system Chrome (puppeteer-core). BASE defaults to the dev server.
import puppeteer from 'puppeteer-core';
const BASE = process.env.BASE || 'http://localhost:3000';
const out = new URL('../shots/', import.meta.url).pathname;
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) mode menu opened by a real click
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.click('button.mode'); await wait(500);
await page.screenshot({ path: out + 'i-mode-menu.png' });
// 2) pick "Plan first", type a question, send → plan card
await page.evaluate(() => [...document.querySelectorAll('.mp-item')].find((b) => b.textContent.includes('Plan first')).click());
await wait(300);
await page.type('textarea', 'Can I contest a dismissal after the deadline if I was in hospital?');
await page.keyboard.press('Enter'); await wait(1600);
await page.screenshot({ path: out + 'i-plan.png' });
// 3) approve → streaming → done
await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Approve and answer')).click());
await wait(2200); await page.screenshot({ path: out + 'i-streaming.png' });
await wait(5000); await page.screenshot({ path: out + 'i-done.png' });
// 4) click a citation → source fragment
await page.click('.cite'); await wait(400); await page.screenshot({ path: out + 'i-citation.png' });
console.log('ok');
await browser.close();
