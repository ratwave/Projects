import { Game } from '../engine/game';
import { Skill } from '../engine/types';
import { VIEW_H, SCREEN_W, SCREEN_H } from '../engine/constants';

export type ButtonId =
  | 'rate-'
  | 'rate+'
  | Skill
  | 'pause'
  | 'nuke';

export interface PanelButton {
  id: ButtonId;
  x: number;
  y: number;
  w: number;
  h: number;
}

const ICON_W = 16;
const ICON_TOP = VIEW_H + 8; // below the 8px status line
const ICON_H = SCREEN_H - ICON_TOP;

/** Ordered button ids in the panel. */
export const BUTTONS: ButtonId[] = [
  'rate-',
  'rate+',
  Skill.Climber,
  Skill.Floater,
  Skill.Bomber,
  Skill.Blocker,
  Skill.Builder,
  Skill.Basher,
  Skill.Miner,
  Skill.Digger,
  'pause',
  'nuke',
];

/** Compute button rectangles. */
export function panelButtons(): PanelButton[] {
  return BUTTONS.map((id, i) => ({
    id,
    x: i * ICON_W,
    y: ICON_TOP,
    w: ICON_W,
    h: ICON_H,
  }));
}

/** X where the minimap region starts (right of the buttons). */
export const MINIMAP_X = BUTTONS.length * ICON_W;
export const MINIMAP_W = SCREEN_W - MINIMAP_X;
export const MINIMAP_Y = VIEW_H;
export const MINIMAP_H = SCREEN_H - VIEW_H;

type Ctx = CanvasRenderingContext2D;

/** Hit-test a screen coordinate against the panel buttons. */
export function buttonAt(sx: number, sy: number): ButtonId | null {
  if (sy < ICON_TOP) return null;
  for (const b of panelButtons()) {
    if (sx >= b.x && sx < b.x + b.w && sy >= b.y && sy < b.y + b.h) return b.id;
  }
  return null;
}

export function drawPanel(
  ctx: Ctx,
  game: Game,
  selected: Skill | null,
  paused: boolean,
): void {
  // panel background
  ctx.fillStyle = '#0c0c14';
  ctx.fillRect(0, VIEW_H, SCREEN_W, SCREEN_H - VIEW_H);

  for (const b of panelButtons()) {
    const isSel = b.id === selected || (b.id === 'pause' && paused);
    drawButton(ctx, game, b, isSel);
  }
}

function drawButton(ctx: Ctx, game: Game, b: PanelButton, selected: boolean): void {
  // cell
  ctx.fillStyle = selected ? '#3a5a8a' : '#1a1a26';
  ctx.fillRect(b.x + 1, b.y, b.w - 1, b.h);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

  // count / number row
  const cx = b.x + b.w / 2;
  const numY = b.y - 1;
  ctx.fillStyle = '#000';
  ctx.fillRect(b.x, b.y - 8, b.w, 8);

  ctx.font = '7px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  if (b.id === 'rate-') {
    ctx.fillStyle = '#7fd';
    ctx.fillText(String(game.initialReleaseRate), cx, numY);
  } else if (b.id === 'rate+') {
    ctx.fillStyle = '#7fd';
    ctx.fillText(String(game.releaseRate), cx, numY);
  } else if (b.id !== 'pause' && b.id !== 'nuke') {
    const n = game.skills[b.id as Skill];
    ctx.fillStyle = n > 0 ? '#ffd400' : '#555';
    ctx.fillText(n > 0 ? String(n) : '', cx, numY);
  }

  drawIcon(ctx, b);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function drawIcon(ctx: Ctx, b: PanelButton): void {
  const cx = Math.round(b.x + b.w / 2);
  const cy = Math.round(b.y + b.h / 2 + 2);
  ctx.fillStyle = '#cfe';
  ctx.strokeStyle = '#cfe';
  ctx.lineWidth = 1;
  const p = (x: number, y: number, w: number, h: number) => ctx.fillRect(cx + x, cy + y, w, h);

  switch (b.id) {
    case 'rate-':
      p(-4, -1, 8, 2);
      break;
    case 'rate+':
      p(-4, -1, 8, 2);
      p(-1, -4, 2, 8);
      break;
    case Skill.Climber:
      // up chevrons
      ctx.fillText('▲', cx, cy + 4);
      break;
    case Skill.Floater:
      p(-5, -3, 10, 1);
      p(-1, -3, 2, 6);
      break;
    case Skill.Bomber:
      ctx.beginPath();
      ctx.arc(cx, cy + 1, 4, 0, Math.PI * 2);
      ctx.fill();
      p(1, -6, 1, 3);
      break;
    case Skill.Blocker:
      p(-1, -6, 2, 12);
      p(-4, -1, 8, 2);
      break;
    case Skill.Builder:
      p(-5, 3, 4, 2);
      p(-1, 0, 4, 2);
      p(3, -3, 4, 2);
      break;
    case Skill.Basher:
      ctx.fillText('»', cx, cy + 4);
      break;
    case Skill.Miner:
      ctx.fillText('↘', cx, cy + 4);
      break;
    case Skill.Digger:
      ctx.fillText('▼', cx, cy + 4);
      break;
    case 'pause':
      p(-3, -4, 2, 8);
      p(1, -4, 2, 8);
      break;
    case 'nuke':
      ctx.fillStyle = '#f55';
      ctx.fillText('☢', cx, cy + 4);
      break;
  }
}
