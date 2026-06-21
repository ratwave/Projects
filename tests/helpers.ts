import { buildLevel, Level } from '../src/engine/level';
import { Game } from '../src/engine/game';
import { Lemming } from '../src/engine/lemming';
import { LemState, Skill } from '../src/engine/types';
import type { LevelData, TerrainShape, LevelObject } from '../src/engine/types';
import { dispatch } from '../src/engine/sim';

const ALL_SKILLS = {
  [Skill.Climber]: 99,
  [Skill.Floater]: 99,
  [Skill.Bomber]: 99,
  [Skill.Blocker]: 99,
  [Skill.Builder]: 99,
  [Skill.Basher]: 99,
  [Skill.Miner]: 99,
  [Skill.Digger]: 99,
};

export function makeLevel(opts: {
  width?: number;
  height?: number;
  shapes?: TerrainShape[];
  objects?: LevelObject[];
  lemmings?: number;
  saveCount?: number;
  releaseRate?: number;
  time?: number;
}): LevelData {
  return {
    name: 'test',
    width: opts.width ?? 200,
    height: opts.height ?? 120,
    shapes: opts.shapes ?? [],
    objects: opts.objects ?? [
      { type: 'entrance', x: 20, y: 10 },
      { type: 'exit', x: 180, y: 100 },
    ],
    lemmings: opts.lemmings ?? 10,
    saveCount: opts.saveCount ?? 1,
    releaseRate: opts.releaseRate ?? 50,
    time: opts.time ?? 300,
    skills: ALL_SKILLS,
  };
}

export function makeGame(data: LevelData): { game: Game; level: Level } {
  const level = buildLevel(data);
  const game = new Game(level);
  return { game, level };
}

/** Add a lemming in a given state to a game (bypassing the spawner). */
export function addLemming(
  game: Game,
  x: number,
  y: number,
  dir = 1,
  state: LemState = LemState.Walker,
): Lemming {
  const lem = new Lemming(x, y, dir, state);
  game.lemmings.push(lem);
  game.out++;
  game.spawned++;
  return lem;
}

/** Tick a single lemming N times via the dispatch (no spawning). */
export function stepLemming(game: Game, lem: Lemming, ticks: number): void {
  const ctx = game.context();
  for (let i = 0; i < ticks; i++) {
    if (lem.removed) break;
    dispatch(lem, ctx);
  }
}

/** Tick all lemmings in the game N times (no spawning). */
export function stepAll(game: Game, ticks: number): void {
  const ctx = game.context();
  for (let i = 0; i < ticks; i++) {
    for (const lem of game.lemmings) {
      if (!lem.removed) dispatch(lem, ctx);
    }
  }
}
