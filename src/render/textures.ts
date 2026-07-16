/**
 * Original procedural terrain textures. Each style is a pure function mapping a
 * world pixel coordinate to an RGBA colour, giving every terrain "style" a
 * distinct original look (no copyrighted art). Deterministic so it is stable
 * across redraws and headless tests.
 */

export type RGBA = [number, number, number, number];
export type Texture = (x: number, y: number) => RGBA;

/** Cheap deterministic hash noise in [0,1). */
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) % 1000) / 1000;
}

function clamp8(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function shade(base: RGBA, amount: number): RGBA {
  return [clamp8(base[0] + amount), clamp8(base[1] + amount), clamp8(base[2] + amount), base[3]];
}

/** Earthy dirt/soil with darker speckle — the classic intro style. */
const dirt: Texture = (x, y) => {
  const base: RGBA = [150, 92, 48, 255];
  const n = hash(x, y);
  let amt = (n - 0.5) * 40;
  // subtle horizontal striations
  if ((y & 3) === 0) amt -= 12;
  return shade(base, amt);
};

/** Grey rock/stone. */
const rock: Texture = (x, y) => {
  const base: RGBA = [120, 124, 132, 255];
  const n = hash(x >> 1, y >> 1);
  let amt = (n - 0.5) * 50;
  if (((x + y) & 7) === 0) amt += 18;
  return shade(base, amt);
};

/** Red brick with mortar lines. */
const brick: Texture = (x, y) => {
  const brickH = 6;
  const brickW = 12;
  const row = Math.floor(y / brickH);
  const offset = (row & 1) * (brickW / 2);
  const inMortarY = y % brickH === 0;
  const inMortarX = (x + offset) % brickW === 0;
  if (inMortarY || inMortarX) return [70, 50, 46, 255];
  const base: RGBA = [176, 74, 58, 255];
  return shade(base, (hash(x, y) - 0.5) * 24);
};

/** Polished marble with veins. */
const marble: Texture = (x, y) => {
  const base: RGBA = [206, 206, 214, 255];
  const vein = Math.sin((x + y) * 0.18) + Math.sin((x - y) * 0.07);
  let amt = vein * 12 + (hash(x, y) - 0.5) * 10;
  return shade(base, amt);
};

/** Hellish hot rock with embers. */
const hell: Texture = (x, y) => {
  const base: RGBA = [90, 30, 28, 255];
  const n = hash(x, y);
  if (n > 0.93) return [255, 150, 40, 255]; // ember
  let amt = (n - 0.5) * 36;
  if ((y & 5) === 0) amt -= 10;
  return shade(base, amt);
};

/** Cold blue crystal/ice. */
const crystal: Texture = (x, y) => {
  const base: RGBA = [96, 150, 196, 255];
  const facet = ((x + y * 2) % 16 < 8 ? 1 : -1) * 10;
  let amt = facet + (hash(x >> 1, y >> 1) - 0.5) * 26;
  return shade(base, amt);
};

/** Mossy green pillar/jungle. */
const pillar: Texture = (x, y) => {
  const base: RGBA = [86, 132, 70, 255];
  let amt = (hash(x, y) - 0.5) * 34;
  if ((x & 7) === 0) amt -= 14;
  return shade(base, amt);
};

/** Sandy desert. */
const sand: Texture = (x, y) => {
  const base: RGBA = [200, 178, 116, 255];
  let amt = (hash(x, y >> 1) - 0.5) * 22;
  if ((y & 7) === 0) amt -= 8;
  return shade(base, amt);
};

/** Dull rusty steel plate look (visual only; steel mask handles behaviour). */
const steel: Texture = (x, y) => {
  const base: RGBA = [110, 104, 98, 255];
  let amt = (hash(x >> 2, y >> 2) - 0.5) * 24;
  // rivets
  if (x % 8 === 4 && y % 8 === 4) return [60, 56, 52, 255];
  return shade(base, amt);
};

export const TEXTURES: Record<string, Texture> = {
  dirt,
  rock,
  brick,
  marble,
  hell,
  crystal,
  pillar,
  sand,
  steel,
};

export type TerrainStyle = keyof typeof TEXTURES;

export function getTexture(style: string): Texture {
  return TEXTURES[style] ?? dirt;
}
