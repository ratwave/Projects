import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { hasGround } from '../collision';

/**
 * Blocker: stands still and turns back approaching walkers (handled in the walker
 * via Game.blockerRepel). If the ground beneath it is removed it falls and
 * resumes walking.
 */
export function updateBlocker(lem: Lemming, ctx: SimContext): void {
  lem.frame++;
  if (!hasGround(ctx.terrain, lem.x, lem.y)) {
    lem.fallDistance = 0;
    lem.setState(LemState.Faller);
  }
}
