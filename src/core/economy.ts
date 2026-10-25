import type { BuffId, Quality, Recipe, Rng } from './types';
import type { GameState } from './state';
import { INGREDIENT_LIST } from '../data/ingredients';
import { UPGRADES } from '../data/upgrades';

const QUALITY_PRICE = [0.5, 1, 1.5];
const QUALITY_REP = [-1, 1, 3];

/** Trader prices swing ±25% each day. */
export function rollPrices(rng: Rng): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const ing of INGREDIENT_LIST) {
    if (ing.basePrice === undefined) continue;
    prices[ing.id] = Math.max(1, Math.round(ing.basePrice * (0.75 + rng() * 0.5)));
  }
  return prices;
}

export function buyIngredient(state: GameState, id: string, qty: number): boolean {
  const price = state.prices[id];
  if (price === undefined || qty <= 0) return false;
  const cost = price * qty;
  if (state.zenny < cost) return false;
  state.zenny -= cost;
  state.stock[id] = (state.stock[id] ?? 0) + qty;
  return true;
}

export function buyUpgrade(state: GameState, id: string): boolean {
  const up = UPGRADES[id];
  if (!up || state.upgrades.includes(id) || state.zenny < up.cost) return false;
  state.zenny -= up.cost;
  state.upgrades.push(id);
  return true;
}

/** How many portions of a recipe the stock allows. */
export function portions(stock: Record<string, number>, recipe: Recipe): number {
  let n = Infinity;
  for (const [id, qty] of Object.entries(recipe.ingredients)) {
    n = Math.min(n, Math.floor((stock[id] ?? 0) / qty));
  }
  return n === Infinity ? 0 : n;
}

export function consumeIngredients(stock: Record<string, number>, recipe: Recipe): boolean {
  if (portions(stock, recipe) < 1) return false;
  for (const [id, qty] of Object.entries(recipe.ingredients)) stock[id] -= qty;
  return true;
}

export function recipeHasBuff(recipe: Recipe, buff: BuffId): boolean {
  return (recipe.buffs[buff] ?? 0) > 0;
}

export interface Payment {
  base: number;
  tip: number;
  wishBonus: number;
  total: number;
  reputation: number;
}

/** What a hunter pays for a served dish. patienceLeft is 0..1. */
export function dishPayment(
  recipe: Recipe, quality: Quality, patienceLeft: number, tipRate: number, wish: BuffId,
): Payment {
  const base = Math.round(recipe.price * QUALITY_PRICE[quality]);
  const tip = Math.round(recipe.price * tipRate * Math.max(0, Math.min(1, patienceLeft)));
  const matched = recipeHasBuff(recipe, wish);
  const wishBonus = matched ? Math.round(recipe.price * 0.25) : 0;
  return {
    base, tip, wishBonus,
    total: base + tip + wishBonus,
    reputation: QUALITY_REP[quality] + (matched ? 1 : 0),
  };
}

/**
 * A hunter picks a dish from today's menu that the kitchen can still make,
 * preferring dishes that give the buff they want. Returns null if nothing is available.
 */
export function chooseOrder(
  rng: Rng, menu: Recipe[], stock: Record<string, number>, wish: BuffId,
): Recipe | null {
  const options = menu.filter((r) => portions(stock, r) > 0);
  if (options.length === 0) return null;
  const weights = options.map((r) => (recipeHasBuff(r, wish) ? 3 : 1));
  let roll = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i];
    if (roll < 0) return options[i];
  }
  return options[options.length - 1];
}
