import type { SimContext } from './game';
import { Lemming } from './lemming';
import { LemState } from './types';
import { LEM_HEIGHT } from './constants';

/** Default trigger-area sizes per object type. */
function area(o: { type: string; w?: number; h?: number }): { w: number; h: number } {
  if (o.type === 'exit') return { w: o.w ?? 12, h: o.h ?? 14 };
  if (o.type === 'water') return { w: o.w ?? 32, h: o.h ?? 12 };
  if (o.type === 'trap') return { w: o.w ?? 12, h: o.h ?? 12 };
  return { w: o.w ?? 12, h: o.h ?? 12 };
}

function inTrigger(lem: Lemming, ox: number, oy: number, w: number, h: number): boolean {
  // Object x is the centre; y is the top of its trigger area.
  const lx = lem.x;
  const ly = lem.y; // feet
  const headY = lem.y - LEM_HEIGHT + 1;
  const left = ox - w / 2;
  const right = ox + w / 2;
  const top = oy;
  const bottom = oy + h;
  const horizOk = lx >= left && lx <= right;
  const vertOk = ly >= top && ly <= bottom + 2 ? true : headY <= bottom && ly >= top;
  return horizOk && vertOk;
}

/**
 * Check exits and hazards for a lemming after it has moved this tick.
 * Returns true if the lemming's state changed (so the caller can stop).
 */
export function checkObjects(lem: Lemming, ctx: SimContext): boolean {
  const { level, terrain } = ctx;

  // Fell off the bottom of the world.
  if (lem.y >= terrain.height + 4) {
    kill(lem);
    return true;
  }

  // Exits.
  for (const ex of level.exits) {
    const { w, h } = area(ex);
    if (inTrigger(lem, ex.x, ex.y, w, h)) {
      lem.setState(LemState.Exiter);
      ctx.emit('exit');
      return true;
    }
  }

  // Hazards (water = instant; trap = re-arming).
  for (const hz of level.hazards) {
    const { w, h } = area(hz);
    if (!inTrigger(lem, hz.x, hz.y, w, h)) continue;
    if (hz.type === 'water') {
      lem.setState(LemState.Drowner);
      ctx.emit('drown');
      return true;
    }
    if (hz.type === 'trap') {
      if ((hz.cooldown ?? 0) > 0) continue; // currently harmless
      hz.cooldown = hz.delay ?? 0;
      lem.setState(LemState.Burner);
      ctx.emit('trap');
      return true;
    }
  }

  return false;
}

/** Advance trap cooldowns once per tick. */
export function tickObjects(ctx: SimContext): void {
  for (const hz of ctx.level.hazards) {
    if (hz.type === 'trap' && (hz.cooldown ?? 0) > 0) hz.cooldown!--;
  }
}

function kill(lem: Lemming): void {
  lem.outcome = 'dead';
  lem.removed = true;
}
