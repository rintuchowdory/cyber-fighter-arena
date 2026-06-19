// All sound is synthesized — no audio files needed.
// Uses the Web Audio API directly for maximum control.

class SoundEngine {
  private ctx!: AudioContext;
  private masterGain!: GainNode;
  private sfxGain!: GainNode;
  private bgmGain!: GainNode;

  // BGM sequencer state
  private schedulerId?: ReturnType<typeof setInterval>;
  private nextNoteTime: number = 0;
  private bgmStep: number = 0;
  private bgmRunning: boolean = false;

  // ── Synthwave BGM pattern (A minor, 120 BPM, 16 steps) ──────────────────
  private readonly BPM = 120;
  private readonly STEPS = 16;

  //                  A     _     A     _     E     _     E     _     D     _     D     _     A     _     A     _
  private readonly BASS = [55, 0, 55, 0, 82.4, 0, 82.4, 0, 73.4, 0, 73.4, 0, 55, 0, 55, 0];

  //                     A3    _      C4     _    E4     _    A4    _    G4    _    E4     _    C4     _    A3    _
  private readonly MELODY = [220, 0, 261.6, 0, 329.6, 0, 440, 0, 392, 0, 329.6, 0, 261.6, 0, 220, 0];

  //                   Am chord _  Em chord _  Dm chord _  Am chord _
  private readonly PADS = [
    [220, 261.6, 329.6],
    null,
    null,
    null,
    [164.8, 220, 329.6],
    null,
    null,
    null,
    [146.8, 220, 293.7],
    null,
    null,
    null,
    [220, 261.6, 329.6],
    null,
    null,
    null,
  ];

