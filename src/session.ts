import type { DishId, Quality } from './core/types';
import { newGame, type GameState } from './core/state';

export interface ServedRecord {
  typeId: string;
  monsterId: string;
  dishId: DishId;
  /** Ingredients the dish was made from. */
  ingredients: string[];
  quality: Quality;
  armorId: string;
  weaponId: string;
}

export interface ShiftSummary {
  served: ServedRecord[];
  earned: number;
  repDelta: number;
  walkouts: number;
}

/** The running game, shared between scenes. */
export const session: { state: GameState; shift: ShiftSummary | null; saveReset: boolean } = {
  state: newGame(),
  shift: null,
  saveReset: false,
};
