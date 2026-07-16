import { describe, it, expect } from 'vitest';
import { Terrain } from '../src/engine/terrain';

function fillSolid(t: Terrain): void {
  for (let y = 0; y < t.height; y++)
    for (let x = 0; x < t.width; x++) t.setPixel(x, y, 100, 100, 100, 255);
}

describe('Terrain collision & destruction', () => {
  it('side walls are solid, below-bottom is empty', () => {
    const t = new Terrain(20, 20);
    expect(t.isSolid(-1, 5)).toBe(true);
    expect(t.isSolid(20, 5)).toBe(true);
    expect(t.isSolid(5, 25)).toBe(false);
    expect(t.isSolid(5, 5)).toBe(false); // empty interior
  });

  it('setPixel makes a cell solid, clearPixel empties it', () => {
    const t = new Terrain(20, 20);
    t.setPixel(5, 5, 1, 2, 3, 255);
    expect(t.isSolidRaw(5, 5)).toBe(true);
    expect(t.clearPixel(5, 5)).toBe(true);
    expect(t.isSolidRaw(5, 5)).toBe(false);
  });

  it('steel cannot be cleared without force', () => {
    const t = new Terrain(20, 20);
    fillSolid(t);
    t.setSteelRect(0, 0, 8, 8); // blocks covering (0..7,0..7)
    expect(t.isSteel(2, 2)).toBe(true);
    expect(t.clearPixel(2, 2)).toBe(false);
    expect(t.isSolidRaw(2, 2)).toBe(true);
    // force clears it
    expect(t.clearPixel(2, 2, true)).toBe(true);
    expect(t.isSolidRaw(2, 2)).toBe(false);
  });

  it('clearRect reports steel obstruction', () => {
    const t = new Terrain(20, 20);
    fillSolid(t);
    t.setSteelRect(8, 0, 4, 20);
    const hitSteel = t.clearRect(6, 0, 6, 4); // spans into steel block at x=8..11
    expect(hitSteel).toBe(true);
    expect(t.isSolidRaw(6, 1)).toBe(false); // permeable part cleared
    expect(t.isSolidRaw(9, 1)).toBe(true); // steel part retained
  });

  it('clearCircle carves a crater but spares steel', () => {
    const t = new Terrain(40, 40);
    fillSolid(t);
    t.setSteelRect(20, 20, 4, 4);
    t.clearCircle(20, 20, 6);
    expect(t.isSolidRaw(20, 14)).toBe(false); // top of crater cleared
    expect(t.isSolidRaw(21, 21)).toBe(true); // steel block within radius retained
  });

  it('one-way blocks record direction', () => {
    const t = new Terrain(20, 20);
    t.setOneWayRect(4, 4, 4, 4, +1);
    expect(t.onewayAt(5, 5)).toBe(1);
    expect(t.onewayAt(0, 0)).toBe(0);
  });
});
