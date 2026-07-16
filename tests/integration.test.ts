import { describe, it, expect } from 'vitest';
import { makeLevel, makeGame } from './helpers';

/** Run the full game loop until it ends or a tick cap is reached. */
function runToEnd(game: { step: () => void; phase: string }, maxTicks = 5000): number {
  let t = 0;
  while (game.phase === 'running' && t < maxTicks) {
    game.step();
    t++;
  }
  return t;
}

describe('Full level loop', () => {
  it('all lemmings walk from entrance to exit and the level is won', () => {
    const { game } = makeGame(
      makeLevel({
        width: 220,
        height: 120,
        shapes: [{ kind: 'rect', x: 0, y: 80, w: 220, h: 20, style: 'dirt' }],
        objects: [
          { type: 'entrance', x: 30, y: 40 },
          { type: 'exit', x: 190, y: 70 },
        ],
        lemmings: 5,
        saveCount: 5,
        releaseRate: 80,
        time: 200,
      }),
    );
    runToEnd(game);
    expect(game.phase).toBe('won');
    expect(game.saved).toBe(5);
    expect(game.dead).toBe(0);
  });

  it('lemmings walking into water all drown and the level is lost', () => {
    const { game } = makeGame(
      makeLevel({
        width: 220,
        height: 120,
        shapes: [{ kind: 'rect', x: 0, y: 80, w: 220, h: 20, style: 'dirt' }],
        objects: [
          { type: 'entrance', x: 30, y: 40 },
          { type: 'exit', x: 210, y: 70 },
          { type: 'water', x: 110, y: 78, w: 60, h: 16 },
        ],
        lemmings: 4,
        saveCount: 4,
        releaseRate: 80,
        time: 200,
      }),
    );
    runToEnd(game);
    expect(game.phase).toBe('lost');
    expect(game.saved).toBe(0);
    expect(game.dead).toBe(4);
  });

  it('spawns the correct number of lemmings over time', () => {
    const { game } = makeGame(
      makeLevel({
        width: 220,
        height: 120,
        shapes: [{ kind: 'rect', x: 0, y: 80, w: 220, h: 20, style: 'dirt' }],
        objects: [
          { type: 'entrance', x: 30, y: 40 },
          { type: 'exit', x: 190, y: 70 },
        ],
        lemmings: 6,
        saveCount: 1,
        releaseRate: 50,
        time: 200,
      }),
    );
    runToEnd(game);
    expect(game.spawned).toBe(6);
  });
});
