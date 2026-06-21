import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { CLIMB_RISE, CLIMB_TICKS, LEM_HEIGHT } from '../constants';

/**
 * Climber: scales the vertical wall on its facing side. Mantles onto the ledge
 * at the top; turns around and falls if it bonks an overhang/ceiling.
 */
export function updateClimber(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;

  const wallX = lem.x + lem.dir;
  const headY = lem.y - LEM_HEIGHT; // pixel just above the top of the body

  // Overhang above the head: can't go up — peel off and fall backwards.
  if (t.isSolid(lem.x, headY)) {
    lem.dir = -lem.dir;
    lem.x += lem.dir;
    lem.fallDistance = 0;
    lem.setState(LemState.Faller);
    return;
  }

  // Reached the top of the wall (no wall beside the upper body): mantle over.
  if (!t.isSolid(wallX, lem.y - LEM_HEIGHT + 1)) {
    lem.setState(LemState.ClimberTop);
    return;
  }

  lem.subTick++;
  if (lem.subTick >= CLIMB_TICKS) {
    lem.subTick = 0;
    lem.y -= CLIMB_RISE;
  }
}

/** Mantling over the lip of a wall, then resuming as a walker on top. */
export function updateClimberTop(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;
  // Rise until the feet clear the ledge, then step forward onto it.
  lem.y -= 1;
  if (lem.frame >= 3) {
    lem.x += lem.dir;
    // Settle onto the ledge surface.
    if (!t.isSolid(lem.x, lem.y + 1)) {
      // find ground just below
      for (let k = 0; k <= 4; k++) {
        if (t.isSolid(lem.x, lem.y + 1 + k)) {
          lem.y += k;
          break;
        }
      }
    }
    lem.setState(LemState.Walker);
  }
}
