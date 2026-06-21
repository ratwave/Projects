import type { SimContext } from '../game';
import { Lemming } from '../lemming';

/** Frames a death animation plays before the lemming is removed. */
const SPLAT_TICKS = 16;
const DROWN_TICKS = 16;
const BURN_TICKS = 16;

export function updateSplatter(lem: Lemming, _ctx: SimContext): void {
  lem.frame++;
  if (lem.frame >= SPLAT_TICKS) {
    lem.outcome = 'dead';
    lem.removed = true;
  }
}

export function updateDrowner(lem: Lemming, _ctx: SimContext): void {
  lem.frame++;
  if (lem.frame >= DROWN_TICKS) {
    lem.outcome = 'dead';
    lem.removed = true;
  }
}

export function updateBurner(lem: Lemming, _ctx: SimContext): void {
  lem.frame++;
  if (lem.frame >= BURN_TICKS) {
    lem.outcome = 'dead';
    lem.removed = true;
  }
}
