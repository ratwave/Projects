import type { LevelData, TerrainShape, LevelObject } from '../engine/types';
import { Skill } from '../engine/types';

/**
 * Original level designs grouped into difficulty ratings. These are our own
 * layouts (not the copyrighted originals), built to teach and exercise every
 * mechanic with a rising difficulty curve.
 *
 * GEOMETRY NOTE: lemmings splat if they fall more than MAX_FALL (60px). All
 * drops below are kept within that budget (verified by tests/levels.test.ts).
 */

interface Rating {
  name: string;
  levels: LevelData[];
}

type Sk = Partial<Record<Skill, number>>;

function level(
  name: string,
  rating: string,
  width: number,
  height: number,
  bg: string,
  shapes: TerrainShape[],
  objects: LevelObject[],
  lemmings: number,
  saveCount: number,
  releaseRate: number,
  time: number,
  skills: Sk,
): LevelData {
  return { name, rating, width, height, bg, shapes, objects, lemmings, saveCount, releaseRate, time, skills };
}

const G = (x: number, y: number, w: number, h: number, style = 'dirt'): TerrainShape => ({
  kind: 'rect',
  x,
  y,
  w,
  h,
  style,
});

/* ============================ TAME ============================ */

const t1 = level(
  'A Gentle Stroll',
  'Tame',
  480,
  160,
  '#0e1430',
  [G(0, 120, 480, 40, 'dirt')],
  [
    { type: 'entrance', x: 70, y: 92 },
    { type: 'exit', x: 420, y: 112 },
  ],
  10,
  8,
  50,
  120,
  {},
);

// Dig straight down through a thin floor to the ground (and exit) just below.
// Drop from the dug hole (top y70) to the lower ground (y120) is ~50px — safe.
const t2 = level(
  'The Only Way Is Down',
  'Tame',
  480,
  170,
  '#101a2e',
  [G(0, 70, 480, 20, 'dirt'), G(0, 120, 480, 50, 'rock')],
  [
    { type: 'entrance', x: 90, y: 42 },
    { type: 'exit', x: 150, y: 112 },
  ],
  10,
  6,
  45,
  180,
  { [Skill.Digger]: 3 },
);

// Block the herd, then build a short bridge over a small water gap.
const t3 = level(
  'Mind the Gap',
  'Tame',
  520,
  160,
  '#0e1830',
  [G(0, 120, 204, 40, 'dirt'), G(228, 120, 292, 40, 'dirt')],
  [
    { type: 'entrance', x: 70, y: 92 },
    { type: 'exit', x: 470, y: 112 },
    { type: 'water', x: 216, y: 134, w: 28, h: 26 },
  ],
  10,
  6,
  40,
  240,
  { [Skill.Builder]: 8, [Skill.Blocker]: 3, [Skill.Bomber]: 2 },
);

// Two-blocker pen + digger to reach the exit below (drop ~50px, safe).
const t4 = level(
  'Hold the Line',
  'Tame',
  520,
  190,
  '#121226',
  [G(0, 90, 520, 20, 'marble'), G(0, 140, 520, 50, 'rock')],
  [
    { type: 'entrance', x: 260, y: 62 },
    { type: 'exit', x: 70, y: 132 },
  ],
  12,
  6,
  50,
  220,
  { [Skill.Digger]: 2, [Skill.Blocker]: 3, [Skill.Builder]: 4 },
);

// Bash horizontally through a wall to the exit.
const t5 = level(
  'Through the Wall',
  'Tame',
  520,
  160,
  '#160e1e',
  [G(0, 120, 520, 40, 'dirt'), G(250, 64, 46, 56, 'rock'), { ...G(250, 56, 46, 8, 'steel'), steel: true }],
  [
    { type: 'entrance', x: 60, y: 92 },
    { type: 'exit', x: 470, y: 112 },
  ],
  12,
  9,
  50,
  200,
  { [Skill.Basher]: 3, [Skill.Builder]: 4 },
);

/* ============================ TRICKY ============================ */

// Climb a wall then float down the far side (make an Athlete).
const t6 = level(
  'Scale the Heights',
  'Tricky',
  500,
  200,
  '#0c1020',
  [
    G(0, 160, 500, 40, 'rock'),
    { ...G(0, 40, 18, 120, 'steel'), steel: true },
    G(150, 40, 18, 120, 'brick'),
  ],
  [
    { type: 'entrance', x: 80, y: 132 },
    { type: 'exit', x: 430, y: 152 },
  ],
  10,
  7,
  50,
  220,
  { [Skill.Climber]: 5, [Skill.Floater]: 5, [Skill.Builder]: 6 },
);

