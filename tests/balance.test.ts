import { describe, expect, it } from 'vitest';
import type { DishId, MealBuffs, NeedId, Quality, Rng } from '../src/core/types';
import { buyIngredient, buyUpgrade, dishPayment, raidSteal, vipMonster, vipPayment } from '../src/core/economy';
import { dishBuffs } from '../src/core/platters';
import { monsterPool, resolveQuest } from '../src/core/quests';
import { FIRST_ARRIVAL_MS, RUSH, SHIFT_MS, arrivalInterval, raidAt, veteranChance, vipAt } from '../src/core/shift';
import { assignStaff, hireCost, hireStaff } from '../src/core/staff';
import {
  TRIAL_REPUTATION, addReputation, advanceDay, hasUpgrade, isRushDay, isTrialDay, newGame, trialProgress, type GameState,
} from '../src/core/state';
import { DISHES } from '../src/data/dishes';
import { HUNTER_TYPES, WEAPONS } from '../src/data/hunters';
import { CANTEEN_QUEST, MONSTER_LIST } from '../src/data/monsters';
import { UPGRADE_LIST } from '../src/data/upgrades';

// A headless run of Days 1-10 built only from core functions, for three kinds of player
// (PLAN-v0.3 §6, PLAN-v0.4 §7).

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
/** Zenny kept back for tomorrow's ingredients and wages before buying an upgrade or a Palico. */
const RESERVE = 250;
/** Each kitchen Palico at work lets the player serve this much more of the crowd. */
const STAFF_SERVED = 0.06;
const DAYS = 10;

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

function hunters(s: GameState, rng: Rng, rush: boolean): number {
  let n = 0;
  for (let t = FIRST_ARRIVAL_MS; t < SHIFT_MS; t += arrivalInterval(s.day, hasUpgrade(s, 'bell'), rng, rush)) n++;
  return n;
}

export interface RunResult {
  /** Day the Rank Trial shift is passed, or null within the run. */
  trialDay: number | null;
  /** Day the first upgrade was bought, and the day all four were owned. */
  firstUpgrade: number | null;
  allUpgrades: number | null;
  /** Day the first kitchen Palico was hired. */
  firstHire: number | null;
  /** Day the Rush Hour was served (Act I complete). */
  actOne: number | null;
  /** Kitchen Palicoes on staff at the end. */
  hired: number;
  reputation: number[];
  zenny: number[];
}

