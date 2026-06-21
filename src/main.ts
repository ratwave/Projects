import { GameLoop } from './engine/loop';
import { SCREEN_W, SCREEN_H } from './engine/constants';

/**
 * Bootstrap entry point. For Phase 0 this just proves the canvas + fixed-timestep
 * loop are wired up. Scene management is added in later phases.
 */
function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;

  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.style.display = 'none';

  // Scale the canvas to fill the window while preserving aspect ratio & integer pixels.
  function resize(): void {
    const scaleX = window.innerWidth / SCREEN_W;
    const scaleY = window.innerHeight / SCREEN_H;
    const scale = Math.max(1, Math.floor(Math.min(scaleX, scaleY)));
    canvas.style.width = `${SCREEN_W * scale}px`;
    canvas.style.height = `${SCREEN_H * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  let tick = 0;
  const update = (): void => {
    tick++;
  };

  const render = (): void => {
    ctx.fillStyle = '#001018';
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    ctx.fillStyle = '#00ff66';
    ctx.font = '8px monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('LEMMINGS — WEB EDITION', 8, 8);
    ctx.fillText(`tick: ${tick}`, 8, 20);
    ctx.fillText('scaffolding online', 8, 32);
  };

  const loop = new GameLoop(update, render);
  loop.start();
}

boot();
