import type { LevelData } from '../engine/types';
import { Skill } from '../engine/types';

/**
 * Original level designs grouped into difficulty ratings. These are our own
 * layouts (not the copyrighted originals), built to teach and exercise every
 * mechanic with a rising difficulty curve. Expanded further in later content.
 */

interface Rating {
  name: string;
  levels: LevelData[];
}

const noSkills = {};

/* ----------------------------- TAME ----------------------------- */

const justWalk: LevelData = {
  name: 'A Gentle Stroll',
  rating: 'Tame',
  width: 480,
  height: 160,
  bg: '#0e1430',
  shapes: [{ kind: 'rect', x: 0, y: 120, w: 480, h: 40, style: 'dirt' }],
  objects: [
    { type: 'entrance', x: 70, y: 92 },
    { type: 'exit', x: 420, y: 112 },
  ],
  lemmings: 10,
  saveCount: 8,
  releaseRate: 50,
  time: 120,
  skills: noSkills,
};

const digDown: LevelData = {
  name: 'The Only Way Is Down',
  rating: 'Tame',
  width: 480,
  height: 200,
  bg: '#101a2e',
  shapes: [
    // upper plateau the lemmings start on
    { kind: 'rect', x: 0, y: 70, w: 480, h: 34, style: 'dirt' },
    // lower ground with the exit
    { kind: 'rect', x: 0, y: 170, w: 480, h: 30, style: 'rock' },
  ],
  objects: [
    { type: 'entrance', x: 70, y: 42 },
    { type: 'exit', x: 240, y: 162 },
  ],
  lemmings: 10,
  saveCount: 5,
  releaseRate: 50,
  time: 180,
  skills: { [Skill.Digger]: 3 },
};

const bridgeIt: LevelData = {
  name: 'Mind the Gap',
  rating: 'Tame',
  width: 520,
  height: 160,
  bg: '#0e1830',
  shapes: [
    { kind: 'rect', x: 0, y: 120, w: 200, h: 40, style: 'dirt' },
    { kind: 'rect', x: 320, y: 120, w: 200, h: 40, style: 'dirt' },
    // water in the gap
  ],
  objects: [
    { type: 'entrance', x: 70, y: 92 },
    { type: 'exit', x: 460, y: 112 },
    { type: 'water', x: 260, y: 140, w: 120, h: 20 },
  ],
  lemmings: 10,
  saveCount: 6,
  releaseRate: 40,
  time: 240,
  skills: { [Skill.Builder]: 8, [Skill.Blocker]: 2 },
};

const blockAndDig: LevelData = {
  name: 'Hold the Line',
  rating: 'Tame',
  width: 520,
  height: 200,
  bg: '#121226',
  shapes: [
    { kind: 'rect', x: 0, y: 70, w: 520, h: 30, style: 'marble' },
    { kind: 'rect', x: 0, y: 170, w: 520, h: 30, style: 'rock' },
  ],
  objects: [
    { type: 'entrance', x: 260, y: 42 },
    { type: 'exit', x: 60, y: 162 },
  ],
  lemmings: 12,
  saveCount: 6,
  releaseRate: 50,
  time: 200,
  skills: { [Skill.Digger]: 2, [Skill.Blocker]: 3, [Skill.Builder]: 4 },
};

/* ----------------------------- TRICKY ----------------------------- */

const climbOut: LevelData = {
  name: 'Scale the Heights',
  rating: 'Tricky',
  width: 480,
  height: 200,
  bg: '#0c1020',
  shapes: [
    { kind: 'rect', x: 0, y: 160, w: 480, h: 40, style: 'rock' },
    // tall wall penning the lemmings in
    { kind: 'rect', x: 150, y: 40, w: 18, h: 120, style: 'brick' },
    { kind: 'rect', x: 0, y: 40, w: 18, h: 120, style: 'steel', steel: true },
  ],
  objects: [
    { type: 'entrance', x: 70, y: 132 },
    { type: 'exit', x: 420, y: 152 },
  ],
  lemmings: 10,
  saveCount: 7,
  releaseRate: 50,
  time: 200,
  skills: { [Skill.Climber]: 4, [Skill.Floater]: 4, [Skill.Builder]: 6 },
};

const bashThrough: LevelData = {
  name: 'Through the Wall',
  rating: 'Tricky',
  width: 520,
  height: 160,
  bg: '#160e1e',
  shapes: [
    { kind: 'rect', x: 0, y: 120, w: 520, h: 40, style: 'dirt' },
    { kind: 'rect', x: 240, y: 60, w: 50, h: 60, style: 'rock' },
    // steel cap on top so they can't go over easily
    { kind: 'rect', x: 240, y: 52, w: 50, h: 8, style: 'steel', steel: true },
  ],
  objects: [
    { type: 'entrance', x: 60, y: 92 },
    { type: 'exit', x: 470, y: 112 },
  ],
  lemmings: 12,
  saveCount: 9,
  releaseRate: 50,
  time: 200,
  skills: { [Skill.Basher]: 3, [Skill.Builder]: 4 },
};

export const CAMPAIGN: Rating[] = [
  { name: 'Tame', levels: [justWalk, digDown, bridgeIt, blockAndDig] },
  { name: 'Tricky', levels: [climbOut, bashThrough] },
];
