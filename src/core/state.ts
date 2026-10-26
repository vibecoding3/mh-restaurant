import type { DishId, PlatterId, Rng } from './types';
import { rollFresh, rollPrices } from './economy';
import { INGREDIENT_LIST } from '../data/ingredients';

export const SAVE_VERSION = 3;
/** Favorite Platter presets per platter. */
export const FAVORITE_SLOTS = 3;
export const GAME_VERSION: string = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
export const TRIAL_DAY = 5;
export const TRIAL_REPUTATION = 170;

export interface GameStats {
  served: number;
  soTasty: number;
  walkouts: number;
  questsWon: number;
  carted: number;
}

/** A carted hunter who comes back the next day wanting a better meal. */
export interface ReturningHunter {
  typeId: string;
  monsterId: string;
  armorId: string;
  weaponId: string;
}

export interface GameState {
  version: number;
  gameVersion: string;
  day: number;
  zenny: number;
  reputation: number;
  stock: Record<string, number>;
  menu: DishId[];
  /** Ingredient ids per platter, set in morning prep. */
  platters: Record<PlatterId, string[]>;
  /** Saved platter presets (World's Favorite Platters), FAVORITE_SLOTS per platter; null = empty. */
  favorites: Record<PlatterId, (string[] | null)[]>;
  /** 1 = two slots per platter; 2 after "Flying Sparks: Tobi-Kadachi". */
  canteenLevel: number;
  /** Today's fresh ingredients. */
  fresh: string[];
  /** Ingredients the Argosy sells. */
  unlocked: string[];
  /** Completed Provisions Manager deliveries. */
  deliveries: string[];
  upgrades: string[];
  prices: Record<string, number>;
  returning: ReturningHunter[];
  trialPassed: boolean;
  stats: GameStats;
  /** Handler tutorial tips already shown. */
  tutorial: string[];
}

export function newGame(rng: Rng = Math.random): GameState {
  const unlocked = INGREDIENT_LIST.filter((i) => i.unlock === 'start').map((i) => i.id);
  return {
    version: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    day: 1,
    zenny: 500,
    reputation: 0,
    stock: {
      wyvernThigh: 3, aptonothMeat: 3, squadSardine: 3, jumboWhelk: 3,
      magnicelery: 3, plumpkin: 3, rawMeat: 5,
    },
    menu: ['meatPlatter', 'fishPlatter', 'veggiePlatter', 'chefsChoice', 'steak'],
    platters: {
      meatPlatter: ['wyvernThigh', 'aptonothMeat'],
      fishPlatter: ['squadSardine', 'jumboWhelk'],
      veggiePlatter: ['magnicelery', 'plumpkin'],
    },
    favorites: {
      meatPlatter: Array(FAVORITE_SLOTS).fill(null),
      fishPlatter: Array(FAVORITE_SLOTS).fill(null),
      veggiePlatter: Array(FAVORITE_SLOTS).fill(null),
    },
    canteenLevel: 1,
    fresh: rollFresh(rng, unlocked),
    unlocked,
    deliveries: [],
    upgrades: [],
    prices: rollPrices(rng),
    returning: [],
    trialPassed: false,
    stats: { served: 0, soTasty: 0, walkouts: 0, questsWon: 0, carted: 0 },
    tutorial: [],
  };
}

export function hasUpgrade(state: GameState, id: string): boolean {
  return state.upgrades.includes(id);
}

/** Changes reputation, never letting it drop below 0 (low punishment). */
export function addReputation(state: GameState, delta: number): number {
  const before = state.reputation;
  state.reputation = Math.max(0, state.reputation + delta);
  return state.reputation - before;
}

/** True on the Commander's Rank Trial day: Day 5, then every day until passed. */
export function isTrialDay(state: GameState): boolean {
  return !state.trialPassed && state.day >= TRIAL_DAY;
}

/** Moves the game to the next morning. */
export function advanceDay(state: GameState, rng: Rng = Math.random): void {
  state.day += 1;
  state.prices = rollPrices(rng);
  state.fresh = rollFresh(rng, state.unlocked);
}
