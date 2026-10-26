import type { Dish, DishId, FoodCategory, MealBuffs, Monster, NeedId, PlatterId, Quality, Rng, StationId } from './types';
import type { GameState } from './state';
import { INGREDIENTS, INGREDIENT_LIST } from '../data/ingredients';
import { UPGRADES } from '../data/upgrades';
import { DELIVERIES } from '../data/deliveries';
import { DISHES, isPlatter } from '../data/dishes';
import { slotsFor } from './platters';

/** The Soup Pot opens on Day 3 ("Low Rank 3" in the GDD). Until then its dishes use the Grill. */
export const POT_DAY = 3;

export function potOpen(state: GameState): boolean {
  return state.day >= POT_DAY;
}

/** The stations a dish goes through today. */
export function stationsFor(dish: DishId, state: GameState): StationId[] {
  const stations = DISHES[dish].stations;
  return potOpen(state) ? [...stations] : stations.map((st) => (st === 'pot' ? 'grill' : st));
}

/** Low punishment: a burnt dish still pays 70%. */
const QUALITY_PRICE = [0.7, 1, 1.3];
const QUALITY_REP = [0, 1, 2];
const FOOD_CATEGORIES: FoodCategory[] = ['meat', 'fish', 'veg'];

/** Argosy prices swing ±25% each day. */
export function rollPrices(rng: Rng): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const ing of INGREDIENT_LIST) {
    if (ing.basePrice === undefined) continue;
    prices[ing.id] = Math.max(1, Math.round(ing.basePrice * (0.75 + rng() * 0.5)));
  }
  return prices;
}

/** One fresh ingredient per category, drawn from the unlocked Argosy stock, as in World's daily rotation. */
export function rollFresh(rng: Rng, unlocked: string[]): string[] {
  const fresh: string[] = [];
  for (const cat of FOOD_CATEGORIES) {
    const pool = unlocked.filter((id) => INGREDIENTS[id]?.category === cat && INGREDIENTS[id].basePrice !== undefined);
    if (pool.length) fresh.push(pool[Math.floor(rng() * pool.length) % pool.length]);
  }
  return fresh;
}

export function buyIngredient(state: GameState, id: string, qty: number): boolean {
  const price = state.prices[id];
  if (price === undefined || qty <= 0 || !state.unlocked.includes(id)) return false;
  const cost = price * qty;
  if (state.zenny < cost) return false;
  state.zenny -= cost;
  state.stock[id] = (state.stock[id] ?? 0) + qty;
  return true;
}

export function sellItem(state: GameState, id: string, qty: number): boolean {
  const price = INGREDIENTS[id]?.sellPrice;
  if (price === undefined || qty <= 0 || (state.stock[id] ?? 0) < qty) return false;
  state.stock[id] -= qty;
  state.zenny += price * qty;
  return true;
}

export function buyUpgrade(state: GameState, id: string): boolean {
  const up = UPGRADES[id];
  if (!up || state.upgrades.includes(id) || state.zenny < up.cost) return false;
  state.zenny -= up.cost;
  state.upgrades.push(id);
  return true;
}

/** Hands items to the Provisions Manager and unlocks the delivery's ingredients. */
export function completeDelivery(state: GameState, id: string): boolean {
  const d = DELIVERIES[id];
  if (!d || state.deliveries.includes(id) || (state.stock[d.item] ?? 0) < d.qty) return false;
  state.stock[d.item] -= d.qty;
  state.deliveries.push(id);
  for (const u of d.unlocks) if (!state.unlocked.includes(u)) state.unlocked.push(u);
  return true;
}

/** Adds or removes an ingredient from a prep-set platter. Same category only, no duplicates. */
export function togglePlatterIngredient(state: GameState, dish: DishId, id: string): boolean {
  if (!isPlatter(dish)) return false;
  const list = state.platters[dish];
  const i = list.indexOf(id);
  if (i >= 0) {
    list.splice(i, 1);
    return true;
  }
  if (INGREDIENTS[id]?.category !== DISHES[dish].category || list.length >= slotsFor(state.canteenLevel)) return false;
  list.push(id);
  return true;
}

/** Stores a platter's current ingredients in a Favorite Platter slot. */
export function saveFavorite(state: GameState, platter: PlatterId, slot: number): boolean {
  const list = state.favorites[platter];
  if (slot < 0 || slot >= list.length || state.platters[platter].length === 0) return false;
  list[slot] = [...state.platters[platter]];
  return true;
}

/** Sets a platter from a Favorite Platter, keeping only unlocked or stocked ingredients that fit the slots. */
export function loadFavorite(state: GameState, platter: PlatterId, slot: number): boolean {
  const saved = state.favorites[platter][slot];
  if (!saved) return false;
  const usable = saved.filter((id) => state.unlocked.includes(id) || (state.stock[id] ?? 0) > 0);
  state.platters[platter] = usable.slice(0, slotsFor(state.canteenLevel));
  return true;
}

function countPortions(stock: Record<string, number>, ids: string[]): number {
  if (ids.length === 0) return 0;
  let n = Infinity;
  for (const id of ids) n = Math.min(n, stock[id] ?? 0);
  return n;
}

