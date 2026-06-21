import { Game } from '../../engine/game';
import { buildLevel } from '../../engine/level';
import { Camera } from '../../engine/camera';
import { Renderer, HudState } from '../../render/renderer';
import { GameLoop } from '../../engine/loop';
import { Skill, LevelData } from '../../engine/types';
import { VIEW_W, VIEW_H } from '../../engine/constants';
import { buttonAt } from '../../render/panel';
import { minimapToWorld } from '../../render/minimap';
import { AudioEngine } from '../../audio/audio';

const SKILL_KEYS: Record<string, Skill> = {
  F3: Skill.Climber,
  F4: Skill.Floater,
  F5: Skill.Bomber,
  F6: Skill.Blocker,
  F7: Skill.Builder,
  F8: Skill.Basher,
  F9: Skill.Miner,
  F10: Skill.Digger,
};

export interface PlayCallbacks {
  onFinish: (won: boolean, game: Game) => void;
}

/** The interactive in-level scene. */
export class PlayScene {
  readonly game: Game;
  private camera: Camera;
  private renderer: Renderer;
  private loop: GameLoop;

  private hud: HudState = {
    selectedSkill: null,
    paused: false,
    cursorX: -1,
    cursorY: -1,
    hover: null,
    hoverCount: 0,
  };

  private rightDown = false;
  private leftEdge = false;
  private rightEdge = false;
  private finished = false;
  private nukeArmTimer = 0;

