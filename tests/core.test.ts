import { describe, expect, it } from 'vitest';
import { combineQuality, gradeChop, gradeGrill, gradePot, gradeSpit, potBand, spitWindow } from '../src/core/cooking';
import {
  buyIngredient, buyUpgrade, chooseOrder, completeDelivery, consumeIngredients, dishIngredients, dishPayment,
  loadFavorite, meetsNeed, potOpen, raidSteal, stationsFor, vipMonster, vipPayment, pickChefsChoice, portions, rollFresh, rollPrices, saveFavorite, sellItem, togglePlatterIngredient,
} from '../src/core/economy';
import { RUSH, arrivalInterval, raidAt, vipAt } from '../src/core/shift';
import { HIRE_COSTS, LEVEL_UP_DISHES, STAFF_DAY, WAGE, assignStaff, hireStaff, payWages, staffQuality, stationStaff } from '../src/core/staff';
import { DEFAULT_SETTINGS, OLD_AUDIO_KEY, SETTINGS_KEY, readSettings } from '../src/ui/settings';
import { TUTORIAL_STEPS } from '../src/data/tutorial';
import { dishBuffs, platterBuffs, slotsFor, steakBuffs, tierFor } from '../src/core/platters';
import { questChance, resolveQuest, rollItem } from '../src/core/quests';
import { SAVE_KEY, loadGame, saveGame, type KeyValueStorage } from '../src/core/save';
import { TRIAL_GOAL, addReputation, advanceDay, isRushDay, isTrialDay, newGame, trialProgress } from '../src/core/state';
import { DISHES, DISH_LIST } from '../src/data/dishes';
import { DELIVERY_LIST } from '../src/data/deliveries';
import { FOOD_SKILL_LIST } from '../src/data/food-skills';
import { INGREDIENTS, INGREDIENT_LIST, unlockSource } from '../src/data/ingredients';
import { MONSTERS, MONSTER_LIST } from '../src/data/monsters';
import { monsterPool } from '../src/core/quests';
import { WEAPONS_BY_ID } from '../src/data/hunters';

