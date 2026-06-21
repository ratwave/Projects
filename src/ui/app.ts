import { AudioEngine } from '../audio/audio';
import { SCREEN_W, SCREEN_H } from '../engine/constants';
import { Game } from '../engine/game';

export interface Scene {
  start(): void;
  stop(): void;
}

/** Result data passed from a finished level to the results scene. */
export interface LevelResult {
  won: boolean;
  saved: number;
  total: number;
  required: number;
}

/**
 * Top-level application: owns the canvas/audio and switches between scenes
 * (menu → objective → play → results). Scenes are created lazily to avoid
 * import cycles.
 */
export class App {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly audio: AudioEngine;

  private current: Scene | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.ctx.imageSmoothingEnabled = false;
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    this.audio = new AudioEngine();
    this.fitToWindow();
    window.addEventListener('resize', () => this.fitToWindow());
  }

  fitToWindow(): void {
    const scaleX = window.innerWidth / SCREEN_W;
    const scaleY = window.innerHeight / SCREEN_H;
    const scale = Math.max(1, Math.min(scaleX, scaleY));
    this.canvas.style.width = `${SCREEN_W * scale}px`;
    this.canvas.style.height = `${SCREEN_H * scale}px`;
  }

  private go(scene: Scene): void {
    this.current?.stop();
    this.current = scene;
    scene.start();
    (window as unknown as { __scene: Scene }).__scene = scene;
  }

  async showMenu(): Promise<void> {
    const { MenuScene } = await import('./scenes/menu');
    this.go(new MenuScene(this));
  }

  async showObjective(r: number, l: number): Promise<void> {
    const { ObjectiveScene } = await import('./scenes/objective');
    this.go(new ObjectiveScene(this, r, l));
  }

  async startLevel(r: number, l: number): Promise<void> {
    const { PlayScene } = await import('./scenes/play');
    const { getLevel } = await import('./progression');
    const data = getLevel(r, l);
    if (!data) {
      void this.showMenu();
      return;
    }
    this.go(
      new PlayScene(this.canvas, this.ctx, data, this.audio, {
        onFinish: (won, game) => {
          void this.showResults(r, l, won, game);
        },
        onQuit: () => {
          void this.showMenu();
        },
      }),
    );
  }

  async showResults(r: number, l: number, won: boolean, game: Game): Promise<void> {
    const { ResultsScene } = await import('./scenes/results');
    this.go(
      new ResultsScene(this, r, l, {
        won,
        saved: game.saved,
        total: game.totalLemmings,
        required: game.required,
      }),
    );
  }
}
