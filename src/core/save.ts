import { GAME_VERSION, SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'hunters-canteen-save';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadResult {
  state: GameState | null;
  /** True if an old or unreadable save was found and wiped. */
  reset: boolean;
}

/** localStorage can be missing or throw (private mode, blocked site data). */
function defaultStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function saveGame(state: GameState, storage = defaultStorage()): boolean {
  if (!storage) return false;
  try {
    state.gameVersion = GAME_VERSION;
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** Loads the save. Saves from another schema version are wiped (allowed until the Low Rank release). */
export function loadGame(storage = defaultStorage()): LoadResult {
  if (!storage) return { state: null, reset: false };
  let raw: string | null;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return { state: null, reset: false };
  }
  if (!raw) return { state: null, reset: false };
  let state: GameState | null = null;
  try {
    state = validate(JSON.parse(raw));
  } catch {
    state = null;
  }
  if (!state) {
    clearSave(storage);
    return { state: null, reset: true };
  }
  return { state, reset: false };
}

export function clearSave(storage = defaultStorage()): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/** Returns the save if it matches the current schema, otherwise null. */
export function validate(data: unknown): GameState | null {
  if (!data || typeof data !== 'object') return null;
  const save = data as Partial<GameState>;
  if (save.version !== SAVE_VERSION) return null;
  if (typeof save.day !== 'number' || typeof save.zenny !== 'number' || !save.stock || !save.platters) return null;
  if (!save.favorites || !Array.isArray(save.tutorial) || !Array.isArray(save.staff) || save.rushDay === undefined) return null;
  return save as GameState;
}