const fixed = (v: number) => () => v;
const sns = WEAPONS_BY_ID.sns;
const memoryStorage = (): KeyValueStorage & { mem: Map<string, string> } => {
  const mem = new Map<string, string>();
  return { mem, getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
};

describe('content', () => {
  it('monster returns and deliveries use known items', () => {
    for (const m of MONSTER_LIST) for (const id of Object.keys(m.returns)) expect(INGREDIENTS[id], `${m.id}:${id}`).toBeDefined();
    for (const d of DELIVERY_LIST) {
      expect(INGREDIENTS[d.item]).toBeDefined();
      for (const u of d.unlocks) expect(INGREDIENTS[u].unlock).toBe('delivery');
    }
  });
  it('hunters bring back field items, never monster parts', () => {
    for (const m of MONSTER_LIST) {
      for (const id of Object.keys(m.returns)) expect(['field', 'meat', 'fish']).toContain(INGREDIENTS[id].category);
    }
    expect(Object.keys(MONSTERS.greatJagras.returns)).toContain('rawMeat');
  });
  it('every canteen ingredient has a skill group and every group has three skills', () => {
    for (const i of INGREDIENT_LIST) if (i.category !== 'field') expect(i.group, i.id).toBeDefined();
    for (const g of ['courage', 'resilience', 'vigor', 'acumen', 'artillery']) {
      expect(FOOD_SKILL_LIST.filter((s) => s.group === g).map((s) => s.tier).sort()).toEqual([0, 1, 2]);
    }
  });
  it('dishes are the five canon dishes', () => {
    expect(DISH_LIST.map((d) => d.name)).toEqual([
      'Meat Platter', 'Fish Platter', 'Veggie Platter', "Chef's Choice Platter", 'Well-Done Steak',
    ]);
    expect(DISHES.meatPlatter.price).toBe(150);
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
  it('grades the spit, the grill and chopping', () => {
    const w = spitWindow(false);
    expect(gradeSpit(0.3, w)).toBe(1);
    expect(gradeSpit(0.7, w)).toBe(2);
    expect(gradeSpit(0.9, w)).toBe(0);
    expect(gradeSpit(0.58, spitWindow(true))).toBe(2);
    expect(gradeGrill(0.4)).toBe(1);
    expect(gradeGrill(0.8)).toBe(2);
    expect(gradeGrill(1.1)).toBe(0);
    expect(gradeChop(0)).toBe(2);
    expect(gradeChop(2)).toBe(1);
    expect(gradeChop(3)).toBe(0);
  });
});

describe('platters', () => {
  it('gives (S)/(M)/(L) tiers at 2/4/6 ingredients', () => {
    expect([1, 2, 3, 4, 5, 6].map(tierFor)).toEqual([0, 1, 1, 2, 2, 3]);
    expect(slotsFor(1)).toBe(2);
    expect(slotsFor(2)).toBe(4);
    const meat = platterBuffs(['wyvernThigh', 'aptonothMeat'], [], 1);
    expect(meat.stat).toBe('attack');
    expect(meat.tier).toBe(1);
    expect(platterBuffs(['squadSardine', 'jumboWhelk', 'sushifish', 'osseoctopus'], [], 2)).toMatchObject({ stat: 'defense', tier: 2 });
    expect(platterBuffs(['magnicelery'], [], 1)).toMatchObject({ stat: null, tier: 0 });
  });
  it('activates a group skill for two ingredients of the same group', () => {
    expect(platterBuffs(['wyvernThigh', 'aptonothMeat'], [], 1).skill).toBeNull();
    expect(platterBuffs(['wyvernThigh', 'wyvernEgg'], [], 1).skill).toBe('polisher');
    expect(platterBuffs(['wyvernThigh', 'wyvernEgg', 'wyvernSkirtSteak', 'aptonothMeat'], [], 2).skill).toBe('polisher');
    expect(platterBuffs(['squadSardine', 'samuraiTuna'], [], 1).skill).toBe('riserHi');
  });
  it('fresh ingredients add Health and half a star each', () => {
    const none = platterBuffs(['wyvernThigh', 'wyvernEgg'], [], 1);
    const one = platterBuffs(['wyvernThigh', 'wyvernEgg'], ['wyvernThigh'], 1);
    const two = platterBuffs(['wyvernThigh', 'wyvernEgg'], ['wyvernThigh', 'wyvernEgg'], 1);
    expect([none.health, one.health, two.health]).toEqual([0, 10, 20]);
    expect([none.skillStars, one.skillStars, two.skillStars]).toEqual([1, 1.5, 2]);
    expect(none.skillChance).toBeCloseTo(0.5);
    expect(two.skillChance).toBeCloseTo(0.75);
    expect(platterBuffs(['wyvernThigh', 'wyvernEgg'], ['wyvernThigh', 'wyvernEgg'], 1, 0).skillChance).toBeCloseTo(0.375);
  });
  it('caps Stamina at +50 and Well-Done Steak gives +50', () => {
    expect(platterBuffs(['wyvernThigh', 'aptonothMeat'], [], 1).stamina).toBe(25);
    expect(platterBuffs(['wyvernThigh', 'aptonothMeat'], [], 2).stamina).toBe(50);
    expect(steakBuffs(2).stamina).toBe(50);
    expect(steakBuffs(1).stamina).toBeLessThan(50);
    expect(dishBuffs('steak', ['rawMeat'], [], 1, 2).stamina).toBe(50);
  });
});

describe('economy', () => {
  it('rolls prices within ±25% and one fresh ingredient per category', () => {
    expect(rollPrices(fixed(0)).aptonothMeat).toBe(17);
    expect(rollPrices(fixed(0.999)).aptonothMeat).toBe(27);
    expect(rollPrices(fixed(0.5)).rawMeat).toBeUndefined();
    const s = newGame(fixed(0.5));
    expect(rollFresh(fixed(0), s.unlocked).map((id) => INGREDIENTS[id].category)).toEqual(['meat', 'fish', 'veg']);
  });
  it('buys only unlocked, affordable ingredients and sells field items', () => {
    const s = newGame(fixed(0.5));
    s.zenny = 50;
    expect(buyIngredient(s, 'aptonothMeat', 2)).toBe(true);
    expect(s.zenny).toBe(6);
    expect(buyIngredient(s, 'aptonothMeat', 1)).toBe(false);
    s.zenny = 1000;
    expect(buyIngredient(s, 'samuraiTuna', 1)).toBe(false);
    expect(buyIngredient(s, 'rawMeat', 1)).toBe(false);
    expect(sellItem(s, 'rawMeat', 2)).toBe(true);
    expect(s.zenny).toBe(1012);
    expect(buyUpgrade(s, 'lanterns')).toBe(true);
    expect(buyUpgrade(s, 'lanterns')).toBe(false);
  });
  it('deliveries consume items and unlock ingredients', () => {
    const s = newGame(fixed(0.5));
    expect(completeDelivery(s, 'herbs')).toBe(false);
    s.stock.herb = 5;
    expect(completeDelivery(s, 'herbs')).toBe(true);
    expect(s.stock.herb).toBe(1);
    expect(s.unlocked).toContain('rapscallion');
    expect(completeDelivery(s, 'herbs')).toBe(false);
  });
  it('sets platters within slots and category', () => {
    const s = newGame(fixed(0.5));
    expect(togglePlatterIngredient(s, 'meatPlatter', 'peonTurkey')).toBe(false); // full
    expect(togglePlatterIngredient(s, 'meatPlatter', 'aptonothMeat')).toBe(true); // remove
    expect(togglePlatterIngredient(s, 'meatPlatter', 'squadSardine')).toBe(false); // wrong category
    expect(togglePlatterIngredient(s, 'meatPlatter', 'peonTurkey')).toBe(true);
    expect(s.platters.meatPlatter).toEqual(['wyvernThigh', 'peonTurkey']);
  });
  it('counts and consumes portions', () => {
    const s = newGame(fixed(0.5));
    expect(portions(s, 'meatPlatter')).toBe(3);
    expect(portions(s, 'steak')).toBe(5);
    const ids = dishIngredients(s, 'meatPlatter') as string[];
    expect(consumeIngredients(s.stock, ids)).toBe(true);
    expect(s.stock.wyvernThigh).toBe(2);
    s.stock = {};
    expect(dishIngredients(s, 'meatPlatter')).toBeNull();
    expect(consumeIngredients(s.stock, ['wyvernThigh'])).toBe(false);
  });
  it("Chef's Choice prefers fresh ingredients from one category", () => {
    const stock = { wyvernThigh: 1, aptonothMeat: 5, peonTurkey: 1, squadSardine: 3 };
    expect(pickChefsChoice(fixed(0), stock, ['peonTurkey'], 2)).toEqual(['peonTurkey', 'aptonothMeat']);
    expect(pickChefsChoice(fixed(0), { squadSardine: 3 }, [], 2)).toBeNull();
  });
  it('pays more for good food, patience and a met need; burnt still pays 70%', () => {
    const burnt = dishPayment(DISHES.meatPlatter, 0, 0, 0.2, false);
    expect(burnt.total).toBe(105);
    expect(burnt.reputation).toBe(0);
    const tasty = dishPayment(DISHES.meatPlatter, 2, 1, 0.2, true);
    expect(tasty.total).toBe(195 + 30 + 38);
    expect(tasty.reputation).toBe(3);
  });
  it('hunters prefer dishes that meet their need', () => {
    const attack = { dish: 'meatPlatter' as const, buffs: platterBuffs(['wyvernThigh', 'aptonothMeat'], [], 1) };
    const steak = { dish: 'steak' as const, buffs: steakBuffs(2) };
    expect(meetsNeed(attack.buffs, 'attack')).toBe(true);
    expect(meetsNeed(steak.buffs, 'stamina')).toBe(true);
    expect(meetsNeed(attack.buffs, 'stamina')).toBe(false);
    expect(chooseOrder(fixed(0.7), [attack, steak], 'attack')?.dish).toBe('meatPlatter');
    expect(chooseOrder(fixed(0.5), [], 'attack')).toBeNull();
  });
});

describe('low punishment', () => {
  it('reputation never drops below 0', () => {
    const s = newGame(fixed(0.5));
    s.reputation = 1;
    expect(addReputation(s, -5)).toBe(-1);
    expect(s.reputation).toBe(0);
  });
  it('a cart costs no reputation', () => {
    const r = resolveQuest(fixed(0.999), 1, MONSTERS.rathian, steakBuffs(0), 0, sns);
    expect(r.outcome).toBe('carted');
    expect(r.reputation).toBe(0);
    expect(r.items).toEqual([]);
  });
  it('the Rank Trial opens on Day 5 with enough reputation and repeats until passed', () => {
    const s = newGame(fixed(0.5));
    expect(isTrialDay(s)).toBe(false);
    s.day = 5;
    expect(isTrialDay(s)).toBe(false); // not enough reputation yet
    s.reputation = 170;
    expect(isTrialDay(s)).toBe(true);
    s.day = 6;
    expect(isTrialDay(s)).toBe(true);
    s.trialPassed = true;
    expect(isTrialDay(s)).toBe(false);
  });
});

describe('quests', () => {
  const attackS = platterBuffs(['wyvernThigh', 'aptonothMeat'], [], 1);
  const elemS = platterBuffs(['magnicelery', 'plumpkin'], [], 1);
  it('rewards the right stat and good cooking', () => {
    const jagras = MONSTERS.greatJagras;
    expect(questChance(1, jagras, attackS, 2, sns, false)).toBeGreaterThan(questChance(1, jagras, elemS, 2, sns, false));
    expect(questChance(1, jagras, attackS, 2, sns, false)).toBeGreaterThan(questChance(1, jagras, attackS, 0, sns, false));
    expect(questChance(1, MONSTERS.rathian, elemS, 2, sns, false)).toBeGreaterThan(questChance(1, MONSTERS.rathian, attackS, 2, sns, false));
    expect(questChance(0, MONSTERS.rathian, steakBuffs(0), 0, sns, false)).toBeGreaterThanOrEqual(0.05);
  });
  it('food skills help when they activate', () => {
    const buffs = platterBuffs(['peonTurkey', 'herbivoreEgg'], [], 1);
    expect(buffs.skill).toBe('sharpshooter');
    const bow = WEAPONS_BY_ID.bow;
    expect(questChance(1, MONSTERS.barroth, buffs, 2, bow, true)).toBeGreaterThan(questChance(1, MONSTERS.barroth, buffs, 2, bow, false));
    expect(questChance(1, MONSTERS.barroth, buffs, 2, sns, true)).toBe(questChance(1, MONSTERS.barroth, buffs, 2, sns, false));
  });
  it('Felyne Moxie turns a cart into a narrow escape', () => {
    const moxie = { ...steakBuffs(0), skill: 'moxie', skillChance: 1 };
    const r = resolveQuest(fixed(0.999), 1, MONSTERS.rathian, moxie, 0, sns);
    expect(r.outcome).toBe('barely');
    expect(r.moxieSaved).toBe(true);
  });
  it('successful hunts bring back field items from the locale', () => {
    const r = resolveQuest(fixed(0), 1, MONSTERS.greatJagras, attackS, 2, sns);
    expect(r.outcome).toBe('success');
    expect(r.items).toHaveLength(2);
    for (const id of r.items) expect(MONSTERS.greatJagras.returns[id]).toBeGreaterThan(0);
    expect(rollItem(fixed(0), MONSTERS.barroth)).toBe('rawMeat');
  });
});

describe('save', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const s = newGame(fixed(0.5));
    advanceDay(s, fixed(0.5));
    expect(saveGame(s, storage)).toBe(true);
    expect(loadGame(storage)).toEqual({ state: s, reset: false });
    expect(loadGame(null)).toEqual({ state: null, reset: false });
    expect(loadGame(memoryStorage())).toEqual({ state: null, reset: false });
  });
  it('wipes saves from another version or garbage and reports it', () => {
    const storage = memoryStorage();
    storage.setItem(SAVE_KEY, JSON.stringify({ version: 1, day: 3, zenny: 100, stock: {} }));
    expect(loadGame(storage)).toEqual({ state: null, reset: true });
    expect(storage.mem.has(SAVE_KEY)).toBe(false);
    storage.setItem(SAVE_KEY, '{not json');
    expect(loadGame(storage).reset).toBe(true);
  });
});

