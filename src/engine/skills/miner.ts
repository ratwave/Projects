import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { MINE_FWD, MINE_DOWN, MINE_TICKS_PER_STROKE, BASH_HEIGHT } from '../constants';

/**
 * Miner: tunnels diagonally downward in the facing direction. Stops and turns at
 * steel or a wrong-way one-way wall.
 */
export function updateMiner(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;
  lem.subTick++;
  if (lem.subTick < MINE_TICKS_PER_STROKE) return;
  lem.subTick = 0;

  const dir = lem.dir;
  const checkX = lem.x + dir;

  // Steel / one-way check on the diagonal target.
  for (let y = lem.y; y <= lem.y + MINE_DOWN; y++) {
    if (t.isSolid(checkX, y) && (t.isSteel(checkX, y) || onewayBlocks(t, checkX, y, dir))) {
      lem.dir = -lem.dir;
      lem.setState(LemState.Walker);
      return;
    }
  }

  // Carve a diagonal chunk: a small block in front and below.
  const top = lem.y - BASH_HEIGHT + 1;
  for (let dx = 0; dx <= MINE_FWD + 1; dx++) {
    for (let yy = top + dx; yy <= lem.y + MINE_DOWN; yy++) {
      t.clearPixel(lem.x + dir * dx, yy);
    }
  }

  lem.x += dir * MINE_FWD;
  lem.y += MINE_DOWN;
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
