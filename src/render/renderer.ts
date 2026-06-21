import { Game } from '../engine/game';
import { Camera } from '../engine/camera';
import { TerrainView } from './terrainView';
import { drawLemming } from './lemmingSprite';
import { drawObject } from './objectSprite';
import { drawPanel } from './panel';
import { drawMinimap } from './minimap';
import { Skill, LemState } from '../engine/types';
import { SCREEN_W, VIEW_W, VIEW_H, LEM_HEIGHT } from '../engine/constants';
import { Lemming } from '../engine/lemming';

export interface HudState {
  selectedSkill: Skill | null;
  paused: boolean;
  cursorX: number;
  cursorY: number;
  hover: Lemming | null;
  hoverCount: number;
}

/** Draws the whole play scene (viewport + lemmings + panel + minimap + cursor). */
export class Renderer {
  private terrainView: TerrainView;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly game: Game,
    private readonly camera: Camera,
  ) {
    this.terrainView = new TerrainView(game.level.terrain);
  }

  draw(hud: HudState): void {
    const ctx = this.ctx;
    const game = this.game;
    const cam = this.camera;

    // Sky / background.
    ctx.fillStyle = game.level.data.bg ?? '#0a0a1a';
    ctx.fillRect(0, 0, SCREEN_W, VIEW_H);

    // Clip to the viewport so nothing draws over the panel.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();

    // Terrain.
    this.terrainView.sync();
    ctx.drawImage(this.terrainView.source, cam.x, cam.y, VIEW_W, VIEW_H, 0, 0, VIEW_W, VIEW_H);

    // Objects (behind lemmings, except exits which look fine behind too).
    for (const o of game.level.data.objects) {
      const sx = o.x - cam.x;
      const sy = o.y - cam.y;
      if (sx < -40 || sx > VIEW_W + 40) continue;
      drawObject(ctx, o, sx, sy, game.tick);
    }

    // Lemmings.
    for (const lem of game.lemmings) {
      if (lem.removed) continue;
      const sx = lem.x - cam.x;
      const sy = lem.y - cam.y;
      if (sx < -16 || sx > VIEW_W + 16) continue;
      drawLemming(ctx, lem, sx, sy);
    }

    // Selection cursor box around hovered lemming.
    if (hud.hover) {
      const sx = hud.hover.x - cam.x;
      const sy = hud.hover.y - cam.y;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 4.5, sy - LEM_HEIGHT - 1.5, 9, LEM_HEIGHT + 3);
    }

    ctx.restore();

    // Cursor crosshair (drawn over viewport).
    if (hud.cursorY < VIEW_H) {
      this.drawCursor(hud.cursorX, hud.cursorY, !!hud.hover);
    }

    // Status line.
    this.drawStatusLine(hud);

    // Panel + minimap.
    drawPanel(ctx, game, hud.selectedSkill, hud.paused);
    drawMinimap(ctx, game, cam);
  }

  private drawCursor(x: number, y: number, overLem: boolean): void {
    const ctx = this.ctx;
    ctx.strokeStyle = overLem ? '#ffe000' : '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 0.5);
    ctx.lineTo(x + 5, y + 0.5);
    ctx.moveTo(x + 0.5, y - 5);
    ctx.lineTo(x + 0.5, y + 5);
    ctx.stroke();
  }

  private drawStatusLine(hud: HudState): void {
    const ctx = this.ctx;
    const game = this.game;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, VIEW_H, SCREEN_W, 8);
    ctx.font = '7px monospace';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    // Under-cursor action + count.
    let left = '';
    if (hud.hover) {
      left = `${stateLabel(hud.hover.state)} ${hud.hoverCount}`;
    }
    ctx.fillStyle = '#fff';
    ctx.fillText(left, 2, VIEW_H + 1);

    // OUT / IN.
    ctx.fillStyle = '#9ff';
    ctx.fillText(`OUT ${game.out}`, 120, VIEW_H + 1);
    ctx.fillText(`IN ${game.savedPercent}%`, 180, VIEW_H + 1);

    // TIME.
    const s = game.secondsLeft;
    const mm = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    ctx.fillStyle = s <= 10 ? '#f55' : '#ff9';
    ctx.textAlign = 'right';
    ctx.fillText(`TIME ${mm}-${ss}`, SCREEN_W - 2, VIEW_H + 1);
    ctx.textAlign = 'left';
  }
}

function stateLabel(s: LemState): string {
  const map: Partial<Record<LemState, string>> = {
    [LemState.Walker]: 'Walker',
    [LemState.Faller]: 'Faller',
    [LemState.Floater]: 'Floater',
    [LemState.Climber]: 'Climber',
    [LemState.Blocker]: 'Blocker',
    [LemState.Builder]: 'Builder',
    [LemState.Basher]: 'Basher',
    [LemState.Miner]: 'Miner',
    [LemState.Digger]: 'Digger',
    [LemState.Shrugger]: 'Shrugger',
  };
  return map[s] ?? 'Lemming';
}
