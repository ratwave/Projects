import { Terrain } from '../engine/terrain';

/**
 * Maintains an offscreen canvas mirroring the terrain colour buffer so it can be
 * blitted cheaply to the main viewport each frame. Rebuilds the ImageData only
 * when the terrain has changed.
 */
export class TerrainView {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly image: ImageData;

  constructor(private readonly terrain: Terrain) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = terrain.width;
    this.canvas.height = terrain.height;
    this.ctx = this.canvas.getContext('2d')!;
    this.image = this.ctx.createImageData(terrain.width, terrain.height);
    this.sync(true);
  }

  /** Copy the terrain colour buffer into the offscreen canvas if dirty. */
  sync(force = false): void {
    if (!this.terrain.dirty && !force) return;
    this.image.data.set(this.terrain.color);
    this.ctx.putImageData(this.image, 0, 0);
    this.terrain.dirty = false;
  }

  get source(): HTMLCanvasElement {
    return this.canvas;
  }
}
