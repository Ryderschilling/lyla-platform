import { chromium } from 'playwright-core';
import { mkdirSync, existsSync } from 'fs';

const BASE = 'http://localhost:3000';
const OUT = '/home/claude/shots';
mkdirSync(OUT, { recursive: true });

const EXEC = '/opt/pw-browsers/chromium';
const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 },
];

const W1 = 'b0000000-0000-4000-8000-000000000001';
const W2 = 'b0000000-0000-4000-8000-000000000002';
const EZRA = 'a0000000-0000-4000-8000-000000000003';

const PUBLIC = [
  ['home', '/'],
  ['watch', '/watch'],
  ['locker', '/locker'],
  ['the-club', '/the-club'],
  ['contact', '/contact'],
  ['login', '/login'],
];
const CLUB = [
  ['club-today', '/club'],
  ['club-past', '/club/past'],
  ['club-past-detail', `/club/past/${W2}`],
  ['club-progress', '/club/progress'],
  ['club-messages', '/club/messages'],
  ['club-review', '/club/review'],
  ['club-locker', '/club/locker'],
  ['club-account', '/club/account'],
];
const HQ = [
  ['hq-dashboard', '/hq'],
  ['hq-clients', '/hq/clients'],
  ['hq-builder', '/hq/builder'],
  ['hq-builder-edit', `/hq/builder/${W1}`],
  ['hq-calendar', '/hq/calendar'],
  ['hq-reviews', '/hq/reviews'],
  ['hq-messages', `/hq/messages?u=${EZRA}`],
  ['hq-locker', '/hq/locker'],
];

async function settle(page) {
  await page.waitForTimeout(500);
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  // walk the page so whileInView reveals fire, then return to top
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(900);
}

async function shoot(page, name, tag) {
  await settle(page);
  await page.screenshot({ path: `${OUT}/${name}--${tag}.png`, fullPage: true });
  console.log('shot', name, tag);
}

function have(name, tag) {
  return existsSync(`${OUT}/${name}--${tag}.png`);
}

async function login(context, email, password, expect) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);
  await page.fill('#l-email', email);
  await page.fill('#l-pass', password);
  await page.click('button[type=submit]');
  await page.waitForURL(`**${expect}**`, { timeout: 20000 });
  await page.close();
}

const browser = await chromium.launch({ executablePath: EXEC });

for (const vp of VIEWPORTS) {
  // ---- public ----
  const pub = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
  const p1 = await pub.newPage();
  for (const [name, path] of PUBLIC) {
    if (have(name, vp.tag)) continue;
    await p1.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await shoot(p1, name, vp.tag);
  }
  await pub.close();

  // ---- club (Brooklyn) ----
  const club = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1.5 });
  await login(club, 'brooklyn@progress.club', 'progress-2026', '/club');
  const p2 = await club.newPage();
  for (const [name, path] of CLUB) {
    if (have(name, vp.tag)) continue;
    await p2.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await shoot(p2, name, vp.tag);
  }
  await club.close();

  // ---- HQ (Lyla) ----
  const hq = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1.5 });
  await login(hq, 'lyla@lylaschilling.com', 'sunrise-2026', '/hq');
  const p3 = await hq.newPage();
  for (const [name, path] of HQ) {
    if (have(name, vp.tag)) continue;
    await p3.goto(BASE + path, { waitUntil: 'domcontentloaded' });
    await shoot(p3, name, vp.tag);
  }
  await hq.close();
}

// ---- interaction captures (desktop): mark complete -> gold moment -> review ----
const flow = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await login(flow, 'brooklyn@progress.club', 'progress-2026', '/club');
const p4 = await flow.newPage();
await p4.goto(`${BASE}/club`, { waitUntil: 'domcontentloaded' });
await p4.waitForTimeout(800);
await p4.evaluate(() => document.fonts.ready).catch(() => {});
const btn = p4.locator('text=MARK COMPLETE');
if (await btn.count()) {
  await btn.first().click();
  await p4.waitForTimeout(1200); // mid-celebration
  await p4.screenshot({ path: `${OUT}/club-complete-gold-moment--desktop.png` });
  console.log('shot club-complete-gold-moment desktop');
  await p4.waitForTimeout(1400); // review panel opens
  await p4.screenshot({ path: `${OUT}/club-review-panel--desktop.png` });
  console.log('shot club-review-panel desktop');
}
await flow.close();

// ---- demo room interaction on the-club (timer EMOM + canned chat) ----
const demo = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
const p5 = await demo.newPage();
await p5.goto(`${BASE}/the-club`, { waitUntil: 'domcontentloaded' });
await p5.waitForTimeout(800);
await p5.evaluate(() => document.fonts.ready).catch(() => {});
const chat = p5.locator('input[aria-label="Message the coach"]');
await chat.fill('how do I make this easier?');
await chat.press('Enter');
await p5.waitForTimeout(1100);
const demoRoom = p5.locator('.theme-dark').first();
await demoRoom.screenshot({ path: `${OUT}/the-club-demo-interaction--desktop.png` });
console.log('shot the-club-demo-interaction desktop');
await demo.close();

await browser.close();
console.log('ALL DONE');
