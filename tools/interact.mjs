// Deterministic UI interaction test: select a skill via the panel and click a
// lemming through the real input path, then verify its state changed.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const out = process.argv[3] ?? '/tmp/interact.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(url, { waitUntil: 'load' });
// Wait until some lemmings have landed and are walking.
await page.waitForTimeout(4000);

const result = await page.evaluate(async () => {
  const scene = window.__scene;
  const game = scene.game;
  const canvas = document.getElementById('game');
  const rect = canvas.getBoundingClientRect();
  const sx = rect.width / canvas.width;
  const sy = rect.height / canvas.height;

  // Find a walker on the ground.
  const cam = scene.camera ?? { x: 0, y: 0 };
  const walker = game.lemmings.find((l) => !l.removed && l.state === 'walker');
  if (!walker) return { ok: false, reason: 'no walker found', states: game.lemmings.map((l) => l.state) };

  // Compute the camera via the scene (private) — recenter on the walker first.
  // Use the panel to select Digger (F10), then click the walker.
  const before = walker.state;

  // Select digger via keyboard.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10' }));

  // Center camera on walker by clicking the minimap is complex; instead read camera.
  const camera = scene['camera'];
  const screenX = (walker.x - camera.x) * sx + rect.left;
  const screenY = (walker.y - camera.y) * sy + rect.top;

  canvas.dispatchEvent(
    new MouseEvent('mousemove', { clientX: screenX, clientY: screenY, bubbles: true }),
  );
  canvas.dispatchEvent(
    new MouseEvent('mousedown', { button: 0, clientX: screenX, clientY: screenY, bubbles: true }),
  );

  return { ok: true, before, id: walker.id, after: walker.state, x: walker.x, y: walker.y };
});

await page.waitForTimeout(800);

const after = await page.evaluate((id) => {
  const game = window.__scene.game;
  const lem = game.lemmings.find((l) => l.id === id);
  return lem ? { state: lem.state, removed: lem.removed } : { state: 'gone' };
}, result.id);

await page.screenshot({ path: out });
await browser.close();

console.log('interaction result:', JSON.stringify(result));
console.log('after 800ms:', JSON.stringify(after));
if (errors.length) {
  console.error('PAGE ERRORS:\n' + errors.join('\n'));
  process.exitCode = 2;
}
