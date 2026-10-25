import type { Quality } from './core/types';
import { newGame, type GameState } from './core/state';

export interface ServedRecord {
  name: string;
  typeId: string;
  monsterId: string;
  recipeId: string;
  quality: Quality;
  armor: number;
  weapon: string;
}

export interface ShiftSummary {
  served: ServedRecord[];
  earned: number;
  repDelta: number;
  angry: number;
}

/** The running game, shared between scenes. */
export const session: { state: GameState; shift: ShiftSummary | null } = {
  state: newGame(),
  shift: null,
};
