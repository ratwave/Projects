// Verify original chiptune music starts after a user gesture and switches
// tracks between menu and in-level scenes.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(600);

const before = await page.evaluate(() => window.__app.audio.status());

// A real click on a harmless menu control (rating '>' arrow) grants user activation.
await page.mouse.click(856, 349);
await page.waitForTimeout(700);
const onMenu = await page.evaluate(() => window.__app.audio.status());

// Enter a level; music track should switch to 'level'.
await page.evaluate(() => window.__app.startLevel(0, 0));
await page.waitForTimeout(900);
const inLevel = await page.evaluate(() => window.__app.audio.status());

await browser.close();
console.log('before gesture:', JSON.stringify(before));
console.log('on menu:      ', JSON.stringify(onMenu));
console.log('in level:     ', JSON.stringify(inLevel));
if (errors.length) {
  console.error('PAGE ERRORS:\n' + errors.join('\n'));
  process.exitCode = 2;
}
