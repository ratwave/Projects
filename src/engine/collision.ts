import { Terrain } from './terrain';
import { LEM_HEIGHT } from './constants';

/** Is the lemming supported by ground at (x, y)? (solid directly below feet) */
export function hasGround(t: Terrain, x: number, y: number): boolean {
  return t.isSolid(x, y + 1);
}

/** Is the feet pixel embedded in terrain at (x, y)? */
export function feetEmbedded(t: Terrain, x: number, y: number): boolean {
  return t.isSolid(x, y);
}

/**
 * From column x, find how many pixels UP the surface is, starting at feet y.
 * Returns the number of solid pixels stacked at/above the feet (the rise),
 * scanning up to `limit`. 0 means feet pixel is empty.
 */
export function riseAt(t: Terrain, x: number, y: number, limit: number): number {
  let k = 0;
  while (k < limit && t.isSolid(x, y - k)) k++;
  return k;
}

/**
 * From column x with empty feet, find how far DOWN the first ground is,
 * scanning (y+1 .. y+limit). Returns distance, or -1 if none within limit.
 */
export function dropTo(t: Terrain, x: number, y: number, limit: number): number {
  for (let k = 1; k <= limit; k++) {
    if (t.isSolid(x, y + k)) return k - 1; // stand on top of that solid pixel
  }
  return -1;
}

/** Is there a wall in front of the lemming's body it cannot step over? */
export function wallAhead(t: Terrain, x: number, y: number, maxStep: number): boolean {
  // Solid stacked taller than maxStep at the column directly ahead.
  return riseAt(t, x, y, maxStep + 2) > maxStep;
}

/** True if any body-height pixel at column x is solid (used for ceiling/overhang). */
export function bodyBlocked(t: Terrain, x: number, y: number): boolean {
  for (let i = 0; i < LEM_HEIGHT; i++) {
    if (t.isSolid(x, y - i)) return true;
  }
  return false;
}
