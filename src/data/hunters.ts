import type { HunterType } from '../core/types';

export const HUNTER_TYPES: Record<string, HunterType> = {
  rookie: { id: 'rookie', label: 'Rookie', patience: 55, skill: 1, tipRate: 0.2 },
  veteran: { id: 'veteran', label: 'Veteran', patience: 38, skill: 2, tipRate: 0.45 },
};

export const HUNTER_NAMES = [
  'Aiden', 'Rook', 'Sable', 'Mira', 'Tobin', 'Wren', 'Kasha', 'Dorn',
  'Ilse', 'Bram', 'Juno', 'Fenn', 'Oska', 'Vel', 'Pip', 'Garran',
];

export const WEAPONS = ['GS', 'LS', 'SnS', 'DB', 'HM', 'HH', 'LN', 'GL', 'SA', 'CB', 'IG', 'BW'];

export const ARMOR_COLORS = [0xb5523b, 0x4f7cac, 0x6c9a4b, 0xc9a227, 0x8a5a9e, 0x5a6b73, 0xd17a2a];
