import { Lemming } from '../engine/lemming';
import { LemState } from '../engine/types';
import { TICK_MS, BOMB_COUNTDOWN_SEC } from '../engine/constants';

/**
 * Original, procedurally-drawn lemming character. Each lemming is rendered every
 * frame from simple coloured rectangles, animated by its state + frame counter.
 * No external/bitmap assets — the look is our own (blue body, green tuft).
 */

const HAIR = '#27c93f';
const HAIR_DK = '#1c9c30';
const SKIN = '#f1c8a4';
const BODY = '#2d3ad6';
const BODY_DK = '#1f29a0';
const LIMB = '#2d3ad6';
const BROLLY = '#d83a3a';
const BROLLY_2 = '#f0f0f0';

type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, color: string, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

/**
 * Draw a lemming. (sx, sy) is the screen position of the lemming's FEET pixel.
 * The body is drawn upward from there.
 */
export function drawLemming(ctx: Ctx, lem: Lemming, sx: number, sy: number): void {
  const d = lem.dir; // facing
  const f = lem.frame;

  switch (lem.state) {
    case LemState.Walker:
    case LemState.Shrugger:
      drawWalker(ctx, sx, sy, d, f, lem.state === LemState.Shrugger);
      break;
    case LemState.Faller:
      drawFaller(ctx, sx, sy, d, f);
      break;
    case LemState.Floater:
      drawFloater(ctx, sx, sy, d, f);
      break;
    case LemState.Climber:
    case LemState.ClimberTop:
      drawClimber(ctx, sx, sy, d, f);
      break;
    case LemState.Blocker:
      drawBlocker(ctx, sx, sy, f);
      break;
    case LemState.Builder:
      drawBuilder(ctx, sx, sy, d, f);
      break;
    case LemState.Basher:
      drawBasher(ctx, sx, sy, d, f);
      break;
    case LemState.Miner:
      drawMiner(ctx, sx, sy, d, f);
      break;
    case LemState.Digger:
      drawDigger(ctx, sx, sy, d, f);
      break;
    case LemState.Splatter:
      drawSplat(ctx, sx, sy, f);
      break;
    case LemState.Drowner:
      drawDrown(ctx, sx, sy, f);
      break;
    case LemState.Burner:
      drawBurn(ctx, sx, sy, f);
      break;
    case LemState.Exiter:
      drawExit(ctx, sx, sy, f);
      break;
    case LemState.Ohnoer:
      drawOhno(ctx, sx, sy, f);
      break;
    case LemState.Exploder:
      drawExplode(ctx, sx, sy, f);
      break;
    default:
      drawWalker(ctx, sx, sy, d, f, false);
  }

  // Bomb countdown digit above the head.
  if (lem.bombTicks > 0) {
    const secs = Math.ceil((lem.bombTicks * TICK_MS) / 1000);
    if (secs <= BOMB_COUNTDOWN_SEC) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(String(secs), sx, sy - 12);
      ctx.textAlign = 'left';
    }
  }
}

/** Common head + hair at the given top y, centred on cx. */
function head(ctx: Ctx, cx: number, topY: number, d: number): void {
  px(ctx, HAIR_DK, cx - 2, topY, 4, 1);
  px(ctx, HAIR, cx - 2, topY, 3, 1);
  px(ctx, SKIN, cx - 1, topY + 1, 3, 2);
  // eye hint
  px(ctx, '#103', cx + (d > 0 ? 1 : -1), topY + 1, 1, 1);
  // hair tuft at back
  px(ctx, HAIR, cx - 2 * d, topY + 1, 1, 1);
}

function torso(ctx: Ctx, cx: number, topY: number): void {
  px(ctx, BODY, cx - 2, topY, 4, 4);
  px(ctx, BODY_DK, cx - 2, topY + 3, 4, 1);
}

function drawWalker(ctx: Ctx, sx: number, sy: number, d: number, f: number, shrug: boolean): void {
  head(ctx, sx, sy - 9, d);
  torso(ctx, sx, sy - 6);
  const phase = (f >> 1) % 4;
  // legs
  if (phase === 0 || phase === 2) {
    px(ctx, LIMB, sx - 2, sy - 2, 2, 2);
    px(ctx, LIMB, sx + 1, sy - 2, 1, 2);
  } else if (phase === 1) {
    px(ctx, LIMB, sx - 1, sy - 2, 2, 2);
    px(ctx, LIMB, sx + 1 + d, sy - 1, 1, 1);
  } else {
    px(ctx, LIMB, sx - 2 + d, sy - 1, 1, 1);
    px(ctx, LIMB, sx, sy - 2, 2, 2);
  }
  // arm swing
  if (shrug) {
    px(ctx, LIMB, sx - 3, sy - 6, 1, 1);
    px(ctx, LIMB, sx + 2, sy - 6, 1, 1);
  } else {
    px(ctx, LIMB, sx + d * 2, sy - 5 + (phase & 1), 1, 2);
  }
}

function drawFaller(ctx: Ctx, sx: number, sy: number, d: number, f: number): void {
  head(ctx, sx, sy - 9, d);
  torso(ctx, sx, sy - 6);
  // arms up, legs splayed
  const w = (f & 1) ? 1 : 0;
  px(ctx, LIMB, sx - 3 - w, sy - 7, 1, 2);
  px(ctx, LIMB, sx + 2 + w, sy - 7, 1, 2);
  px(ctx, LIMB, sx - 2, sy - 2, 1, 2);
  px(ctx, LIMB, sx + 1, sy - 2, 1, 2);
}

