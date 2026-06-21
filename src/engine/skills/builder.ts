import type { SimContext } from '../game';
import { Lemming } from '../lemming';
import { LemState } from '../types';
import {
  BUILDER_BRICKS,
  BUILDER_BRICK_W,
  BUILDER_STEP_FWD,
  BUILDER_STEP_UP,
  BUILDER_TICKS_PER_BRICK,
  BUILDER_WARN_BRICK,
  LEM_HEIGHT,
} from '../constants';
import { getTexture } from '../../render/textures';
import { bodyBlocked } from '../collision';

const brickTex = getTexture('brick');

/**
 * Builder: lays a 12-brick stairway diagonally upward in the facing direction.
 * Stops early if it bonks its head, hits an obstacle, or runs out of bricks.
 */
export function updateBuilder(lem: Lemming, ctx: SimContext): void {
  const t = ctx.terrain;

  // Initialise the brick supply on the first tick in this state.
  if (lem.frame === 0 && lem.bricksLeft === 0) {
    lem.bricksLeft = BUILDER_BRICKS;
  }
  lem.frame++;
  lem.subTick++;
  if (lem.subTick < BUILDER_TICKS_PER_BRICK) return;
  lem.subTick = 0;

  if (lem.bricksLeft <= 0) {
    lem.setState(LemState.Shrugger);
    return;
  }

  // Lay one brick at the current feet row, extending forward.
  for (let i = 0; i < BUILDER_BRICK_W; i++) {
    const bx = lem.x + lem.dir * i;
    const [r, g, b] = brickTex(bx, lem.y);
    t.setPixel(bx, lem.y, r, g, b, 255);
  }

  lem.bricksLeft--;
  if (lem.bricksLeft + 1 <= BUILDER_BRICKS - BUILDER_WARN_BRICK + 1 && lem.bricksLeft < 3) {
    ctx.emit('build-warn');
  } else {
    ctx.emit('build-step');
  }

  // Step up and forward onto the brick just laid.
  const nx = lem.x + lem.dir * BUILDER_STEP_FWD;
  const ny = lem.y - BUILDER_STEP_UP;

  // Head bonk: solid where the head would be at the new position.
  if (t.isSolid(nx, ny - LEM_HEIGHT + 1) || t.isSolid(lem.x, lem.y - LEM_HEIGHT)) {
    lem.dir = -lem.dir;
    lem.setState(LemState.Walker);
    return;
  }

  // Obstacle directly ahead (wall): stop building and turn.
  if (bodyBlocked(t, nx, ny)) {
    lem.dir = -lem.dir;
    lem.setState(LemState.Walker);
    return;
  }

  lem.x = nx;
  lem.y = ny;

  if (lem.bricksLeft <= 0) {
    lem.setState(LemState.Shrugger);
  }
}

/** Shrugger: brief pause after the last brick, then resume walking. */
export function updateShrugger(lem: Lemming, _ctx: SimContext): void {
  lem.frame++;
  if (lem.frame >= 8) {
    lem.setState(LemState.Walker);
  }
}
