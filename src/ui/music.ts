import type Phaser from 'phaser';
import { musicVolume, setMusicVolume } from './sfx';

// Free-licensed tracks chosen to feel like World (see ASSETS_LICENSES.md). No music from the game itself.
export const MUSIC = {
  town: 'music-town', // Title and morning prep: warm town theme
  service: 'music-service', // Service: upbeat tavern folk
  spit: 'music-spit', // BBQ Spit: a short cooking song
  fanfare: 'music-fanfare', // Quest report
} as const;
type Track = (typeof MUSIC)[keyof typeof MUSIC];

let manager: Phaser.Sound.BaseSoundManager | null = null;
let current: Phaser.Sound.BaseSound | null = null;
let currentKey: Track | null = null;
/** Track to return to after a one-off (the spit song or the fanfare). */
let resumeKey: Track | null = null;

export function initMusic(sound: Phaser.Sound.BaseSoundManager): void {
  manager = sound;
}

function setVol(s: Phaser.Sound.BaseSound | null, v: number): void {
  (s as Phaser.Sound.WebAudioSound | null)?.setVolume?.(v);
}

/** Starts a looping track unless it is already playing. */
export function playMusic(key: Track, loop = true): void {
  if (!manager || currentKey === key) return;
  stopMusic();
  try {
    current = manager.add(key, { loop, volume: musicVolume() });
    current.play();
    currentKey = key;
  } catch {
    current = null;
    currentKey = null;
  }
}

export function stopMusic(): void {
  current?.stop();
  current?.destroy();
  current = null;
  currentKey = null;
}

/** Plays a track over the current one, then goes back to it. */
export function playInterlude(key: Track): void {
  if (currentKey === key) return;
  resumeKey = currentKey;
  playMusic(key);
}

export function endInterlude(): void {
  if (resumeKey) playMusic(resumeKey);
  resumeKey = null;
}

/** Cycles music volume through 0%, 25%, 50%, 75% and 100%. Returns the new volume. */
export function cycleMusicVolume(): number {
  const steps = [0, 0.25, 0.5, 0.75, 1];
  const i = steps.findIndex((s) => Math.abs(s - musicVolume()) < 0.01);
  const next = steps[(i + 1) % steps.length];
  setMusicVolume(next);
  setVol(current, next);
  return next;
}
