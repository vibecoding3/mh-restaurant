import { describe, expect, it } from 'vitest';
import type { DishId, MealBuffs, NeedId, Quality, Rng } from '../src/core/types';
import { buyIngredient, buyUpgrade, dishPayment } from '../src/core/economy';
import { dishBuffs } from '../src/core/platters';
import { monsterPool, resolveQuest } from '../src/core/quests';
import { FIRST_ARRIVAL_MS, SHIFT_MS, arrivalInterval, veteranChance } from '../src/core/shift';
import { TRIAL_DAY, TRIAL_REPUTATION, addReputation, advanceDay, hasUpgrade, isTrialDay, newGame, type GameState } from '../src/core/state';
import { DISHES } from '../src/data/dishes';
import { HUNTER_TYPES, WEAPONS } from '../src/data/hunters';
import { CANTEEN_QUEST, MONSTER_LIST } from '../src/data/monsters';
import { UPGRADE_LIST } from '../src/data/upgrades';

// A headless run of Days 1-7 built only from core functions, for three kinds of player (PLAN-v0.3 §6).

interface Profile {
  /** Share of arriving hunters who get served; the rest walk out. */
  served: number;
  /** Chance of Well-done and Rare; the rest is Burnt. */
  wellDone: number;
  rare: number;
  /** Chance the served dish gives what the hunter needs. */
  needs: number;
}

const PROFILES: Record<'good' | 'average' | 'sloppy', Profile> = {
  good: { served: 0.95, wellDone: 0.8, rare: 0.15, needs: 0.7 },
  average: { served: 0.8, wellDone: 0.55, rare: 0.3, needs: 0.45 },
  sloppy: { served: 0.6, wellDone: 0.3, rare: 0.4, needs: 0.2 },
};

const NEED_DISH: Record<NeedId, DishId> = { attack: 'meatPlatter', defense: 'fishPlatter', elemRes: 'veggiePlatter', stamina: 'steak' };
const PLATTERS = ['meatPlatter', 'fishPlatter', 'veggiePlatter'] as const;
/** Zenny kept back for tomorrow's ingredients before buying an upgrade. */
const RESERVE = 250;

function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rng: Rng, list: T[]): T => list[Math.floor(rng() * list.length) % list.length];

function rollQuality(rng: Rng, p: Profile): Quality {
  const r = rng();
  return r < p.wellDone ? 2 : r < p.wellDone + p.rare ? 1 : 0;
}

/** Morning prep: top every platter ingredient up to `target` portions, cheapest first. */
function restock(s: GameState, target: number): void {
  for (const id of PLATTERS.flatMap((p) => s.platters[p])) {
    const need = target - (s.stock[id] ?? 0);
    if (need > 0) buyIngredient(s, id, Math.min(need, Math.floor(s.zenny / (s.prices[id] ?? Infinity))));
  }
}

function hunters(s: GameState, rng: Rng): number {
  let n = 0;
  for (let t = FIRST_ARRIVAL_MS; t < SHIFT_MS; t += arrivalInterval(s.day, hasUpgrade(s, 'bell'), rng)) n++;
  return n;
}

export interface RunResult {
  /** First day the Rank Trial is passed, or null within the run. */
  trialDay: number | null;
  /** Day the first upgrade was bought, and the day all four were owned. */
  firstUpgrade: number | null;
  allUpgrades: number | null;
  reputation: number[];
  zenny: number[];
}

