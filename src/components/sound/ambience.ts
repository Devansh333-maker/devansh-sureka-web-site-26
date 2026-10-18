// Ambient sound, generated live with Web Audio. Calm by design: warm chords that swell
// in and drift slowly from one to the next, an occasional soft glass-like note, and a
// gentle swell of air like distant waves. No plucks, no beats, nothing sharp. Each
// place sits in its own key and pace; moving between places crossfades over seconds.
// Under it all, a real recording for each place (CC0 field recordings from BigSoundBank,
// cut into seamless one-minute loops): birds at a forest edge, countryside, a stream,
// crickets at night. The chords sit quietly on top, like an instrument far away.

export type Scape = 'island-day' | 'island-night' | 'workshop' | 'studio' | 'village' | 'arena' | 'press' | 'night';

// the recording under each place
type Bed = 'forest' | 'countryside' | 'stream' | 'night';
const BEDS: Record<Scape, Bed> = {
  'island-day': 'forest',
  'island-night': 'night',
  workshop: 'forest',
  studio: 'forest',
  press: 'forest',
  village: 'countryside',
  arena: 'countryside',
  night: 'stream', // the Notebook, by its pond
};
const BED_LEVEL = 0.7;
const CHORD_LEVEL = 0.4; // was the whole sound; now it sits under the recording

type Mood = { root: number; brightness: number; chordEvery: number; glass: [number, number] };

// keys chosen to sit low and warm; night moods are slower and darker
const MOODS: Record<Scape, Mood> = {
  'island-day': { root: 130.81, brightness: 1100, chordEvery: 11, glass: [6, 12] }, // C
  'island-night': { root: 110.0, brightness: 700, chordEvery: 14, glass: [9, 16] }, // A
  workshop: { root: 123.47, brightness: 900, chordEvery: 12, glass: [8, 14] }, // B
  studio: { root: 146.83, brightness: 1000, chordEvery: 12, glass: [7, 13] }, // D
  village: { root: 116.54, brightness: 950, chordEvery: 12, glass: [6, 12] }, // A♯
  arena: { root: 138.59, brightness: 1150, chordEvery: 9, glass: [5, 10] }, // C♯
  press: { root: 103.83, brightness: 800, chordEvery: 13, glass: [8, 15] }, // G♯
  night: { root: 98.0, brightness: 650, chordEvery: 15, glass: [10, 18] }, // G
};

// a soft, looping progression in semitones from the root: Imaj9 · vi9 · IVmaj7 · Vsus2
const CHORDS = [
  [0, 7, 11, 14, 16],
  [-3, 4, 7, 11, 14],
  [-7, 0, 4, 7, 11],
  [-5, 2, 7, 9, 14],
];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const hz = (root: number, semi: number) => root * Math.pow(2, semi / 12);

