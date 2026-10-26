import type { DishId, Quality } from './core/types';
import { newGame, type GameState } from './core/state';
import type { VipId } from './data/cast';

export interface ServedRecord {
  typeId: string;
  monsterId: string;
  dishId: DishId;
  /** Ingredients the dish was made from. */
  ingredients: string[];
  quality: Quality;
  armorId: string;
  weaponId: string;
  /** True if the dish gave what the hunter needed. */
  matched: boolean;
  /** Set when the customer was a VIP regular. */
  vip?: VipId;
}

export interface ShiftSummary {
  served: ServedRecord[];
  earned: number;
  repDelta: number;
  walkouts: number;
  /** This shift was the Commander's Rank Trial. */
  trial: boolean;
  /** This shift was the Rush Hour before the Zorah Magdaros operation. */
  rush: boolean;
  /** Dishes cooked by kitchen Palicoes. */
  staffCooked: number;
  /** Ingredients Jagras ate. */
  raided: string[];
}

export function emptyShift(): ShiftSummary {
  return { served: [], earned: 0, repDelta: 0, walkouts: 0, trial: false, rush: false, staffCooked: 0, raided: [] };
}

/** The running game, shared between scenes. */
export const session: { state: GameState; shift: ShiftSummary | null; saveReset: boolean } = {
  state: newGame(),
  shift: null,
  saveReset: false,
};
