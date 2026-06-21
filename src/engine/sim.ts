import type { SimContext } from './game';
import { Lemming } from './lemming';
import { LemState } from './types';
import { updateWalker } from './skills/walker';
import { updateFaller, updateFloater } from './skills/faller';
import { updateSplatter, updateDrowner, updateBurner } from './skills/death';
import { updateExiter } from './skills/exiter';
import { tickBomb } from './skills/bomber';
import { updateBlocker } from './skills/blocker';
import { updateBuilder, updateShrugger } from './skills/builder';
import { updateBasher } from './skills/basher';
import { updateMiner } from './skills/miner';
import { updateDigger } from './skills/digger';
import { updateClimber, updateClimberTop } from './skills/climber';
import { updateOhnoer, updateExploder } from './skills/bomber';

export type StateHandler = (lem: Lemming, ctx: SimContext) => void;

const handlers: Partial<Record<LemState, StateHandler>> = {
  [LemState.Walker]: updateWalker,
  [LemState.Faller]: updateFaller,
  [LemState.Floater]: updateFloater,
  [LemState.Splatter]: updateSplatter,
  [LemState.Drowner]: updateDrowner,
  [LemState.Burner]: updateBurner,
  [LemState.Exiter]: updateExiter,
  [LemState.Blocker]: updateBlocker,
  [LemState.Builder]: updateBuilder,
  [LemState.Shrugger]: updateShrugger,
  [LemState.Basher]: updateBasher,
  [LemState.Miner]: updateMiner,
  [LemState.Digger]: updateDigger,
  [LemState.Climber]: updateClimber,
  [LemState.ClimberTop]: updateClimberTop,
  [LemState.Ohnoer]: updateOhnoer,
  [LemState.Exploder]: updateExploder,
};

/** Run one tick of a lemming's behaviour, handling the bomb countdown first. */
export function dispatch(lem: Lemming, ctx: SimContext): void {
  // The bomb countdown ticks regardless of state (except already exploding).
  if (lem.bombTicks >= 0 && lem.state !== LemState.Exploder && lem.state !== LemState.Ohnoer) {
    if (tickBomb(lem, ctx)) return; // exploded / transitioned this tick
  }

  const handler = handlers[lem.state];
  if (handler) handler(lem, ctx);
}
