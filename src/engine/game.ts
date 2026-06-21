import { Level } from './level';
import { Lemming } from './lemming';
import { LemState, Skill, SKILL_ORDER } from './types';
import type { SkillCounts } from './types';
import { Rng } from './rng';
import { EventSink, noopSink } from './events';
import {
  releaseInterval,
  RR_MIN,
  RR_MAX,
  TICK_MS,
  BLOCKER_REACH,
  LEM_HEIGHT,
  BOMB_COUNTDOWN_SEC,
  DEFAULT_SEED,
} from './constants';
import { dispatch } from './sim';

export type GamePhase = 'running' | 'won' | 'lost';

/** Per-tick simulation of an entire level. */
export class Game {
  readonly level: Level;
  readonly rng: Rng;
  events: EventSink = noopSink;

  lemmings: Lemming[] = [];

  /** Remaining counts per skill. */
  skills: SkillCounts;

  /** Current and initial release rate. */
  releaseRate: number;
  readonly initialReleaseRate: number;

  /** Total to release, and how many have entered so far. */
  readonly totalLemmings: number;
  spawned = 0;
  /** Currently active on the level ("OUT"). */
  out = 0;
  /** Reached an exit ("IN"). */
  saved = 0;
  /** Died. */
  dead = 0;

  /** Required saves to pass. */
  readonly required: number;

  /** Ticks elapsed; level time budget in ticks. */
  tick = 0;
  readonly timeLimitTicks: number;

  /** Tick countdown until the next spawn. */
  private spawnTimer = 0;
  /** Round-robin index over entrances. */
  private entranceIndex = 0;
  /** Whether the entrance trapdoors have finished opening. */
  private startDelay = Math.round(1500 / TICK_MS);

  phase: GamePhase = 'running';

  /** Nuke in progress: each tick converts the next lemming to a bomber. */
  nuking = false;
  private nukeIndex = 0;

  constructor(level: Level, seed = DEFAULT_SEED) {
    this.level = level;
    this.rng = new Rng(seed);
    this.totalLemmings = level.data.lemmings;
    this.required = level.data.saveCount;
    this.releaseRate = level.data.releaseRate;
    this.initialReleaseRate = level.data.releaseRate;
    this.timeLimitTicks = Math.round((level.data.time * 1000) / TICK_MS);
    this.skills = {
      [Skill.Climber]: level.data.skills[Skill.Climber] ?? 0,
      [Skill.Floater]: level.data.skills[Skill.Floater] ?? 0,
      [Skill.Bomber]: level.data.skills[Skill.Bomber] ?? 0,
      [Skill.Blocker]: level.data.skills[Skill.Blocker] ?? 0,
      [Skill.Builder]: level.data.skills[Skill.Builder] ?? 0,
      [Skill.Basher]: level.data.skills[Skill.Basher] ?? 0,
      [Skill.Miner]: level.data.skills[Skill.Miner] ?? 0,
      [Skill.Digger]: level.data.skills[Skill.Digger] ?? 0,
    };
    this.spawnTimer = 0;
  }

  /** Seconds remaining (for the on-screen clock). */
  get secondsLeft(): number {
    return Math.max(0, Math.ceil(((this.timeLimitTicks - this.tick) * TICK_MS) / 1000));
  }

  /** Percentage saved (of total). */
  get savedPercent(): number {
    return Math.floor((this.saved / this.totalLemmings) * 100);
  }

  /** Whether all lemmings have been released. */
  get allSpawned(): boolean {
    return this.spawned >= this.totalLemmings;
  }

  /* ----------------------------- main step ----------------------------- */

