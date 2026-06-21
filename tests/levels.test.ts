import { describe, it, expect } from 'vitest';
import { CAMPAIGN } from '../src/levels/campaign';
import { buildLevel } from '../src/engine/level';
import { Lemming } from '../src/engine/lemming';
import { LemState, Skill } from '../src/engine/types';
import { dispatch } from '../src/engine/sim';
import { Game } from '../src/engine/game';
import { makeGame } from './helpers';
import { runWithStrategy } from './helpers';

/** Drop a single test lemming at an entrance and report its settled state. */
function dropAtEntrance(data: ReturnType<typeof buildLevel>['data'], ex: number, ey: number): LemState {
  const level = buildLevel(data);
  const game = new Game(level);
  const lem = new Lemming(ex, ey + 8, 1, LemState.Faller);
  game.lemmings.push(lem);
  const ctx = game.context();
  for (let i = 0; i < 120; i++) {
    if (lem.removed) break;
    dispatch(lem, ctx);
    if (lem.state === LemState.Walker || lem.state === LemState.Splatter) break;
  }
  return lem.state;
}

describe('Campaign level geometry', () => {
  for (const rating of CAMPAIGN) {
    for (const data of rating.levels) {
      it(`[${rating.name}] "${data.name}" — entrance drops are survivable`, () => {
        for (const o of data.objects) {
          if (o.type !== 'entrance') continue;
          const state = dropAtEntrance(data, o.x, o.y);
          expect(state, `entrance at (${o.x},${o.y}) caused: ${state}`).not.toBe(LemState.Splatter);
        }
      });
    }
  }

  it('all levels have an entrance and an exit and a sane save target', () => {
    for (const rating of CAMPAIGN) {
      for (const data of rating.levels) {
        expect(data.objects.some((o) => o.type === 'entrance')).toBe(true);
        expect(data.objects.some((o) => o.type === 'exit')).toBe(true);
        expect(data.saveCount).toBeGreaterThan(0);
        expect(data.saveCount).toBeLessThanOrEqual(data.lemmings);
      }
    }
  });
});

describe('Campaign solvability (scripted strategies)', () => {
  it('"A Gentle Stroll" is won with no input', () => {
    const data = CAMPAIGN[0].levels[0];
    const { game } = makeGame(data);
    runWithStrategy(game, () => {});
    expect(game.phase).toBe('won');
  });

  it('"The Only Way Is Down" is solved by digging above the exit', () => {
    const data = CAMPAIGN[0].levels[1]; // t2
    const { game } = makeGame(data);
    runWithStrategy(game, (g) => {
      for (const lem of g.lemmings) {
        if (
          lem.state === LemState.Walker &&
          lem.y < 120 && // still on the plateau
          lem.x >= 146 &&
          lem.x <= 158 &&
          g.skills[Skill.Digger] > 0
        ) {
          g.assignSkill(lem, Skill.Digger);
        }
      }
    });
    expect(game.phase).toBe('won');
    expect(game.saved).toBeGreaterThanOrEqual(data.saveCount);
  });

  it('"Through the Wall" is solved by bashing through', () => {
    const data = CAMPAIGN[0].levels[4]; // t5
    const { game } = makeGame(data);
    runWithStrategy(game, (g) => {
      for (const lem of g.lemmings) {
        if (
          lem.state === LemState.Walker &&
          lem.dir === 1 &&
          lem.x >= 246 &&
          lem.x <= 251 &&
          g.skills[Skill.Basher] > 0
        ) {
          g.assignSkill(lem, Skill.Basher);
        }
      }
    });
    expect(game.phase).toBe('won');
    expect(game.saved).toBeGreaterThanOrEqual(data.saveCount);
  });
});
