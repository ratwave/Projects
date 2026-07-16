/** The eight assignable skills, plus internal action ids used by the panel. */
export enum Skill {
  Climber = 'climber',
  Floater = 'floater',
  Bomber = 'bomber',
  Blocker = 'blocker',
  Builder = 'builder',
  Basher = 'basher',
  Miner = 'miner',
  Digger = 'digger',
}

export const SKILL_ORDER: Skill[] = [
  Skill.Climber,
  Skill.Floater,
  Skill.Bomber,
  Skill.Blocker,
  Skill.Builder,
  Skill.Basher,
  Skill.Miner,
  Skill.Digger,
];

export type SkillCounts = Record<Skill, number>;

/** Behavioural state of a lemming (its current animation/AI). */
export enum LemState {
  Faller = 'faller',
  Walker = 'walker',
  Climber = 'climber',
  ClimberTop = 'climber-top', // mantling over the top of a wall
  Floater = 'floater',
  Blocker = 'blocker',
  Builder = 'builder',
  Shrugger = 'shrugger', // builder out of bricks
  Basher = 'basher',
  Miner = 'miner',
  Digger = 'digger',
  Ohnoer = 'ohnoer', // bomber countdown reached zero, "oh no!" pose
  Exploder = 'exploder', // the explosion frame
  Splatter = 'splatter', // fatal fall
  Drowner = 'drowner', // died in water
  Burner = 'burner', // died in a trap/fire
  Exiter = 'exiter', // walking into the exit
  Dead = 'dead', // removed next tick
}

export interface LevelObject {
  type: 'entrance' | 'exit' | 'water' | 'trap';
  x: number;
  y: number;
  /** Trigger-area size (px). Defaults applied per type if omitted. */
  w?: number;
  h?: number;
  /** For traps: ticks the trap is harmless after a kill before re-arming. */
  delay?: number;
  /** Optional sprite/style hint. */
  variant?: string;
  /** Runtime: trap re-arm countdown (managed by the sim). */
  cooldown?: number;
}

export interface TerrainShape {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  style: string;
  /** Mark this region as steel (non-excavatable). */
  steel?: boolean;
  /** One-way wall direction: -1 left-only, +1 right-only. */
  oneway?: -1 | 0 | 1;
  /** Subtract terrain instead of adding it (carve holes). */
  erase?: boolean;
}

export interface LevelData {
  name: string;
  rating?: string;
  width: number;
  height: number;
  /** Background colour (CSS hex). */
  bg?: string;
  shapes: TerrainShape[];
  objects: LevelObject[];
  /** Total lemmings released this level. */
  lemmings: number;
  /** Absolute number that must be saved to pass. */
  saveCount: number;
  /** Initial release rate (1..99). */
  releaseRate: number;
  /** Time limit in seconds. */
  time: number;
  /** Available skill counts. */
  skills: Partial<SkillCounts>;
}