  step(): void {
    if (this.phase !== 'running') return;
    this.tick++;

    // Trapdoor opening delay before the first lemming drops.
    if (this.startDelay > 0) {
      this.startDelay--;
    } else {
      this.handleSpawning();
    }

    if (this.nuking) this.handleNuke();

    // Update lemmings (snapshot length; new spawns this tick already added).
    for (const lem of this.lemmings) {
      if (lem.removed) continue;
      dispatch(lem, this.ctx());
    }

    // Reap removed lemmings and tally outcomes.
    if (this.lemmings.some((l) => l.removed)) {
      const next: Lemming[] = [];
      for (const lem of this.lemmings) {
        if (lem.removed) {
          this.out--;
          if (lem.outcome === 'saved') this.saved++;
          else this.dead++;
        } else {
          next.push(lem);
        }
      }
      this.lemmings = next;
    }

    this.evaluate();
  }

  private ctxCache: SimContext | null = null;
  /** Public accessor for the simulation context (used by tests/tools). */
  context(): SimContext {
    return this.ctx();
  }
  private ctx(): SimContext {
    if (!this.ctxCache) {
      this.ctxCache = {
        terrain: this.level.terrain,
        level: this.level,
        game: this,
        rng: this.rng,
        emit: (e) => this.events(e),
      };
    }
    return this.ctxCache;
  }

  private handleSpawning(): void {
    if (this.allSpawned) return;
    if (this.spawnTimer > 0) {
      this.spawnTimer--;
      return;
    }
    this.spawn();
    this.spawnTimer = releaseInterval(this.releaseRate);
  }

  private spawn(): void {
    const entrances = this.level.entrances;
    if (entrances.length === 0) return;
    const e = entrances[this.entranceIndex % entrances.length];
    this.entranceIndex++;
    const lem = new Lemming(e.x, e.y + 8, 1, LemState.Faller);
    lem.fallDistance = 0;
    this.lemmings.push(lem);
    this.spawned++;
    this.out++;
    this.events('release');
  }

  private handleNuke(): void {
    // Convert one lemming per tick to a ticking bomber for the cascade effect.
    while (this.nukeIndex < this.lemmings.length) {
      const lem = this.lemmings[this.nukeIndex++];
      if (!lem.removed && lem.bombTicks < 0 && lem.state !== LemState.Exiter) {
        lem.bombTicks = Math.round((BOMB_COUNTDOWN_SEC * 1000) / TICK_MS);
        return;
      }
    }
  }

  private evaluate(): void {
    if (this.phase !== 'running') return;
    const noneLeft = this.allSpawned && this.out === 0;
    const timeUp = this.tick >= this.timeLimitTicks;
    if (timeUp || noneLeft) {
      this.phase = this.saved >= this.required ? 'won' : 'lost';
    }
  }

  /* ----------------------------- player actions ----------------------------- */

  /** Adjust release rate within [initial, 99]. */
  changeReleaseRate(delta: number): void {
    const next = Math.max(this.initialReleaseRate, Math.min(RR_MAX, this.releaseRate + delta));
    this.releaseRate = Math.max(RR_MIN, next);
  }

  /**
   * Attempt to assign a skill to the lemming. Returns true on success.
   * `onlyWalkers` restricts targeting to plain walkers (right-button modifier).
   */
  assignSkill(lem: Lemming, skill: Skill): boolean {
    if (this.skills[skill] <= 0) return false;
    if (!this.canAssign(lem, skill)) return false;

    switch (skill) {
      case Skill.Climber:
        if (lem.climber) return false;
        lem.climber = true;
        break;
      case Skill.Floater:
        if (lem.floater) return false;
        lem.floater = true;
        break;
      case Skill.Bomber:
        if (lem.bombTicks >= 0) return false;
        lem.bombTicks = Math.round((BOMB_COUNTDOWN_SEC * 1000) / TICK_MS);
        break;
      case Skill.Blocker:
        lem.setState(LemState.Blocker);
        break;
      case Skill.Builder:
        lem.bricksLeft = 0; // initialised by the builder handler
        lem.setState(LemState.Builder);
        break;
      case Skill.Basher:
        lem.setState(LemState.Basher);
        break;
      case Skill.Miner:
        lem.setState(LemState.Miner);
        break;
      case Skill.Digger:
        lem.setState(LemState.Digger);
        break;
    }
    this.skills[skill]--;
    this.events('assign');
    return true;
  }

