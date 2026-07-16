import type { GameEvent } from '../engine/events';
import { MusicPlayer } from './music';

export type AudioMode = 'music' | 'fx' | 'off';

/**
 * WebAudio engine producing original synthesized sound effects and original
 * chiptune music. No sampled/copyrighted audio — everything is generated from
 * oscillators and noise at runtime.
 *
 * Modes mirror the original game: 'music' = music + effects, 'fx' = effects
 * only, 'off' = silent.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private music: MusicPlayer | null = null;
  /** The track scenes want playing (played only while mode === 'music'). */
  private desiredTrack: string | null = 'menu';
  mode: AudioMode = 'music';
  private lastPlay: Record<string, number> = {};

  private ensure(): AudioContext | null {
    if (this.mode === 'off') return null;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.35;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.5;
      this.musicGain.connect(this.master);
      this.music = new MusicPlayer(this.ctx, this.musicGain);
    }
    return this.ctx;
  }

  /** Resume the context after a user gesture (autoplay policy) and (re)start music. */
  resume(): void {
    const c = this.ensure();
    if (c && c.state === 'suspended') void c.resume();
    this.updateMusic();
  }

  /** Choose which track should play; takes effect immediately in 'music' mode. */
  setMusicTrack(name: string): void {
    this.desiredTrack = name;
    this.updateMusic();
  }

  private updateMusic(): void {
    if (!this.music) return;
    if (this.mode === 'music' && this.desiredTrack && this.ctx?.state === 'running') {
      this.music.start(this.desiredTrack);
    } else {
      this.music.stop();
    }
  }

  setMode(mode: AudioMode): void {
    this.mode = mode;
    if (mode === 'off') {
      this.music?.stop();
      // Keep the context alive for a quick unmute; just silence output.
    } else {
      this.resume();
    }
    this.updateMusic();
  }

  cycleMode(): AudioMode {
    this.setMode(this.mode === 'music' ? 'fx' : this.mode === 'fx' ? 'off' : 'music');
    return this.mode;
  }

  /** Diagnostic snapshot (used by automated tests). */
  status(): { mode: AudioMode; ctx: string; musicPlaying: boolean; track: string | null } {
    return {
      mode: this.mode,
      ctx: this.ctx?.state ?? 'none',
      musicPlaying: this.music?.playing ?? false,
      track: this.music?.track ?? null,
    };
  }

  /** Map a game event to a short synthesized sound. */
  play(event: GameEvent): void {
    if (this.mode === 'off') return;
    const c = this.ensure();
    if (!c || !this.master) return;

    // Throttle very frequent events (e.g. build steps, releases).
    const now = c.currentTime;
    if (event === 'build-step' || event === 'release') {
      if (now - (this.lastPlay[event] ?? 0) < 0.06) return;
    }
    this.lastPlay[event] = now;

    switch (event) {
      case 'assign':
        this.blip(880, 0.05, 'square', 0.25);
        break;
      case 'build-step':
        this.blip(440, 0.04, 'square', 0.18);
        break;
      case 'build-warn':
        this.blip(1320, 0.05, 'square', 0.3);
        break;
      case 'explode':
        this.noise(0.25, 0.5);
        break;
      case 'splat':
        this.noise(0.08, 0.4, 600);
        break;
      case 'drown':
        this.sweep(500, 120, 0.4, 'sine');
        break;
      case 'exit':
        this.arp([660, 880, 1320], 0.06);
        break;
      case 'ohno':
        this.sweep(700, 300, 0.3, 'square');
        break;
      case 'nuke':
        this.sweep(200, 60, 0.6, 'sawtooth');
        break;
      case 'trap':
        this.noise(0.12, 0.45, 300);
        break;
      case 'release':
        this.blip(520, 0.03, 'triangle', 0.12);
        break;
      case 'blocker':
        this.blip(220, 0.08, 'square', 0.2);
        break;
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain: number): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(this.master!);
    o.start();
    o.stop(c.currentTime + dur);
  }

  private sweep(from: number, to: number, dur: number, type: OscillatorType): void {
    const c = this.ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, to), c.currentTime + dur);
    g.gain.setValueAtTime(0.3, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.connect(g).connect(this.master!);
    o.start();
    o.stop(c.currentTime + dur);
  }

  private arp(freqs: number[], step: number): void {
    freqs.forEach((f, i) => {
      setTimeout(() => this.blip(f, step * 1.5, 'square', 0.22), i * step * 1000);
    });
  }

  private noise(dur: number, gain: number, lowpass?: number): void {
    const c = this.ctx!;
    const buffer = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buffer;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    let node: AudioNode = src;
    if (lowpass) {
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      src.connect(f);
      node = f;
    }
    node.connect(g).connect(this.master!);
    src.start();
    src.stop(c.currentTime + dur);
  }
}
