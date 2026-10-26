import type { Quality } from './types';

/** Combines the grades from each station step into one dish quality. */
export function combineQuality(grades: Quality[]): Quality {
  if (grades.length === 0) return 0;
  const avg = grades.reduce<number>((a, b) => a + b, 0) / grades.length;
  if (avg >= 1.66) return 2;
  if (avg >= 0.83) return 1;
  return 0;
}

export interface SpitWindow {
  start: number;
  end: number;
}

/** Minigame assist widens the BBQ Spit's gold window by this much on each side. */
const ASSIST_SPIT = 0.06;

export function spitWindow(tempered: boolean, assist = false): SpitWindow {
  const w = tempered ? { start: 0.56, end: 0.84 } : { start: 0.62, end: 0.8 };
  return assist ? { start: w.start - ASSIST_SPIT, end: w.end + ASSIST_SPIT } : w;
}

/** Grades a BBQ Spit release at a meter position 0..1. */
export function gradeSpit(meter: number, window: SpitWindow): Quality {
  if (meter > window.end) return 0;
  if (meter >= window.start) return 2;
  return 1;
}

/** The grill's golden range of heat; assist widens it to 0.55–1.0. */
export function grillGolden(assist = false): { start: number; end: number } {
  return assist ? { start: 0.55, end: 1 } : { start: 0.65, end: 0.95 };
}

/** Grill doneness of one side of a cut: below the golden range is rare, beyond it is burnt. */
export function gradeGrill(heat: number, assist = false): Quality {
  const g = grillGolden(assist);
  if (heat > g.end) return 0;
  if (heat >= g.start) return 2;
  return 1;
}

/** Chopping board grade from how many tossed ingredients fell without being sliced. */
export function gradeChop(missed: number): Quality {
  if (missed === 0) return 2;
  if (missed <= 2) return 1;
  return 0;
}

export interface PotBand {
  low: number;
  high: number;
  /** How long each "Add ingredient!" cue stays open, in ms. */
  cueMs: number;
}

/** The Soup Pot's green heat band; assist widens it and holds the cues open longer. */
export function potBand(assist = false): PotBand {
  return assist ? { low: 0.38, high: 0.77, cueMs: 1300 } : { low: 0.45, high: 0.7, cueMs: 900 };
}

/** Soup Pot grade from the share of time spent in the green band and the ingredient cues hit (of 3). */
export function gradePot(greenShare: number, hits: number): Quality {
  if (greenShare >= 0.75 && hits >= 3) return 2;
  if (greenShare >= 0.45 && hits >= 2) return 1;
  return 0;
}