  /** Whether a skill could legally be assigned to this lemming right now. */
  canAssign(lem: Lemming, skill: Skill): boolean {
    if (lem.removed) return false;
    // Dead/transition states cannot receive skills.
    const dying: LemState[] = [
      LemState.Splatter,
      LemState.Drowner,
      LemState.Burner,
      LemState.Exiter,
      LemState.Exploder,
      LemState.Ohnoer,
      LemState.Dead,
    ];
    if (dying.includes(lem.state)) return false;

    if (skill === Skill.Climber) return !lem.climber;
    if (skill === Skill.Floater) return !lem.floater;

    // A blocker can only be removed by a bomber (not re-tasked to anything else).
    if (lem.state === LemState.Blocker && skill !== Skill.Bomber) return false;

    if (skill === Skill.Bomber) return lem.bombTicks < 0;
    return true;
  }

  /** Begin the nuke sequence (all lemmings explode). */
  nuke(): void {
    if (this.nuking) return;
    this.nuking = true;
    this.nukeIndex = 0;
    this.events('nuke');
  }

  /** Find the topmost selectable lemming under a world point. */
  pick(wx: number, wy: number, onlyWalkers: boolean): Lemming | null {
    let best: Lemming | null = null;
    for (const lem of this.lemmings) {
      if (lem.removed) continue;
      const left = lem.x - 3;
      const right = lem.x + 3;
      const top = lem.y - LEM_HEIGHT;
      const bottom = lem.y + 1;
      if (wx < left || wx > right || wy < top || wy > bottom) continue;
      if (onlyWalkers && lem.state !== LemState.Walker) continue;
      // Prefer the most "interesting" lemming: later-added (on top) wins ties.
      if (!best) best = lem;
      else if (priority(lem) >= priority(best)) best = lem;
    }
    return best;
  }

  /** Count selectable lemmings under a point (for the status line). */
  countUnder(wx: number, wy: number): number {
    let n = 0;
    for (const lem of this.lemmings) {
      if (lem.removed) continue;
      if (Math.abs(wx - lem.x) <= 3 && wy >= lem.y - LEM_HEIGHT && wy <= lem.y + 1) n++;
    }
    return n;
  }

  /** Is there a blocker whose field contains (x,y)? Returns its facing repel dir or 0. */
  blockerRepel(x: number, y: number): number {
    for (const lem of this.lemmings) {
      if (lem.removed || lem.state !== LemState.Blocker) continue;
      if (Math.abs(y - lem.y) > LEM_HEIGHT) continue;
      const dx = x - lem.x;
      if (Math.abs(dx) <= BLOCKER_REACH) {
        // Repel away from the blocker centre.
        return dx >= 0 ? +1 : -1;
      }
    }
    return 0;
  }

  /** Is a blocker standing on the given pixel column/row (so digging frees it)? */
  blockerAtGround(x: number, y: number): Lemming | null {
    for (const lem of this.lemmings) {
      if (lem.removed || lem.state !== LemState.Blocker) continue;
      if (Math.abs(x - lem.x) <= 4 && Math.abs(y - (lem.y + 1)) <= 2) return lem;
    }
    return null;
  }

  /** Distinct number of available skill types (for UI). */
  static skillOrder(): Skill[] {
    return SKILL_ORDER;
  }
}

function priority(lem: Lemming): number {
  // Non-walkers are usually the intended target when overlapping a walker crowd.
  const order: Record<string, number> = {
    [LemState.Blocker]: 5,
    [LemState.Builder]: 5,
    [LemState.Basher]: 5,
    [LemState.Miner]: 5,
    [LemState.Digger]: 5,
    [LemState.Climber]: 4,
    [LemState.Floater]: 4,
    [LemState.Faller]: 3,
    [LemState.Walker]: 2,
  };
  return order[lem.state] ?? 1;
}

/** Context passed to every state handler. */
export interface SimContext {
  terrain: import('./terrain').Terrain;
  level: Level;
  game: Game;
  rng: Rng;
  emit: EventSink;
}
