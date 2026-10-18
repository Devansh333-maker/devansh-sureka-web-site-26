import { DUR, R } from '../cinematic/timeline';

// The 2D half of the 2D/3D hybrid: drawn over the 3D frame on the same clock.
// Speed lines on the drive, focus lines that close in during bullet time, a whip-pan
// blur on the cut, letterbox bars, and the kinetic type (DOM, in the site's own faces).
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const outExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
const inExpo = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10));
const outBack = (t: number, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : Math.sin(((t - a) / (b - a)) * Math.PI));
const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

type Word = { el: HTMLElement; letters: HTMLElement[] };

export class Overlay {
  private g: CanvasRenderingContext2D;
  private W = 1;
  private H = 1;
  private words: Record<string, Word> = {};
  constructor(private canvas: HTMLCanvasElement, private type: HTMLElement) {
    this.g = canvas.getContext('2d')!;
    const make = (key: string, text: string, cls: string) => {
      const el = document.createElement('div');
      el.className = `ac-type ${cls}`;
      const letters = [...text].map((ch) => {
        const s = document.createElement('span');
        s.textContent = ch === ' ' ? ' ' : ch;
        el.appendChild(s);
        return s;
      });
      type.appendChild(el);
      this.words[key] = { el, letters };
    };
    make('kana', 'アリーナ', 'ac-kana');
    make('title', 'THE ARENA', 'ac-title');
    make('sub', 'ROLL BALL · ON QUAD SKATES', 'ac-sub');
    make('read', 'READ THE PLAY', 'ac-lower');
    make('wait', 'WAIT FOR THE GAP', 'ac-wait');
    make('strike', 'STRIKE', 'ac-slam');
    make('goal', 'GOAL', 'ac-goal');
    make('kgoal', 'ゴール', 'ac-kana ac-kana--goal');
  }
  resize() {
    const r = this.canvas.getBoundingClientRect();
    const d = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(r.width * d);
    this.canvas.height = Math.round(r.height * d);
    this.g.setTransform(d, 0, 0, d, 0, 0);
    this.W = r.width;
    this.H = r.height;
  }

  // letters in with a stagger: rise from below with a little stretch (a smear), settle
  private letters(w: Word, k: number, out = 0, mode: 'rise' | 'drop' | 'track' = 'rise') {
    const n = w.letters.length;
    w.el.style.opacity = k > 0 && out < 1 ? '1' : '0';
    w.letters.forEach((s, i) => {
      const a = clamp(k * (n + 4) / 5 - i / 5 * 1.0 * (5 / n) * (n / 5));
      const li = clamp(k * 1.6 - (i / n) * 0.6);
      const lo = clamp(out * 1.6 - (i / n) * 0.6);
      const e = outBack(li);
      if (mode === 'drop') s.style.transform = `translateY(${(1 - e) * -120 - lo * 160}%) scaleY(${1 + (1 - li) * 0.9 + lo * 0.6})`;
      else if (mode === 'track') s.style.transform = `translateX(${(i - n / 2) * (1 - outExpo(li)) * -18}px)`;
      else s.style.transform = `translateY(${(1 - outExpo(li)) * 110 + lo * -110}%) skewX(${(1 - li) * -14}deg)`;
      s.style.opacity = String(clamp(li * 3) * (1 - lo));
      void a;
    });
  }

  draw(r: number, focus: { x: number; y: number }) {
    const g = this.g, W = this.W, H = this.H;
    g.clearRect(0, 0, W, H);
    const fx = focus.x * W, fy = focus.y * H;

    // speed lines on the drive: the floor rushing under the camera
    const drive = r > R.drive && r < R.whip ? Math.min(seg(r, R.drive, R.drive + 0.25), 1 - seg(r, R.whip - 0.05, R.whip)) : 0;
    if (drive > 0) {
      g.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const y = rnd(i) * H, len = (60 + rnd(i + 3) * 340) * drive;
        const x = ((rnd(i + 9) * W * 1.6 - r * 2400 * (0.6 + rnd(i + 4))) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3;
        g.globalAlpha = drive * (0.12 + rnd(i + 5) * 0.32);
        g.strokeStyle = i % 9 === 0 ? '#c6f24a' : '#f3ebdd';
        g.lineWidth = 0.5 + rnd(i + 2) * 1.4;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + len, y);
        g.stroke();
      }
      g.globalAlpha = 1;
    }

