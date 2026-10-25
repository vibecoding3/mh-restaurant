export type StationId = 'board' | 'spit' | 'grill';

/** 0 = Burnt, 1 = Rare, 2 = Well-done ("So tasty!") */
export type Quality = 0 | 1 | 2;

export type BuffId = 'attack' | 'defense' | 'health' | 'stamina' | 'fireRes';
export type SkillId = 'heroics';

export type Buffs = Partial<Record<BuffId, number>>;

export interface Ingredient {
  id: string;
  name: string;
  icon: string;
  /** Trader base price. Undefined = monster material, not sold. */
  basePrice?: number;
}

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  ingredients: Record<string, number>;
  stations: StationId[];
  buffs: Buffs;
  skills?: SkillId[];
  price: number;
}

export interface Monster {
  id: string;
  name: string;
  stars: number;
  /** How much each buff point matters on this quest. */
  weights: Buffs;
  /** The buff the hunter asks for when heading to this quest. */
  wish: BuffId;
  drop: string;
  minDay: number;
}

export interface HunterType {
  id: string;
  label: string;
  patience: number; // seconds
  skill: number;
  tipRate: number;
}

export interface Upgrade {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
}

export type Rng = () => number;
