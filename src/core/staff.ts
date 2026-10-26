import type { Quality, StationId } from './types';
import type { GameState } from './state';

// Kitchen Palicoes: unnamed helpers, as in World's Canteen, who cook one station's orders on their own.

export interface KitchenPalico {
  id: string;
  station: StationId | null;
  /** Dishes cooked so far; enough of them and the Palico cooks Well-done. */
  cooked: number;
  /** True when this morning's wage couldn't be paid: the Palico takes the day off. */
  off: boolean;
}

export const HIRE_COSTS = [2000, 3000];
/** The Commander approves extra kitchen staff once the Canteen is established. */
export const STAFF_DAY = 5;
export const MAX_STAFF = HIRE_COSTS.length;
export const WAGE = 150;
export const STAFF_COOK_MS = 7000;
/** Dishes a Palico must cook to reach level 2. */
export const LEVEL_UP_DISHES = 25;

/** The next Palico's price, or null if none can be hired (all hired, or before Day 5). */
export function hireCost(state: GameState): number | null {
  return state.staff.length < MAX_STAFF && state.day >= STAFF_DAY ? HIRE_COSTS[state.staff.length] : null;
}

export function hireStaff(state: GameState): boolean {
  const cost = hireCost(state);
  if (cost === null || state.zenny < cost) return false;
  state.zenny -= cost;
  state.staff.push({ id: `palico${state.staff.length + 1}`, station: null, cooked: 0, off: false });
  return true;
}

/** Puts a Palico on a station (or none). A station takes one Palico; whoever was there moves off it. */
export function assignStaff(state: GameState, id: string, station: StationId | null): boolean {
  const p = state.staff.find((x) => x.id === id);
  if (!p) return false;
  if (station) for (const other of state.staff) if (other !== p && other.station === station) other.station = null;
  p.station = station;
  return true;
}

/** Morning wages. Low punishment: a Palico who can't be paid takes the day off, with no debt. */
export function payWages(state: GameState): number {
  let paid = 0;
  for (const p of state.staff) {
    p.off = state.zenny < WAGE;
    if (!p.off) {
      state.zenny -= WAGE;
      paid += WAGE;
    }
  }
  return paid;
}

export function staffLevel(p: KitchenPalico): number {
  return p.cooked >= LEVEL_UP_DISHES ? 2 : 1;
}

export function staffQuality(p: KitchenPalico): Quality {
  return staffLevel(p) >= 2 ? 2 : 1;
}

/** The Palico working a station today, if any. */
export function stationStaff(state: GameState, station: StationId): KitchenPalico | undefined {
  return state.staff.find((p) => p.station === station && !p.off);
}
