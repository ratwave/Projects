import { describe, it, expect } from 'vitest';
import {
  makePassword,
  parsePassword,
  nextLevel,
  ratingCount,
  levelsInRating,
  getLevel,
} from '../src/ui/progression';

describe('Passwords', () => {
  it('round-trip every level password back to its indices', () => {
    for (let r = 0; r < ratingCount(); r++) {
      for (let l = 0; l < levelsInRating(r); l++) {
        const pw = makePassword(r, l);
        expect(pw).toHaveLength(10);
        expect(parsePassword(pw)).toEqual({ r, l });
      }
    }
  });

  it('rejects an invalid password', () => {
    expect(parsePassword('AAAAAAAAAA')).toBeNull();
    expect(parsePassword('not a code')).toBeNull();
  });

  it('passwords are case-insensitive', () => {
    const pw = makePassword(0, 0);
    expect(parsePassword(pw.toLowerCase())).toEqual({ r: 0, l: 0 });
  });
});

describe('Level ordering', () => {
  it('advances within and across ratings', () => {
    const last0 = levelsInRating(0) - 1;
    expect(nextLevel(0, 0)).toEqual({ r: 0, l: 1 });
    expect(nextLevel(0, last0)).toEqual({ r: 1, l: 0 });
  });

  it('returns null after the final level', () => {
    const lastR = ratingCount() - 1;
    const lastL = levelsInRating(lastR) - 1;
    expect(nextLevel(lastR, lastL)).toBeNull();
  });

  it('every campaign level is well-formed', () => {
    for (let r = 0; r < ratingCount(); r++) {
      for (let l = 0; l < levelsInRating(r); l++) {
        const lv = getLevel(r, l)!;
        expect(lv.objects.some((o) => o.type === 'entrance')).toBe(true);
        expect(lv.objects.some((o) => o.type === 'exit')).toBe(true);
        expect(lv.saveCount).toBeLessThanOrEqual(lv.lemmings);
      }
    }
  });
});
