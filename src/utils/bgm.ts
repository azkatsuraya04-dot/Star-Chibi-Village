// Original Instrumental Background Music Track: "Sunny Chibi Village Promenade"
// Mood: Cozy, cheerful, wholesome, relaxing, playful, slightly nostalgic, warm & comforting
// Instrumentation: Soft acoustic guitar, gentle piano, light ukulele, soft bells/glockenspiel, subtle marimba, light percussion, warm bass
// Structure: 64 bars in G Major at 88 BPM (~2 minutes 54.5 seconds), seamlessly looping without dramatic endings.

export class ChibiVillageBgmEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private enabled: boolean = true;
  private volume: number = 0.4; // 0.0 to 1.0 (default cozy comfortable level)

  // Nodes
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  // Clock & Scheduling
  private bpm: number = 88;
  private timerId: number | null = null;
  private currentBar: number = 0;
  private nextBarTime: number = 0;
  private scheduleAheadTime: number = 0.25; // schedule 250ms ahead

  // Noise buffer for shakers and acoustic pluck transients
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Lazy initialized on user gesture
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
    } else {
      if (!this.isPlaying) {
        this.start();
      }
    }
  }

  public isMusicEnabled(): boolean {
    return this.enabled;
  }

  public isMusicPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume * 0.45, this.ctx.currentTime, 0.08);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  private initAudio() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    // Create Master Chain: masterGain -> compressor -> destination
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume * 0.45, this.ctx.currentTime);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Create 1-second white noise buffer for shakers and acoustic string taps
    const bufferSize = this.ctx.sampleRate;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  public start() {
    if (!this.enabled) return;
    this.initAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Reset bar counter and start time
    this.currentBar = 0;
    this.nextBarTime = this.ctx.currentTime + 0.05;

    this.scheduler();
    this.timerId = window.setInterval(() => this.scheduler(), 35);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // Look-ahead audio scheduler
  private scheduler() {
    if (!this.ctx || !this.isPlaying || !this.enabled) return;

    const barDuration = (60 / this.bpm) * 4; // 4/4 bar duration = ~2.727 seconds

    while (this.nextBarTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleBar(this.currentBar, this.nextBarTime);
      this.nextBarTime += barDuration;
      this.currentBar = (this.currentBar + 1) % 64; // 64 bars loop seamlessly
    }
  }

  // Frequency conversion from MIDI number
  private m2f(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // --- INSTRUMENT SYNTHESIZERS ---

  // 1. Soft Acoustic Guitar / Ukulele Pluck
  private playPluck(
    time: number,
    freq: number,
    duration: number,
    velocity: number = 0.7,
    isUke: boolean = false
  ) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * (isUke ? 2 : 1), now);

      filter.type = 'lowpass';
      const baseCutoff = isUke ? 2400 : 1800;
      filter.frequency.setValueAtTime(baseCutoff, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + duration);

      const amp = velocity * (isUke ? 0.06 : 0.08);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  // 2. Gentle Piano
  private playPiano(
    time: number,
    freq: number,
    duration: number,
    velocity: number = 0.7
  ) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + duration);

      const amp = velocity * 0.09;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + Math.max(0.2, duration));

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  // 3. Soft Bells / Glockenspiel
  private playBells(
    time: number,
    freq: number,
    duration: number = 1.4,
    velocity: number = 0.5
  ) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();
      const masterBell = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2.756, now); // Sweet inharmonic chime overtone

      const amp = velocity * 0.06;
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(amp, now + 0.004);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.linearRampToValueAtTime(amp * 0.22, now + 0.003);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.4);

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(masterBell);
      gain2.connect(masterBell);
      masterBell.connect(this.masterGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration + 0.05);
      osc2.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  // 4. Subtle Marimba
  private playMarimba(
    time: number,
    freq: number,
    velocity: number = 0.6
  ) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      // Fast woody mallet pitch click
      osc.frequency.setValueAtTime(freq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.015);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      const amp = velocity * 0.075;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.38);
    } catch {
      // ignore
    }
  }

  // 5. Warm Bass
  private playBass(
    time: number,
    freq: number,
    duration: number,
    velocity: number = 0.65
  ) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      const amp = velocity * 0.12;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch {
      // ignore
    }
  }

  // 6. Light Percussion: Soft Brush / Shaker
  private playShaker(time: number, velocity: number = 0.4) {
    if (!this.ctx || !this.masterGain || !this.noiseBuffer) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(4200, now);
      filter.Q.setValueAtTime(2.2, now);

      const gain = this.ctx.createGain();
      const amp = velocity * 0.035;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      source.start(now);
      source.stop(now + 0.06);
    } catch {
      // ignore
    }
  }

  // 7. Light Percussion: Subtle Acoustic Rim / Wood Tap
  private playRim(time: number, velocity: number = 0.4) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.025);

      const amp = velocity * 0.04;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // ignore
    }
  }

  // 8. Light Percussion: Soft Low Heartbeat Thump
  private playKick(time: number, velocity: number = 0.4) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const now = Math.max(time, this.ctx.currentTime);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.07);

      const amp = velocity * 0.06;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // --- BAR SCHEDULER (64 Bars Total = ~2m 54s) ---
  private scheduleBar(barIndex: number, barStartTime: number) {
    const beatSec = 60 / this.bpm; // ~0.6818s per beat

    // Chords definition per bar (MIDI root & voicing notes)
    // Scale: G Major (G=55/67, A=57/69, B=59/71, C=60/72, D=62/74, E=64/76, F#=66/78)
    const chordVoicings: {
      root: number; // Bass MIDI
      notes: number[]; // Guitar / Uke chord arpeggio notes
    }[] = [
      // Bars 0-7 (Intro & Gentle Morning Breeze)
      { root: 43, notes: [55, 59, 62, 67] }, // G (G2)
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7 (C3)
      { root: 47, notes: [59, 62, 67, 71] }, // G/B (B2)
      { root: 50, notes: [57, 62, 67, 69] }, // Dsus4 -> D (D3)
      { root: 40, notes: [55, 59, 64, 67] }, // Em7 (E2)
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7 (B2)
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 50, notes: [57, 60, 62, 66] }, // D7

      // Bars 8-15 (Section A: Main Wholesome Village Melody)
      { root: 43, notes: [55, 59, 62, 67] }, // G
      { root: 42, notes: [54, 57, 62, 66] }, // D/F#
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 47, notes: [55, 59, 62, 67] }, // G/B
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 50, notes: [57, 60, 62, 66] }, // D7

      // Bars 16-23 (Section B: Star Garden Bloom)
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 48, notes: [57, 60, 62, 66] }, // D/C
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 50, notes: [57, 60, 62, 66] }, // D7
      { root: 43, notes: [55, 59, 62, 67] }, // Gmaj7
      { root: 43, notes: [53, 59, 62, 67] }, // G7

      // Bars 24-31 (Section C: Shopping & Animal Friends)
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 43, notes: [55, 59, 62, 67] }, // G
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 49, notes: [55, 58, 61, 64] }, // A7/C# (cozy uplifting chord!)
      { root: 50, notes: [57, 62, 67, 69] }, // Dsus4
      { root: 50, notes: [57, 60, 62, 66] }, // D7

      // Bars 32-39 (Section D: Cozy Afternoon Breeze)
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 47, notes: [55, 59, 62, 67] }, // G/B
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 50, notes: [57, 60, 62, 66] }, // D7

      // Bars 40-47 (Section E: Sunny Town Square Reprise)
      { root: 43, notes: [55, 59, 62, 67] }, // G
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 50, notes: [57, 60, 62, 66] }, // D7
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 45, notes: [55, 57, 61, 64] }, // A7
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 50, notes: [57, 62, 66, 69] }, // Dsus4 - D

      // Bars 48-55 (Section F: Golden Hour Glow)
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 50, notes: [57, 60, 62, 66] }, // D/C
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 50, notes: [57, 60, 62, 66] }, // D7

      // Bars 56-63 (Section G: Sunset & Seamless Homecoming Loop)
      { root: 43, notes: [55, 59, 62, 67] }, // G
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 40, notes: [55, 59, 64, 67] }, // Em7
      { root: 47, notes: [54, 59, 62, 66] }, // Bm7
      { root: 48, notes: [60, 64, 67, 71] }, // Cmaj7
      { root: 47, notes: [55, 59, 62, 67] }, // G/B
      { root: 45, notes: [57, 60, 64, 67] }, // Am7
      { root: 50, notes: [57, 62, 66, 69] }, // Dsus4 -> D7(9) bridging to Bar 0!
    ];

    const currentChord = chordVoicings[barIndex] || chordVoicings[0];

    // --- 1. LIGHT PERCUSSION (Enters bar 4, thins at bar 60-63) ---
    const hasDrums = barIndex >= 4 && barIndex < 62;
    if (hasDrums) {
      for (let b = 0; b < 4; b++) {
        const beatTime = barStartTime + b * beatSec;

        // Shaker on 8th notes (down and up)
        this.playShaker(beatTime, 0.35);
        this.playShaker(beatTime + beatSec * 0.5, 0.28);

        // Subtle warm kick on beats 1 & 3
        if (b === 0 || b === 2) {
          this.playKick(beatTime, 0.38);
        }

        // Acoustic rim tap on beat 3 (and gentle on beat 4 in upbeat sections)
        if (b === 2) {
          this.playRim(beatTime, 0.36);
        } else if (b === 3 && (barIndex >= 24 && barIndex < 48)) {
          this.playRim(beatTime + beatSec * 0.5, 0.22);
        }
      }
    } else {
      // Gentle ambient shaker only during intro / outro
      if (barIndex >= 2) {
        this.playShaker(barStartTime, 0.25);
        this.playShaker(barStartTime + beatSec * 2, 0.25);
      }
    }

    // --- 2. WARM BASS (Starts on bar 2, grounds the peaceful movement) ---
    if (barIndex >= 2) {
      const rootFreq = this.m2f(currentChord.root);
      const fifthFreq = this.m2f(currentChord.root + 7);

      // Beat 1: Root
      this.playBass(barStartTime, rootFreq, beatSec * 1.6, 0.65);

      // Beat 3: Fifth or walking note
      const secondBassTime = barStartTime + beatSec * 2;
      this.playBass(secondBassTime, fifthFreq, beatSec * 1.4, 0.55);

      // Occasional walking passing note on beat 4.5
      if (barIndex % 2 === 1) {
        this.playBass(barStartTime + beatSec * 3.5, this.m2f(currentChord.root + 2), beatSec * 0.5, 0.45);
      }
    }

    // --- 3. ACOUSTIC GUITAR & UKULELE (Rhythm Strum & Fingerpicking Arpeggio) ---
    // Guitar plays gentle fingerpicking arpeggios
    currentChord.notes.forEach((midiNote, idx) => {
      const strumTime = barStartTime + idx * (beatSec * 0.75);
      if (strumTime < barStartTime + beatSec * 3.8) {
        this.playPluck(strumTime, this.m2f(midiNote), beatSec * 0.9, 0.62, false);
      }
    });

    // Ukulele adds sweet offbeat chucks/strums on beats 2 and 4 (classic cute pet sim feel)
    if (barIndex >= 1 && barIndex < 63) {
      const ukeBeats = [1, 3];
      ukeBeats.forEach((b) => {
        const ukeTime = barStartTime + b * beatSec;
        currentChord.notes.slice(1).forEach((midiNote, uIdx) => {
          this.playPluck(
            ukeTime + uIdx * 0.015,
            this.m2f(midiNote + 12),
            beatSec * 0.5,
            0.45,
            true
          );
        });
      });
    }

    // --- 4. ORIGINAL LEAD MELODIES & INSTRUMENTAL COUNTERPOINT ---
    this.scheduleMelody(barIndex, barStartTime, beatSec);
  }

  // Melodic and counterpoint arrangement across the 8 sections
  private scheduleMelody(bar: number, t: number, b: number) {
    // Helper to trigger piano note: note(timeOffsetInBeats, midi, durationInBeats, velocity)
    const p = (timeBeat: number, midi: number, durBeat: number, vel: number = 0.7) => {
      this.playPiano(t + timeBeat * b, this.m2f(midi), durBeat * b, vel);
    };

    // Helper for glockenspiel / soft bells
    const bell = (timeBeat: number, midi: number, durBeat: number = 1.6, vel: number = 0.5) => {
      this.playBells(t + timeBeat * b, this.m2f(midi), durBeat * b, vel);
    };

    // Helper for marimba
    const m = (timeBeat: number, midi: number, vel: number = 0.6) => {
      this.playMarimba(t + timeBeat * b, this.m2f(midi), vel);
    };

    // --- SECTION 1: INTRO (Bars 0-7) ---
    if (bar === 0) {
      bell(1.0, 74, 1.8, 0.5); // D5
      bell(2.0, 76, 1.8, 0.55); // E5
      bell(3.0, 79, 2.2, 0.6); // G5 (Welcoming chime)
    } else if (bar === 1) {
      p(0.0, 71, 2.0, 0.6); // B4
      p(2.0, 72, 1.8, 0.65); // C5
    } else if (bar === 2) {
      bell(1.0, 79, 2.0, 0.5); // G5
      bell(2.5, 83, 2.0, 0.55); // B5
    } else if (bar === 3) {
      p(1.0, 74, 1.0, 0.6); // D5
      p(2.0, 76, 1.0, 0.65); // E5
      p(3.0, 78, 1.5, 0.7); // F#5
    } else if (bar === 4) {
      // Marimba enters playfully
      m(1.0, 71, 0.55); // B4
      m(2.0, 74, 0.6); // D5
      m(3.0, 76, 0.6); // E5
    } else if (bar === 5) {
      m(1.0, 74, 0.55);
      m(2.5, 71, 0.5);
    } else if (bar === 6) {
      bell(0.5, 79, 1.6, 0.55); // G5
      bell(1.5, 81, 1.6, 0.55); // A5
      bell(2.5, 83, 1.8, 0.6); // B5
      bell(3.5, 86, 2.0, 0.65); // D6
    } else if (bar === 7) {
      p(0.0, 81, 1.0, 0.65); // A5
      p(1.5, 78, 1.2, 0.65); // F#5
      p(3.0, 74, 1.0, 0.6); // D5
    }

    // --- SECTION 2: THE WHOLESOME VILLAGE THEME (Bars 8-15) ---
    // Catchy, original, heartwarming 8-bar theme
    else if (bar === 8) {
      p(0.0, 71, 1.2, 0.75); // B4
      p(1.5, 74, 0.8, 0.7); // D5
      p(2.5, 76, 0.8, 0.72); // E5
      p(3.25, 74, 0.9, 0.7); // D5
      m(2.0, 67, 0.5); // G4
      bell(0.0, 83, 1.6, 0.45); // B5 sparkle
    } else if (bar === 9) {
      p(0.0, 69, 1.4, 0.7); // A4
      p(1.5, 71, 0.8, 0.68); // B4
      p(2.5, 74, 1.0, 0.72); // D5
      p(3.5, 71, 0.8, 0.65); // B4
      m(1.0, 66, 0.48); // F#4
    } else if (bar === 10) {
      p(0.0, 67, 0.9, 0.72); // G4
      p(1.0, 71, 0.9, 0.7); // B4
      p(2.0, 74, 0.9, 0.75); // D5
      p(3.0, 76, 1.2, 0.78); // E5
      bell(3.0, 79, 1.8, 0.55); // G5
    } else if (bar === 11) {
      p(0.0, 78, 1.2, 0.72); // F#5
      p(1.5, 76, 0.8, 0.68); // E5
      p(2.5, 74, 0.8, 0.7); // D5
      p(3.25, 71, 0.9, 0.68); // B4
      m(3.0, 62, 0.5); // D4
    } else if (bar === 12) {
      p(0.0, 76, 1.4, 0.75); // E5
      p(1.5, 79, 0.9, 0.78); // G5
      p(2.5, 81, 0.8, 0.8); // A5
      p(3.25, 79, 0.9, 0.76); // G5
      bell(1.5, 79, 1.6, 0.5);
    } else if (bar === 13) {
      p(0.0, 74, 1.2, 0.72); // D5
      p(1.5, 71, 0.8, 0.68); // B4
      p(2.5, 67, 0.8, 0.65); // G4
      p(3.5, 69, 0.8, 0.68); // A4
      m(2.0, 71, 0.55);
    } else if (bar === 14) {
      p(0.0, 72, 1.0, 0.7); // C5
      p(1.0, 71, 0.8, 0.65); // B4
      p(2.0, 69, 0.8, 0.65); // A4
      p(3.0, 67, 1.0, 0.68); // G4
      m(1.5, 64, 0.45);
    } else if (bar === 15) {
      p(0.0, 69, 1.0, 0.7); // A4
      p(1.0, 71, 0.8, 0.7); // B4
      p(2.0, 74, 0.8, 0.72); // D5
      p(3.0, 78, 1.4, 0.75); // F#5
      bell(3.0, 86, 2.2, 0.6); // D6 resolution
    }

    // --- SECTION 3: STAR GARDEN BLOOM (Bars 16-23) ---
    // Soft bells lead the melody with twinkling, nostalgic intervals
    else if (bar === 16) {
      bell(0.0, 79, 1.6, 0.6); // G5
      bell(1.5, 76, 1.2, 0.55); // E5
      bell(2.5, 74, 1.0, 0.55); // D5
      bell(3.25, 72, 1.2, 0.5); // C5
      p(0.5, 64, 1.5, 0.58);
      p(2.5, 67, 1.5, 0.6);
    } else if (bar === 17) {
      bell(0.0, 78, 1.4, 0.6); // F#5
      bell(1.5, 74, 1.0, 0.55); // D5
      bell(2.5, 72, 1.0, 0.55); // C5
      bell(3.5, 69, 1.2, 0.5); // A4
      p(2.0, 66, 1.2, 0.58);
    } else if (bar === 18) {
      m(0.0, 74, 0.6); // D5
      m(1.0, 71, 0.55); // B4
      m(2.0, 69, 0.55); // A4
      m(3.0, 66, 0.58); // F#4
      bell(2.0, 83, 1.5, 0.5); // B5
    } else if (bar === 19) {
      p(0.0, 67, 1.2, 0.68); // G4
      p(1.5, 71, 1.0, 0.7); // B4
      p(2.5, 76, 1.4, 0.75); // E5
      bell(2.5, 88, 2.0, 0.55); // E6
    } else if (bar === 20) {
      p(0.0, 69, 1.0, 0.68); // A4
      p(1.0, 72, 1.0, 0.7); // C5
      p(2.0, 76, 1.2, 0.72); // E5
      p(3.25, 74, 1.0, 0.7); // D5
    } else if (bar === 21) {
      p(0.0, 78, 1.2, 0.72); // F#5
      p(1.5, 76, 0.8, 0.68); // E5
      p(2.5, 74, 0.8, 0.68); // D5
      p(3.25, 72, 1.0, 0.65); // C5
      m(2.0, 69, 0.52);
    } else if (bar === 22) {
      bell(0.0, 71, 1.4, 0.6); // B4
      bell(1.5, 74, 1.0, 0.6); // D5
      bell(2.5, 79, 1.2, 0.65); // G5
      bell(3.5, 78, 1.0, 0.6); // F#5
      p(1.0, 67, 1.5, 0.65);
    } else if (bar === 23) {
      p(0.0, 77, 1.2, 0.68); // F5 (modal G7 touch)
      p(1.5, 74, 0.8, 0.65); // D5
      p(2.5, 71, 0.8, 0.65); // B4
      p(3.25, 67, 1.0, 0.62); // G4
      m(3.0, 59, 0.5);
    }

    // --- SECTION 4: SHOPPING & VISITING ANIMAL FRIENDS (Bars 24-31) ---
    // Playful, cheerful call & response between marimba and piano
    else if (bar === 24) {
      m(0.0, 76, 0.7); // E5
      m(0.75, 79, 0.72); // G5
      m(1.5, 84, 0.75); // C6
      bell(1.5, 84, 1.5, 0.5);
      p(2.5, 79, 1.0, 0.65); // G5
      p(3.25, 76, 0.8, 0.65); // E5
    } else if (bar === 25) {
      p(0.0, 74, 1.0, 0.68); // D5
      p(1.0, 78, 1.0, 0.7); // F#5
      p(2.0, 83, 1.4, 0.72); // B5
      m(2.5, 71, 0.55);
    } else if (bar === 26) {
      m(0.0, 72, 0.68); // C5
      m(0.75, 76, 0.7); // E5
      m(1.5, 81, 0.72); // A5
      p(2.5, 76, 1.0, 0.65);
      p(3.25, 72, 0.8, 0.65);
    } else if (bar === 27) {
      p(0.0, 71, 1.0, 0.68); // B4
      p(1.0, 74, 1.0, 0.7); // D5
      p(2.0, 79, 1.4, 0.75); // G5
      bell(2.0, 79, 1.8, 0.5);
    } else if (bar === 28) {
      bell(0.0, 79, 1.0, 0.6); // G5
      bell(1.0, 81, 1.0, 0.62); // A5
      bell(2.0, 83, 1.0, 0.65); // B5
      bell(3.0, 84, 1.4, 0.7); // C6
      m(1.5, 67, 0.52);
    } else if (bar === 29) {
      // A7/C# uplifting warm accent
      p(0.0, 73, 1.0, 0.72); // C#5
      p(1.0, 76, 1.0, 0.72); // E5
      p(2.0, 81, 1.5, 0.75); // A5
      bell(2.0, 81, 1.6, 0.5);
    } else if (bar === 30) {
      p(0.0, 74, 1.0, 0.7); // D5
      p(1.0, 79, 1.0, 0.72); // G5
      p(2.0, 81, 1.4, 0.75); // A5
      m(2.5, 62, 0.5);
    } else if (bar === 31) {
      p(0.0, 78, 1.2, 0.72); // F#5
      p(1.5, 76, 0.8, 0.68); // E5
      p(2.5, 74, 1.2, 0.7); // D5
      bell(2.5, 86, 2.0, 0.55); // D6
    }

    // --- SECTION 5: COZY AFTERNOON BREEZE (Bars 32-39) ---
    // Softer, reflective, gentle acoustic guitar & piano dialogue
    else if (bar === 32) {
      p(0.0, 71, 1.4, 0.65); // B4
      p(1.5, 67, 1.0, 0.6); // G4
      p(2.5, 64, 1.0, 0.58); // E4
      p(3.25, 67, 1.0, 0.6); // G4
    } else if (bar === 33) {
      bell(0.0, 71, 2.0, 0.48); // B4
      bell(2.0, 74, 2.0, 0.5); // D5
      p(1.0, 59, 1.5, 0.55);
    } else if (bar === 34) {
      p(0.0, 64, 1.0, 0.62); // E4
      p(1.0, 67, 1.0, 0.62); // G4
      p(2.0, 72, 1.2, 0.68); // C5
      p(3.25, 71, 1.0, 0.65); // B4
    } else if (bar === 35) {
      p(0.0, 62, 1.0, 0.6); // D4
      p(1.0, 67, 1.0, 0.62); // G4
      p(2.0, 71, 1.2, 0.65); // B4
      p(3.25, 69, 1.0, 0.62); // A4
      m(2.0, 74, 0.45);
    } else if (bar === 36) {
      p(0.0, 60, 1.0, 0.6); // C4
      p(1.0, 64, 1.0, 0.6); // E4
      p(2.0, 69, 1.2, 0.65); // A4
      p(3.25, 67, 1.0, 0.62); // G4
    } else if (bar === 37) {
      m(0.0, 71, 0.55);
      m(1.5, 67, 0.5);
      m(2.5, 64, 0.5);
      bell(2.0, 76, 1.8, 0.45);
    } else if (bar === 38) {
      p(0.0, 76, 1.0, 0.68); // E5
      p(1.0, 74, 0.8, 0.65); // D5
      p(2.0, 72, 0.8, 0.65); // C5
      p(3.0, 71, 1.0, 0.65); // B4
    } else if (bar === 39) {
      p(0.0, 69, 1.0, 0.65); // A4
      p(1.0, 71, 0.8, 0.68); // B4
      p(2.0, 74, 0.8, 0.7); // D5
      p(3.0, 78, 1.4, 0.72); // F#5
      bell(3.0, 86, 2.0, 0.55);
    }

    // --- SECTION 6: SUNNY TOWN SQUARE REPRISE (Bars 40-47) ---
    // Harmonized piano & glockenspiel with bouncy marimba
    else if (bar === 40) {
      p(0.0, 71, 1.2, 0.75); // B4
      p(1.5, 74, 0.8, 0.72); // D5
      p(2.5, 76, 0.8, 0.75); // E5
      p(3.25, 74, 0.9, 0.72); // D5
      bell(0.0, 79, 1.6, 0.55); // G5 (harmonic 3rd above)
      bell(1.5, 83, 1.2, 0.55); // B5
      bell(2.5, 84, 1.2, 0.58); // C6
      bell(3.25, 83, 1.2, 0.55); // B5
      m(2.0, 67, 0.55);
    } else if (bar === 41) {
      p(0.0, 74, 1.2, 0.7); // D5
      p(1.5, 71, 0.8, 0.68); // B4
      p(2.5, 69, 0.8, 0.68); // A4
      p(3.5, 66, 0.8, 0.65); // F#4
      m(1.0, 78, 0.5);
    } else if (bar === 42) {
      bell(0.0, 79, 0.8, 0.6); // G5
      bell(1.0, 81, 0.8, 0.62); // A5
      bell(2.0, 83, 0.8, 0.65); // B5
      bell(3.0, 79, 1.2, 0.62); // G5
      p(0.5, 72, 1.2, 0.65);
      p(2.5, 76, 1.2, 0.68);
    } else if (bar === 43) {
      p(0.0, 78, 1.2, 0.72); // F#5
      p(1.5, 74, 0.8, 0.68); // D5
      p(2.5, 71, 0.8, 0.68); // B4
      p(3.5, 69, 0.8, 0.68); // A4
      m(2.0, 62, 0.5);
    } else if (bar === 44) {
      p(0.0, 83, 1.2, 0.78); // B5
      p(1.5, 81, 0.8, 0.72); // A5
      p(2.5, 79, 0.8, 0.75); // G5
      p(3.25, 76, 1.0, 0.75); // E5
      bell(0.0, 83, 1.8, 0.58);
    } else if (bar === 45) {
      p(0.0, 79, 1.0, 0.72); // G5
      p(1.0, 78, 0.8, 0.7); // F#5
      p(2.0, 76, 0.8, 0.7); // E5
      p(3.0, 73, 1.2, 0.72); // C#5
      m(2.5, 69, 0.52);
    } else if (bar === 46) {
      p(0.0, 72, 0.9, 0.7); // C5
      p(1.0, 74, 0.9, 0.72); // D5
      p(2.0, 76, 0.9, 0.75); // E5
      p(3.0, 79, 1.2, 0.78); // G5
      bell(3.0, 86, 1.8, 0.55); // D6
    } else if (bar === 47) {
      p(0.0, 81, 1.4, 0.75); // A5
      p(2.0, 78, 1.0, 0.72); // F#5
      p(3.25, 74, 1.2, 0.7); // D5
      bell(0.0, 81, 2.0, 0.5);
    }

    // --- SECTION 7: GOLDEN HOUR GLOW (Bars 48-55) ---
    // Warmest harmonic fullness, wholesome counterpoint
    else if (bar === 48) {
      p(0.0, 76, 1.4, 0.72); // E5
      p(1.5, 79, 0.9, 0.75); // G5
      p(2.5, 84, 1.4, 0.78); // C6
      bell(2.5, 84, 2.0, 0.6);
      m(1.0, 67, 0.5);
    } else if (bar === 49) {
      p(0.0, 81, 1.2, 0.72); // A5
      p(1.5, 78, 0.8, 0.7); // F#5
      p(2.5, 74, 1.2, 0.7); // D5
      m(2.0, 69, 0.5);
    } else if (bar === 50) {
      p(0.0, 74, 1.2, 0.7); // D5
      p(1.5, 78, 0.9, 0.72); // F#5
      p(2.5, 83, 1.4, 0.75); // B5
      bell(2.5, 83, 2.0, 0.55);
    } else if (bar === 51) {
      p(0.0, 79, 1.2, 0.72); // G5
      p(1.5, 76, 0.8, 0.7); // E5
      p(2.5, 71, 1.2, 0.68); // B4
      m(3.0, 64, 0.48);
    } else if (bar === 52) {
      bell(0.0, 76, 1.0, 0.6); // E5
      bell(1.0, 79, 1.0, 0.62); // G5
      bell(2.0, 81, 1.0, 0.65); // A5
      bell(3.0, 83, 1.4, 0.68); // B5
      p(1.0, 60, 1.5, 0.62);
    } else if (bar === 53) {
      p(0.0, 86, 1.2, 0.75); // D6
      p(1.5, 83, 0.8, 0.72); // B5
      p(2.5, 81, 0.8, 0.7); // A5
      p(3.25, 79, 1.0, 0.72); // G5
      bell(0.0, 86, 2.0, 0.55);
    } else if (bar === 54) {
      p(0.0, 76, 1.0, 0.7); // E5
      p(1.0, 79, 1.0, 0.72); // G5
      p(2.0, 84, 1.2, 0.76); // C6
      p(3.25, 83, 1.0, 0.72); // B5
      bell(2.0, 84, 1.8, 0.58);
    } else if (bar === 55) {
      p(0.0, 81, 1.0, 0.72); // A5
      p(1.0, 83, 0.8, 0.72); // B5
      p(2.0, 86, 1.0, 0.76); // D6
      p(3.0, 90, 1.4, 0.8); // F#6
      bell(3.0, 90, 2.2, 0.6);
    }

    // --- SECTION 8: SUNSET & SEAMLESS HOMECOMING (Bars 56-63) ---
    // Calms down smoothly, seamlessly connecting back to Bar 0
    else if (bar === 56) {
      p(0.0, 79, 1.4, 0.72); // G5
      p(1.5, 74, 1.0, 0.68); // D5
      p(2.5, 71, 1.2, 0.65); // B4
      bell(0.0, 79, 2.0, 0.5);
    } else if (bar === 57) {
      p(0.0, 76, 1.4, 0.68); // E5
      p(1.5, 72, 1.0, 0.65); // C5
      p(2.5, 67, 1.2, 0.62); // G4
      m(2.0, 64, 0.45);
    } else if (bar === 58) {
      p(0.0, 71, 1.4, 0.65); // B4
      p(1.5, 67, 1.0, 0.62); // G4
      p(2.5, 64, 1.2, 0.6); // E4
      bell(2.0, 76, 1.8, 0.45);
    } else if (bar === 59) {
      p(0.0, 66, 1.4, 0.62); // F#4
      p(1.5, 62, 1.0, 0.6); // D4
      p(2.5, 59, 1.2, 0.58); // B3
    } else if (bar === 60) {
      bell(0.0, 74, 1.6, 0.5); // D5
      bell(1.5, 76, 1.6, 0.52); // E5
      bell(2.5, 79, 2.0, 0.55); // G5 (Opening signature motif returning!)
      p(1.0, 60, 1.5, 0.58);
    } else if (bar === 61) {
      p(0.0, 71, 1.4, 0.62); // B4
      p(1.5, 67, 1.0, 0.6); // G4
      p(2.5, 62, 1.2, 0.58); // D4
      bell(1.5, 79, 1.8, 0.45);
    } else if (bar === 62) {
      p(0.0, 64, 1.0, 0.6); // E4
      p(1.0, 67, 1.0, 0.6); // G4
      p(2.0, 69, 1.2, 0.62); // A4
      p(3.25, 67, 1.0, 0.6); // G4
    } else if (bar === 63) {
      // Dsus4 to D7(9) suspended cadence resolving right into Bar 0's G chord!
      p(0.0, 69, 1.0, 0.62); // A4
      p(1.0, 74, 1.0, 0.65); // D5
      p(2.0, 76, 1.0, 0.68); // E5 (add9)
      p(3.0, 78, 1.5, 0.7); // F#5 (leads into G in bar 0)
      bell(2.0, 86, 2.4, 0.55); // D6 shimmering tail
    }
  }
}

export const bgmEngine = new ChibiVillageBgmEngine();
