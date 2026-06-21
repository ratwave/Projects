/**
 * Central tunable constants for the simulation.
 *
 * Values are chosen to faithfully match documented behaviour of the original
 * DOS Lemmings (see research notes). All gameplay is measured in "ticks"
 * (logic steps), not wall-clock time, except the level countdown timer.
 */

/** Milliseconds per logic tick. Original time unit ~= 60ms (~16.67 ticks/sec). */
export const TICK_MS = 60;

/** Logical terrain block size used for steel masks & object trigger alignment. */
export const BLOCK = 4;

/** Internal play-field resolution (homage to the original ~320x160 play area). */
export const VIEW_W = 320;
/** Height of the scrollable play viewport (the level view, excluding the panel). */
export const VIEW_H = 160;
/** Height of the bottom control panel. */
export const PANEL_H = 40;
/** Total internal canvas height. */
export const SCREEN_H = VIEW_H + PANEL_H;
export const SCREEN_W = VIEW_W;

/** Release rate bounds. */
export const RR_MIN = 1;
export const RR_MAX = 99;

/**
 * Frames (ticks) between consecutive lemming releases for a given release rate.
 * Faithful DOS formula: floor((99 - RR) / 2) + 4.
 */
export function releaseInterval(releaseRate: number): number {
  const rr = Math.max(RR_MIN, Math.min(RR_MAX, releaseRate));
  return Math.floor((99 - rr) / 2) + 4;
}

/* ----------------------------- Movement / gravity ----------------------------- */

/** Horizontal walking speed in pixels per tick. */
export const WALK_SPEED = 2;

/** Max height (px) of a step a walker can climb before reversing. */
export const MAX_STEP_UP = 7;

/** On the first tick of a fall the pin may drop up to this many px. */
export const FALL_FIRST_STEP = 4;

/** Subsequent fall speed in px per tick. */
export const FALL_SPEED = 2;

/** Floater descent speed in px per tick (slower than a normal faller). */
export const FLOAT_SPEED = 1;
/** Ticks the floater takes to deploy the brolly before slowing. */
export const FLOAT_DEPLOY_TICKS = 8;

/**
 * Maximum survivable fall distance in pixels. A fall strictly greater than this
 * results in a splat death (unless the lemming is a floater). DOS value ~= 60.
 */
export const MAX_FALL = 60;

/* ----------------------------- Climber ----------------------------- */

/** Climber rises this many px per this many ticks (avg ~1px / 2 ticks). */
export const CLIMB_RISE = 1;
export const CLIMB_TICKS = 2;

/* ----------------------------- Builder ----------------------------- */

/** Number of bricks a builder lays before shrugging. */
export const BUILDER_BRICKS = 12;
/** Each brick step rises this many px and advances this many px. */
export const BUILDER_STEP_UP = 1;
export const BUILDER_STEP_FWD = 2;
/** Width of each laid brick in px. */
export const BUILDER_BRICK_W = 6;
/** Ticks spent laying each brick (animation pacing). */
export const BUILDER_TICKS_PER_BRICK = 9;
/** Brick number (1-based) from which the "running out" warning sound plays. */
export const BUILDER_WARN_BRICK = 10;

/* ----------------------------- Basher ----------------------------- */

/** Pixels carved forward per bash stroke. */
export const BASH_STROKE = 5;
/** Vertical extent (px) of the bashed tunnel, centred on the lemming body. */
export const BASH_HEIGHT = 10;
/** Ticks per bash stroke. */
export const BASH_TICKS_PER_STROKE = 8;

/* ----------------------------- Miner ----------------------------- */

/** Per mining stroke the miner advances this many px horizontally / vertically. */
export const MINE_FWD = 2;
export const MINE_DOWN = 2;
export const MINE_TICKS_PER_STROKE = 8;

/* ----------------------------- Digger ----------------------------- */

/** Pixels dug downward per digging stroke. */
export const DIG_DEPTH = 2;
/** Ticks per dig stroke. */
export const DIG_TICKS_PER_STROKE = 8;

/* ----------------------------- Bomber ----------------------------- */

/** Countdown shown above a bomber, in seconds. */
export const BOMB_COUNTDOWN_SEC = 5;
/** Radius (px) of the explosion crater. */
export const BOMB_RADIUS = 9;

/* ----------------------------- Blocker ----------------------------- */

/** Half-width (px) on each side within which a blocker reverses walkers. */
export const BLOCKER_REACH = 4;

/* ----------------------------- Lemming body ----------------------------- */

/** Lemming sprite height (px). */
export const LEM_HEIGHT = 10;
/** Lemming sprite width (px). */
export const LEM_WIDTH = 8;

/** Default seed for the deterministic RNG (trap timing/anim jitter). */
export const DEFAULT_SEED = 0x1234abcd;
