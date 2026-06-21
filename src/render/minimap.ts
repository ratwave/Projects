import { Game } from '../engine/game';
import { Camera } from '../engine/camera';
import { MINIMAP_X, MINIMAP_Y, MINIMAP_W, MINIMAP_H } from './panel';
import { VIEW_W, VIEW_H } from '../engine/constants';

type Ctx = CanvasRenderingContext2D;

/** Draw the micro-map: terrain silhouette, lemming dots, and viewport box. */
export function drawMinimap(ctx: Ctx, game: Game, camera: Camera): void {
  const t = game.level.terrain;
  const scaleX = MINIMAP_W / t.width;
  const scaleY = MINIMAP_H / t.height;

  ctx.fillStyle = '#05060a';
  ctx.fillRect(MINIMAP_X, MINIMAP_Y, MINIMAP_W, MINIMAP_H);

  // Terrain silhouette: sample a coarse grid for performance.
  ctx.fillStyle = '#2c7a2c';
  const stepX = Math.max(1, Math.floor(t.width / MINIMAP_W));
  const stepY = Math.max(1, Math.floor(t.height / MINIMAP_H));
  for (let y = 0; y < t.height; y += stepY) {
    for (let x = 0; x < t.width; x += stepX) {
      if (t.isSolidRaw(x, y)) {
        ctx.fillRect(MINIMAP_X + x * scaleX, MINIMAP_Y + y * scaleY, 1, 1);
      }
    }
  }

  // Lemmings as yellow dots.
  ctx.fillStyle = '#ffe000';
  for (const lem of game.lemmings) {
    if (lem.removed) continue;
    ctx.fillRect(MINIMAP_X + lem.x * scaleX, MINIMAP_Y + lem.y * scaleY, 1, 1);
  }

  // Viewport box.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    MINIMAP_X + camera.x * scaleX + 0.5,
    MINIMAP_Y + camera.y * scaleY + 0.5,
    VIEW_W * scaleX,
    VIEW_H * scaleY,
  );
}

/** Convert a click inside the minimap to a world coordinate (or null). */
export function minimapToWorld(
  game: Game,
  sx: number,
  sy: number,
): { x: number; y: number } | null {
  if (sx < MINIMAP_X || sx >= MINIMAP_X + MINIMAP_W) return null;
  if (sy < MINIMAP_Y || sy >= MINIMAP_Y + MINIMAP_H) return null;
  const t = game.level.terrain;
  const x = ((sx - MINIMAP_X) / MINIMAP_W) * t.width;
  const y = ((sy - MINIMAP_Y) / MINIMAP_H) * t.height;
  return { x, y };
}
