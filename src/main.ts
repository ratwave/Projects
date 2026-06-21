import { GameLoop } from './engine/loop';
import { SCREEN_W, SCREEN_H, VIEW_W, VIEW_H } from './engine/constants';
import { buildLevel } from './engine/level';
import { Camera } from './engine/camera';
import { TerrainView } from './render/terrainView';
import { TEST_LEVEL } from './levels/testLevel';

/**
 * Phase 1 visual harness: builds the test level, renders its terrain through a
 * scrolling camera. Replaced by the scene manager in later phases.
 */
function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = false;
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;

  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.style.display = 'none';

  const level = buildLevel(TEST_LEVEL);
  const camera = new Camera(level.terrain.width, level.terrain.height);
  const terrainView = new TerrainView(level.terrain);

  let scale = 1;
  function resize(): void {
    const scaleX = window.innerWidth / SCREEN_W;
    const scaleY = window.innerHeight / SCREEN_H;
    scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
    canvas.style.width = `${SCREEN_W * scale}px`;
    canvas.style.height = `${SCREEN_H * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  // Track cursor for edge scrolling.
  let mouseX = -1;
  let mouseY = -1;
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / scale;
    mouseY = (e.clientY - rect.top) / scale;
  });
  canvas.addEventListener('mouseleave', () => {
    mouseX = -1;
    mouseY = -1;
  });

  const update = (): void => {
    const edge = 12;
    if (mouseX >= 0 && mouseY >= 0 && mouseY < VIEW_H) {
      if (mouseX < edge) camera.scrollBy(-3, 0);
      else if (mouseX > VIEW_W - edge) camera.scrollBy(3, 0);
    }
  };

  const render = (): void => {
    // background
    ctx.fillStyle = TEST_LEVEL.bg ?? '#000';
    ctx.fillRect(0, 0, SCREEN_W, VIEW_H);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, VIEW_H, SCREEN_W, SCREEN_H - VIEW_H);

    // terrain
    terrainView.sync();
    ctx.drawImage(
      terrainView.source,
      camera.x,
      camera.y,
      VIEW_W,
      VIEW_H,
      0,
      0,
      VIEW_W,
      VIEW_H,
    );

    // object markers (placeholder until sprites exist)
    for (const e of level.entrances) {
      ctx.fillStyle = '#88aaff';
      ctx.fillRect(e.x - camera.x - 6, e.y - camera.y, 12, 4);
    }
    for (const ex of level.exits) {
      ctx.fillStyle = '#ffd400';
      ctx.fillRect(ex.x - camera.x - 6, ex.y - camera.y - 12, 12, 12);
    }

    // panel placeholder
    ctx.fillStyle = '#202830';
    ctx.fillRect(0, VIEW_H, SCREEN_W, SCREEN_H - VIEW_H);
    ctx.fillStyle = '#00ff66';
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText(`${TEST_LEVEL.name}  cam:${camera.x}`, 4, VIEW_H + 4);
  };

  const loop = new GameLoop(update, render);
  loop.start();
}

boot();
