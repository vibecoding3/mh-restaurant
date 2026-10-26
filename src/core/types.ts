export type StationId = 'board' | 'spit' | 'grill';

/** 0 = Burnt, 1 = Rare, 2 = Well-done ("So tasty!"), as on the BBQ Spit in World. */
export type Quality = 0 | 1 | 2;

/** Canteen categories from World, plus items gathered in the field. */
export type Category = 'meat' | 'fish' | 'veg' | 'field';
export type FoodCategory = Exclude<Category, 'field'>;

/** Ingredient skill groups from World's Canteen. */
export type SkillGroup = 'courage' | 'resilience' | 'vigor' | 'acumen' | 'artillery';

/** Meat gives Attack Up, Fish gives Defense Up, Vegetables give Elemental Res Up. */
export type StatId = 'attack' | 'defense' | 'elemRes';

/** What a hunter needs from a meal before a quest. */
export type NeedId = StatId | 'stamina';

export type PlatterId = 'meatPlatter' | 'fishPlatter' | 'veggiePlatter';
export type DishId = PlatterId | 'chefsChoice' | 'steak';

export interface Ingredient {
  id: string;
  name: string;
  /** Icon texture key and tint. */
  icon: string;
  tint: number;
  category: Category;
  group?: SkillGroup;
  /** Argosy base price. Undefined = not sold by the Captain. */
  basePrice?: number;
  /** What the Captain pays for surplus field items. */
  sellPrice?: number;
  /** start = on the Argosy from Day 1, delivery = unlocked by a delivery request, field = brought back by hunters. */
  unlock: 'start' | 'delivery' | 'field';
}

export interface Dish {
  id: DishId;
  name: string;
  icon: string;
  tint: number;
  stations: StationId[];
  /** Base price; World's Canteen meal costs 150 z. */
  price: number;
  /** Platters only: the ingredient category the platter is built from. */
  category?: FoodCategory;
  description: string;
}

/** Result of a meal, following World's Canteen rules (GDD Appendix A.1). */
export interface MealBuffs {
  stat: StatId | null;
  /** 0 = none, 1/2/3 = (S)/(M)/(L) */
  tier: number;
  health: number;
  stamina: number;
  skill: string | null;
  /** Skill activation rating, 1 to 3 stars in half steps. */
  skillStars: number;
  /** Activation chance 0..1 after cooking quality. */
  skillChance: number;
}

export type WeaponClass = 'blade' | 'blunt' | 'gunlance' | 'gun' | 'bow';

export interface Weapon {
  id: string;
  name: string;
  short: string;
  cls: WeaponClass;
}

export interface FoodSkill {
  id: string;
  name: string;
  group: SkillGroup;
  /** Index in the group: 0, 1, 2 need 2, 4, 6 ingredients of the group. */
  tier: number;
  /** World's description of the skill. */
  description: string;
  /** How the quest simulation uses it. */
  questEffect: string;
  /** Success-chance bonus in the quest simulation when the skill activates. */
  bonus: (monster: Monster, weapon: Weapon) => number;
}

export interface Monster {
  id: string;
  name: string;
  stars: number;
  locale: string;
  /** How much each need matters on this quest. */
  weights: Partial<Record<NeedId | 'health', number>>;
  /** The buff the hunter asks for when heading to this quest. */
  need: NeedId;
  /** True if the monster inflicts elemental blights or poison. */
  blights: boolean;
  minDay: number;
  /** Field items hunters can bring back, with relative weights. */
  returns: Record<string, number>;
}

export interface HunterType {
  id: string;
  label: string;
  patience: number; // seconds
  skill: number;
  tipRate: number;
}

export interface ArmorSet {
  id: string;
  name: string;
  main: number;
  trim: number;
  minDay: number;
}

export interface Upgrade {
  id: string;
  name: string;
  icon: string;
  cost: number;
  description: string;
}

export interface Delivery {
  id: string;
  item: string;
  qty: number;
  unlocks: string[];
}

export type Rng = () => number;
