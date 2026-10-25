import type { Ingredient } from '../core/types';

export const INGREDIENT_LIST: Ingredient[] = [
  { id: 'rawMeat', name: 'Raw Meat', icon: '🥩', basePrice: 20 },
  { id: 'kelbiMeat', name: 'Kelbi Meat', icon: '🍖', basePrice: 30 },
  { id: 'herb', name: 'Herb', icon: '🌿', basePrice: 10 },
  { id: 'firecellPepper', name: 'Firecell Pepper', icon: '🌶️', basePrice: 25 },
  { id: 'forestPotato', name: 'Forest Potato', icon: '🥔', basePrice: 12 },
  { id: 'royalCheese', name: 'Royal Cheese', icon: '🧀', basePrice: 40 },
  // Monster materials: only brought back by hunters.
  { id: 'jaggiTail', name: 'Jaggi Tail Meat', icon: '🍗' },
  { id: 'kuluEgg', name: 'Kulu Egg', icon: '🥚' },
  { id: 'rathianRib', name: 'Rathian Rib', icon: '🦴' },
];

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_LIST.map((i) => [i.id, i]),
);
