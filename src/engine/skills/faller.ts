import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import { FALL_FIRST_STEP, FALL_SPEED, FLOAT_SPEED, FLOAT_DEPLOY_TICKS, MAX_FALL } from '../constants';
import { hasGround } from '../collision';
import { checkObjects } from '../objects';

/** Faller: drops under gravity, splatting if the total fall exceeds MAX_FALL. */
export function updateFaller(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;

  if (lem.floater) {
    lem.setState(LemState.Floater);
    lem.floatDeploy = 0;
    updateFloater(lem, ctx);
    return;
  }

  const steps = lem.fallDistance === 0 ? FALL_FIRST_STEP : FALL_SPEED;
  for (let i = 0; i < steps; i++) {
    if (hasGround(t, lem.x, lem.y)) {
      land(lem);
      return;
    }
    lem.y++;
    lem.fallDistance++;
  }
  if (checkObjects(lem, ctx)) return;
}

function land(lem: Lemming): void {
  if (lem.fallDistance > MAX_FALL && !lem.floater) {
    lem.setState(LemState.Splatter);
  } else {
    lem.setState(LemState.Walker);
  }
}

/** Floater: deploys a brolly and descends slowly, never splatting. */
export function updateFloater(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;
  lem.frame++;
  lem.floatDeploy++;

  // During deployment it still falls at full speed for a couple of ticks.
  const speed = lem.floatDeploy <= FLOAT_DEPLOY_TICKS ? FALL_SPEED : FLOAT_SPEED;
  for (let i = 0; i < speed; i++) {
    if (hasGround(t, lem.x, lem.y)) {
      lem.setState(LemState.Walker);
      lem.fallDistance = 0;
      return;
    }
    lem.y++;
  }
  if (checkObjects(lem, ctx)) return;
}
