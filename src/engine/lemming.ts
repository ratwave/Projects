import { LemState, Skill } from './types';

let nextId = 1;

/**
 * A single lemming.
 *
 * Position convention:
 *  - `x` is the lemming's collision column (centre of the body).
 *  - `y` is the lemming's FEET pixel = the lowest body pixel.
 *  - The body occupies rows [y - (LEM_HEIGHT-1) .. y], centred on `x`.
 *  - "Ground" is tested at (x, y+1): solid there ⇒ the lemming is supported.
 */
export class Lemming {
  readonly id: number;
  x: number;
  y: number;
  /** Facing/movement direction: -1 = left, +1 = right. */
  dir: number;
  state: LemState;

  /** Animation frame counter (ticks since entering current state). */
  frame = 0;

  /** Permanent abilities. */
  climber = false;
  floater = false;

  /** Distance fallen so far (for splat detection). */
  fallDistance = 0;

  /** Builder bricks remaining. */
  bricksLeft = 0;

  /** Bomber countdown in ticks (>0 means ticking); -1 = none. */
  bombTicks = -1;

  /** Per-state work counter (e.g. ticks within a stroke). */
  work = 0;

  /** Sub-step accumulator used by skills that act every N ticks. */
  subTick = 0;

  /** True once removed from the simulation. */
  removed = false;

  /** Reason the lemming left the level (for stats). */
  outcome: 'saved' | 'dead' | null = null;

  /** Floater brolly deployment timer. */
  floatDeploy = 0;

  constructor(x: number, y: number, dir = 1, state: LemState = LemState.Faller) {
    this.id = nextId++;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.state = state;
  }

  /** Switch to a new state, resetting per-state counters. */
  setState(state: LemState): void {
    this.state = state;
    this.frame = 0;
    this.work = 0;
    this.subTick = 0;
  }

  /** Does this lemming currently have the given permanent ability? */
  hasAbility(skill: Skill): boolean {
    if (skill === Skill.Climber) return this.climber;
    if (skill === Skill.Floater) return this.floater;
    return false;
  }
}

/** Reset the global id counter (used by deterministic tests). */
export function resetLemmingIds(): void {
  nextId = 1;
}