describe('v0.3', () => {
  it('assist widens the spit and grill windows', () => {
    const w = spitWindow(false, true);
    expect(w.start).toBeCloseTo(0.56);
    expect(w.end).toBeCloseTo(0.86);
    expect(gradeSpit(0.58, spitWindow(false))).toBe(1);
    expect(gradeSpit(0.58, w)).toBe(2);
    expect(gradeGrill(0.6)).toBe(1);
    expect(gradeGrill(0.6, true)).toBe(2);
    expect(gradeGrill(0.98, true)).toBe(2);
    expect(gradeGrill(1.05, true)).toBe(0);
  });
  it('saves and loads Favorite Platters', () => {
    const s = newGame(fixed(0.5));
    expect(s.favorites.meatPlatter).toEqual([null, null, null]);
    expect(saveFavorite(s, 'meatPlatter', 0)).toBe(true);
    expect(saveFavorite(s, 'meatPlatter', 3)).toBe(false);
    s.platters.meatPlatter = [];
    expect(saveFavorite(s, 'meatPlatter', 1)).toBe(false); // nothing to save
    expect(loadFavorite(s, 'meatPlatter', 1)).toBe(false);
    expect(loadFavorite(s, 'meatPlatter', 0)).toBe(true);
    expect(s.platters.meatPlatter).toEqual(['wyvernThigh', 'aptonothMeat']);
  });
  it('loading a favorite drops locked ingredients and trims to the slots', () => {
    const s = newGame(fixed(0.5));
    s.favorites.meatPlatter[0] = ['wyvernSkirtSteak', 'wyvernThigh', 'peonTurkey', 'toughMeat', 'aptonothMeat'];
    loadFavorite(s, 'meatPlatter', 0);
    expect(s.platters.meatPlatter).toEqual(['wyvernThigh', 'peonTurkey']);
    s.canteenLevel = 2;
    s.stock.wyvernSkirtSteak = 1; // stocked, so usable even before the delivery
    loadFavorite(s, 'meatPlatter', 0);
    expect(s.platters.meatPlatter).toEqual(['wyvernSkirtSteak', 'wyvernThigh', 'peonTurkey', 'toughMeat']);
  });
  it('names where each ingredient comes from', () => {
    expect(unlockSource(INGREDIENTS.wyvernThigh)).toBe('The Argosy from Day 1');
    expect(unlockSource(INGREDIENTS.rapscallion)).toBe('Delivery: 4 Herb');
    expect(unlockSource(INGREDIENTS.samuraiTuna)).toBe('Delivery: 3 Whetfish');
    expect(unlockSource(INGREDIENTS.wyvernEgg)).toBe('Brought back by hunters');
  });
  it('carries audio settings over from v0.2 and sanitizes the rest', () => {
    const storage = memoryStorage();
    expect(readSettings(storage)).toEqual(DEFAULT_SETTINGS);
    storage.setItem(OLD_AUDIO_KEY, JSON.stringify({ muted: true, music: 0.25 }));
    expect(readSettings(storage)).toEqual({ muted: true, music: 0.25, textScale: 1, assist: false });
    expect(storage.mem.has(OLD_AUDIO_KEY)).toBe(false);
    expect(JSON.parse(storage.mem.get(SETTINGS_KEY) as string).music).toBe(0.25);
    storage.setItem(SETTINGS_KEY, JSON.stringify({ music: 7, textScale: 3, assist: 1 }));
    expect(readSettings(storage)).toEqual({ muted: false, music: 1, textScale: 1, assist: true });
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
  });
  it('new games start with an empty tutorial and older saves are wiped', () => {
    const s = newGame(fixed(0.5));
    expect(s.tutorial).toEqual([]);
    expect(s.version).toBe(4);
    const storage = memoryStorage();
    const { staff: _s, rushDay: _r, actOneDone: _a, ...v3 } = s;
    storage.setItem(SAVE_KEY, JSON.stringify({ ...v3, version: 3 }));
    expect(loadGame(storage).reset).toBe(true);
  });
  it('the tutorial covers every scene with unique ids', () => {
    const ids = TUTORIAL_STEPS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(TUTORIAL_STEPS.map((t) => t.scene))).toEqual(new Set(['Prep', 'Service', 'Report']));
  });
  it('arrivals speed up with the Bell and later days', () => {
    expect(arrivalInterval(1, false, fixed(0))).toBe(7000);
    expect(arrivalInterval(1, true, fixed(0))).toBe(5600);
    expect(arrivalInterval(10, false, fixed(1))).toBeCloseTo(11500 * 0.75);
  });
});

