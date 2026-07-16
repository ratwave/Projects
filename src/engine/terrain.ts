import { BLOCK } from './constants';

/**
 * The destructible terrain. Three logical layers:
 *  - `solid`:  per-pixel collision mask (1 = solid, 0 = empty).
 *  - `steel`:  per-block mask (1 = steel, cannot be excavated). Block-aligned.
 *  - `oneway`: per-block direction restriction for bashers/miners
 *              (0 = none, -1 = only diggable leftward, +1 = only rightward).
 *  - `color`:  RGBA pixel buffer for rendering (kept in sync with `solid`).
 *
 * Pure typed-array implementation so it can run headless in unit tests.
 */
export class Terrain {
  readonly width: number;
  readonly height: number;
  readonly blocksW: number;
  readonly blocksH: number;

  readonly solid: Uint8Array;
  readonly steel: Uint8Array;
  readonly oneway: Int8Array;
  /** RGBA, length = width*height*4. */
  readonly color: Uint8ClampedArray;

  /** Marks the bounding box of pixels changed since last consumed (for dirty-rect redraw). */
  dirty = true;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.blocksW = Math.ceil(width / BLOCK);
    this.blocksH = Math.ceil(height / BLOCK);
    this.solid = new Uint8Array(width * height);
    this.steel = new Uint8Array(this.blocksW * this.blocksH);
    this.oneway = new Int8Array(this.blocksW * this.blocksH);
    this.color = new Uint8ClampedArray(width * height * 4);
  }

  /** True if (x,y) is outside the terrain bounds. */
  inBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /** Solid query. Out-of-bounds horizontally is treated as solid (level walls); below bottom is empty. */
  isSolid(x: number, y: number): boolean {
    if (y < 0) return false;
    if (y >= this.height) return false;
    if (x < 0 || x >= this.width) return true; // side walls block movement
    return this.solid[y * this.width + x] === 1;
  }

  /** Raw solid query without wall treatment (false if OOB). */
  isSolidRaw(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    return this.solid[y * this.width + x] === 1;
  }

  isSteel(x: number, y: number): boolean {
    if (!this.inBounds(x, y)) return false;
    const bx = (x / BLOCK) | 0;
    const by = (y / BLOCK) | 0;
    return this.steel[by * this.blocksW + bx] === 1;
  }

  /** One-way restriction at a pixel: 0 none, -1 left-only, +1 right-only. */
  onewayAt(x: number, y: number): number {
    if (!this.inBounds(x, y)) return 0;
    const bx = (x / BLOCK) | 0;
    const by = (y / BLOCK) | 0;
    return this.oneway[by * this.blocksW + bx];
  }

  /** Mark a block region as steel. */
  setSteelRect(px: number, py: number, w: number, h: number): void {
    for (let y = py; y < py + h; y += BLOCK) {
      for (let x = px; x < px + w; x += BLOCK) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
        const bx = (x / BLOCK) | 0;
        const by = (y / BLOCK) | 0;
        this.steel[by * this.blocksW + bx] = 1;
      }
    }
  }

  /** Mark a block region as a one-way wall facing `dir` (-1 left / +1 right). */
  setOneWayRect(px: number, py: number, w: number, h: number, dir: number): void {
    for (let y = py; y < py + h; y += BLOCK) {
      for (let x = px; x < px + w; x += BLOCK) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
        const bx = (x / BLOCK) | 0;
        const by = (y / BLOCK) | 0;
        this.oneway[by * this.blocksW + bx] = dir as number;
      }
    }
  }

  /** Set a solid pixel with a colour (used by builders & terrain painting). */
  setPixel(x: number, y: number, r: number, g: number, b: number, a = 255): void {
    if (!this.inBounds(x, y)) return;
    const i = y * this.width + x;
    this.solid[i] = a >= 128 ? 1 : 0;
    const j = i * 4;
    this.color[j] = r;
    this.color[j + 1] = g;
    this.color[j + 2] = b;
    this.color[j + 3] = a;
    this.dirty = true;
  }

  /** Clear a pixel to empty (respects steel unless `force`). Returns true if a solid pixel was removed. */
  clearPixel(x: number, y: number, force = false): boolean {
    if (!this.inBounds(x, y)) return false;
    if (!force && this.isSteel(x, y)) return false;
    const i = y * this.width + x;
    const was = this.solid[i] === 1;
    this.solid[i] = 0;
    const j = i * 4;
    this.color[j + 3] = 0;
    this.dirty = true;
    return was;
  }

  /** Clear an axis-aligned rectangle. Returns whether any steel blocked clearing. */
  clearRect(x0: number, y0: number, w: number, h: number, force = false): boolean {
    let hitSteel = false;
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        if (!force && this.isSteel(x, y) && this.isSolidRaw(x, y)) {
          hitSteel = true;
          continue;
        }
        this.clearPixel(x, y, force);
      }
    }
    return hitSteel;
  }

  /** Clear a filled circle (explosion crater). Skips steel pixels. */
  clearCircle(cx: number, cy: number, radius: number): void {
    const r2 = radius * radius;
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= r2) {
          this.clearPixel(cx + x, cy + y);
        }
      }
    }
  }

  /**
   * Paint a solid rectangle of terrain (used by level building from tile pieces).
   * The colour can vary per pixel via the optional sampler.
   */
  paintRect(
    x0: number,
    y0: number,
    w: number,
    h: number,
    sampler: (lx: number, ly: number) => [number, number, number, number],
  ): void {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const [r, g, b, a] = sampler(x, y);
        if (a >= 128) this.setPixel(x0 + x, y0 + y, r, g, b, a);
      }
    }
  }
}
