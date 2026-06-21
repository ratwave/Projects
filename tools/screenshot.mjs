// Headless screenshot helper for visual validation of the game.
// Usage: node tools/screenshot.mjs <url> <outPath> [waitMs] [width] [height] [clicksJson]
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = process.argv[3] ?? '/tmp/shot.png';
const waitMs = Number(process.argv[4] ?? 1500);
const width = Number(process.argv[5] ?? 1280);
const height = Number(process.argv[6] ?? 720);
const actions = process.argv[7] ? JSON.parse(process.argv[7]) : [];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height } });
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`[console] ${m.text()}`);
});
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(waitMs);

for (const a of actions) {
  if (a.type === 'wait') await page.waitForTimeout(a.ms);
  else if (a.type === 'click') await page.mouse.click(a.x, a.y);
  else if (a.type === 'move') await page.mouse.move(a.x, a.y);
  else if (a.type === 'down') await page.mouse.down({ button: a.button ?? 'left' });
  else if (a.type === 'up') await page.mouse.up({ button: a.button ?? 'left' });
  else if (a.type === 'key') await page.keyboard.press(a.key);
}

await page.screenshot({ path: out });
await browser.close();

if (errors.length) {
  console.error('PAGE ERRORS:\n' + errors.join('\n'));
  process.exitCode = 2;
} else {
  console.log('OK screenshot ->', out);
}
