import { describe, it, expect } from 'vitest';
import { releaseInterval } from '../src/engine/constants';

describe('releaseInterval (DOS formula floor((99-RR)/2)+4)', () => {
  it('RR 99 and 98 behave identically (truncating division)', () => {
    expect(releaseInterval(99)).toBe(4);
    expect(releaseInterval(98)).toBe(4);
  });

  it('RR 1 yields the slowest cadence', () => {
    // floor((99-1)/2)+4 = 49+4 = 53
    expect(releaseInterval(1)).toBe(53);
  });

  it('mid value', () => {
    // floor((99-50)/2)+4 = 24+4 = 28
    expect(releaseInterval(50)).toBe(28);
  });

  it('clamps out-of-range input', () => {
    expect(releaseInterval(200)).toBe(releaseInterval(99));
    expect(releaseInterval(-5)).toBe(releaseInterval(1));
  });
});