    // the whip pan: a smear of light across the cut
    const whip = bump(r, R.whip - 0.09, R.whip + 0.12);
    if (whip > 0) {
      const grd = g.createLinearGradient(0, 0, W, 0);
      grd.addColorStop(0, 'rgba(243,235,221,0)');
      grd.addColorStop(0.5, `rgba(243,235,221,${0.55 * whip})`);
      grd.addColorStop(1, 'rgba(243,235,221,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) {
        g.globalAlpha = whip * 0.5;
        g.fillStyle = '#fff';
        g.fillRect(0, rnd(i + 40) * H, W, 1 + rnd(i) * 3);
      }
      g.globalAlpha = 1;
    }

    // focus lines: close in on him as time slows, and burst on the strike and the goal
    const slow = r > R.gap && r < R.shot ? Math.min(seg(r, R.gap, R.gap + 0.5), 1 - seg(r, R.shot - 0.1, R.shot)) : 0;
    const burst = Math.max(bump(r, R.shot - 0.02, R.shot + 0.3), bump(r, R.hit - 0.02, R.hit + 0.45));
    const focusK = Math.max(slow * 0.85, burst);
    if (focusK > 0) {
      const inner = burst > slow ? 80 + (1 - burst) * 200 : 260 - slow * 120;
      g.fillStyle = burst > slow ? '#0a0807' : 'rgba(10,8,7,.85)';
      for (let i = 0; i < 110; i++) {
        const a = (i / 110) * Math.PI * 2 + rnd(i) * 0.03 + (burst > 0 ? 0 : Math.sin(r * 3 + i) * 0.004);
        const r0 = inner + rnd(i + 1) * 120;
        const wdt = (0.004 + rnd(i + 7) * 0.012) * focusK;
        g.globalAlpha = focusK * (0.45 + rnd(i + 3) * 0.5);
        g.beginPath();
        g.moveTo(fx + Math.cos(a - wdt) * r0, fy + Math.sin(a - wdt) * r0);
        g.lineTo(fx + Math.cos(a) * W * 1.2, fy + Math.sin(a) * W * 1.2);
        g.lineTo(fx + Math.cos(a + wdt) * r0, fy + Math.sin(a + wdt) * r0);
        g.fill();
      }
      g.globalAlpha = 1;
    }

    // letterbox: the frame narrows for the slow motion and the shot
    const box = Math.max(seg(r, R.gap - 0.2, R.gap + 0.2) * (1 - seg(r, R.hit + 1.2, R.hit + 1.8)), 0.35 * seg(r, R.outro, R.outro + 0.6));
    if (box > 0) {
      g.fillStyle = '#000';
      const b = H * 0.11 * outExpo(box);
      g.fillRect(0, 0, W, b);
      g.fillRect(0, H - b, W, b);
    }

    // fade from and to black at the loop point
    const fade = Math.max(1 - seg(r, 0, 0.3), seg(r, DUR - 0.45, DUR));
    if (fade > 0) {
      g.fillStyle = `rgba(0,0,0,${fade})`;
      g.fillRect(0, 0, W, H);
    }

    // ── kinetic type ──
    const w = this.words;
    this.letters(w.kana, seg(r, R.lightOn + 0.1, R.title + 0.4), seg(r, R.drive - 0.1, R.drive + 0.2), 'track');
    this.letters(w.kgoal, seg(r, R.hit + 0.1, R.hit + 0.4), seg(r, R.hit + 1.6, R.hit + 1.9));
    this.letters(w.title, seg(r, R.title, R.title + 0.55), seg(r, R.drive - 0.1, R.drive + 0.2), 'drop');
    this.letters(w.sub, seg(r, R.title + 0.35, R.title + 0.8), seg(r, R.drive - 0.1, R.drive + 0.15));
    this.letters(w.read, seg(r, R.drive + 0.25, R.drive + 0.65), seg(r, R.gap - 0.3, R.gap));
    this.letters(w.wait, seg(r, R.gap + 0.2, R.gap + 1.0), seg(r, R.shot - 0.15, R.shot), 'track');
    this.letters(w.strike, seg(r, R.shot, R.shot + 0.12), seg(r, R.hit - 0.08, R.hit), 'drop');
    this.letters(w.goal, seg(r, R.hit + 0.02, R.hit + 0.16), seg(r, R.hit + 1.6, R.hit + 1.9), 'drop');
    // the GOAL shakes and splits into red and cyan on impact
    const hit = bump(r, R.hit, R.hit + 0.5);
    w.goal.el.style.setProperty('--split', `${hit * 10}px`);
    w.goal.el.style.translate = `${(rnd(Math.floor(r * 60)) - 0.5) * hit * 24}px ${(rnd(Math.floor(r * 60) + 5) - 0.5) * hit * 18}px`;
    w.strike.el.style.translate = `${(rnd(Math.floor(r * 60) + 2) - 0.5) * bump(r, R.shot, R.shot + 0.25) * 30}px 0`;
    void inExpo;
  }
}
