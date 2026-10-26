import type { Ingredient } from '../core/types';
import { DELIVERY_LIST } from './deliveries';

// Canteen ingredients from Monster Hunter: World (GDD Appendix A.2). Prices are gameplay numbers.
export const INGREDIENT_LIST: Ingredient[] = [
  // Meat: Attack Up
  { id: 'wyvernThigh', name: 'Wyvern Thigh', icon: 'drumstick', tint: 0xc0563a, category: 'meat', group: 'courage', basePrice: 30, unlock: 'start' },
  { id: 'toughMeat', name: 'Tough Meat', icon: 'meat', tint: 0xb04a3a, category: 'meat', group: 'resilience', basePrice: 28, unlock: 'start' },
  { id: 'aptonothMeat', name: 'Aptonoth Meat', icon: 'steak', tint: 0xd06a4a, category: 'meat', group: 'vigor', basePrice: 22, unlock: 'start' },
  { id: 'whiteLiver', name: 'White Liver', icon: 'liver', tint: 0xe8c8b8, category: 'meat', group: 'acumen', basePrice: 34, unlock: 'start' },
  { id: 'peonTurkey', name: 'Peon Turkey', icon: 'chicken', tint: 0xd89a5a, category: 'meat', group: 'artillery', basePrice: 26, unlock: 'start' },
  { id: 'wyvernSkirtSteak', name: 'Wyvern Skirt Steak', icon: 'steak', tint: 0xa83a2a, category: 'meat', group: 'courage', basePrice: 38, unlock: 'delivery' },
  { id: 'thornyMeat', name: 'Thorny Meat', icon: 'meat', tint: 0x8a5a3a, category: 'meat', group: 'resilience', basePrice: 36, unlock: 'delivery' },
  { id: 'apceroast', name: 'Apceroast', icon: 'meat', tint: 0xc8803a, category: 'meat', group: 'vigor', basePrice: 34, unlock: 'delivery' },
  { id: 'wyvernEgg', name: 'Wyvern Egg', icon: 'egg', tint: 0xe0d090, category: 'meat', group: 'courage', sellPrice: 40, unlock: 'field' },
  { id: 'herbivoreEgg', name: 'Herbivore Egg', icon: 'egg', tint: 0xf2ead8, category: 'meat', group: 'artillery', sellPrice: 20, unlock: 'field' },

  // Fish: Defense Up
  { id: 'sushifish', name: 'Sushifish', icon: 'sushifish', tint: 0xe07a5a, category: 'fish', group: 'courage', basePrice: 24, sellPrice: 10, unlock: 'start' },
  { id: 'jumboWhelk', name: 'Jumbo Whelk', icon: 'shell', tint: 0xd8b890, category: 'fish', group: 'resilience', basePrice: 30, unlock: 'start' },
  { id: 'squadSardine', name: 'Squad Sardine', icon: 'fish', tint: 0x8aa8c0, category: 'fish', group: 'vigor', basePrice: 20, unlock: 'start' },
  { id: 'bentBackedShrimp', name: 'Bent-backed Shrimp', icon: 'shrimp', tint: 0xe8806a, category: 'fish', group: 'acumen', basePrice: 32, unlock: 'start' },
  { id: 'osseoctopus', name: 'Osseoctopus', icon: 'octopus', tint: 0xc07aa0, category: 'fish', group: 'artillery', basePrice: 36, unlock: 'start' },
  { id: 'serpentineSalmon', name: 'Serpentine Salmon', icon: 'tuna', tint: 0xe89a7a, category: 'fish', group: 'courage', basePrice: 34, unlock: 'delivery' },
  { id: 'scallopChips', name: 'Scallop Chips', icon: 'shell', tint: 0xf0dcb0, category: 'fish', group: 'resilience', basePrice: 32, unlock: 'delivery' },
  { id: 'samuraiTuna', name: 'Samurai Tuna', icon: 'tuna', tint: 0x6a8ab0, category: 'fish', group: 'vigor', basePrice: 38, unlock: 'delivery' },

  // Vegetables: Elemental Res Up
  { id: 'magnicelery', name: 'Magnicelery', icon: 'celery', tint: 0x8ac05a, category: 'veg', group: 'courage', basePrice: 18, unlock: 'start' },
  { id: 'stonecorn', name: 'Stonecorn', icon: 'corn', tint: 0xe8c04a, category: 'veg', group: 'resilience', basePrice: 16, unlock: 'start' },
  { id: 'plumpkin', name: 'Plumpkin', icon: 'pumpkin', tint: 0xe0882a, category: 'veg', group: 'vigor', basePrice: 20, unlock: 'start' },
  { id: 'aromaticelery', name: 'Aromaticelery', icon: 'celery', tint: 0x5aa07a, category: 'veg', group: 'acumen', basePrice: 22, unlock: 'start' },
  { id: 'kutkuBean', name: 'Kut-Ku Bean', icon: 'bean', tint: 0x9ac05a, category: 'veg', group: 'artillery', basePrice: 18, unlock: 'start' },
  { id: 'rapscallion', name: 'Rapscallion', icon: 'onion', tint: 0xd8a0c0, category: 'veg', group: 'courage', basePrice: 24, unlock: 'delivery' },
  { id: 'steadfastSpud', name: 'Steadfast Spud', icon: 'potato', tint: 0xc8a06a, category: 'veg', group: 'resilience', basePrice: 22, unlock: 'delivery' },
  { id: 'cudgelOnion', name: 'Cudgel Onion', icon: 'onion', tint: 0xe8d8a0, category: 'veg', group: 'vigor', basePrice: 24, unlock: 'delivery' },

  // Field items: gathered or carved by hunters, never sold by the Argosy.
  { id: 'rawMeat', name: 'Raw Meat', icon: 'rawmeat', tint: 0xd85a4a, category: 'field', sellPrice: 6, unlock: 'field' },
  { id: 'herb', name: 'Herb', icon: 'herb', tint: 0x6ab04a, category: 'field', sellPrice: 4, unlock: 'field' },
  { id: 'blueMushroom', name: 'Blue Mushroom', icon: 'mushroom', tint: 0x5a8ad8, category: 'field', sellPrice: 6, unlock: 'field' },
  { id: 'whetfish', name: 'Whetfish', icon: 'flatfish', tint: 0x9ab0c0, category: 'field', sellPrice: 12, unlock: 'field' },
];

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_LIST.map((i) => [i.id, i]),
);

export const CATEGORY_LABELS: Record<string, string> = {
  meat: 'Meat', fish: 'Fish', veg: 'Vegetables', field: 'Field items',
};

export const GROUP_LABELS: Record<string, string> = {
  courage: 'Courage', resilience: 'Resilience', vigor: 'Vigor', acumen: 'Acumen', artillery: 'Artillery',
};

/** Where an ingredient comes from, for the Ingredient book. */
export function unlockSource(ing: Ingredient): string {
  if (ing.unlock === 'start') return 'The Argosy from Day 1';
  if (ing.unlock === 'delivery') {
    const d = DELIVERY_LIST.find((x) => x.unlocks.includes(ing.id));
    return d ? `Delivery: ${d.qty} ${INGREDIENTS[d.item].name}` : 'Provisions Manager delivery';
  }
  return 'Brought back by hunters';
}
