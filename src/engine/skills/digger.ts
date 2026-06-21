import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { DIG_DEPTH, DIG_TICKS_PER_STROKE, LEM_WIDTH } from '../constants';

/**
 * Digger: tunnels straight down. Falls through when no terrain remains below;
 * stops (becomes a walker) if it reaches steel it cannot dig.
 */
export function updateDigger(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;
  lem.subTick++;
  if (lem.subTick < DIG_TICKS_PER_STROKE) return;
  lem.subTick = 0;

  const half = Math.floor(LEM_WIDTH / 2);

  // Steel directly below cannot be dug.
  let steelBelow = false;
  let anySolidBelow = false;
  for (let x = lem.x - half; x <= lem.x + half; x++) {
    if (t.isSolid(x, lem.y + 1)) {
      anySolidBelow = true;
      if (t.isSteel(x, lem.y + 1)) steelBelow = true;
    }
  }

  if (!anySolidBelow) {
    // Broke through to open space.
    lem.fallDistance = 0;
    lem.setState(LemState.Faller);
    return;
  }
  if (steelBelow) {
    lem.setState(LemState.Walker);
    return;
  }

  // Remove the slice(s) below and descend.
  for (let d = 1; d <= DIG_DEPTH; d++) {
    for (let x = lem.x - half; x <= lem.x + half; x++) {
      t.clearPixel(x, lem.y + d);
    }
  }
  lem.y += DIG_DEPTH;
}
