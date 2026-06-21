import { SCREEN_W, SCREEN_H } from './engine/constants';
import { PlayScene } from './ui/scenes/play';
import { AudioEngine } from './audio/audio';
import { TEST_LEVEL } from './levels/testLevel';

/** Phase 5 harness: a fully playable single level (menu/flow added in Phase 6). */
function boot(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.imageSmoothingEnabled = false;
  canvas.width = SCREEN_W;
  canvas.height = SCREEN_H;

  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.style.display = 'none';

  function resize(): void {
    const scaleX = window.innerWidth / SCREEN_W;
    const scaleY = window.innerHeight / SCREEN_H;
    const scale = Math.max(1, Math.min(scaleX, scaleY));
    canvas.style.width = `${SCREEN_W * scale}px`;
    canvas.style.height = `${SCREEN_H * scale}px`;
  }
  window.addEventListener('resize', resize);
  resize();

  const audio = new AudioEngine();
  const scene = new PlayScene(canvas, ctx, TEST_LEVEL, audio, {
    onFinish: (won) => {
      console.log('level finished, won =', won);
    },
  });
  scene.start();
}

boot();
