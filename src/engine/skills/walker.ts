import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { WALK_SPEED, MAX_STEP_UP } from '../constants';
import { hasGround, riseAt, dropTo } from '../collision';
import { checkObjects } from '../objects';

/**
 * Walker: advances in the facing direction, stepping up shallow slopes, turning
 * at walls (or climbing if a Climber), walking down small drops, and becoming a
 * Faller over larger gaps.
 */
export function updateWalker(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  const g = ctx.game;
  lem.frame++;

  // Repelled by a nearby blocker: face away from it.
  const repel = g.blockerRepel(lem.x, lem.y);
  if (repel !== 0 && repel !== lem.dir) {
    lem.dir = repel;
  }

  for (let step = 0; step < WALK_SPEED; step++) {
    const nx = lem.x + lem.dir;

    if (t.isSolid(nx, lem.y)) {
      // Something at feet level — try to climb the slope.
      const rise = riseAt(t, nx, lem.y, MAX_STEP_UP + 1);
      if (rise > MAX_STEP_UP) {
        // Too tall: a wall.
        if (lem.climber) {
          lem.setState(LemState.Climber);
          return;
        }
        lem.dir = -lem.dir;
        break;
      }
      lem.x = nx;
      lem.y -= rise;
    } else {
      lem.x = nx;
      if (!hasGround(t, lem.x, lem.y)) {
        const drop = dropTo(t, lem.x, lem.y, 4);
        if (drop >= 0) {
          lem.y += drop;
        } else {
          lem.fallDistance = 0;
          lem.setState(LemState.Faller);
          checkObjects(lem, ctx);
          return;
        }
      }
    }
  }

  checkObjects(lem, ctx);
}
