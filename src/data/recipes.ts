import type { Recipe } from '../core/types';

export const RECIPE_LIST: Recipe[] = [
  {
    id: 'steak', name: 'Well-Done Steak', icon: '🍖',
    ingredients: { rawMeat: 1 }, stations: ['spit'],
    buffs: { health: 20 }, price: 60,
  },
  {
    id: 'skewers', name: 'Kokoto Skewers', icon: '🍢',
    ingredients: { kelbiMeat: 1, herb: 1 }, stations: ['board', 'grill'],
    buffs: { stamina: 25 }, price: 80,
  },
  {
    id: 'hash', name: "Hunter's Hash", icon: '🥘',
    ingredients: { forestPotato: 1, herb: 1 }, stations: ['board', 'grill'],
    buffs: { defense: 10, health: 10 }, price: 70,
  },
  {
    id: 'spicy', name: 'Spicy Wyvern Steak', icon: '🌶️',
    ingredients: { rawMeat: 1, firecellPepper: 1 }, stations: ['board', 'spit'],
    buffs: { attack: 10, fireRes: 10 }, price: 110,
  },
  {
    id: 'jaggiRoast', name: 'Jaggi Tail Roast', icon: '🍗',
    ingredients: { jaggiTail: 1, herb: 1 }, stations: ['board', 'spit'],
    buffs: { attack: 20, health: 10 }, price: 150,
  },
  {
    id: 'omelette', name: 'Kulu Cheese Omelette', icon: '🍳',
    ingredients: { kuluEgg: 1, royalCheese: 1 }, stations: ['board', 'grill'],
    buffs: { health: 30, stamina: 20 }, price: 160,
  },
  {
    id: 'feast', name: 'Rathian Rib Feast', icon: '🍱',
    ingredients: { rathianRib: 1, rawMeat: 1, herb: 1 }, stations: ['board', 'spit', 'grill'],
    buffs: { attack: 15, defense: 15, fireRes: 15 }, skills: ['heroics'], price: 260,
  },
];

export const RECIPES: Record<string, Recipe> = Object.fromEntries(RECIPE_LIST.map((r) => [r.id, r]));

export const MAX_MENU = 4;
