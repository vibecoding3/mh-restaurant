import type { NeedId, StationId } from '../core/types';

export const STATIONS: Record<StationId, { name: string; icon: string; key: string }> = {
  board: { name: 'Chopping Board', icon: 'board', key: '1' },
  spit: { name: 'BBQ Spit', icon: 'spit', key: '2' },
  grill: { name: 'Grill', icon: 'grill', key: '3' },
  pot: { name: 'Soup Pot', icon: 'cauldron', key: '4' },
};

export const STATION_ORDER: StationId[] = ['board', 'spit', 'grill', 'pot'];

export const NEED_LABELS: Record<NeedId | 'health', { name: string; icon: string; tint: number }> = {
  attack: { name: 'Attack Up', icon: 'attack', tint: 0xe0603a },
  defense: { name: 'Defense Up', icon: 'defense', tint: 0x5a8ad0 },
  elemRes: { name: 'Elemental Res Up', icon: 'elemRes', tint: 0x6ab84a },
  stamina: { name: 'Stamina', icon: 'stamina', tint: 0xf2c94c },
  health: { name: 'Health', icon: 'heart', tint: 0xe04a5a },
};

export const TIER_LABELS = ['', '(S)', '(M)', '(L)'];

export const QUALITY_LABELS = ['Burnt!', 'Rare...', 'So tasty!'] as const;
export const QUALITY_NAMES = ['Burnt', 'Rare', 'Well-done'] as const;
export const QUALITY_COLORS = ['#8a8a8a', '#e0893a', '#f2c94c'] as const;
