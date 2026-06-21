import type { LevelData } from '../engine/types';
import { Skill } from '../engine/types';

/** A throwaway level used for early visual/physics validation. */
export const TEST_LEVEL: LevelData = {
  name: 'Test Chamber',
  rating: 'Dev',
  width: 640,
  height: 160,
  bg: '#101830',
  shapes: [
    // ground floor
    { kind: 'rect', x: 0, y: 140, w: 640, h: 20, style: 'dirt' },
    // a couple of platforms
    { kind: 'rect', x: 120, y: 100, w: 80, h: 8, style: 'rock' },
    { kind: 'rect', x: 260, y: 80, w: 100, h: 60, style: 'brick' },
    { kind: 'rect', x: 420, y: 60, w: 16, h: 80, style: 'marble' },
    // steel block
    { kind: 'rect', x: 500, y: 100, w: 40, h: 40, style: 'steel', steel: true },
    // a pit carved out of the ground
    { kind: 'rect', x: 200, y: 140, w: 30, h: 20, style: 'dirt', erase: true },
  ],
  objects: [
    { type: 'entrance', x: 40, y: 20 },
    { type: 'exit', x: 590, y: 124 },
    { type: 'water', x: 200, y: 150 },
  ],
  lemmings: 20,
  saveCount: 10,
  releaseRate: 50,
  time: 300,
  skills: {
    [Skill.Climber]: 5,
    [Skill.Floater]: 5,
    [Skill.Bomber]: 5,
    [Skill.Blocker]: 5,
    [Skill.Builder]: 10,
    [Skill.Basher]: 5,
    [Skill.Miner]: 5,
    [Skill.Digger]: 5,
  },
};
