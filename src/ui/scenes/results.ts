import { App, Scene, LevelResult } from '../app';
import { SCREEN_W } from '../../engine/constants';
import { clearScreen, text, drawButton, hitButton, toInternal, UiButton } from '../canvasUI';
import { markComplete, nextLevel, makePassword } from '../progression';

/** Post-level tally: pass/fail, stats, password, and navigation. */
export class ResultsScene implements Scene {
  private buttons: UiButton[] = [];
  private listeners: Array<() => void> = [];
  private nextPos: { r: number; l: number } | null = null;

  constructor(
    private readonly app: App,
    private readonly r: number,
    private readonly l: number,
    private readonly result: LevelResult,
  ) {}

  start(): void {
    if (this.result.won) {
      markComplete(this.r, this.l);
      this.nextPos = nextLevel(this.r, this.l);
    }

    const cx = SCREEN_W / 2;
    this.buttons = [];
    if (this.result.won && this.nextPos) {
      this.buttons.push({
        x: cx - 50,
        y: 120,
        w: 100,
        h: 16,
        label: 'NEXT LEVEL',
        onClick: () => this.app.startLevel(this.nextPos!.r, this.nextPos!.l),
      });
    } else if (!this.result.won) {
      this.buttons.push({
        x: cx - 50,
        y: 120,
        w: 100,
        h: 16,
        label: 'TRY AGAIN',
        onClick: () => this.app.startLevel(this.r, this.l),
      });
    }
    this.buttons.push({
      x: cx - 50,
      y: 142,
      w: 100,
      h: 14,
      label: 'MAIN MENU',
      onClick: () => this.app.showMenu(),
    });

    const onClick = (e: MouseEvent) => {
      this.app.audio.resume();
      const p = toInternal(this.app.canvas, e.clientX, e.clientY);
      const b = hitButton(this.buttons, p.x, p.y);
      if (b) b.onClick();
    };
    this.app.canvas.addEventListener('click', onClick);
    this.listeners.push(() => this.app.canvas.removeEventListener('click', onClick));
    this.render();
  }

  stop(): void {
    for (const off of this.listeners) off();
    this.listeners = [];
  }

  private render(): void {
    const ctx = this.app.ctx;
    const res = this.result;
    clearScreen(ctx, res.won ? '#08210f' : '#21080a');

    text(ctx, res.won ? 'LEVEL COMPLETE!' : 'TRY AGAIN…', SCREEN_W / 2, 28, {
      align: 'center',
      color: res.won ? '#3cf06a' : '#f06a6a',
      size: 14,
    });

    const pct = Math.floor((res.saved / res.total) * 100);
    const reqPct = Math.floor((res.required / res.total) * 100);
    const lines = [
      `You rescued ${res.saved} of ${res.total} lemmings.`,
      `That's ${pct}%.  You needed ${reqPct}%.`,
    ];
    let y = 58;
    for (const ln of lines) {
      text(ctx, ln, SCREEN_W / 2, y, { align: 'center', color: '#cfe', size: 8 });
      y += 14;
    }

    if (res.won && this.nextPos) {
      text(ctx, `Next level password:`, SCREEN_W / 2, 92, {
        align: 'center',
        color: '#9ab',
        size: 7,
      });
      text(ctx, makePassword(this.nextPos.r, this.nextPos.l), SCREEN_W / 2, 104, {
        align: 'center',
        color: '#ffd400',
        size: 10,
      });
    } else if (res.won && !this.nextPos) {
      text(ctx, 'You have completed every level! 🎉', SCREEN_W / 2, 98, {
        align: 'center',
        color: '#ffd400',
        size: 8,
      });
    }

    for (const b of this.buttons) drawButton(ctx, b);
  }
}
