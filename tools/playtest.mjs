// End-to-end playtest: navigate to "The Only Way Is Down" and solve it by
// assigning a digger above the exit through the real input path.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = process.argv[3] ?? '/tmp/playtest.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(800);

// Navigate: menu -> select level 2 -> objective -> play.
await page.evaluate(() => window.__scene && window.__app.showObjective(0, 1));
await page.waitForTimeout(400);
await page.evaluate(() => window.__app.startLevel(0, 1));
await page.waitForTimeout(2500);

// Select digger via keyboard and assign to walkers crossing above the exit.
const log = await page.evaluate(async () => {
  const scene = window.__scene;
  const game = scene.game;
  const canvas = document.getElementById('game');
  const rect = canvas.getBoundingClientRect();
  const sx = rect.width / canvas.width;
  const sy = rect.height / canvas.height;
  const camera = scene['camera'];

  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10' }));

  let assigned = 0;
  const start = performance.now();
  // Poll for ~12s, assigning diggers near the exit column (x≈150).
  while (performance.now() - start < 12000 && game.phase === 'running') {
    for (const lem of game.lemmings) {
      if (lem.state === 'walker' && lem.y < 110 && lem.x >= 146 && lem.x <= 158 && game.skills.digger > 0) {
        const screenX = (lem.x - camera.x) * sx + rect.left;
        const screenY = (lem.y - camera.y) * sy + rect.top;
        canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: screenX, clientY: screenY, bubbles: true }));
        canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: screenX, clientY: screenY, bubbles: true }));
        assigned++;
      }
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  return { assigned, phase: game.phase, saved: game.saved, dead: game.dead, out: game.out };
});

await page.screenshot({ path: out });
// Wait for the level to resolve into the results scene.
await page.waitForTimeout(8000);
const finalState = await page.evaluate(() => {
  const s = window.__scene;
  return { sceneName: s.constructor.name };
});
await page.screenshot({ path: out.replace('.png', '-final.png') });
await browser.close();

console.log('playtest:', JSON.stringify(log));
console.log('final:', JSON.stringify(finalState));
if (errors.length) {
  console.error('PAGE ERRORS:\n' + errors.join('\n'));
  process.exitCode = 2;
}
