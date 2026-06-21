import { describe, it, expect } from 'vitest';
import { makeLevel, makeGame, addLemming, stepLemming } from './helpers';
import { LemState, Skill } from '../src/engine/types';
import { WALK_SPEED, MAX_FALL } from '../src/engine/constants';

const ground = (y: number, w = 200): { kind: 'rect'; x: number; y: number; w: number; h: number; style: string } => ({
  kind: 'rect',
  x: 0,
  y,
  w,
  h: 8,
  style: 'dirt',
});

describe('Walker', () => {
  it('walks forward at WALK_SPEED on flat ground', () => {
    const { game } = makeGame(makeLevel({ shapes: [ground(100)] }));
    const lem = addLemming(game, 50, 99, 1, LemState.Walker);
    stepLemming(game, lem, 1);
    expect(lem.x).toBe(50 + WALK_SPEED);
    expect(lem.state).toBe(LemState.Walker);
  });

  it('reverses at a tall wall', () => {
    const { game } = makeGame(
      makeLevel({
        shapes: [ground(100), { kind: 'rect', x: 80, y: 60, w: 6, h: 40, style: 'rock' }],
      }),
    );
    const lem = addLemming(game, 60, 99, 1, LemState.Walker);
    for (let i = 0; i < 30; i++) stepLemming(game, lem, 1);
    expect(lem.dir).toBe(-1);
  });

  it('falls off a ledge and becomes a faller', () => {
    const { game } = makeGame(makeLevel({ shapes: [{ kind: 'rect', x: 0, y: 100, w: 60, h: 8, style: 'dirt' }] }));
    const lem = addLemming(game, 50, 99, 1, LemState.Walker);
    for (let i = 0; i < 10; i++) stepLemming(game, lem, 1);
    expect([LemState.Faller, LemState.Walker]).toContain(lem.state);
    expect(lem.x).toBeGreaterThan(58);
  });

  it('climbs a shallow slope', () => {
    // staircase slope made of stacked rects
    const shapes = [ground(100)];
    for (let i = 0; i < 10; i++) {
      shapes.push({ kind: 'rect', x: 80 + i * 4, y: 100 - i * 3, w: 4, h: 60, style: 'rock' });
    }
    const { game } = makeGame(makeLevel({ shapes }));
    const lem = addLemming(game, 60, 99, 1, LemState.Walker);
    const startY = lem.y;
    for (let i = 0; i < 40; i++) stepLemming(game, lem, 1);
    expect(lem.y).toBeLessThan(startY); // ascended the slope
  });
});

describe('Faller & splat', () => {
  it('survives a short fall', () => {
    const { game } = makeGame(
      makeLevel({
        height: 200,
        shapes: [
          { kind: 'rect', x: 0, y: 40, w: 40, h: 4, style: 'dirt' }, // ledge
          { kind: 'rect', x: 0, y: 40 + 20, w: 200, h: 8, style: 'dirt' }, // floor 20px below
        ],
      }),
    );
    const lem = addLemming(game, 38, 39, 1, LemState.Walker);
    for (let i = 0; i < 60; i++) stepLemming(game, lem, 1);
    expect(lem.removed).toBe(false);
    expect(lem.state).not.toBe(LemState.Splatter);
  });

  it('splats on a long fall', () => {
    const fallH = MAX_FALL + 30;
    const { game } = makeGame(
      makeLevel({
        height: 200,
        shapes: [
          { kind: 'rect', x: 0, y: 20, w: 40, h: 4, style: 'dirt' },
          { kind: 'rect', x: 0, y: 20 + fallH, w: 200, h: 8, style: 'dirt' },
        ],
      }),
    );
    const lem = addLemming(game, 38, 19, 1, LemState.Walker);
    let splatted = false;
    for (let i = 0; i < 120; i++) {
      stepLemming(game, lem, 1);
      if (lem.state === LemState.Splatter) splatted = true;
    }
    expect(splatted).toBe(true);
  });

  it('floater never splats from a huge fall', () => {
    const fallH = MAX_FALL + 80;
    const { game } = makeGame(
      makeLevel({
        height: 300,
        shapes: [
          { kind: 'rect', x: 0, y: 20, w: 40, h: 4, style: 'dirt' },
          { kind: 'rect', x: 0, y: 20 + fallH, w: 200, h: 8, style: 'dirt' },
        ],
      }),
    );
    const lem = addLemming(game, 38, 19, 1, LemState.Walker);
    lem.floater = true;
    let splatted = false;
    for (let i = 0; i < 300; i++) {
      stepLemming(game, lem, 1);
      if (lem.state === LemState.Splatter) splatted = true;
    }
    expect(splatted).toBe(false);
  });
});

describe('Exit & hazards', () => {
  it('reaching the exit marks the lemming saved', () => {
    const { game } = makeGame(
      makeLevel({ shapes: [ground(100)], objects: [
        { type: 'entrance', x: 10, y: 10 },
        { type: 'exit', x: 90, y: 92 },
      ] }),
    );
    const lem = addLemming(game, 70, 99, 1, LemState.Walker);
    for (let i = 0; i < 40; i++) {
      stepLemming(game, lem, 1);
      if (lem.removed) break;
    }
    expect(lem.outcome).toBe('saved');
  });

  it('water drowns the lemming', () => {
    const { game } = makeGame(
      makeLevel({ shapes: [ground(100, 60)], objects: [
        { type: 'entrance', x: 10, y: 10 },
        { type: 'exit', x: 190, y: 92 },
        { type: 'water', x: 80, y: 100, w: 40, h: 16 },
      ] }),
    );
    const lem = addLemming(game, 58, 99, 1, LemState.Walker);
    let drowned = false;
    for (let i = 0; i < 60; i++) {
      stepLemming(game, lem, 1);
      if (lem.state === LemState.Drowner) drowned = true;
      if (lem.removed) break;
    }
    expect(drowned).toBe(true);
  });
});
