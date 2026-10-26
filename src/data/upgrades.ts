import type { Upgrade } from '../core/types';

// Canteen improvements built by the Second Fleet Master's Smithy team.
export const UPGRADE_LIST: Upgrade[] = [
  { id: 'lanterns', name: 'Hanging Lanterns', icon: 'lantern', cost: 800, description: 'Hunters wait 25% longer.' },
  { id: 'spit', name: 'Iron Spit Frame', icon: 'spit', cost: 900, description: 'Wider well-done window on the BBQ Spit.' },
  { id: 'bell', name: 'Canteen Bell', icon: 'bell', cost: 1100, description: 'More hunters drop by each shift.' },
  { id: 'table', name: 'Extra Table', icon: 'table', cost: 1400, description: 'Seat a fifth hunter.' },
];

export const UPGRADES: Record<string, Upgrade> = Object.fromEntries(UPGRADE_LIST.map((u) => [u.id, u]));
