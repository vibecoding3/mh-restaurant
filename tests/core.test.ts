import { describe, expect, it } from 'vitest';
import { combineQuality, gradeChop, gradeSkewer, gradeSpit, spitWindow } from '../src/core/cooking';
import {
  buyIngredient, buyUpgrade, chooseOrder, consumeIngredients, dishPayment, portions, rollPrices,
} from '../src/core/economy';
import { questChance, resolveQuest } from '../src/core/quests';
import { loadGame, saveGame, type KeyValueStorage } from '../src/core/save';
import { advanceDay, newGame } from '../src/core/state';
import { RECIPES, RECIPE_LIST } from '../src/data/recipes';
import { MONSTERS } from '../src/data/monsters';
import { INGREDIENTS } from '../src/data/ingredients';

const fixed = (v: number) => () => v;

describe('content', () => {
  it('every recipe uses known ingredients and at least one station', () => {
    for (const r of RECIPE_LIST) {
      expect(r.stations.length).toBeGreaterThan(0);
      for (const id of Object.keys(r.ingredients)) expect(INGREDIENTS[id], `${r.id}:${id}`).toBeDefined();
    }
  });
  it('every monster drop is a known ingredient', () => {
    for (const m of Object.values(MONSTERS)) expect(INGREDIENTS[m.drop]).toBeDefined();
  });
});

describe('cooking', () => {
  it('combines step grades', () => {
    expect(combineQuality([2])).toBe(2);
    expect(combineQuality([2, 1])).toBe(1);
    expect(combineQuality([2, 2, 1])).toBe(2);
    expect(combineQuality([0, 1])).toBe(0);
    expect(combineQuality([])).toBe(0);
  });
  it('grades the spit against its window', () => {
    const w = spitWindow(false);
    expect(gradeSpit(0.3, w)).toBe(1);
    expect(gradeSpit(0.7, w)).toBe(2);
    expect(gradeSpit(0.9, w)).toBe(0);
    expect(gradeSpit(0.58, spitWindow(true))).toBe(2);
  });
  it('grades skewers and chopping', () => {
    expect(gradeSkewer(0.4)).toBe(1);
    expect(gradeSkewer(0.8)).toBe(2);
    expect(gradeSkewer(1.1)).toBe(0);
    expect(gradeChop(0, false)).toBe(2);
    expect(gradeChop(2, false)).toBe(1);
    expect(gradeChop(0, true)).toBe(0);
  });
});

describe('economy', () => {
  it('rolls prices within ±25%', () => {
    expect(rollPrices(fixed(0)).rawMeat).toBe(15);
    expect(rollPrices(fixed(0.999)).rawMeat).toBe(25);
    expect(rollPrices(fixed(0.5)).jaggiTail).toBeUndefined();
  });
  it('buys ingredients and upgrades only when affordable', () => {
    const s = newGame(fixed(0.5));
    s.zenny = 50;
    expect(buyIngredient(s, 'rawMeat', 2)).toBe(true);
    expect(s.zenny).toBe(10);
    expect(buyIngredient(s, 'rawMeat', 1)).toBe(false);
    expect(buyIngredient(s, 'jaggiTail', 1)).toBe(false);
    s.zenny = 1000;
    expect(buyUpgrade(s, 'table')).toBe(true);
    expect(buyUpgrade(s, 'table')).toBe(false);
    expect(s.zenny).toBe(650);
  });
  it('counts and consumes portions', () => {
    const stock = { rawMeat: 3, firecellPepper: 1 };
    expect(portions(stock, RECIPES.spicy)).toBe(1);
    expect(consumeIngredients(stock, RECIPES.spicy)).toBe(true);
    expect(stock).toEqual({ rawMeat: 2, firecellPepper: 0 });
    expect(consumeIngredients(stock, RECIPES.spicy)).toBe(false);
  });
  it('pays more for good food, patience and a matching buff', () => {
    const burnt = dishPayment(RECIPES.steak, 0, 0, 0.2, 'attack');
    const tasty = dishPayment(RECIPES.steak, 2, 1, 0.2, 'health');
    expect(burnt.total).toBe(30);
    expect(burnt.reputation).toBe(-1);
    expect(tasty.total).toBe(90 + 12 + 15);
    expect(tasty.reputation).toBe(4);
  });
  it('orders only cookable dishes and returns null when out of stock', () => {
    const menu = [RECIPES.steak, RECIPES.spicy];
    expect(chooseOrder(fixed(0.99), menu, { rawMeat: 1 }, 'attack')?.id).toBe('steak');
    expect(chooseOrder(fixed(0.5), menu, {}, 'attack')).toBeNull();
  });
});

describe('quests', () => {
  it('rewards good food and relevant buffs', () => {
    const jaggi = MONSTERS.greatJaggi;
    expect(questChance(1, jaggi, RECIPES.spicy, 2)).toBeGreaterThan(questChance(1, jaggi, RECIPES.skewers, 2));
    expect(questChance(1, jaggi, RECIPES.spicy, 2)).toBeGreaterThan(questChance(1, jaggi, RECIPES.spicy, 0));
    expect(questChance(0, MONSTERS.rathian, RECIPES.skewers, 0)).toBe(0.05);
  });
  it('resolves outcomes and Felyne Heroics saves a cart', () => {
    expect(resolveQuest(fixed(0), 1, MONSTERS.greatJaggi, RECIPES.steak, 2).outcome).toBe('success');
    expect(resolveQuest(fixed(0.999), 1, MONSTERS.rathian, RECIPES.steak, 0).outcome).toBe('carted');
    const saved = resolveQuest(fixed(0.999), 1, MONSTERS.rathian, RECIPES.feast, 0);
    expect(saved.outcome).toBe('barely');
    expect(saved.heroicsSaved).toBe(true);
    expect(saved.drops).toBe(1);
  });
});

describe('save', () => {
  it('round-trips through storage and rejects garbage', () => {
    const mem = new Map<string, string>();
    const storage: KeyValueStorage = {
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
      removeItem: (k) => void mem.delete(k),
    };
    const s = newGame(fixed(0.5));
    advanceDay(s, fixed(0.5));
    expect(saveGame(s, storage)).toBe(true);
    expect(loadGame(storage)).toEqual(s);
    mem.set('hunters-canteen-save', '{not json');
    expect(loadGame(storage)).toBeNull();
    expect(loadGame(null)).toBeNull();
  });
});
