import type { Monster } from '../core/types';

export const MONSTER_LIST: Monster[] = [
  {
    id: 'greatJaggi', name: 'Great Jaggi', stars: 1,
    weights: { attack: 1, health: 0.5 }, wish: 'attack', drop: 'jaggiTail', minDay: 1,
  },
  {
    id: 'kulu', name: 'Kulu-Ya-Ku', stars: 2,
    weights: { stamina: 1, health: 0.5 }, wish: 'stamina', drop: 'kuluEgg', minDay: 2,
  },
  {
    id: 'rathian', name: 'Rathian', stars: 4,
    weights: { fireRes: 2, health: 0.6, defense: 0.6 }, wish: 'fireRes', drop: 'rathianRib', minDay: 3,
  },
];

export const MONSTERS: Record<string, Monster> = Object.fromEntries(MONSTER_LIST.map((m) => [m.id, m]));
