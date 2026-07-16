import { SCREEN_W, SCREEN_H } from '../engine/constants';

/** Convert a client (DOM) coordinate to internal canvas pixels. */
export function toInternal(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / canvas.width;
  const scaleY = rect.height / canvas.height;
  return { x: (clientX - rect.left) / scaleX, y: (clientY - rect.top) / scaleY };
}

export interface UiButton {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function hitButton(buttons: UiButton[], x: number, y: number): UiButton | null {
  for (const b of buttons) {
    if (b.disabled) continue;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

type Ctx = CanvasRenderingContext2D;

export function clearScreen(ctx: Ctx, color = '#05070f'): void {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
}

export function text(
  ctx: Ctx,
  str: string,
  x: number,
  y: number,
  opts: { size?: number; color?: string; align?: CanvasTextAlign } = {},
): void {
  ctx.font = `${opts.size ?? 8}px monospace`;
  ctx.fillStyle = opts.color ?? '#cfe';
  ctx.textAlign = opts.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

export function drawButton(ctx: Ctx, b: UiButton, highlight = false): void {
  ctx.fillStyle = b.disabled ? '#16161e' : highlight ? '#3a5a8a' : '#1d2740';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = b.disabled ? '#333' : '#6a86c0';
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
  text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, {
    align: 'center',
    color: b.disabled ? '#555' : '#dfe',
    size: 8,
  });
}