export function simulate(p: Profile, seed: number, days = 7): RunResult {
  const rng = mulberry32(seed);
  const s = newGame(rng);
  const res: RunResult = { trialDay: null, firstUpgrade: null, allUpgrades: null, reputation: [], zenny: [] };
  for (let d = 0; d < days; d++) {
    restock(s, 7);
    const served: { dish: DishId; ingredients: string[]; quality: Quality; buffs: MealBuffs; type: string; monster: string }[] = [];
    const arrivals = hunters(s, rng);
    const served1 = p.served + (hasUpgrade(s, 'lanterns') ? 0.04 : 0) + (hasUpgrade(s, 'table') ? 0.03 : 0);
    for (let i = 0; i < arrivals; i++) {
      const type = rng() < veteranChance(s.day) ? HUNTER_TYPES.veteran : HUNTER_TYPES.rookie;
      const monster = pick(rng, monsterPool(MONSTER_LIST, s.day));
      if (rng() >= Math.min(1, served1)) {
        addReputation(s, -1);
        continue;
      }
      const matched = rng() < p.needs;
      // What they get: their need's dish if it was met, otherwise some other dish on the menu.
      let dish: DishId = matched ? NEED_DISH[monster.need] : pick(rng, ['meatPlatter', 'fishPlatter', 'veggiePlatter', 'steak'].filter((x) => x !== NEED_DISH[monster.need]) as DishId[]);
      const ingredients = dish === 'steak' ? ['rawMeat'] : [...s.platters[dish as (typeof PLATTERS)[number]]];
      if (ingredients.some((id) => (s.stock[id] ?? 0) < 1)) {
        // Out of that dish: they take a platter that's in stock without the bonus, or leave.
        const alt = PLATTERS.find((x) => s.platters[x].every((id) => (s.stock[id] ?? 0) > 0));
        if (!alt) {
          addReputation(s, -1);
          continue;
        }
        dish = alt;
        ingredients.splice(0, ingredients.length, ...s.platters[alt]);
      }
      for (const id of ingredients) s.stock[id] -= 1;
      let quality = rollQuality(rng, p);
      if (dish === 'steak' && hasUpgrade(s, 'spit') && quality === 1 && rng() < 0.3) quality = 2;
      const buffs = dishBuffs(dish, ingredients, s.fresh, s.canteenLevel, quality);
      const pay = dishPayment(DISHES[dish], quality, 0.3 + rng() * 0.5, type.tipRate, matched && dish === NEED_DISH[monster.need]);
      s.zenny += pay.total;
      addReputation(s, pay.reputation);
      served.push({ dish, ingredients, quality, buffs, type: type.id, monster: monster.id });
    }
    // Evening: quests.
    for (const r of served) {
      const m = MONSTER_LIST.find((x) => x.id === r.monster)!;
      const q = resolveQuest(rng, HUNTER_TYPES[r.type].skill, m, r.buffs, r.quality, pick(rng, WEAPONS));
      s.zenny += q.zenny;
      addReputation(s, q.reputation);
      for (const id of q.items) s.stock[id] = (s.stock[id] ?? 0) + 1;
      if (q.outcome !== 'carted' && m.id === CANTEEN_QUEST.monsterId) s.canteenLevel = 2;
    }
    if (isTrialDay(s) && s.reputation >= TRIAL_REPUTATION) {
      s.trialPassed = true;
      res.trialDay ??= s.day;
    }
    // Buy the cheapest upgrade that leaves enough for tomorrow's ingredients.
    const next = UPGRADE_LIST.filter((u) => !hasUpgrade(s, u.id)).sort((a, b) => a.cost - b.cost)[0];
    if (next && s.zenny - next.cost >= RESERVE && buyUpgrade(s, next.id)) {
      res.firstUpgrade ??= s.day;
      if (s.upgrades.length === UPGRADE_LIST.length) res.allUpgrades = s.day;
    }
    res.reputation.push(s.reputation);
    res.zenny.push(s.zenny);
    advanceDay(s, rng);
  }
  return res;
}

const RUNS = 200;

function runs(p: Profile): RunResult[] {
  return Array.from({ length: RUNS }, (_, i) => simulate(p, 1000 + i));
}

const share = (list: RunResult[], f: (r: RunResult) => boolean) => list.filter(f).length / list.length;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

describe('balance (200 seeded runs per profile)', () => {
  const good = runs(PROFILES.good);
  const average = runs(PROFILES.average);
  const sloppy = runs(PROFILES.sloppy);

  it('prints a summary', () => {
    for (const [name, list] of [['good', good], ['average', average], ['sloppy', sloppy]] as const) {
      const rep = list[0].reputation.map((_, d) => median(list.map((r) => r.reputation[d])));
      const zen = list[0].zenny.map((_, d) => median(list.map((r) => r.zenny[d])));
      const first = median(list.map((r) => r.firstUpgrade ?? 99));
      const all = median(list.map((r) => r.allUpgrades ?? 99));
      console.log(`${name}: rep ${rep.join(' ')} | zenny ${zen.join(' ')} | trial by D5 ${share(list, (r) => r.trialDay === TRIAL_DAY)} D7 ${share(list, (r) => r.trialDay !== null)} | upgrades first D${first} all D${all}`);
    }
    expect(true).toBe(true);
  });

  it('an average player passes the Rank Trial on Day 5, but not by coasting', () => {
    expect(share(average, (r) => r.trialDay === TRIAL_DAY)).toBeGreaterThanOrEqual(0.7);
    // Reaching the bar as early as Day 3 would make the trial trivial.
    expect(share(average, (r) => r.reputation[2] >= TRIAL_REPUTATION)).toBeLessThan(0.1);
  });

  it('a good player passes on Day 5 in nearly every run', () => {
    expect(share(good, (r) => r.trialDay === TRIAL_DAY)).toBeGreaterThanOrEqual(0.95);
  });

  it('a sloppy player passes a day or two later', () => {
    expect(share(sloppy, (r) => r.trialDay !== null && r.trialDay <= 7)).toBeGreaterThanOrEqual(0.6);
    expect(share(sloppy, (r) => r.trialDay === TRIAL_DAY)).toBeLessThan(0.5);
  });

  it('an average player affords an upgrade every one or two days', () => {
    expect(median(average.map((r) => r.firstUpgrade ?? 99))).toBeLessThanOrEqual(2);
    expect(median(average.map((r) => r.allUpgrades ?? 99))).toBeLessThanOrEqual(7);
    expect(median(average.map((r) => r.allUpgrades ?? 99))).toBeGreaterThanOrEqual(5);
  });
});
