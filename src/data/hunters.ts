import type { ArmorSet, HunterType, Weapon } from '../core/types';

// Customers are unnamed Research Commission hunters.
export const HUNTER_TYPES: Record<string, HunterType> = {
  rookie: { id: 'rookie', label: 'Commission hunter', patience: 70, skill: 1, tipRate: 0.2 },
  veteran: { id: 'veteran', label: 'Veteran hunter', patience: 52, skill: 2, tipRate: 0.45 },
};

// The 14 weapon types of World.
export const WEAPONS: Weapon[] = [
  { id: 'gs', name: 'Great Sword', short: 'GS', cls: 'blade' },
  { id: 'ls', name: 'Long Sword', short: 'LS', cls: 'blade' },
  { id: 'sns', name: 'Sword and Shield', short: 'SnS', cls: 'blade' },
  { id: 'db', name: 'Dual Blades', short: 'DB', cls: 'blade' },
  { id: 'hammer', name: 'Hammer', short: 'HM', cls: 'blunt' },
  { id: 'hh', name: 'Hunting Horn', short: 'HH', cls: 'blunt' },
  { id: 'lance', name: 'Lance', short: 'LN', cls: 'blade' },
  { id: 'gl', name: 'Gunlance', short: 'GL', cls: 'gunlance' },
  { id: 'sa', name: 'Switch Axe', short: 'SA', cls: 'blade' },
  { id: 'cb', name: 'Charge Blade', short: 'CB', cls: 'blade' },
  { id: 'ig', name: 'Insect Glaive', short: 'IG', cls: 'blade' },
  { id: 'lbg', name: 'Light Bowgun', short: 'LBG', cls: 'gun' },
  { id: 'hbg', name: 'Heavy Bowgun', short: 'HBG', cls: 'gun' },
  { id: 'bow', name: 'Bow', short: 'Bow', cls: 'bow' },
];

export const WEAPONS_BY_ID: Record<string, Weapon> = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

// Low Rank armor sets of World, unlocked roughly as their monsters appear.
export const ARMOR_SETS: ArmorSet[] = [
  { id: 'leather', name: 'Leather', main: 0x8b5a2b, trim: 0xc49a6c, minDay: 1 },
  { id: 'chainmail', name: 'Chainmail', main: 0x8d9399, trim: 0x5b6066, minDay: 1 },
  { id: 'hunters', name: "Hunter's", main: 0x6b7a3a, trim: 0x9a6a3a, minDay: 1 },
  { id: 'bone', name: 'Bone', main: 0xe2d6b8, trim: 0x8a7a5a, minDay: 1 },
  { id: 'alloy', name: 'Alloy', main: 0xa0a8b0, trim: 0x4a5a6a, minDay: 2 },
  { id: 'jagras', name: 'Jagras', main: 0x4f7a3a, trim: 0xd9a43a, minDay: 2 },
  { id: 'kulu', name: 'Kulu', main: 0xc8a46a, trim: 0x5a7ab0, minDay: 2 },
  { id: 'pukei', name: 'Pukei', main: 0x5a8a4a, trim: 0x8a5ab0, minDay: 3 },
  { id: 'barroth', name: 'Barroth', main: 0xa86a3a, trim: 0x6a4a2a, minDay: 4 },
  { id: 'jyura', name: 'Jyura', main: 0x7a5a3a, trim: 0x3a5a7a, minDay: 4 },
  { id: 'kadachi', name: 'Kadachi', main: 0x3a6a8a, trim: 0xe8e2c8, minDay: 5 },
  { id: 'anja', name: 'Anja', main: 0x8a3a2a, trim: 0x2a2a2a, minDay: 6 },
  { id: 'rathian', name: 'Rathian', main: 0x4a6a3a, trim: 0x9a3a2a, minDay: 7 },
];

export const ARMOR_BY_ID: Record<string, ArmorSet> = Object.fromEntries(ARMOR_SETS.map((a) => [a.id, a]));

/** "Hunter in Jagras armor" style label: no invented names. */
export function hunterLabel(armorId: string): string {
  return `${ARMOR_BY_ID[armorId].name} armor`;
}
