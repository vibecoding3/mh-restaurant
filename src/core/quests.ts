import type { BuffId, Monster, Quality, Recipe, Rng } from './types';

export type QuestOutcome = 'success' | 'barely' | 'carted';

export interface QuestResult {
  outcome: QuestOutcome;
  chance: number;
  /** True if Felyne Heroics turned a cart into a narrow escape. */
  heroicsSaved: boolean;
  drops: number;
  zenny: number;
  reputation: number;
}

/** success = base_skill + Σ(buff × relevance) + quality bonus, per GDD §4.4. */
export function questChance(skill: number, monster: Monster, recipe: Recipe, quality: Quality): number {
  let buffScore = 0;
  for (const [buff, weight] of Object.entries(monster.weights)) {
    buffScore += (recipe.buffs[buff as BuffId] ?? 0) * (weight ?? 0);
  }
  const qualityBonus = quality === 2 ? 0.2 : quality === 1 ? 0.1 : -0.1;
  const chance = 0.45 + skill * 0.1 - monster.stars * 0.1 + buffScore / 100 + qualityBonus;
  return Math.max(0.05, Math.min(0.95, chance));
}

export function resolveQuest(
  rng: Rng, skill: number, monster: Monster, recipe: Recipe, quality: Quality,
): QuestResult {
  const chance = questChance(skill, monster, recipe, quality);
  const roll = rng();
  let outcome: QuestOutcome;
  if (roll < chance) outcome = 'success';
  else if (roll < chance + (1 - chance) * 0.4) outcome = 'barely';
  else outcome = 'carted';

  let heroicsSaved = false;
  if (outcome === 'carted' && recipe.skills?.includes('heroics')) {
    outcome = 'barely';
    heroicsSaved = true;
  }

  switch (outcome) {
    case 'success':
      return { outcome, chance, heroicsSaved, drops: 2, zenny: 40 * monster.stars, reputation: 3 };
    case 'barely':
      return { outcome, chance, heroicsSaved, drops: 1, zenny: 15 * monster.stars, reputation: 1 };
    case 'carted':
      return { outcome, chance, heroicsSaved, drops: 0, zenny: 0, reputation: -3 };
  }
}

/** Monsters available as quest targets on a given day. */
export function monsterPool(monsters: Monster[], day: number): Monster[] {
  return monsters.filter((m) => m.minDay <= day);
}
