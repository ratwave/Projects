/** Game-event identifiers emitted by the simulation (consumed by the audio layer). */
export type GameEvent =
  | 'assign'
  | 'build-step'
  | 'build-warn'
  | 'explode'
  | 'splat'
  | 'drown'
  | 'exit'
  | 'ohno'
  | 'nuke'
  | 'release'
  | 'trap'
  | 'blocker';

export type EventSink = (event: GameEvent) => void;

/** Default no-op sink (tests / headless). */
export const noopSink: EventSink = () => {};
