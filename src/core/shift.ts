import type { Rng } from './types';

/** How long a shift lets new hunters in, in ms (`?shift=` overrides it in Service for playtests). */
export const SHIFT_MS = 120_000;
/** The first hunter arrives this long after the doors open. */
export const FIRST_ARRIVAL_MS = 1200;

/** Milliseconds until the next hunter arrives. The Canteen Bell and later days bring them sooner. */
export function arrivalInterval(day: number, bell: boolean, rng: Rng): number {
  const speed = (bell ? 0.8 : 1) * Math.max(0.75, 1 - (day - 1) * 0.05);
  return (7000 + rng() * 4500) * speed;
}

/** Chance that a new hunter is a veteran: 10% on Day 1, rising to 50%. */
export function veteranChance(day: number): number {
  return Math.min(0.5, 0.1 + (day - 1) * 0.1);
}
