import type { DishId, FoodCategory, MealBuffs, Quality, SkillGroup, StatId } from './types';
import { INGREDIENTS } from '../data/ingredients';
import { groupSkill } from '../data/food-skills';

export const CATEGORY_STAT: Record<FoodCategory, StatId> = { meat: 'attack', fish: 'defense', veg: 'elemRes' };

/** Cooking quality scales the skill activation chance. */
const QUALITY_SKILL = [0.5, 0.8, 1];
/** Steak stamina for Burnt Meat / Rare Steak / Well-Done Steak. */
const STEAK_STAMINA = [10, 25, 50];

/** Ingredient slots per platter: 2 at first, 4 after "Flying Sparks: Tobi-Kadachi". */
export function slotsFor(canteenLevel: number): number {
  return canteenLevel >= 2 ? 4 : 2;
}

/** (S)/(M)/(L) tiers at 2/4/6 matching ingredients; also the skill thresholds. */
export function tierFor(count: number): number {
  if (count >= 6) return 3;
  if (count >= 4) return 2;
  if (count >= 2) return 1;
  return 0;
}

/** Stamina bonus scales with Canteen level up to +50. */
export function staminaFor(canteenLevel: number): number {
  return canteenLevel >= 2 ? 50 : 25;
}

/** Activation chance from the star rating: 1 star 50%, 2 stars 75%, 3 stars 100%. */
export function starChance(stars: number): number {
  return Math.min(1, 0.5 + (stars - 1) * 0.25);
}

/** Buffs of a platter made of `ids`, following World's Canteen rules (GDD A.1). */
export function platterBuffs(ids: string[], fresh: string[], canteenLevel: number, quality: Quality = 2): MealBuffs {
  const cats: Partial<Record<FoodCategory, number>> = {};
  const groups: Partial<Record<SkillGroup, number>> = {};
  let freshCount = 0;
  for (const id of ids) {
    const ing = INGREDIENTS[id];
    if (!ing || ing.category === 'field') continue;
    cats[ing.category] = (cats[ing.category] ?? 0) + 1;
    if (ing.group) groups[ing.group] = (groups[ing.group] ?? 0) + 1;
    if (fresh.includes(id)) freshCount++;
  }

  let stat: StatId | null = null;
  let tier = 0;
  for (const [cat, n] of Object.entries(cats) as [FoodCategory, number][]) {
    if (tierFor(n) > tier) {
      tier = tierFor(n);
      stat = CATEGORY_STAT[cat];
    }
  }

  let skill: string | null = null;
  let best = 0;
  for (const [group, n] of Object.entries(groups) as [SkillGroup, number][]) {
    if (tierFor(n) > best) {
      const s = groupSkill(group, tierFor(n) - 1);
      if (s) {
        skill = s.id;
        best = tierFor(n);
      }
    }
  }

  const skillStars = Math.min(3, 1 + freshCount * 0.5);
  return {
    stat, tier,
    health: freshCount * 10,
    stamina: ids.length > 0 ? staminaFor(canteenLevel) : 0,
    skill,
    skillStars,
    skillChance: skill ? starChance(skillStars) * QUALITY_SKILL[quality] : 0,
  };
}

export function steakBuffs(quality: Quality): MealBuffs {
  return { stat: null, tier: 0, health: 0, stamina: STEAK_STAMINA[quality], skill: null, skillStars: 0, skillChance: 0 };
}

/** Buffs of any dish given the ingredients it was made from. */
export function dishBuffs(dish: DishId, ids: string[], fresh: string[], canteenLevel: number, quality: Quality = 2): MealBuffs {
  return dish === 'steak' ? steakBuffs(quality) : platterBuffs(ids, fresh, canteenLevel, quality);
}