function drawFloater(ctx: Ctx, sx: number, sy: number, d: number, _f: number): void {
  // umbrella
  px(ctx, BROLLY, sx - 5, sy - 14, 10, 1);
  px(ctx, BROLLY, sx - 4, sy - 15, 8, 1);
  px(ctx, BROLLY_2, sx - 2, sy - 15, 1, 1);
  px(ctx, '#999', sx, sy - 14, 1, 5); // pole
  head(ctx, sx, sy - 9, d);
  torso(ctx, sx, sy - 6);
  px(ctx, LIMB, sx - 2, sy - 2, 1, 2);
  px(ctx, LIMB, sx + 1, sy - 2, 1, 2);
}

function drawClimber(ctx: Ctx, sx: number, sy: number, d: number, f: number): void {
  // hugging the wall on facing side
  head(ctx, sx, sy - 9, d);
  torso(ctx, sx, sy - 6);
  const up = (f >> 1) & 1;
  px(ctx, LIMB, sx + d * 2, sy - 8 - up, 1, 2); // upper arm reaching
  px(ctx, LIMB, sx + d * 2, sy - 4 + up, 1, 2); // leg
}

function drawBlocker(ctx: Ctx, sx: number, sy: number, _f: number): void {
  head(ctx, sx, sy - 9, 1);
  torso(ctx, sx, sy - 6);
  // arms straight out both sides
  px(ctx, LIMB, sx - 4, sy - 6, 2, 1);
  px(ctx, LIMB, sx + 2, sy - 6, 2, 1);
  px(ctx, LIMB, sx - 2, sy - 2, 1, 2);
  px(ctx, LIMB, sx + 1, sy - 2, 1, 2);
}

function drawBuilder(ctx: Ctx, sx: number, sy: number, d: number, f: number): void {
  // crouched, placing a brick forward
  head(ctx, sx, sy - 8, d);
  torso(ctx, sx, sy - 5);
  const reach = (f >> 2) & 1;
  px(ctx, LIMB, sx + d * (2 + reach), sy - 4, 2, 1); // arm forward
  px(ctx, '#b04a3a', sx + d * 3, sy - 1, 3, 1); // brick hint
  px(ctx, LIMB, sx - 1, sy - 2, 2, 2);
}

function drawBasher(ctx: Ctx, sx: number, sy: number, d: number, f: number): void {
  head(ctx, sx, sy - 9, d);
  torso(ctx, sx, sy - 6);
  const punch = (f >> 1) & 1;
  px(ctx, LIMB, sx + d * (2 + punch), sy - 5, 2, 2); // fists forward
  px(ctx, LIMB, sx - 2, sy - 2, 1, 2);
  px(ctx, LIMB, sx + 1, sy - 2, 1, 2);
}

function drawMiner(ctx: Ctx, sx: number, sy: number, d: number, f: number): void {
  head(ctx, sx, sy - 8, d);
  torso(ctx, sx, sy - 5);
  const swing = (f >> 1) & 1;
  px(ctx, '#bbb', sx + d * (2 + swing), sy - 4 + swing, 2, 2); // pick
  px(ctx, LIMB, sx - 1, sy - 2, 2, 2);
}

function drawDigger(ctx: Ctx, sx: number, sy: number, d: number, f: number): void {
  head(ctx, sx, sy - 8, d);
  torso(ctx, sx, sy - 5);
  const dig = (f >> 1) & 1;
  px(ctx, LIMB, sx - 3, sy - 3 + dig, 2, 1);
  px(ctx, LIMB, sx + 2, sy - 3 + dig, 2, 1);
  px(ctx, LIMB, sx - 1, sy - 2, 2, 1);
}

function drawSplat(ctx: Ctx, sx: number, sy: number, f: number): void {
  const spread = Math.min(5, 2 + (f >> 1));
  px(ctx, BODY, sx - spread, sy - 1, spread * 2, 1);
  px(ctx, HAIR, sx - spread, sy - 2, 2, 1);
  px(ctx, SKIN, sx + spread - 2, sy - 2, 2, 1);
}

function drawDrown(ctx: Ctx, sx: number, sy: number, f: number): void {
  const sink = Math.min(4, f >> 1);
  head(ctx, sx, sy - 6 + sink, 1);
  px(ctx, LIMB, sx - 3, sy - 5 + sink, 2, 1);
  px(ctx, LIMB, sx + 2, sy - 5 + sink, 2, 1);
}

function drawBurn(ctx: Ctx, sx: number, sy: number, f: number): void {
  const colors = ['#ffec00', '#ff8a00', '#ff3b00'];
  px(ctx, colors[f % 3], sx - 2, sy - 8, 4, 8);
  px(ctx, '#fff', sx - 1, sy - 6, 1, 2);
}

function drawExit(ctx: Ctx, sx: number, sy: number, f: number): void {
  const shrink = f >> 1;
  head(ctx, sx, sy - 8 + shrink, 1);
  if (shrink < 3) torso(ctx, sx, sy - 5 + shrink);
}

function drawOhno(ctx: Ctx, sx: number, sy: number, d: number): void {
  head(ctx, sx, sy - 9, d);
  torso(ctx, sx, sy - 6);
  px(ctx, LIMB, sx - 3, sy - 8, 1, 2); // arms up in alarm
  px(ctx, LIMB, sx + 2, sy - 8, 1, 2);
}

function drawExplode(ctx: Ctx, sx: number, sy: number, f: number): void {
  const r = 3 + f * 2;
  ctx.fillStyle = f < 2 ? '#fff' : '#ff8a00';
  ctx.beginPath();
  ctx.arc(sx, sy - 4, r, 0, Math.PI * 2);
  ctx.fill();
}
