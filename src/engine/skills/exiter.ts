import type { SimContext } from '../game';
import { Lemming } from '../lemming';

/** Frames the "entering the exit" animation plays before counting as saved. */
const EXIT_TICKS = 8;

export function updateExiter(lem: Lemming, _ctx: SimContext): void {
  lem.frame++;
  if (lem.frame >= EXIT_TICKS) {
    lem.outcome = 'saved';
    lem.removed = true;
  }
}
