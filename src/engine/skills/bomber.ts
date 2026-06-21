import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { BOMB_RADIUS } from '../constants';

/**
 * Advance the bomb countdown. The lemming keeps its current behaviour while the
 * fuse burns; when it reaches zero it transitions to the Exploder state.
 * Returns true if the lemming transitioned (caller should skip normal update).
 */
export function tickBomb(lem: Lemming, _ctx: SimContext): boolean {
  if (lem.bombTicks > 0) {
    lem.bombTicks--;
    if (lem.bombTicks === 0) {
      lem.setState(LemState.Exploder);
      return true;
    }
  }
  return false;
}

/** Brief "oh no!" pose used by the nuke cascade before exploding. */
export function updateOhnoer(lem: Lemming, _ctx: SimContext): void {
  lem.frame++;
  if (lem.frame >= 8) lem.setState(LemState.Exploder);
}

/** The explosion: carve a crater of permeable terrain and remove the lemming. */
export function updateExploder(lem: Lemming, ctx: SimContext): void {
  if (lem.frame === 0) {
    ctx.terrain.clearCircle(lem.x, lem.y - 3, BOMB_RADIUS);
    ctx.emit('explode');
  }
  lem.frame++;
  if (lem.frame >= 4) {
    lem.outcome = 'dead';
    lem.removed = true;
  }
}
