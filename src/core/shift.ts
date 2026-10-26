import type { Rng } from './types';

/** How long a shift lets new hunters in, in ms (`?shift=` overrides it in Service for playtests). */
export const SHIFT_MS = 120_000;
/** The first hunter arrives this long after the doors open. */
export const FIRST_ARRIVAL_MS = 1200;

/** Rush Hour before the Zorah Magdaros operation: more hunters, a little more patience, bonus reputation. */
export const RUSH = { arrivals: 1.6, patience: 1.2, reputation: 1 };

/** Milliseconds until the next hunter arrives. The Canteen Bell, later days and Rush Hour bring them sooner. */
export function arrivalInterval(day: number, bell: boolean, rng: Rng, rush = false): number {
  const speed = (bell ? 0.8 : 1) * Math.max(0.75, 1 - (day - 1) * 0.05) / (rush ? RUSH.arrivals : 1);
  return (7000 + rng() * 4500) * speed;
}

/** A Jagras raid: from Day 3, once in a quarter of shifts, starting 40-80% of the way through. Null = no raid. */
export function raidAt(day: number, rng: Rng): number | null {
  if (day < 3 || rng() >= 0.25) return null;
  return 0.4 + rng() * 0.4;
}

/** A VIP regular: from Day 4, in 40% of shifts, arriving 20-60% of the way through. Null = none today. */
export function vipAt(day: number, rng: Rng): number | null {
  if (day < 4 || rng() >= 0.4) return null;
  return 0.2 + rng() * 0.4;
}

/** Chance that a new hunter is a veteran: 10% on Day 1, rising to 50%. */
export function veteranChance(day: number): number {
  return Math.min(0.5, 0.1 + (day - 1) * 0.1);
}
