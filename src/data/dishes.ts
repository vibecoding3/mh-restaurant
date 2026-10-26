import type { Dish, DishId, PlatterId } from '../core/types';

// Pre-made canon dishes. Platter contents are set in morning prep, like World's Favorite Platters.
export const DISH_LIST: Dish[] = [
  {
    id: 'meatPlatter', name: 'Meat Platter', icon: 'platter', tint: 0xd0703a, category: 'meat',
    stations: ['board', 'grill'], price: 150, description: 'Meat ingredients: Attack Up.',
  },
  {
    id: 'fishPlatter', name: 'Fish Platter', icon: 'platter', tint: 0x5a8ac0, category: 'fish',
    stations: ['board', 'grill'], price: 150, description: 'Fish ingredients: Defense Up.',
  },
  {
    id: 'veggiePlatter', name: 'Veggie Platter', icon: 'platter', tint: 0x6aa04a, category: 'veg',
    stations: ['board', 'grill'], price: 150, description: 'Vegetables: Elemental Res Up.',
  },
  {
    id: 'chefsChoice', name: "Chef's Choice Platter", icon: 'chef', tint: 0xf2e6c8,
    stations: ['board'], price: 120, description: 'Uses fresh ingredients first. Quick, random stat.',
  },
  {
    id: 'steak', name: 'Well-Done Steak', icon: 'steak', tint: 0xa0582a,
    stations: ['spit'], price: 60, description: 'Raw Meat on the BBQ Spit: max Stamina up.',
  },
];

export const DISHES = Object.fromEntries(DISH_LIST.map((d) => [d.id, d])) as Record<DishId, Dish>;

export const PLATTER_IDS: PlatterId[] = ['meatPlatter', 'fishPlatter', 'veggiePlatter'];

export function isPlatter(id: DishId): id is PlatterId {
  return (PLATTER_IDS as string[]).includes(id);
}

/** The BBQ Spit's three real outcomes. */
export const SPIT_RESULTS = ['Burnt Meat', 'Rare Steak', 'Well-Done Steak'] as const;