// Mine diagonally down through a slope to reach a lower exit.
const t7 = level(
  'Down the Mine',
  'Tricky',
  520,
  200,
  '#1a1410',
  [G(0, 70, 300, 20, 'sand'), G(0, 90, 160, 110, 'sand'), G(0, 170, 520, 30, 'rock')],
  [
    { type: 'entrance', x: 70, y: 42 },
    { type: 'exit', x: 430, y: 152 },
  ],
  12,
  8,
  50,
  240,
  { [Skill.Miner]: 4, [Skill.Builder]: 6, [Skill.Basher]: 3 },
);

// One-way wall: bashers may only pass in the arrow direction.
const t8 = level(
  'One Way Only',
  'Tricky',
  540,
  160,
  '#101626',
  [
    G(0, 120, 540, 40, 'dirt'),
    G(250, 70, 40, 50, 'crystal'),
    { ...G(250, 70, 40, 50, 'crystal'), oneway: 1 },
  ],
  [
    { type: 'entrance', x: 60, y: 92 },
    { type: 'exit', x: 500, y: 112 },
  ],
  14,
  10,
  50,
  220,
  { [Skill.Basher]: 4, [Skill.Builder]: 4 },
);

// Avoid the trap, then dig down to the exit (drop ~50px, safe).
const t9 = level(
  'Pit of Peril',
  'Tricky',
  520,
  180,
  '#160c18',
  [G(0, 80, 520, 20, 'hell'), G(0, 130, 520, 50, 'rock')],
  [
    { type: 'entrance', x: 70, y: 52 },
    { type: 'exit', x: 440, y: 122 },
    { type: 'trap', x: 250, y: 72, w: 14, h: 8, delay: 30 },
  ],
  12,
  7,
  45,
  220,
  { [Skill.Digger]: 3, [Skill.Builder]: 5, [Skill.Blocker]: 3 },
);

/* ============================ TAXING ============================ */

// Combine blocker + builder + basher to cross a long hazard field.
const t10 = level(
  'The Long Way Round',
  'Taxing',
  640,
  200,
  '#0a0e1a',
  [
    G(0, 120, 180, 80, 'dirt'),
    G(180, 150, 120, 50, 'rock'),
    G(300, 120, 60, 80, 'brick'),
    G(420, 120, 220, 80, 'dirt'),
    { ...G(360, 120, 60, 80, 'steel'), steel: true },
  ],
  [
    { type: 'entrance', x: 60, y: 92 },
    { type: 'exit', x: 580, y: 112 },
    { type: 'water', x: 390, y: 188, w: 50, h: 12 },
  ],
  20,
  12,
  40,
  300,
  { [Skill.Builder]: 10, [Skill.Basher]: 4, [Skill.Blocker]: 3, [Skill.Digger]: 3, [Skill.Climber]: 3 },
);

// Vertical descent: staggered shelves; walk off alternating ends (drops ~52px).
const t11 = level(
  'Descent',
  'Taxing',
  420,
  270,
  '#0c1018',
  [
    G(0, 50, 300, 14, 'marble'),
    G(120, 104, 300, 14, 'marble'),
    G(0, 158, 300, 14, 'marble'),
    G(0, 210, 420, 50, 'rock'),
  ],
  [
    { type: 'entrance', x: 60, y: 22 },
    { type: 'exit', x: 360, y: 202 },
  ],
  16,
  10,
  45,
  300,
  { [Skill.Digger]: 6, [Skill.Builder]: 6, [Skill.Floater]: 4 },
);

// Grand finale: everything at once.
const t12 = level(
  'Lemming Mountain',
  'Taxing',
  720,
  220,
  '#0a0c16',
  [
    G(0, 150, 140, 70, 'dirt'),
    G(140, 110, 80, 110, 'rock'),
    G(260, 80, 80, 140, 'brick'),
    G(380, 120, 80, 100, 'crystal'),
    G(500, 160, 220, 60, 'dirt'),
    { ...G(460, 120, 40, 100, 'steel'), steel: true },
  ],
  [
    { type: 'entrance', x: 60, y: 122 },
    { type: 'exit', x: 660, y: 152 },
    { type: 'water', x: 480, y: 208, w: 36, h: 12 },
    { type: 'trap', x: 300, y: 78, w: 14, h: 8, delay: 24 },
  ],
  24,
  14,
  35,
  360,
  {
    [Skill.Climber]: 4,
    [Skill.Floater]: 4,
    [Skill.Bomber]: 4,
    [Skill.Blocker]: 4,
    [Skill.Builder]: 12,
    [Skill.Basher]: 5,
    [Skill.Miner]: 5,
    [Skill.Digger]: 5,
  },
);

export const CAMPAIGN: Rating[] = [
  { name: 'Tame', levels: [t1, t2, t3, t4, t5] },
  { name: 'Tricky', levels: [t6, t7, t8, t9] },
  { name: 'Taxing', levels: [t10, t11, t12] },
];
