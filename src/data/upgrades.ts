import type { Upgrade } from '../core/types';

export const UPGRADE_LIST: Upgrade[] = [
  { id: 'lanterns', name: 'Cozy Lanterns', icon: '🏮', cost: 200, description: 'Hunters wait 25% longer.' },
  { id: 'spit', name: 'Tempered Spit', icon: '🔩', cost: 250, description: 'Wider golden window on the spit.' },
  { id: 'bell', name: 'Palico Bell', icon: '🔔', cost: 300, description: 'More hunters drop by each shift.' },
  { id: 'table', name: 'Extra Table', icon: '🪑', cost: 350, description: 'Seat a fifth hunter.' },
];

export const UPGRADES: Record<string, Upgrade> = Object.fromEntries(UPGRADE_LIST.map((u) => [u.id, u]));