  private listeners: Array<() => void> = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    data: LevelData,
    private readonly audio: AudioEngine,
    private readonly cb: PlayCallbacks,
  ) {
    const level = buildLevel(data);
    this.game = new Game(level);
    this.game.events = (e) => this.audio.play(e);
    this.camera = new Camera(level.terrain.width, level.terrain.height);
    this.renderer = new Renderer(ctx, this.game, this.camera);
    this.loop = new GameLoop(
      () => this.update(),
      () => this.render(),
    );
    this.bindEvents();
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
    for (const off of this.listeners) off();
    this.listeners = [];
  }

  setSpeed(mult: number): void {
    this.loop.speed = mult;
  }

  /* ----------------------------- loop ----------------------------- */

  private update(): void {
    if (this.hud.paused) return;
    // Edge scrolling.
    const sp = this.rightDown ? 6 : 3;
    if (this.leftEdge) this.camera.scrollBy(-sp, 0);
    if (this.rightEdge) this.camera.scrollBy(sp, 0);

    this.game.step();

    if (this.nukeArmTimer > 0) this.nukeArmTimer--;

    if (!this.finished && this.game.phase !== 'running') {
      this.finished = true;
      this.cb.onFinish(this.game.phase === 'won', this.game);
    }
  }

  private render(): void {
    // Refresh hover each frame from cursor.
    this.updateHover();
    this.hud.paused = this.loop.paused;
    this.renderer.draw(this.hud);
  }

  private updateHover(): void {
    if (this.hud.cursorX < 0 || this.hud.cursorY >= VIEW_H) {
      this.hud.hover = null;
      this.hud.hoverCount = 0;
      return;
    }
    const wx = this.camera.screenToWorldX(this.hud.cursorX);
    const wy = this.camera.screenToWorldY(this.hud.cursorY);
    this.hud.hover = this.game.pick(wx, wy, this.rightDown);
    this.hud.hoverCount = this.game.countUnder(wx, wy);
  }

  /* ----------------------------- input ----------------------------- */

  private toInternal(e: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / this.canvas.width;
    const scaleY = rect.height / this.canvas.height;
    return {
      x: (e.clientX - rect.left) / scaleX,
      y: (e.clientY - rect.top) / scaleY,
    };
  }

  private bindEvents(): void {
    const on = <K extends keyof DocumentEventMap>(
      target: EventTarget,
      type: K,
      handler: (ev: DocumentEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ): void => {
      target.addEventListener(type, handler as EventListener, opts);
      this.listeners.push(() => target.removeEventListener(type, handler as EventListener, opts));
    };

    on(this.canvas, 'contextmenu', (e) => e.preventDefault());

    on(this.canvas, 'mousemove', (e) => {
      const p = this.toInternal(e);
      this.hud.cursorX = p.x;
      this.hud.cursorY = p.y;
      const edge = 12;
      this.leftEdge = p.y < VIEW_H && p.x < edge;
      this.rightEdge = p.y < VIEW_H && p.x > VIEW_W - edge;
    });

    on(this.canvas, 'mouseleave', () => {
      this.hud.cursorX = -1;
      this.hud.cursorY = -1;
      this.leftEdge = this.rightEdge = false;
    });

    on(this.canvas, 'mousedown', (e) => {
      this.audio.resume();
      if (e.button === 2) {
        this.rightDown = true;
        return;
      }
      const p = this.toInternal(e);
      this.handleClick(p.x, p.y);
    });

    on(window, 'mouseup', (e) => {
      if (e.button === 2) this.rightDown = false;
    });

    on(window, 'keydown', (e) => this.handleKey(e));

    // Touch: tap to act, drag near edges to scroll.
    on(this.canvas, 'touchstart', (e) => {
      this.audio.resume();
      const t = e.touches[0];
      if (!t) return;
      const p = this.toInternal(t);
      this.hud.cursorX = p.x;
      this.hud.cursorY = p.y;
      this.updateHover();
      this.handleClick(p.x, p.y);
      e.preventDefault();
    }, { passive: false });

    on(this.canvas, 'touchmove', (e) => {
      const t = e.touches[0];
      if (!t) return;
      const p = this.toInternal(t);
      this.hud.cursorX = p.x;
      this.hud.cursorY = p.y;
      const edge = 24;
      this.leftEdge = p.y < VIEW_H && p.x < edge;
      this.rightEdge = p.y < VIEW_H && p.x > VIEW_W - edge;
      e.preventDefault();
    }, { passive: false });

    on(this.canvas, 'touchend', () => {
      this.leftEdge = this.rightEdge = false;
    });
  }

  private handleClick(x: number, y: number): void {
    // Panel button?
    const btn = buttonAt(x, y);
    if (btn) {
      this.handleButton(btn);
      return;
    }

    // Minimap?
    const mm = minimapToWorld(this.game, x, y);
    if (mm) {
      this.camera.centerOn(mm.x, mm.y);
      return;
    }

    // Viewport: assign skill to hovered lemming.
    if (y < VIEW_H && this.hud.selectedSkill) {
      const wx = this.camera.screenToWorldX(x);
      const wy = this.camera.screenToWorldY(y);
      const lem = this.game.pick(wx, wy, this.rightDown);
      if (lem) this.game.assignSkill(lem, this.hud.selectedSkill);
    }
  }

  private handleButton(btn: ReturnType<typeof buttonAt>): void {
    if (btn === 'rate-') this.game.changeReleaseRate(-1);
    else if (btn === 'rate+') this.game.changeReleaseRate(+1);
    else if (btn === 'pause') this.loop.paused = !this.loop.paused;
    else if (btn === 'nuke') this.armNuke();
    else if (btn) this.hud.selectedSkill = btn as Skill;
  }

  private armNuke(): void {
    // Require a double activation (classic safety): first arms, second nukes.
    if (this.nukeArmTimer > 0) {
      this.game.nuke();
    } else {
      this.nukeArmTimer = 20;
    }
  }

  private handleKey(e: KeyboardEvent): void {
    if (e.key === 'F1') {
      this.game.changeReleaseRate(-1);
      e.preventDefault();
    } else if (e.key === 'F2') {
      this.game.changeReleaseRate(+1);
      e.preventDefault();
    } else if (SKILL_KEYS[e.key]) {
      this.hud.selectedSkill = SKILL_KEYS[e.key];
      e.preventDefault();
    } else if (e.key === 'F11' || e.key === 'p' || e.key === 'P' || e.key === ' ') {
      this.loop.paused = !this.loop.paused;
      e.preventDefault();
    } else if (e.key === 'F12') {
      this.armNuke();
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      this.camera.scrollBy(-16, 0);
    } else if (e.key === 'ArrowRight') {
      this.camera.scrollBy(16, 0);
    }
  }
}
