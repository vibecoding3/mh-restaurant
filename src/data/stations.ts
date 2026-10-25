import type { StationId } from '../core/types';

export const STATIONS: Record<StationId, { name: string; icon: string; key: string }> = {
  board: { name: 'Chopping Board', icon: '🔪', key: '1' },
  spit: { name: 'BBQ Spit', icon: '🍖', key: '2' },
  grill: { name: 'Skewer Grill', icon: '🍢', key: '3' },
};

export const STATION_ORDER: StationId[] = ['board', 'spit', 'grill'];

export const BUFF_LABELS: Record<string, { name: string; icon: string }> = {
  attack: { name: 'Attack', icon: '⚔️' },
  defense: { name: 'Defense', icon: '🛡️' },
  health: { name: 'Health', icon: '❤️' },
  stamina: { name: 'Stamina', icon: '⚡' },
  fireRes: { name: 'Fire Res', icon: '🔥' },
  heroics: { name: 'Felyne Heroics', icon: '🐱' },
};

export const QUALITY_LABELS = ['Burnt!', 'Rare...', 'So tasty!'] as const;
export const QUALITY_COLORS = ['#8a8a8a', '#e0893a', '#f2c94c'] as const;
