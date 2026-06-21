import { App, Scene } from '../app';
import { SCREEN_W, SCREEN_H } from '../../engine/constants';
import { clearScreen, text, drawButton, hitButton, toInternal, UiButton } from '../canvasUI';
import { getLevel, RATINGS } from '../progression';
import { buildLevel } from '../../engine/level';
import { Skill, SKILL_ORDER } from '../../engine/types';

const SKILL_LABEL: Record<Skill, string> = {
  [Skill.Climber]: 'Climber',
  [Skill.Floater]: 'Floater',
  [Skill.Bomber]: 'Bomber',
  [Skill.Blocker]: 'Blocker',
  [Skill.Builder]: 'Builder',
  [Skill.Basher]: 'Basher',
  [Skill.Miner]: 'Miner',
  [Skill.Digger]: 'Digger',
};

/** Pre-level briefing screen with a mini-map preview and the level stats. */
export class ObjectiveScene implements Scene {
  private buttons: UiButton[] = [];
  private listeners: Array<() => void> = [];
  private preview: HTMLCanvasElement | null = null;

  constructor(
    private readonly app: App,
    private readonly r: number,
    private readonly l: number,
  ) {}

  start(): void {
    this.renderPreview();
    this.buttons = [
      { x: SCREEN_W / 2 - 70, y: SCREEN_H - 24, w: 64, h: 16, label: 'BACK', onClick: () => this.app.showMenu() },
      { x: SCREEN_W / 2 + 6, y: SCREEN_H - 24, w: 64, h: 16, label: "LET'S GO!", onClick: () => this.app.startLevel(this.r, this.l) },
    ];
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

  private renderPreview(): void {
    const data = getLevel(this.r, this.l);
    if (!data) return;
    const level = buildLevel(data);
    const pw = 220;
    const ph = 60;
    const c = document.createElement('canvas');
    c.width = pw;
    c.height = ph;
    const pctx = c.getContext('2d')!;
    pctx.fillStyle = data.bg ?? '#000';
    pctx.fillRect(0, 0, pw, ph);
    const t = level.terrain;
    const sx = pw / t.width;
    const sy = ph / t.height;
    pctx.fillStyle = '#2c7a2c';
    const stepX = Math.max(1, Math.floor(t.width / pw));
    const stepY = Math.max(1, Math.floor(t.height / ph));
    for (let y = 0; y < t.height; y += stepY)
      for (let x = 0; x < t.width; x += stepX)
        if (t.isSolidRaw(x, y)) pctx.fillRect(x * sx, y * sy, 1, 1);
    // entrances / exits
    for (const o of data.objects) {
      pctx.fillStyle = o.type === 'exit' ? '#ffd400' : o.type === 'entrance' ? '#88aaff' : '#1e6fb0';
      pctx.fillRect(o.x * sx - 1, o.y * sy - 1, 3, 3);
    }
    this.preview = c;
  }

  private render(): void {
    const ctx = this.app.ctx;
    const data = getLevel(this.r, this.l)!;
    clearScreen(ctx, '#0a0e1e');

    text(ctx, `${RATINGS[this.r].name}  —  Level ${this.l + 1}`, SCREEN_W / 2, 12, {
      align: 'center',
      color: '#ffd400',
      size: 9,
    });
    text(ctx, data.name, SCREEN_W / 2, 26, { align: 'center', color: '#cfe', size: 9 });

    if (this.preview) {
      const px = (SCREEN_W - this.preview.width) / 2;
      ctx.strokeStyle = '#456';
      ctx.strokeRect(px - 1, 35, this.preview.width + 1, this.preview.height + 1);
      ctx.drawImage(this.preview, px, 36);
    }

    const pct = Math.round((data.saveCount / data.lemmings) * 100);
    const lines = [
      `Lemmings:   ${data.lemmings}`,
      `To be saved: ${data.saveCount}  (${pct}%)`,
      `Release rate: ${data.releaseRate}`,
      `Time:        ${Math.floor(data.time / 60)}:${String(data.time % 60).padStart(2, '0')}`,
    ];
    let y = 108;
    for (const ln of lines) {
      text(ctx, ln, 40, y, { size: 8, color: '#bcd' });
      y += 11;
    }

    // available skills
    const skills = SKILL_ORDER.filter((s) => (data.skills[s] ?? 0) > 0).map(
      (s) => `${SKILL_LABEL[s]} ${data.skills[s]}`,
    );
    text(ctx, 'Skills:', SCREEN_W - 130, 108, { size: 8, color: '#9ab' });
    let sy = 119;
    for (const s of skills) {
      text(ctx, s, SCREEN_W - 130, sy, { size: 7, color: '#7fd' });
      sy += 9;
    }
    if (skills.length === 0) text(ctx, '(none)', SCREEN_W - 130, 119, { size: 7, color: '#577' });

    for (const b of this.buttons) drawButton(ctx, b);
  }
}
