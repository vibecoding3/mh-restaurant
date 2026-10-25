import { SAVE_VERSION, type GameState } from './state';

export const SAVE_KEY = 'hunters-canteen-save';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
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
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(storage = defaultStorage()): GameState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    return raw ? migrate(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearSave(storage = defaultStorage()): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

/** Upgrades older save schemas to the current one. Returns null for unreadable saves. */
export function migrate(data: unknown): GameState | null {
  if (!data || typeof data !== 'object') return null;
  const save = data as Partial<GameState>;
  if (save.version !== SAVE_VERSION) return null; // only one schema so far
  if (typeof save.day !== 'number' || typeof save.zenny !== 'number' || !save.stock) return null;
  return save as GameState;
}
