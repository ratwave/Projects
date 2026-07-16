import { App, Scene } from '../app';
import { SCREEN_W, SCREEN_H, VIEW_H } from '../../engine/constants';
import { clearScreen, text, drawButton, hitButton, toInternal, UiButton } from '../canvasUI';
import { RATINGS, levelsInRating, ratingCount, isUnlocked, parsePassword, makePassword } from '../progression';
import { Lemming } from '../../engine/lemming';
import { LemState } from '../../engine/types';
import { drawLemming } from '../../render/lemmingSprite';

/** Main menu: choose a rating/level, start, enter a password, toggle audio. */
export class MenuScene implements Scene {
  private raf = 0;
  private tick = 0;
  private r = 0;
  private l = 0;
  private buttons: UiButton[] = [];
  private listeners: Array<() => void> = [];
  private parade: Lemming[] = [];

  constructor(private readonly app: App) {
    for (let i = 0; i < 8; i++) {
      const lem = new Lemming(20 + i * 36, VIEW_H - 6, 1, LemState.Walker);
      lem.frame = i * 3;
      this.parade.push(lem);
    }
  }

  start(): void {
    this.app.audio.setMusicTrack('menu');
    this.buildButtons();
    const onClick = (e: MouseEvent) => {
      this.app.audio.resume();
      const p = toInternal(this.app.canvas, e.clientX, e.clientY);
      const b = hitButton(this.buttons, p.x, p.y);
      if (b) b.onClick();
    };
    this.app.canvas.addEventListener('click', onClick);
    this.listeners.push(() => this.app.canvas.removeEventListener('click', onClick));
    this.loop();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    for (const off of this.listeners) off();
    this.listeners = [];
  }

  private buildButtons(): void {
    const cx = SCREEN_W / 2;
    this.buttons = [
      { x: cx - 70, y: 70, w: 20, h: 14, label: '<', onClick: () => this.changeRating(-1) },
      { x: cx + 50, y: 70, w: 20, h: 14, label: '>', onClick: () => this.changeRating(+1) },
      { x: cx - 70, y: 90, w: 20, h: 14, label: '<', onClick: () => this.changeLevel(-1) },
      { x: cx + 50, y: 90, w: 20, h: 14, label: '>', onClick: () => this.changeLevel(+1) },
      { x: cx - 50, y: 118, w: 100, h: 16, label: 'PLAY', onClick: () => this.play() },
      { x: cx - 50, y: 138, w: 48, h: 14, label: 'PASSWORD', onClick: () => this.password() },
      { x: cx + 2, y: 138, w: 48, h: 14, label: this.audioLabel(), onClick: () => this.toggleAudio() },
    ];
  }

  private audioLabel(): string {
    return `SND:${this.app.audio.mode.toUpperCase()}`;
  }

  private changeRating(d: number): void {
    this.r = (this.r + d + ratingCount()) % ratingCount();
    this.l = 0;
  }

  private changeLevel(d: number): void {
    const n = levelsInRating(this.r);
    this.l = (this.l + d + n) % n;
  }

  private play(): void {
    void this.app.showObjective(this.r, this.l);
  }

  private password(): void {
    const pw = window.prompt('Enter level password:');
    if (!pw) return;
    const res = parsePassword(pw);
    if (res) {
      this.r = res.r;
      this.l = res.l;
      void this.app.showObjective(res.r, res.l);
    } else {
      window.alert('Invalid password.');
    }
  }

  private toggleAudio(): void {
    this.app.audio.cycleMode();
    this.buildButtons();
  }

  private loop = (): void => {
    this.tick++;
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private render(): void {
    const ctx = this.app.ctx;
    clearScreen(ctx, '#070b1c');

    // Title
    text(ctx, 'L E M M I N G S', SCREEN_W / 2, 30, { size: 18, color: '#27c93f', align: 'center' });
    text(ctx, 'Web Edition', SCREEN_W / 2, 46, { size: 8, color: '#9ab', align: 'center' });

    // Rating / level selectors
    const rating = RATINGS[this.r];
    text(ctx, `${rating.name}`, SCREEN_W / 2, 77, { align: 'center', color: '#ffd400', size: 9 });
    const lv = rating.levels[this.l];
    const locked = !isUnlocked(this.r, this.l);
    text(ctx, `Level ${this.l + 1}`, SCREEN_W / 2, 97, {
      align: 'center',
      color: locked ? '#a55' : '#cfe',
      size: 8,
    });
    text(ctx, lv.name, SCREEN_W / 2, 108, {
      align: 'center',
      color: locked ? '#a55' : '#9cf',
      size: 7,
    });

    for (const b of this.buttons) {
      const isPlay = b.label === 'PLAY';
      drawButton(ctx, { ...b, disabled: isPlay && locked }, false);
    }
    if (locked) {
      text(ctx, '(locked — enter a password)', SCREEN_W / 2, 160, {
        align: 'center',
        color: '#a55',
        size: 7,
      });
    } else {
      text(ctx, `code: ${makePassword(this.r, this.l)}`, SCREEN_W / 2, 160, {
        align: 'center',
        color: '#577',
        size: 7,
      });
    }

    // Parading lemmings along the bottom.
    ctx.fillStyle = '#0c1024';
    ctx.fillRect(0, VIEW_H, SCREEN_W, SCREEN_H - VIEW_H);
    for (const lem of this.parade) {
      if (this.tick % 4 === 0) {
        lem.x += 1;
        lem.frame++;
        if (lem.x > SCREEN_W + 10) lem.x = -10;
      }
      drawLemming(ctx, lem, lem.x, VIEW_H + 18);
    }
    text(ctx, 'click PLAY to begin', SCREEN_W / 2, SCREEN_H - 6, {
      align: 'center',
      color: '#456',
      size: 7,
    });
  }
}
