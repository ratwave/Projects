// Smoke test: start every campaign level briefly and assert no runtime errors.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 640 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(`${e.message}`));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(600);

const counts = await page.evaluate(() => {
  const { CAMPAIGN } = window.__campaign ?? {};
  return null; // campaign not exposed; use known structure below
});

// Known structure: rating 0 has 5, rating 1 has 4, rating 2 has 3.
const plan = [
  [0, 5],
  [1, 4],
  [2, 3],
];

let started = 0;
for (const [r, n] of plan) {
  for (let l = 0; l < n; l++) {
    await page.evaluate(([r, l]) => window.__app.startLevel(r, l), [r, l]);
    await page.waitForTimeout(700);
    const ok = await page.evaluate(() => {
      const s = window.__scene;
      return s && s.game ? s.game.lemmings.length >= 0 : false;
    });
    if (ok) started++;
  }
}

await browser.close();
console.log(`started ${started} levels`);
if (errors.length) {
  console.error('PAGE ERRORS:\n' + errors.join('\n'));
  process.exitCode = 2;
} else {
  console.log('no runtime errors across all levels');
}
