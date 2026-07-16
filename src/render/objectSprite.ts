import type { LevelObject } from '../engine/types';

type Ctx = CanvasRenderingContext2D;

/**
 * Original object art drawn procedurally. Entrances are trapdoors, exits are
 * archways, water is an animated pool, traps are spiked devices.
 */
export function drawObject(ctx: Ctx, o: LevelObject, sx: number, sy: number, tick: number): void {
  switch (o.type) {
    case 'entrance':
      drawEntrance(ctx, sx, sy, tick);
      break;
    case 'exit':
      drawExit(ctx, sx, sy, tick);
      break;
    case 'water':
      drawWater(ctx, sx, sy, o.w ?? 32, o.h ?? 12, tick);
      break;
    case 'trap':
      drawTrap(ctx, sx, sy, tick, (o.cooldown ?? 0) > 0);
      break;
  }
}

function drawEntrance(ctx: Ctx, x: number, y: number, _tick: number): void {
  // A round-topped hatch the lemmings drop from.
  ctx.fillStyle = '#7a5a2a';
  ctx.fillRect(x - 10, y - 6, 20, 6);
  ctx.fillStyle = '#9a7436';
  ctx.fillRect(x - 10, y - 8, 20, 2);
  ctx.fillStyle = '#3a2a14';
  ctx.fillRect(x - 6, y - 1, 12, 3); // opening
  ctx.fillStyle = '#caa050';
  ctx.beginPath();
  ctx.arc(x, y - 8, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#5a4420';
  ctx.fillRect(x - 1, y - 18, 2, 10); // pole
}

function drawExit(ctx: Ctx, x: number, y: number, tick: number): void {
  // An archway with a glowing portal and a little flag.
  ctx.fillStyle = '#3b2f6b';
  ctx.fillRect(x - 8, y - 16, 16, 16);
  ctx.fillStyle = '#15103a';
  ctx.fillRect(x - 5, y - 12, 10, 12); // dark doorway
  const glow = 0.5 + 0.5 * Math.sin(tick * 0.2);
  ctx.fillStyle = `rgba(120,200,255,${0.3 + glow * 0.4})`;
  ctx.fillRect(x - 4, y - 11, 8, 11);
  // top
  ctx.fillStyle = '#6a58b0';
  ctx.fillRect(x - 9, y - 18, 18, 3);
  ctx.fillStyle = '#ffd400';
  ctx.fillRect(x + 6, y - 24, 6, 4); // flag
  ctx.fillStyle = '#5a4420';
  ctx.fillRect(x + 5, y - 24, 1, 8);
}

function drawWater(ctx: Ctx, x: number, y: number, w: number, h: number, tick: number): void {
  ctx.fillStyle = '#1e6fb0';
  ctx.fillRect(x - w / 2, y, w, h);
  ctx.fillStyle = '#3a9fd8';
  for (let i = 0; i < w; i += 4) {
    const wave = Math.sin((i + tick * 2) * 0.3) * 1.5;
    ctx.fillRect(x - w / 2 + i, y + wave, 2, 1);
  }
}

function drawTrap(ctx: Ctx, x: number, y: number, tick: number, harmless: boolean): void {
  ctx.fillStyle = harmless ? '#555' : '#883030';
  ctx.fillRect(x - 6, y, 12, 8);
  // spikes
  ctx.fillStyle = harmless ? '#888' : '#c0c0c0';
  const up = harmless ? 0 : (tick % 8 < 4 ? 2 : 0);
  for (let i = -5; i <= 5; i += 2) {
    ctx.beginPath();
    ctx.moveTo(x + i, y - up);
    ctx.lineTo(x + i + 1, y - 3 - up);
    ctx.lineTo(x + i + 2, y - up);
    ctx.fill();
  }
}