export function simulate(p: Profile, seed: number, days = DAYS): RunResult {
  const rng = mulberry32(seed);
  const s = newGame(rng);
  const res: RunResult = { trialDay: null, firstUpgrade: null, allUpgrades: null, firstHire: null, actOne: null, hired: 0, reputation: [], zenny: [] };
  for (let d = 0; d < days; d++) {
    restock(s, 7);
    const trial = isTrialDay(s);
    const rush = isRushDay(s);
    const served: { dish: DishId; ingredients: string[]; quality: Quality; buffs: MealBuffs; type: string; monster: string; matched: boolean }[] = [];
    const working = s.staff.filter((x) => x.station && !x.off).length;
    const share = Math.min(0.98, p.served + (hasUpgrade(s, 'lanterns') ? 0.04 : 0) + (hasUpgrade(s, 'table') ? 0.03 : 0) + working * STAFF_SERVED);
    const arrivals = hunters(s, rng, rush);
    let vip = vipAt(s.day, rng) !== null;
    // A raid: the player shoos about as many Jagras as the share of hunters they keep up with.
    if (!trial && raidAt(s.day, rng) !== null) {
      const jagras = 3 + Math.floor(rng() * 3);
      for (let j = 0; j < jagras; j++) if (rng() >= share) raidSteal(s, rng);
    }
    for (let i = 0; i < arrivals; i++) {
      const isVip = vip;
      vip = false;
      const type = isVip || rng() < veteranChance(s.day) ? HUNTER_TYPES.veteran : HUNTER_TYPES.rookie;
      const pool = monsterPool(MONSTER_LIST, s.day);
      const monster = isVip ? vipMonster(rng, pool) : pick(rng, pool);
      if (rng() >= share) {
        addReputation(s, isVip ? -2 : -1);
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
      const met = matched && dish === NEED_DISH[monster.need];
      const buffs = dishBuffs(dish, ingredients, s.fresh, s.canteenLevel, quality);
      const pay = (isVip ? vipPayment : dishPayment)(DISHES[dish], quality, 0.3 + rng() * 0.5, type.tipRate, met);
      s.zenny += pay.total;
      addReputation(s, pay.reputation + (rush ? RUSH.reputation : 0));
      served.push({ dish, ingredients, quality, buffs, type: type.id, monster: monster.id, matched: met });
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
    if (trial && trialProgress(served).passed) {
      s.trialPassed = true;
      s.rushDay = s.day + 2;
      res.trialDay = s.day;
    }
    if (rush) {
      s.actOneDone = true;
      res.actOne = s.day;
    }
    // Evening shopping: the cheapest upgrade, else a kitchen Palico, leaving enough for tomorrow.
    const next = UPGRADE_LIST.filter((u) => !hasUpgrade(s, u.id)).sort((a, b) => a.cost - b.cost)[0];
    const hire = hireCost(s);
    if (next && s.zenny - next.cost >= RESERVE && buyUpgrade(s, next.id)) {
      res.firstUpgrade ??= s.day;
      if (s.upgrades.length === UPGRADE_LIST.length) res.allUpgrades = s.day;
    } else if (hire !== null && s.zenny - hire >= RESERVE && hireStaff(s)) {
      res.firstHire ??= s.day;
      const palico = s.staff[s.staff.length - 1];
      assignStaff(s, palico.id, s.staff.length === 1 ? 'grill' : 'pot');
    }
    res.reputation.push(s.reputation);
    res.zenny.push(s.zenny);
    advanceDay(s, rng);
  }
  res.hired = s.staff.length;
  return res;
}

const RUNS = 200;

function runs(p: Profile): RunResult[] {
  return Array.from({ length: RUNS }, (_, i) => simulate(p, 1000 + i));
}

const share = (list: RunResult[], f: (r: RunResult) => boolean) => list.filter(f).length / list.length;
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const by = (day: number) => (r: RunResult) => r.trialDay !== null && r.trialDay <= day;

describe(`balance (${RUNS} seeded runs of ${DAYS} days per profile)`, () => {
  const good = runs(PROFILES.good);
  const average = runs(PROFILES.average);
  const sloppy = runs(PROFILES.sloppy);

  it('prints a summary', () => {
    for (const [name, list] of [['good', good], ['average', average], ['sloppy', sloppy]] as const) {
      const rep = list[0].reputation.map((_, d) => median(list.map((r) => r.reputation[d])));
      const zen = list[0].zenny.map((_, d) => median(list.map((r) => r.zenny[d])));
      const m = (f: (r: RunResult) => number | null) => median(list.map((r) => f(r) ?? 99));
      console.log(`${name}: rep ${rep.join(' ')} | zenny ${zen.join(' ')} | trial by D5 ${share(list, by(5))} D6 ${share(list, by(6))} `
        + `D8 ${share(list, by(8))} D10 ${share(list, by(10))} | hired 2 ${share(list, (r) => r.hired === 2)} | upgrades D${m((r) => r.firstUpgrade)}-D${m((r) => r.allUpgrades)} | hire D${m((r) => r.firstHire)} `
        + `| act I D${m((r) => r.actOne)}`);
    }
    expect(true).toBe(true);
  });

  it('an average player passes the Rank Trial shift by Day 6, but not by coasting', () => {
    expect(share(average, by(6))).toBeGreaterThanOrEqual(0.7);
    // Reaching the bar as early as Day 3 would make the trial trivial.
    expect(share(average, (r) => r.reputation[2] >= TRIAL_REPUTATION)).toBeLessThan(0.1);
  });

  it('a good player passes on Day 5 or 6 in nearly every run', () => {
    expect(share(good, by(6))).toBeGreaterThanOrEqual(0.95);
  });

  it('a sloppy player passes later, by Day 10 in most runs', () => {
    // They only reach the reputation bar around Day 7, then need a shift with enough needs met.
    expect(share(sloppy, by(10))).toBeGreaterThanOrEqual(0.5);
    expect(share(sloppy, by(6))).toBeLessThan(0.1);
  });

  it('an average player affords an upgrade every one or two days', () => {
    expect(median(average.map((r) => r.firstUpgrade ?? 99))).toBeLessThanOrEqual(2);
    expect(median(average.map((r) => r.allUpgrades ?? 99))).toBeLessThanOrEqual(7);
    expect(median(average.map((r) => r.allUpgrades ?? 99))).toBeGreaterThanOrEqual(5);
  });

  it('an average player hires the first kitchen Palico on Day 5 to 7', () => {
    const hire = median(average.map((r) => r.firstHire ?? 99));
    expect(hire).toBeGreaterThanOrEqual(5);
    expect(hire).toBeLessThanOrEqual(7);
  });

  it('both kitchen Palicoes are within reach of an average player by Day 10', () => {
    // A sink for Zenny, but only a partial one: savings still pile up late (see PROGRESS, known issues).
    expect(share(average, (r) => r.hired === 2)).toBeGreaterThanOrEqual(0.7);
  });

  it('an average player completes Act I with the Rush Hour by Day 10', () => {
    expect(share(average, (r) => r.actOne !== null)).toBeGreaterThanOrEqual(0.6);
  });
});
