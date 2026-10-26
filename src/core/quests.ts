import type { MealBuffs, Monster, NeedId, Quality, Rng, Weapon } from './types';
import { FOOD_SKILLS } from '../data/food-skills';

export type QuestOutcome = 'success' | 'barely' | 'carted';

export interface QuestResult {
  outcome: QuestOutcome;
  chance: number;
  /** True if the meal's food skill activated. */
  skillActive: boolean;
  /** True if Felyne Moxie turned a cart into a narrow escape. */
  moxieSaved: boolean;
  /** Field items brought back. */
  items: string[];
  zenny: number;
  reputation: number;
}

const QUALITY_BONUS = [-0.05, 0.05, 0.12];

/** How well a meal covers one need, on a 0..3 scale like the (S)/(M)/(L) tiers. */
function needScore(buffs: MealBuffs, need: NeedId): number {
  if (need === 'stamina') return buffs.stamina / 25;
  return buffs.stat === need ? buffs.tier : 0;
}

/**
 * success = base skill − difficulty + Σ(meal score × relevance) + Health + quality + food skill (GDD §4.4).
 */
export function questChance(
  skill: number, monster: Monster, buffs: MealBuffs, quality: Quality, weapon: Weapon, skillActive: boolean,
): number {
  let score = 0;
  for (const [need, weight] of Object.entries(monster.weights)) {
    if (need === 'health') continue;
    score += needScore(buffs, need as NeedId) * (weight ?? 0) * 0.06;
  }
  const health = buffs.health * 0.002 * (1 + (monster.weights.health ?? 0));
  const skillBonus = skillActive && buffs.skill ? FOOD_SKILLS[buffs.skill].bonus(monster, weapon) : 0;
  const chance = 0.5 + skill * 0.1 - monster.stars * 0.08 + score + health + QUALITY_BONUS[quality] + skillBonus;
  return Math.max(0.05, Math.min(0.95, chance));
}

/** Draws a field item from the monster's locale table. */
export function rollItem(rng: Rng, monster: Monster): string {
  const entries = Object.entries(monster.returns);
  let roll = rng() * entries.reduce((a, [, w]) => a + w, 0);
  for (const [id, w] of entries) {
    roll -= w;
    if (roll < 0) return id;
  }
  return entries[entries.length - 1][0];
}

export function resolveQuest(
  rng: Rng, skill: number, monster: Monster, buffs: MealBuffs, quality: Quality, weapon: Weapon,
): QuestResult {
  const skillActive = !!buffs.skill && rng() < buffs.skillChance;
  const chance = questChance(skill, monster, buffs, quality, weapon, skillActive);
  const roll = rng();
  let outcome: QuestOutcome;
  if (roll < chance) outcome = 'success';
  else if (roll < chance + (1 - chance) * 0.4) outcome = 'barely';
  else outcome = 'carted';

  let moxieSaved = false;
  if (outcome === 'carted' && skillActive && buffs.skill === 'moxie') {
    outcome = 'barely';
    moxieSaved = true;
  }

  const items = (n: number) => Array.from({ length: n }, () => rollItem(rng, monster));
  const base = { chance, skillActive, moxieSaved };
  switch (outcome) {
    case 'success':
      return { ...base, outcome, items: items(2), zenny: 30 * monster.stars, reputation: 3 };
    case 'barely':
      return { ...base, outcome, items: items(1), zenny: 10 * monster.stars, reputation: 1 };
    case 'carted':
      // Low punishment: a cart costs nothing; the hunter just comes back tomorrow.
      return { ...base, outcome, items: [], zenny: 0, reputation: 0 };
  }
}

/** Monsters available as quest targets on a given day. */
export function monsterPool(monsters: Monster[], day: number): Monster[] {
  return monsters.filter((m) => m.minDay <= day);
}
