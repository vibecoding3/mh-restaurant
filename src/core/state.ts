import type { Rng } from './types';
import { rollPrices } from './economy';

export const SAVE_VERSION = 1;
export const FINAL_DAY = 5;
export const TRIAL_REPUTATION = 60;

export interface GameStats {
  served: number;
  soTasty: number;
  angry: number;
  questsWon: number;
  carted: number;
}

export interface GameState {
  version: number;
  day: number;
  zenny: number;
  reputation: number;
  stock: Record<string, number>;
  menu: string[];
  upgrades: string[];
  prices: Record<string, number>;
  stats: GameStats;
}

export function newGame(rng: Rng = Math.random): GameState {
  return {
    version: SAVE_VERSION,
    day: 1,
    zenny: 250,
    reputation: 0,
    stock: { rawMeat: 4, kelbiMeat: 2, herb: 4, firecellPepper: 2, forestPotato: 2 },
    menu: ['steak', 'skewers', 'spicy'],
    upgrades: [],
    prices: rollPrices(rng),
    stats: { served: 0, soTasty: 0, angry: 0, questsWon: 0, carted: 0 },
  };
}

export function hasUpgrade(state: GameState, id: string): boolean {
  return state.upgrades.includes(id);
}

export function rankFor(reputation: number): string {
  if (reputation >= 120) return 'Low Rank ★★★';
  if (reputation >= 60) return 'Low Rank ★★';
  return 'Low Rank ★';
}

/** Moves the game to the next morning. */
export function advanceDay(state: GameState, rng: Rng = Math.random): void {
  state.day += 1;
  state.prices = rollPrices(rng);
}
