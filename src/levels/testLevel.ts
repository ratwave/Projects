import type { LevelData } from '../engine/types';
import { Skill } from '../engine/types';

/** A small, genuinely playable demo/validation level. */
export const TEST_LEVEL: LevelData = {
  name: 'Test Chamber',
  rating: 'Dev',
  width: 640,
  height: 160,
  bg: '#101830',
  shapes: [
    // main ground
    { kind: 'rect', x: 0, y: 120, w: 640, h: 40, style: 'dirt' },
    // a raised starting ledge under the hatch (short, safe drop)
    { kind: 'rect', x: 30, y: 96, w: 120, h: 6, style: 'rock' },
    // a wall to bash/build over
    { kind: 'rect', x: 300, y: 70, w: 16, h: 50, style: 'brick' },
    // a steel block (indestructible)
    { kind: 'rect', x: 420, y: 100, w: 40, h: 20, style: 'steel', steel: true },
    // a pit of water in the ground
    { kind: 'rect', x: 200, y: 120, w: 40, h: 40, style: 'dirt', erase: true },
  ],
  objects: [
    { type: 'entrance', x: 70, y: 70 },
    { type: 'exit', x: 600, y: 112 },
    { type: 'water', x: 220, y: 130, w: 40, h: 24 },
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
