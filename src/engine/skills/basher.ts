import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { BASH_STROKE, BASH_HEIGHT, BASH_TICKS_PER_STROKE } from '../constants';
import { hasGround } from '../collision';

/**
 * Basher: tunnels horizontally in the facing direction. Stops and turns at steel
 * or a wrong-way one-way wall; becomes a walker when it breaks through to air.
 */
export function updateBasher(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;
  lem.subTick++;
  if (lem.subTick < BASH_TICKS_PER_STROKE) return;
  lem.subTick = 0;

  const dir = lem.dir;
  const top = lem.y - BASH_HEIGHT + 1;

  // Look a few pixels ahead for a wall (the walker often stops 1-2px short).
  const LOOKAHEAD = 4;
  let wallDist = -1;
  for (let s = 1; s <= LOOKAHEAD; s++) {
    for (let y = top; y <= lem.y; y++) {
      if (t.isSolid(lem.x + dir * s, y)) {
        wallDist = s;
        break;
      }
    }
    if (wallDist >= 0) break;
  }

  // Nothing ahead to bash — broken through to open air.
  if (wallDist < 0) {
    lem.setState(LemState.Walker);
    return;
  }

  // Steel / one-way at the wall column stops the basher.
  const checkX = lem.x + dir * wallDist;
  for (let y = top; y <= lem.y; y++) {
    if (t.isSolid(checkX, y) && (t.isSteel(checkX, y) || onewayBlocks(t, checkX, y, dir))) {
      lem.dir = -lem.dir;
      lem.setState(LemState.Walker);
      return;
    }
  }

  // Carve a stroke: a rectangle in front spanning the body height.
  for (let s = 1; s <= BASH_STROKE; s++) {
    const x = lem.x + dir * s;
    for (let y = top; y <= lem.y; y++) {
      t.clearPixel(x, y);
    }
  }
  lem.x += dir * BASH_STROKE;

  // If after advancing there's no floor, start falling.
  if (!hasGround(t, lem.x, lem.y)) {
    lem.fallDistance = 0;
    lem.setState(LemState.Faller);
  }
}

function onewayBlocks(
  t: { onewayAt(x: number, y: number): number },
  x: number,
  y: number,
  dir: number,
): boolean {
  const ow = t.onewayAt(x, y);
  return ow !== 0 && ow !== dir;
}