/**
 * Picks Chef's Choice ingredients: a random category with enough distinct ingredients in stock,
 * fresh ingredients first. Returns null if no category has enough.
 */
export function pickChefsChoice(rng: Rng, stock: Record<string, number>, fresh: string[], slots: number): string[] | null {
  const options = FOOD_CATEGORIES
    .map((cat) => INGREDIENT_LIST.filter((i) => i.category === cat && (stock[i.id] ?? 0) > 0).map((i) => i.id))
    .filter((ids) => ids.length >= slots);
  if (options.length === 0) return null;
  const ids = options[Math.floor(rng() * options.length) % options.length];
  ids.sort((a, b) => Number(fresh.includes(b)) - Number(fresh.includes(a)) || (stock[b] ?? 0) - (stock[a] ?? 0));
  return ids.slice(0, slots);
}

/** Ingredients one portion of a dish would use right now, or null if it can't be made. */
export function dishIngredients(state: GameState, dish: DishId, rng: Rng = Math.random): string[] | null {
  if (dish === 'steak') return (state.stock.rawMeat ?? 0) > 0 ? ['rawMeat'] : null;
  if (dish === 'chefsChoice') return pickChefsChoice(rng, state.stock, state.fresh, slotsFor(state.canteenLevel));
  const ids = state.platters[dish];
  return countPortions(state.stock, ids) > 0 ? [...ids] : null;
}

/** How many portions the stock allows (Chef's Choice: a lower bound for display). */
export function portions(state: GameState, dish: DishId): number {
  if (dish === 'steak') return state.stock.rawMeat ?? 0;
  if (dish === 'chefsChoice') {
    const slots = slotsFor(state.canteenLevel);
    const stock = { ...state.stock };
    let n = 0;
    for (let ids = pickChefsChoice(() => 0, stock, [], slots); ids && n < 99; ids = pickChefsChoice(() => 0, stock, [], slots)) {
      consumeIngredients(stock, ids);
      n++;
    }
    return n;
  }
  return countPortions(state.stock, state.platters[dish]);
}

export function consumeIngredients(stock: Record<string, number>, ids: string[]): boolean {
  if (ids.some((id) => (stock[id] ?? 0) < 1)) return false;
  for (const id of ids) stock[id] -= 1;
  return true;
}

/** Whether a meal gives what the hunter needs. */
export function meetsNeed(buffs: MealBuffs, need: NeedId): boolean {
  return need === 'stamina' ? buffs.stamina >= 50 : buffs.stat === need && buffs.tier > 0;
}

export interface Payment {
  base: number;
  tip: number;
  needBonus: number;
  total: number;
  reputation: number;
}

/** What a hunter pays for a served dish. patienceLeft is 0..1. */
export function dishPayment(dish: Dish, quality: Quality, patienceLeft: number, tipRate: number, matched: boolean): Payment {
  const base = Math.round(dish.price * QUALITY_PRICE[quality]);
  const tip = Math.round(dish.price * tipRate * Math.max(0, Math.min(1, patienceLeft)));
  const needBonus = matched ? Math.round(dish.price * 0.25) : 0;
  return { base, tip, needBonus, total: base + tip + needBonus, reputation: QUALITY_REP[quality] + (matched ? 1 : 0) };
}

/** VIP regulars pay double and give bonus reputation for a Well-done meal that meets their need. */
export const VIP = { pay: 2, bonusRep: 3, walkoutRep: 2, patience: 1.2, minStars: 4 };

export function vipPayment(dish: Dish, quality: Quality, patienceLeft: number, tipRate: number, matched: boolean): Payment {
  const p = dishPayment(dish, quality, patienceLeft, tipRate, matched);
  const total = p.total * VIP.pay;
  return { base: p.base * VIP.pay, tip: p.tip * VIP.pay, needBonus: p.needBonus * VIP.pay, total, reputation: p.reputation + (quality === 2 && matched ? VIP.bonusRep : 0) };
}

/** A VIP's quest: a 4-star or harder monster when one is available, otherwise the hardest one. */
export function vipMonster(rng: Rng, pool: Monster[]): Monster {
  const top = Math.max(...pool.map((m) => m.stars));
  const hard = pool.filter((m) => m.stars >= Math.min(VIP.minStars, top));
  return hard[Math.floor(rng() * hard.length) % hard.length];
}

/** A Jagras that reaches the counter eats one portion of a stocked platter ingredient. Returns its id, or null. */
export function raidSteal(state: GameState, rng: Rng): string | null {
  const ids = [...new Set(Object.values(state.platters).flat())].filter((id) => (state.stock[id] ?? 0) > 0);
  if (ids.length === 0) return null;
  const id = ids[Math.floor(rng() * ids.length) % ids.length];
  state.stock[id] -= 1;
  return id;
}

export interface MenuOption {
  dish: DishId;
  buffs: MealBuffs;
}

/** A hunter picks a dish, preferring the ones that give what they need. Null if nothing is available. */
export function chooseOrder(rng: Rng, options: MenuOption[], need: NeedId): MenuOption | null {
  if (options.length === 0) return null;
  const weights = options.map((o) => (meetsNeed(o.buffs, need) ? 4 : 1));
  let roll = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i];
    if (roll < 0) return options[i];
  }
  return options[options.length - 1];
}
