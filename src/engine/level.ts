import { Terrain } from './terrain';
import { getTexture } from '../render/textures';
import type { LevelData, LevelObject } from './types';

/** A loaded, ready-to-play level: terrain plus parsed object lists. */
export interface Level {
  data: LevelData;
  terrain: Terrain;
  entrances: LevelObject[];
  exits: LevelObject[];
  hazards: LevelObject[]; // water + traps
}

/** Build a Terrain (collision + colour) and object lists from level data. */
export function buildLevel(data: LevelData): Level {
  const terrain = new Terrain(data.width, data.height);

  for (const shape of data.shapes) {
    if (shape.kind !== 'rect') continue;
    if (shape.erase) {
      terrain.clearRect(shape.x, shape.y, shape.w, shape.h, true);
      continue;
    }
    const tex = getTexture(shape.style);
    terrain.paintRect(shape.x, shape.y, shape.w, shape.h, (lx, ly) =>
      tex(shape.x + lx, shape.y + ly),
    );
    if (shape.steel) terrain.setSteelRect(shape.x, shape.y, shape.w, shape.h);
    if (shape.oneway) terrain.setOneWayRect(shape.x, shape.y, shape.w, shape.h, shape.oneway);
  }

  terrain.dirty = true;

  const entrances = data.objects.filter((o) => o.type === 'entrance');
  const exits = data.objects.filter((o) => o.type === 'exit');
  const hazards = data.objects.filter((o) => o.type === 'water' || o.type === 'trap');

  return { data, terrain, entrances, exits, hazards };
}

/** Validate a level definition; returns a list of problems (empty = OK). */
export function validateLevel(data: LevelData): string[] {
  const problems: string[] = [];
  if (data.width <= 0 || data.height <= 0) problems.push('invalid dimensions');
  if (!data.objects.some((o) => o.type === 'entrance')) problems.push('no entrance');
  if (!data.objects.some((o) => o.type === 'exit')) problems.push('no exit');
  if (data.lemmings <= 0) problems.push('no lemmings');
  if (data.saveCount > data.lemmings) problems.push('saveCount exceeds lemmings');
  if (data.releaseRate < 1 || data.releaseRate > 99) problems.push('release rate out of range');
  return problems;
}
