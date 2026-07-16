import { TICK_MS } from './constants';

/**
 * Fixed-timestep accumulator loop. The simulation advances in discrete ticks of
 * TICK_MS; rendering happens once per animation frame. A speed multiplier allows
 * fast-forward / slow-motion without changing the tick semantics.
 */
export class GameLoop {
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private running = false;

  /** Logic ticks per render frame multiplier (1 = normal). */
  public speed = 1;
  /** When true, update() is skipped but render() still runs. */
  public paused = false;

  constructor(
    private readonly update: () => void,
    private readonly render: (alpha: number) => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    let delta = now - this.lastTime;
    this.lastTime = now;
    // Clamp huge deltas (tab switches) to avoid spiral-of-death.
    if (delta > 250) delta = 250;
    this.accumulator += delta;

    const step = TICK_MS / Math.max(0.0001, this.speed);
    let guard = 0;
    while (this.accumulator >= step) {
      if (!this.paused) this.update();
      this.accumulator -= step;
      if (++guard > 240) {
        this.accumulator = 0;
        break;
      }
    }

    this.render(this.accumulator / step);
    this.rafId = requestAnimationFrame(this.frame);
  };
}
