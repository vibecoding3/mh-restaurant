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

export function spitWindow(tempered: boolean): SpitWindow {
  return tempered ? { start: 0.56, end: 0.84 } : { start: 0.62, end: 0.8 };
}

/** Grades a BBQ Spit release at a meter position 0..1. */
export function gradeSpit(meter: number, window: SpitWindow): Quality {
  if (meter > window.end) return 0;
  if (meter >= window.start) return 2;
  return 1;
}

/** Grill doneness of one side of a cut: below 0.65 is rare, 0.65–0.95 golden, beyond is burnt. */
export function gradeGrill(heat: number): Quality {
  if (heat > 0.95) return 0;
  if (heat >= 0.65) return 2;
  return 1;
}

/** Chopping board grade from mistakes made and whether the timer ran out. */
export function gradeChop(mistakes: number, timedOut: boolean): Quality {
  if (timedOut || mistakes > 2) return 0;
  if (mistakes === 0) return 2;
  return 1;
}
