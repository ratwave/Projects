import { VIEW_W, VIEW_H } from './constants';

/**
 * Viewport over a level that is usually wider (and sometimes taller) than the
 * play area. Provides world<->screen transforms and clamped scrolling.
 */
export class Camera {
  x = 0;
  y = 0;

  constructor(
    public levelWidth: number,
    public levelHeight: number,
  ) {}

  get maxX(): number {
    return Math.max(0, this.levelWidth - VIEW_W);
  }

  get maxY(): number {
    return Math.max(0, this.levelHeight - VIEW_H);
  }

  clamp(): void {
    if (this.x < 0) this.x = 0;
    if (this.x > this.maxX) this.x = this.maxX;
    if (this.y < 0) this.y = 0;
    if (this.y > this.maxY) this.y = this.maxY;
  }

  scrollBy(dx: number, dy: number): void {
    this.x += dx;
    this.y += dy;
    this.clamp();
  }

  /** Centre the viewport on a world point (used by minimap clicks). */
  centerOn(worldX: number, worldY: number): void {
    this.x = Math.round(worldX - VIEW_W / 2);
    this.y = Math.round(worldY - VIEW_H / 2);
    this.clamp();
  }

  worldToScreenX(wx: number): number {
    return wx - this.x;
  }
  worldToScreenY(wy: number): number {
    return wy - this.y;
  }
  screenToWorldX(sx: number): number {
    return sx + this.x;
  }
  screenToWorldY(sy: number): number {
    return sy + this.y;
  }
}