  // ── Lazy init (AudioContext requires a user gesture) ─────────────────────
  private ensureCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.55;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.22;
      this.bgmGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ── Noise buffer helper ───────────────────────────────────────────────────
  private makeNoise(duration: number): AudioBufferSourceNode {
    const samples = Math.ceil(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, samples, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  // ── Oscillator helper ─────────────────────────────────────────────────────
  private osc(
    type: OscillatorType,
    freq: number,
    start: number,
    stop: number,
    dest: AudioNode,
    startGain = 0.5,
    freqEnd?: number,
    freqEndTime?: number
  ) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(dest);
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    if (freqEnd !== undefined && freqEndTime !== undefined) {
      o.frequency.exponentialRampToValueAtTime(freqEnd, freqEndTime);
    }
    g.gain.setValueAtTime(startGain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, stop);
    o.start(start);
    o.stop(stop + 0.01);
    return { osc: o, gain: g };
  }

  // ── SFX ──────────────────────────────────────────────────────────────────

  playJump() {
    this.ensureCtx();
    const t = this.ctx.currentTime;
    // Rising chirp
    this.osc('sine', 180, t, t + 0.14, this.sfxGain, 0.35, 520, t + 0.1);
    // Subtle click
    this.osc('square', 80, t, t + 0.04, this.sfxGain, 0.12);
  }

  playPunch() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Sub thud
    this.osc('sine', 140, t, t + 0.08, this.sfxGain, 0.5, 55, t + 0.07);

    // Sawtooth crunch
    this.osc('sawtooth', 900, t, t + 0.06, this.sfxGain, 0.28, 150, t + 0.055);

    // Noise hit
    const noise = this.makeNoise(0.04);
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 3000;
    nf.Q.value = 1.5;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.22, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.05);
  }

  playEnemyDeath() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Descending glitch tone
    this.osc('square', 700, t, t + 0.25, this.sfxGain, 0.35, 45, t + 0.22);

    // High harmonic decay
    this.osc('sawtooth', 1400, t, t + 0.18, this.sfxGain, 0.15, 180, t + 0.15);

    // Noise burst at death moment
    const noise = this.makeNoise(0.06);
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'highpass';
    nf.frequency.value = 1800;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.18, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.07);
  }

  playPlayerHit() {
    this.ensureCtx();
    const t = this.ctx.currentTime;

    // Heavy low impact
    this.osc('sawtooth', 90, t, t + 0.22, this.sfxGain, 0.55, 35, t + 0.2);

    // Mid distort buzz
    this.osc('square', 320, t, t + 0.16, this.sfxGain, 0.25, 80, t + 0.14);

    // Noise sizzle
    const noise = this.makeNoise(0.1);
    const nf = this.ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 1200;
    nf.Q.value = 2;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.2, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    noise.connect(nf);
    nf.connect(ng);
    ng.connect(this.sfxGain);
    noise.start(t);
    noise.stop(t + 0.11);
  }

  playWaveClear() {
    this.ensureCtx();
    const t = this.ctx.currentTime;
    // Rising arpeggio: A3 C4 E4 A4
    [220, 261.6, 329.6, 440].forEach((freq, i) => {
      const st = t + i * 0.09;
      this.osc('triangle', freq, st, st + 0.22, this.sfxGain, 0.28);
      // Octave shimmer
      this.osc('sine', freq * 2, st, st + 0.18, this.sfxGain, 0.10);
    });
  }

  playGameOver() {
    this.ensureCtx();
    const t = this.ctx.currentTime;
    // Descending funeral tones
    [220, 196, 174.6, 146.8].forEach((freq, i) => {
      const st = t + i * 0.18;
      this.osc('sawtooth', freq, st, st + 0.35, this.sfxGain, 0.2);
      this.osc('square', freq / 2, st, st + 0.3, this.sfxGain, 0.12);
    });
  }

  playMenuClick() {
    this.ensureCtx();
    const t = this.ctx.currentTime;
    this.osc('sine', 440, t, t + 0.07, this.sfxGain, 0.25, 880, t + 0.05);
  }

  // ── Background Music ──────────────────────────────────────────────────────

  startBGM() {
    this.ensureCtx();
    if (this.bgmRunning) return;
    this.bgmRunning = true;
    this.bgmStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.schedule();
    this.schedulerId = setInterval(() => this.schedule(), 20);
  }

  stopBGM() {
    if (this.schedulerId !== undefined) {
      clearInterval(this.schedulerId);
      this.schedulerId = undefined;
    }
    this.bgmRunning = false;
    // Fade out
    if (this.bgmGain) {
      const t = this.ctx.currentTime;
      this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, t);
      this.bgmGain.gain.linearRampToValueAtTime(0, t + 0.4);
      setTimeout(() => {
        if (this.bgmGain) this.bgmGain.gain.value = 0.22;
      }, 500);
    }
  }

  setBGMVolume(v: number) {
    this.ensureCtx();
    this.bgmGain.gain.value = v;
  }

  private schedule() {
    if (!this.bgmRunning) return;
    const LOOKAHEAD = 0.12;
    const stepDur = 60 / this.BPM / 4; // 16th note duration

    while (this.nextNoteTime < this.ctx.currentTime + LOOKAHEAD) {
      const t = this.nextNoteTime;
      const step = this.bgmStep;

      // Bass line — square wave, punchy
      const bassHz = this.BASS[step];
      if (bassHz > 0) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.bgmGain);
        o.type = 'square';
        o.frequency.value = bassHz;
        g.gain.setValueAtTime(0.55, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 1.6);
        o.start(t);
        o.stop(t + stepDur * 1.8);
      }

      // Melody — triangle wave, airy
      const melHz = this.MELODY[step];
      if (melHz > 0) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.bgmGain);
        o.type = 'triangle';
        o.frequency.value = melHz;
        g.gain.setValueAtTime(0.22, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 0.9);
        o.start(t);
        o.stop(t + stepDur);
      }

      // Pad chords — sine wave, sustained
      const chord = this.PADS[step];
      if (chord) {
        chord.forEach(freq => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.bgmGain);
          o.type = 'sine';
          o.frequency.value = freq;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.12, t + stepDur * 0.5);
          g.gain.setValueAtTime(0.12, t + stepDur * 3.5);
          g.gain.exponentialRampToValueAtTime(0.0001, t + stepDur * 4);
          o.start(t);
          o.stop(t + stepDur * 4 + 0.05);
        });
      }

      // Kick drum on beats 0 and 8
      if (step === 0 || step === 8) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.connect(g);
        g.connect(this.bgmGain);
        o.type = 'sine';
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(30, t + 0.12);
        g.gain.setValueAtTime(0.7, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.start(t);
        o.stop(t + 0.18);
      }

      // Hi-hat on every step (quieter on off-beats)
      const hatVol = (step % 2 === 0) ? 0.04 : 0.02;
      const noise = this.makeNoise(0.04);
      const hf = this.ctx.createBiquadFilter();
      hf.type = 'highpass';
      hf.frequency.value = 8000;
      const hg = this.ctx.createGain();
      hg.gain.setValueAtTime(hatVol, t);
      hg.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      noise.connect(hf);
      hf.connect(hg);
      hg.connect(this.bgmGain);
      noise.start(t);
      noise.stop(t + 0.05);

      this.bgmStep = (this.bgmStep + 1) % this.STEPS;
      this.nextNoteTime += stepDur;
    }
  }
}

// Singleton export
export const soundEngine = new SoundEngine();