class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private wet: GainNode | null = null;
  private bus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timers: number[] = [];
  private live: AudioScheduledSourceNode[] = [];
  private scape: Scape | null = null;
  private bedOut: GainNode | null = null;
  private bed: { name: Bed; src: AudioBufferSourceNode | null; gain: GainNode } | null = null;
  private beds = new Map<Bed, Promise<AudioBuffer | null>>();
  on = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const soft = ctx.createBiquadFilter();
    soft.type = 'lowpass';
    soft.frequency.value = 3800; // nothing bright ever reaches the speakers
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.3;
    comp.release.value = 1;
    this.master.connect(soft).connect(comp).connect(ctx.destination);
    // the recordings skip the chords' low-pass, so birdsong keeps its air
    this.bedOut = ctx.createGain();
    this.bedOut.gain.value = 0;
    this.bedOut.connect(ctx.destination);

    // a long, smooth hall: generated, dark, five seconds
    const len = Math.floor(ctx.sampleRate * 5);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4; // pre-softened noise
        d[i] = lp * Math.pow(1 - i / len, 2.6);
      }
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    this.wet = ctx.createGain();
    this.wet.gain.value = 1;
    this.wet.connect(verb).connect(this.master);

    // brown noise: deep and smooth, like air or far-off surf
    const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const nd = nb.getChannelData(0);
    let last = 0;
    for (let i = 0; i < nd.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      nd[i] = last * 3.2;
    }
    this.noise = nb;
    return ctx;
  }

  async start() {
    const ctx = this.ensure();
    if (ctx.state === 'suspended') await ctx.resume();
    this.on = true;
    this.master!.gain.cancelScheduledValues(ctx.currentTime);
    this.master!.gain.setTargetAtTime(CHORD_LEVEL, ctx.currentTime, 2.5); // a slow fade up
    this.bedOut!.gain.cancelScheduledValues(ctx.currentTime);
    this.bedOut!.gain.setTargetAtTime(BED_LEVEL, ctx.currentTime, 2.5);
    if (this.scape) this.build(this.scape);
  }

  stop() {
    if (!this.ctx || !this.master) return;
    this.on = false;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
    this.bedOut?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.8);
    window.setTimeout(() => {
      if (this.on) return;
      this.timers.forEach((t) => window.clearTimeout(t));
      this.timers = [];
      this.live.forEach((s) => {
        try {
          s.stop();
        } catch {}
      });
      this.live = [];
      this.bus?.disconnect();
      this.bus = null;
      try {
        this.bed?.src?.stop();
      } catch {}
      this.bed?.gain.disconnect();
      this.bed = null;
    }, 4000);
  }

  set(scape: Scape) {
    if (scape === this.scape) return;
    this.scape = scape;
    if (this.on) this.build(scape);
  }

  fx(name: 'whoosh' | 'cheer' | 'bounce' | 'tick') {
    if (!this.on || !this.ctx || !this.scape) return;
    const m = MOODS[this.scape];
    // gentle accents only: a single soft note, never a hit
    if (name === 'tick' || name === 'whoosh') this.glassNote(hz(m.root, 24 + [0, 7, 4][Math.floor(Math.random() * 3)]), 0.018);
    if (name === 'cheer' && this.scape === 'arena') [0, 4, 7, 11].forEach((s, i) => window.setTimeout(() => this.on && this.glassNote(hz(m.root, 24 + s), 0.022), i * 160));
  }

  private build(scape: Scape) {
    const ctx = this.ctx!;
    const mood = MOODS[scape];
    // crossfade: the old mood sinks away over a few seconds while the new one rises
    const oldBus = this.bus;
    const oldLive = this.live;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.live = [];
    if (oldBus) {
      oldBus.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
      window.setTimeout(() => {
        oldLive.forEach((s) => {
          try {
            s.stop();
          } catch {}
        });
        oldBus.disconnect();
      }, 9000);
    }
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0, ctx.currentTime);
    bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 5);
    bus.connect(this.master!);
    this.bus = bus;

    this.surf(bus);
    this.playBed(BEDS[scape]);
    let i = 0;
    const next = () => {
      if (!this.on) return;
      this.chord(CHORDS[i % CHORDS.length], mood, bus);
      i++;
      this.timers.push(window.setTimeout(next, mood.chordEvery * 1000));
    };
    next();
    const glass = () => {
      if (!this.on) return;
      const chord = CHORDS[(i + CHORDS.length - 1) % CHORDS.length];
      const semi = chord[1 + Math.floor(Math.random() * (chord.length - 1))] + 12;
      this.glassNote(hz(mood.root, semi), 0.016, bus);
      this.timers.push(window.setTimeout(glass, rand(mood.glass[0], mood.glass[1]) * 1000));
    };
    this.timers.push(window.setTimeout(glass, 4000));
  }

  // the recording: fetched once, looped without a seam, crossfaded between places
  private loadBed(name: Bed) {
    let p = this.beds.get(name);
    if (!p) {
      const ctx = this.ctx!;
      p = fetch(`/audio/ambience/${name}.mp3`)
        .then((r) => r.arrayBuffer())
        .then((b) => ctx.decodeAudioData(b))
        .catch(() => null);
      this.beds.set(name, p);
    }
    return p;
  }

  private playBed(name: Bed) {
    const ctx = this.ctx!;
    if (this.bed?.name === name) return;
    const old = this.bed;
    if (old) {
      old.gain.gain.setTargetAtTime(0, ctx.currentTime, 1.5);
      window.setTimeout(() => {
        try {
          old.src?.stop();
        } catch {}
        old.gain.disconnect();
      }, 9000);
    }
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.bedOut!);
    const bed: { name: Bed; src: AudioBufferSourceNode | null; gain: GainNode } = { name, src: null, gain };
    this.bed = bed;
    this.loadBed(name).then((buf) => {
      if (!buf || this.bed !== bed) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      // an mp3 can carry a few milliseconds of encoder silence at each end; loop past it
      const d = buf.getChannelData(0);
      let a = 0;
      let z = d.length - 1;
      while (a < d.length / 2 && Math.abs(d[a]) < 1e-4) a++;
      while (z > d.length / 2 && Math.abs(d[z]) < 1e-4) z--;
      src.loopStart = a / buf.sampleRate;
      src.loopEnd = (z + 1) / buf.sampleRate;
      src.connect(gain);
      src.start(ctx.currentTime, src.loopStart);
      bed.src = src;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 4);
    });
  }

  // one chord: each note two slightly detuned sines that swell in over seconds and
  // fade out slowly, overlapping the next chord so there's never a gap or an edge
  private chord(notes: number[], mood: Mood, bus: GainNode) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.05;
    const hold = mood.chordEvery;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(mood.brightness * 0.6, t);
    filter.frequency.linearRampToValueAtTime(mood.brightness, t + hold * 0.5); // opens like a breath
    filter.frequency.linearRampToValueAtTime(mood.brightness * 0.6, t + hold * 1.6);
    filter.Q.value = 0.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + hold * 0.45);
    g.gain.linearRampToValueAtTime(0.022, t + hold);
    g.gain.linearRampToValueAtTime(0, t + hold * 1.7);
    filter.connect(g);
    g.connect(bus);
    const send = ctx.createGain();
    send.gain.value = 0.55;
    g.connect(send).connect(this.wet!);
    notes.forEach((semi, k) => {
      const f = hz(mood.root, semi);
      for (const det of [-5, 6]) {
        const o = ctx.createOscillator();
        o.type = k === 0 ? 'triangle' : 'sine';
        o.frequency.value = f;
        o.detune.value = det + rand(-2, 2);
        const v = ctx.createGain();
        v.gain.value = k === 0 ? 0.55 : 0.32;
        const pan = ctx.createStereoPanner();
        pan.pan.value = det < 0 ? -0.35 : 0.35;
        o.connect(v).connect(pan).connect(filter);
        o.start(t);
        o.stop(t + hold * 1.75);
      }
    });
  }

  // a soft glass-like tone: slow attack (no click), long fade, mostly reverb
  private glassNote(freq: number, level: number, bus: AudioNode = this.bus ?? this.master!) {
    const ctx = this.ctx!;
    const t = ctx.currentTime + 0.03;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = freq * 2.001;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0002, t + 7);
    const g2 = ctx.createGain();
    g2.gain.value = 0.15;
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-0.4, 0.4);
    o.connect(g);
    o2.connect(g2).connect(g);
    g.connect(pan);
    pan.connect(bus);
    const send = ctx.createGain();
    send.gain.value = 1.4;
    pan.connect(send).connect(this.wet!);
    o.start(t);
    o2.start(t);
    o.stop(t + 7.2);
    o2.stop(t + 7.2);
  }

  // distant surf: deep noise breathing in and out every ten seconds or so
  private surf(bus: GainNode) {
    const ctx = this.ctx!;
    const s = ctx.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    const g = ctx.createGain();
    g.gain.value = 0.02;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const amt = ctx.createGain();
    amt.gain.value = 0.014;
    lfo.connect(amt).connect(g.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.09;
    const amt2 = ctx.createGain();
    amt2.gain.value = 160;
    lfo2.connect(amt2).connect(lp.frequency);
    s.connect(lp).connect(g).connect(bus);
    s.start();
    lfo.start();
    lfo2.start();
    this.live.push(s, lfo, lfo2);
  }
}

let instance: Ambience | null = null;
export function ambience() {
  if (!instance) instance = new Ambience();
  return instance;
}

// fire-and-forget from anywhere (does nothing while sound is off)
export function sfx(name: 'whoosh' | 'cheer' | 'bounce' | 'tick') {
  if (typeof window === 'undefined' || !instance) return;
  instance.fx(name);
}
