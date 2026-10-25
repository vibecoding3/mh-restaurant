// Tiny synthesized sound effects (Web Audio). No audio files needed, works offline.

let ctx: AudioContext | null = null;
let muted = false;

function audio(): AudioContext | null {
  if (muted) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.04, delay = 0, slideTo?: number): void {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + delay;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  click: () => tone(660, 0.05, 'square', 0.03),
  chop: () => tone(220, 0.06, 'triangle', 0.08, 0, 120),
  miss: () => tone(140, 0.15, 'sawtooth', 0.04),
  sizzle: () => tone(1800, 0.05, 'sawtooth', 0.01),
  tasty: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', 0.04, i * 0.08)),
  rare: () => [440, 392].forEach((f, i) => tone(f, 0.15, 'triangle', 0.06, i * 0.1)),
  burnt: () => tone(180, 0.45, 'sawtooth', 0.05, 0, 60),
  coin: () => [988, 1319].forEach((f, i) => tone(f, 0.1, 'square', 0.03, i * 0.06)),
  angry: () => tone(300, 0.3, 'sawtooth', 0.04, 0, 120),
  arrive: () => tone(880, 0.08, 'sine', 0.05),
  gong: () => [196, 98].forEach((f) => tone(f, 1.4, 'sine', 0.12)),
  flip: () => tone(520, 0.08, 'triangle', 0.06, 0, 780),
};

export function toggleMute(): boolean {
  muted = !muted;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}
