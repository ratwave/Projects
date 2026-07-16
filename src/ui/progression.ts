import type { LevelData } from '../engine/types';
import { CAMPAIGN } from '../levels/campaign';

export interface Rating {
  name: string;
  levels: LevelData[];
}

/** The full campaign: ordered ratings, each with ordered levels. */
export const RATINGS: Rating[] = CAMPAIGN;

export function ratingCount(): number {
  return RATINGS.length;
}

export function levelsInRating(r: number): number {
  return RATINGS[r]?.levels.length ?? 0;
}

export function getLevel(r: number, l: number): LevelData | null {
  return RATINGS[r]?.levels[l] ?? null;
}

/** The next (rating, level) after the given one, or null if the campaign is complete. */
export function nextLevel(r: number, l: number): { r: number; l: number } | null {
  if (l + 1 < levelsInRating(r)) return { r, l: l + 1 };
  if (r + 1 < ratingCount()) return { r: r + 1, l: 0 };
  return null;
}

/* ----------------------------- Passwords ----------------------------- */

const ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ'; // consonants only, avoids real words / ambiguity
const SALT = 0x5eed;

/** Deterministic 10-letter password encoding a (rating, level) pair. */
export function makePassword(r: number, l: number): string {
  const code = (r * 100 + l) ^ SALT;
  let s = '';
  let acc = code;
  for (let i = 0; i < 10; i++) {
    // Mix the index in so the password looks varied but stays deterministic.
    const v = (acc + i * 37 + ((r + 1) * (l + 7) * (i + 3))) % ALPHABET.length;
    s += ALPHABET[(v + ALPHABET.length) % ALPHABET.length];
    acc = (acc * 31 + 7) & 0xffff;
  }
  return s;
}

/** Resolve a password back to a (rating, level) by matching all valid pairs. */
export function parsePassword(pw: string): { r: number; l: number } | null {
  const norm = pw.trim().toUpperCase();
  for (let r = 0; r < ratingCount(); r++) {
    for (let l = 0; l < levelsInRating(r); l++) {
      if (makePassword(r, l) === norm) return { r, l };
    }
  }
  return null;
}

/* ----------------------------- Progress persistence ----------------------------- */

const KEY = 'lemmings-progress-v1';

interface Progress {
  /** Highest unlocked level index per rating (-1 = none beyond level 0 unlocked). */
  unlocked: number[];
}

function defaultProgress(): Progress {
  return { unlocked: RATINGS.map(() => 0) };
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultProgress();
    const p = JSON.parse(raw) as Progress;
    if (!Array.isArray(p.unlocked)) return defaultProgress();
    // Pad/truncate to current rating count.
    const unlocked = RATINGS.map((_, i) => p.unlocked[i] ?? 0);
    return { unlocked };
  } catch {
    return defaultProgress();
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore quota / privacy errors */
  }
}

/** Mark a level complete, unlocking the next one. */
export function markComplete(r: number, l: number): void {
  const p = loadProgress();
  const nxt = nextLevel(r, l);
  if (nxt && nxt.r === r) {
    p.unlocked[r] = Math.max(p.unlocked[r], nxt.l);
  } else if (nxt) {
    p.unlocked[nxt.r] = Math.max(p.unlocked[nxt.r] ?? 0, 0);
  }
  saveProgress(p);
}

export function isUnlocked(r: number, l: number): boolean {
  const p = loadProgress();
  return l <= (p.unlocked[r] ?? 0);
}