describe('v0.4', () => {
  it('grades the Soup Pot and widens it with assist', () => {
    expect(gradePot(0.8, 3)).toBe(2);
    expect(gradePot(0.8, 2)).toBe(1);
    expect(gradePot(0.5, 2)).toBe(1);
    expect(gradePot(0.3, 3)).toBe(0);
    expect(gradePot(0.9, 1)).toBe(0);
    const a = potBand(true);
    const n = potBand(false);
    expect(a.high - a.low).toBeGreaterThan(n.high - n.low);
    expect(a.cueMs).toBeGreaterThan(n.cueMs);
  });
  it('Fish and Veggie Platters use the Soup Pot from Day 3, the Grill before', () => {
    const s = newGame(fixed(0.5));
    expect(potOpen(s)).toBe(false);
    expect(stationsFor('fishPlatter', s)).toEqual(['board', 'grill']);
    expect(stationsFor('meatPlatter', s)).toEqual(['board', 'grill']);
    s.day = 3;
    expect(stationsFor('veggiePlatter', s)).toEqual(['board', 'pot']);
    expect(stationsFor('meatPlatter', s)).toEqual(['board', 'grill']);
  });
  it('hires, assigns and pays kitchen Palicoes', () => {
    const s = newGame(fixed(0.5));
    s.zenny = 10_000;
    expect(hireStaff(s)).toBe(false); // not before Day 5
    s.day = STAFF_DAY;
    s.zenny = HIRE_COSTS[0] - 1;
    expect(hireStaff(s)).toBe(false);
    s.zenny = 10_000;
    expect(hireStaff(s)).toBe(true);
    expect(hireStaff(s)).toBe(true);
    expect(hireStaff(s)).toBe(false); // two at most
    expect(s.zenny).toBe(10_000 - HIRE_COSTS[0] - HIRE_COSTS[1]);
    const [a, b] = s.staff;
    assignStaff(s, a.id, 'grill');
    assignStaff(s, b.id, 'grill'); // takes the grill from a
    expect(a.station).toBeNull();
    expect(stationStaff(s, 'grill')).toBe(b);
    s.zenny = WAGE + 10;
    expect(payWages(s)).toBe(WAGE);
    expect([a.off, b.off]).toEqual([false, true]); // no debt: the unpaid Palico takes the day off
    expect(stationStaff(s, 'grill')).toBeUndefined();
    expect(s.zenny).toBe(10);
  });
  it('kitchen Palicoes cook Rare, then Well-done after enough dishes', () => {
    const s = newGame(fixed(0.5));
    s.day = STAFF_DAY;
    s.zenny = 5000;
    hireStaff(s);
    expect(staffQuality(s.staff[0])).toBe(1);
    s.staff[0].cooked = LEVEL_UP_DISHES;
    expect(staffQuality(s.staff[0])).toBe(2);
  });
  it('advanceDay pays the wages', () => {
    const s = newGame(fixed(0.5));
    s.day = STAFF_DAY;
    s.zenny = 2500;
    hireStaff(s);
    advanceDay(s, fixed(0.5));
    expect(s.zenny).toBe(2500 - HIRE_COSTS[0] - WAGE);
  });
  it('VIPs pay double, give bonus reputation and hunt 4-star or harder monsters', () => {
    const plain = dishPayment(DISHES.meatPlatter, 2, 1, 0.45, true);
    const vip = vipPayment(DISHES.meatPlatter, 2, 1, 0.45, true);
    expect(vip.total).toBe(plain.total * 2);
    expect(vip.reputation).toBe(plain.reputation + 3);
    expect(vipPayment(DISHES.meatPlatter, 1, 1, 0.45, true).reputation).toBe(dishPayment(DISHES.meatPlatter, 1, 1, 0.45, true).reputation);
    for (let i = 0; i < 10; i++) expect(vipMonster(fixed(i / 10), monsterPool(MONSTER_LIST, 8)).stars).toBeGreaterThanOrEqual(4);
    expect(vipMonster(fixed(0), monsterPool(MONSTER_LIST, 4)).stars).toBe(3); // hardest available
  });
  it('raids and VIPs only come from their first day', () => {
    expect(raidAt(2, fixed(0))).toBeNull();
    expect(raidAt(3, fixed(0))).toBeCloseTo(0.4);
    expect(raidAt(3, fixed(0.5))).toBeNull();
    expect(vipAt(3, fixed(0))).toBeNull();
    expect(vipAt(4, fixed(0))).toBeCloseTo(0.2);
  });
  it('a Jagras eats one stocked platter ingredient', () => {
    const s = newGame(fixed(0.5));
    const before = s.stock.wyvernThigh;
    expect(raidSteal(s, fixed(0))).toBe('wyvernThigh');
    expect(s.stock.wyvernThigh).toBe(before - 1);
    s.stock = {};
    expect(raidSteal(s, fixed(0))).toBeNull();
  });
  it('the Rank Trial shift counts Rare or better and needs met', () => {
    const ok = { quality: 2, matched: true };
    const plain = { quality: 1, matched: false };
    const burnt = { quality: 0, matched: true };
    expect(trialProgress([ok, ok, ok, plain, plain, plain, plain, plain]).passed).toBe(true);
    expect(trialProgress([ok, ok, plain, plain, plain, plain, plain, plain]).passed).toBe(false); // 2 needs met
    const t = trialProgress([ok, ok, ok, ok, plain, plain, plain, burnt]);
    expect(t).toEqual({ served: 7, needsMet: 4, passed: false }); // burnt doesn't count
    expect(TRIAL_GOAL).toEqual({ served: 8, needsMet: 3 });
  });
  it('Rush Hour is one day, and speeds up arrivals', () => {
    const s = newGame(fixed(0.5));
    expect(isRushDay(s)).toBe(false);
    s.rushDay = 7;
    s.day = 7;
    expect(isRushDay(s)).toBe(true);
    s.actOneDone = true;
    expect(isRushDay(s)).toBe(false);
    expect(arrivalInterval(1, false, fixed(0), true)).toBeCloseTo(7000 / RUSH.arrivals);
  });
  it('Low Rank monsters follow World star ratings', () => {
    const stars = Object.fromEntries(MONSTER_LIST.map((m) => [m.id, m.stars]));
    expect(stars).toMatchObject({ paolumu: 4, legiana: 5, odogaron: 5, rathalos: 5, diablos: 5 });
    expect(MONSTERS.legiana.locale).toBe('Coral Highlands');
    expect(MONSTERS.odogaron.locale).toBe('Rotten Vale');
  });
});
