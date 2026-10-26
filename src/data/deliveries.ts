import type { Delivery } from '../core/types';

// Provisions Manager delivery requests. In World, delivering items unlocks new Canteen ingredients.
export const DELIVERY_LIST: Delivery[] = [
  { id: 'herbs', item: 'herb', qty: 4, unlocks: ['rapscallion', 'steadfastSpud', 'cudgelOnion'] },
  { id: 'meat', item: 'rawMeat', qty: 5, unlocks: ['wyvernSkirtSteak', 'thornyMeat', 'apceroast'] },
  { id: 'whetfish', item: 'whetfish', qty: 3, unlocks: ['serpentineSalmon', 'scallopChips', 'samuraiTuna'] },
];

export const DELIVERIES: Record<string, Delivery> = Object.fromEntries(DELIVERY_LIST.map((d) => [d.id, d]));
