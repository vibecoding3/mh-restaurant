import type Phaser from 'phaser';
import { settings, updateSettings } from './settings';

// Sound effects from Kenney's CC0 audio packs, played through Phaser's global sound manager.
// Mute and music volume live in the player settings.

export const SFX_KEYS = ['click', 'chop', 'miss', 'tasty', 'rare', 'burnt', 'coin', 'angry', 'arrive', 'gong', 'flip', 'pot'] as const;
type SfxKey = (typeof SFX_KEYS)[number];

const VOLUME: Record<SfxKey, number> = {
  click: 0.5, chop: 0.7, miss: 0.5, tasty: 0.6, rare: 0.5, burnt: 0.5, coin: 0.6,
  angry: 0.5, arrive: 0.35, gong: 0.5, flip: 0.6, pot: 0.4,
};

let sound: Phaser.Sound.BaseSoundManager | null = null;

export function initAudio(manager: Phaser.Sound.BaseSoundManager): void {
  sound = manager;
  sound.mute = settings().muted;
}

function play(key: SfxKey, rate = 1): void {
  if (!sound || settings().muted) return;
  try {
    sound.play(`sfx-${key}`, { volume: VOLUME[key], rate });
  } catch {
    // audio not ready or unsupported
  }
}

export const sfx = {
  click: () => play('click'),
  chop: () => play('chop', 0.9 + Math.random() * 0.2),
  miss: () => play('miss'),
  sizzle: () => play('pot', 1.4),
  tasty: () => play('tasty'),
  rare: () => play('rare'),
  burnt: () => play('burnt'),
  coin: () => play('coin'),
  angry: () => play('angry'),
  arrive: () => play('arrive'),
  gong: () => play('gong'),
  flip: () => play('flip'),
};

export function toggleMute(): boolean {
  const muted = updateSettings({ muted: !settings().muted }).muted;
  if (sound) sound.mute = muted;
  return muted;
}

export function isMuted(): boolean {
  return settings().muted;
}

export function musicVolume(): number {
  return settings().music;
}

export function setMusicVolume(v: number): void {
  updateSettings({ music: v });
}
