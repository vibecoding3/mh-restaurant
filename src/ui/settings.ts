import type { KeyValueStorage } from '../core/save';

// Every player setting, remembered per browser. The game still works if storage is missing or throws.

export const SETTINGS_KEY = 'hunters-canteen-settings';
/** Audio settings from v0.2, read once so mute and music volume carry over. */
export const OLD_AUDIO_KEY = 'hunters-canteen-audio';

export interface Settings {
  muted: boolean;
  /** Music volume 0..1. */
  music: number;
  /** Body text scale: 1 (Normal) or 1.15 (Large). */
  textScale: number;
  /** Minigame assist: wider windows and a slower board. */
  assist: boolean;
}

export const DEFAULT_SETTINGS: Settings = { muted: false, music: 0.5, textScale: 1, assist: false };
export const LARGE_TEXT = 1.15;

function defaultStorage(): KeyValueStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function sanitize(raw: Partial<Settings>): Settings {
  return {
    muted: !!raw.muted,
    music: typeof raw.music === 'number' ? Math.max(0, Math.min(1, raw.music)) : DEFAULT_SETTINGS.music,
    textScale: raw.textScale === LARGE_TEXT ? LARGE_TEXT : 1,
    assist: !!raw.assist,
  };
}

export function readSettings(storage = defaultStorage()): Settings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (raw) return sanitize(JSON.parse(raw) as Partial<Settings>);
    const old = storage.getItem(OLD_AUDIO_KEY);
    if (old) {
      const migrated = sanitize(JSON.parse(old) as Partial<Settings>);
      storage.setItem(SETTINGS_KEY, JSON.stringify(migrated));
      storage.removeItem(OLD_AUDIO_KEY);
      return migrated;
    }
  } catch {
    // unreadable: fall back to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

let current: Settings = readSettings();

export function settings(): Readonly<Settings> {
  return current;
}

export function updateSettings(patch: Partial<Settings>, storage = defaultStorage()): Settings {
  current = sanitize({ ...current, ...patch });
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
  return current;
}
