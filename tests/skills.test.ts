import { describe, it, expect } from 'vitest';
import { makeLevel, makeGame, addLemming, stepLemming, stepAll } from './helpers';
import { LemState, Skill } from '../src/engine/types';
import { BUILDER_BRICKS } from '../src/engine/constants';

const solidBlock = (x: number, y: number, w: number, h: number, style = 'rock', steel = false) => ({
  kind: 'rect' as const,
  x,
  y,
  w,
  h,
  style,
  steel,
});

describe('Blocker', () => {
  it('reverses an approaching walker', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 100, 200, 8, 'dirt')] }));
    addLemming(game, 100, 99, 1, LemState.Blocker);
    const walker = addLemming(game, 80, 99, 1, LemState.Walker);
    stepAll(game, 40);
    expect(walker.dir).toBe(-1);
    expect(walker.x).toBeLessThan(100);
  });
});

describe('Builder', () => {
  it('lays 12 bricks and rises diagonally', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 100, 200, 8, 'dirt')] }));
    const lem = addLemming(game, 50, 99, 1, LemState.Builder);
    const startY = lem.y;
    const startX = lem.x;
    let shrugged = false;
    let minY = lem.y;
    let maxX = lem.x;
    for (let i = 0; i < 12 * 12 + 40; i++) {
      stepLemming(game, lem, 1);
      if (lem.state === LemState.Shrugger) shrugged = true;
      minY = Math.min(minY, lem.y);
      maxX = Math.max(maxX, lem.x);
    }
    expect(shrugged).toBe(true);
    // Used all bricks => rose roughly BUILDER_BRICKS px and advanced forward.
    expect(startY - minY).toBeGreaterThanOrEqual(BUILDER_BRICKS - 2);
    expect(maxX).toBeGreaterThan(startX);
    // Bricks were laid (terrain became solid where the first brick went down).
    const t = game.level.terrain;
    expect(t.isSolidRaw(startX + 2, startY)).toBe(true);
    // And a higher step exists above the original floor.
    expect(t.isSolidRaw(startX + 10, startY - 4)).toBe(true);
  });
});

describe('Basher', () => {
  it('carves horizontally and stops at steel', () => {
    const { game } = makeGame(
      makeLevel({
        shapes: [
          solidBlock(0, 100, 200, 8, 'dirt'),
          solidBlock(60, 80, 56, 24, 'rock'), // diggable wall x60..115
          solidBlock(116, 80, 8, 24, 'steel', true), // steel beyond x116..123
        ],
      }),
    );
    // Start adjacent to the wall so there is solid directly ahead to bash.
    const lem = addLemming(game, 62, 99, 1, LemState.Basher);
    for (let i = 0; i < 300; i++) stepLemming(game, lem, 1);
    const t = game.level.terrain;
    // Carved through the rock.
    expect(t.isSolidRaw(80, 96)).toBe(false);
    // Steel is intact.
    expect(t.isSolidRaw(118, 96)).toBe(true);
    // Did not bash past the steel.
    expect(lem.x).toBeLessThan(120);
  });
});

describe('Digger', () => {
  it('digs straight down through dirt', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 60, 200, 60, 'dirt')] }));
    const lem = addLemming(game, 100, 61, 1, LemState.Digger);
    const startY = lem.y;
    for (let i = 0; i < 60; i++) stepLemming(game, lem, 1);
    expect(lem.y).toBeGreaterThan(startY + 6);
    const t = game.level.terrain;
    expect(t.isSolidRaw(100, startY + 2)).toBe(false); // dug out above current pos
  });

  it('stops at steel', () => {
    const { game } = makeGame(
      makeLevel({
        shapes: [solidBlock(0, 60, 200, 20, 'dirt'), solidBlock(0, 80, 200, 20, 'steel', true)],
      }),
    );
    const lem = addLemming(game, 100, 61, 1, LemState.Digger);
    for (let i = 0; i < 80; i++) stepLemming(game, lem, 1);
    // Should not have dug below the steel boundary.
    expect(lem.y).toBeLessThanOrEqual(80);
    expect([LemState.Walker, LemState.Digger]).toContain(lem.state);
  });
});

describe('Miner', () => {
  it('tunnels diagonally downward', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 60, 200, 60, 'dirt')] }));
    const lem = addLemming(game, 60, 61, 1, LemState.Miner);
    const startX = lem.x;
    const startY = lem.y;
    for (let i = 0; i < 60; i++) stepLemming(game, lem, 1);
    expect(lem.x).toBeGreaterThan(startX);
    expect(lem.y).toBeGreaterThan(startY);
  });
});

describe('Climber', () => {
  it('climbs a tall wall and mantles on top', () => {
    const { game } = makeGame(
      makeLevel({
        shapes: [
          solidBlock(0, 100, 200, 8, 'dirt'),
          solidBlock(90, 40, 10, 60, 'rock'), // wall from y=40..99
        ],
      }),
    );
    const lem = addLemming(game, 85, 99, 1, LemState.Walker);
    lem.climber = true;
    let climbed = false;
    let minY = lem.y;
    for (let i = 0; i < 200; i++) {
      stepLemming(game, lem, 1);
      if (lem.state === LemState.Climber) climbed = true;
      minY = Math.min(minY, lem.y);
      if (lem.removed) break;
    }
    expect(climbed).toBe(true);
    // Climbed up to (near) the top of the 60px wall.
    expect(minY).toBeLessThan(50);
  });
});

describe('Bomber', () => {
  it('counts down then craters terrain', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 100, 200, 20, 'dirt')] }));
    // Use a blocker so it stays put while the fuse burns.
    const lem = addLemming(game, 100, 99, 1, LemState.Blocker);
    game.assignSkill(lem, Skill.Bomber);
    expect(lem.bombTicks).toBeGreaterThan(0);
    let exploded = false;
    for (let i = 0; i < 200; i++) {
      stepLemming(game, lem, 1);
      if (lem.state === LemState.Exploder) exploded = true;
      if (lem.removed) break;
    }
    expect(exploded).toBe(true);
    const t = game.level.terrain;
    expect(t.isSolidRaw(100, 101)).toBe(false); // crater removed terrain
  });

  it('explosion does not remove steel', () => {
    const { game } = makeGame(
      makeLevel({ shapes: [solidBlock(0, 100, 200, 20, 'steel', true)] }),
    );
    const lem = addLemming(game, 100, 99, 1, LemState.Blocker);
    game.assignSkill(lem, Skill.Bomber);
    for (let i = 0; i < 200; i++) {
      stepLemming(game, lem, 1);
      if (lem.removed) break;
    }
    const t = game.level.terrain;
    expect(t.isSolidRaw(100, 105)).toBe(true); // steel survived
  });
});

describe('Skill assignment rules', () => {
  it('blocker can only be removed by bomber', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 100, 200, 8, 'dirt')] }));
    const lem = addLemming(game, 100, 99, 1, LemState.Blocker);
    expect(game.assignSkill(lem, Skill.Basher)).toBe(false);
    expect(game.canAssign(lem, Skill.Bomber)).toBe(true);
  });

  it('decrements skill counts on assignment', () => {
    const { game } = makeGame(makeLevel({ shapes: [solidBlock(0, 100, 200, 8, 'dirt')] }));
    const lem = addLemming(game, 100, 99, 1, LemState.Walker);
    const before = game.skills[Skill.Digger];
    expect(game.assignSkill(lem, Skill.Digger)).toBe(true);
    expect(game.skills[Skill.Digger]).toBe(before - 1);
  });
});
