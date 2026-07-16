/**
 * Original chiptune music, generated at runtime from oscillators — no sampled or
 * copyrighted audio. Tracks are our own compositions expressed on a 16th-note
 * grid (MIDI note numbers; 0 = rest) and scheduled with a look-ahead timer.
 */

export interface Track {
  bpm: number;
  /** Lead melody, one entry per 16th note. 0 = rest. */
  melody: number[];
  /** Bass line, one entry per 16th note. 0 = rest. */
  bass: number[];
}

// An upbeat, bouncy in-level theme (original composition, C-major flavoured).
const level: Track = {
  bpm: 132,
  melody: [
    72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 74, 0, 72, 0,
    71, 0, 74, 0, 79, 0, 77, 0, 76, 0, 72, 0, 74, 0, 0, 0,
    72, 0, 79, 0, 84, 0, 79, 0, 77, 0, 81, 0, 77, 0, 74, 0,
    76, 0, 79, 0, 83, 0, 79, 0, 72, 0, 0, 0, 0, 0, 0, 0,
  ],
  bass: [
    48, 0, 0, 0, 48, 0, 0, 0, 50, 0, 0, 0, 50, 0, 0, 0,
    43, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0,
    45, 0, 0, 0, 45, 0, 0, 0, 41, 0, 0, 0, 41, 0, 0, 0,
    43, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0, 48, 0, 0, 0,
  ],
};

// A calmer, gentler menu theme (original composition).
const menu: Track = {
  bpm: 100,
  melody: [
    64, 0, 67, 0, 71, 0, 67, 0, 69, 0, 72, 0, 69, 0, 67, 0,
    65, 0, 69, 0, 72, 0, 69, 0, 67, 0, 64, 0, 65, 0, 0, 0,
    67, 0, 71, 0, 74, 0, 71, 0, 72, 0, 76, 0, 72, 0, 69, 0,
    71, 0, 67, 0, 64, 0, 0, 0, 62, 0, 0, 0, 60, 0, 0, 0,
  ],
  bass: [
    48, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0,
    41, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0,
    47, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0,
    43, 0, 0, 0, 0, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0,
  ],
};

export const TRACKS: Record<string, Track> = { level, menu };

/** Schedules a looping track using the WebAudio look-ahead technique. */
export class MusicPlayer {
  private timer: ReturnType<typeof setInterval> | undefined;
  private nextStepTime = 0;
  private step = 0;
  private current: Track | null = null;
  private currentName: string | null = null;
  private active: OscillatorNode[] = [];

  constructor(
    private readonly ctx: AudioContext,
    private readonly out: GainNode,
  ) {}

  get playing(): boolean {
    return this.timer !== undefined;
  }

  get track(): string | null {
    return this.currentName;
  }

  start(name: string): void {
    const track = TRACKS[name];
    if (!track) return;
    if (this.currentName === name && this.timer !== undefined) return;
    this.stop();
    this.current = track;
    this.currentName = name;
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
    this.schedule();
  }

  stop(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    for (const o of this.active) {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    }
    this.active = [];
    this.current = null;
    this.currentName = null;
  }

  private schedule(): void {
    if (!this.current || this.ctx.state !== 'running') return;
    const stepDur = 60 / this.current.bpm / 4; // 16th-note duration in seconds
    const lookahead = 0.15;
    while (this.nextStepTime < this.ctx.currentTime + lookahead) {
      const mel = this.current.melody[this.step % this.current.melody.length];
      const bass = this.current.bass[this.step % this.current.bass.length];
      if (mel) this.note(mel, this.nextStepTime, stepDur * 1.6, 'square', 0.11);
      if (bass) this.note(bass, this.nextStepTime, stepDur * 2.4, 'triangle', 0.16);
      this.step++;
      this.nextStepTime += stepDur;
    }
  }

  private note(midi: number, t: number, dur: number, type: OscillatorType, gain: number): void {
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + dur + 0.03);
    this.active.push(o);
    o.onended = () => {
      const i = this.active.indexOf(o);
      if (i >= 0) this.active.splice(i, 1);
    };
  }
}
