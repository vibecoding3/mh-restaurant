import type { Monster } from '../core/types';

// What hunters gather or carve on the way. Raw Meat comes from Aptonoth (Ancient Forest)
// and Apceros (Wildspire Waste).
const ANCIENT_FOREST = { rawMeat: 3, herb: 3, blueMushroom: 2, sushifish: 1, whetfish: 1, herbivoreEgg: 1, wyvernEgg: 0.5 };
const WILDSPIRE_WASTE = { rawMeat: 3, herb: 2, blueMushroom: 1, sushifish: 1, whetfish: 2, herbivoreEgg: 1, wyvernEgg: 1 };
// Coral Highlands and the Rotten Vale have no Aptonoth or Apceros, so less Raw Meat.
const CORAL_HIGHLANDS = { rawMeat: 1, herb: 3, blueMushroom: 2, sushifish: 2, whetfish: 2, herbivoreEgg: 0.5, wyvernEgg: 1 };
const ROTTEN_VALE = { rawMeat: 1, herb: 1, blueMushroom: 3, sushifish: 0.5, whetfish: 1, herbivoreEgg: 0.5, wyvernEgg: 1.5 };

// Low Rank targets with their World star ratings (assignments on monsterhunterwiki.org).
export const MONSTER_LIST: Monster[] = [
  {
    id: 'greatJagras', name: 'Great Jagras', stars: 2, locale: 'Ancient Forest',
    weights: { attack: 1.5, health: 0.5 }, need: 'attack', blights: false, minDay: 1, returns: ANCIENT_FOREST,
  },
  {
    id: 'kuluYaKu', name: 'Kulu-Ya-Ku', stars: 2, locale: 'Ancient Forest',
    weights: { stamina: 1.5, health: 0.5 }, need: 'stamina', blights: false, minDay: 1, returns: ANCIENT_FOREST,
  },
  {
    id: 'pukeiPukei', name: 'Pukei-Pukei', stars: 3, locale: 'Ancient Forest',
    weights: { defense: 1.5, stamina: 0.5 }, need: 'defense', blights: true, minDay: 2, returns: ANCIENT_FOREST,
  },
  {
    id: 'barroth', name: 'Barroth', stars: 3, locale: 'Wildspire Waste',
    weights: { defense: 1.5, health: 0.5 }, need: 'defense', blights: true, minDay: 3, returns: WILDSPIRE_WASTE,
  },
  {
    id: 'jyuratodus', name: 'Jyuratodus', stars: 3, locale: 'Wildspire Waste',
    weights: { elemRes: 1.5, defense: 0.5 }, need: 'elemRes', blights: true, minDay: 3, returns: WILDSPIRE_WASTE,
  },
  {
    id: 'tobiKadachi', name: 'Tobi-Kadachi', stars: 3, locale: 'Ancient Forest',
    weights: { elemRes: 1.5, stamina: 0.5 }, need: 'elemRes', blights: true, minDay: 4, returns: ANCIENT_FOREST,
  },
  {
    id: 'anjanath', name: 'Anjanath', stars: 4, locale: 'Ancient Forest',
    weights: { defense: 1.5, elemRes: 0.5, health: 0.5 }, need: 'defense', blights: true, minDay: 5, returns: ANCIENT_FOREST,
  },
  {
    id: 'rathian', name: 'Rathian', stars: 4, locale: 'Ancient Forest',
    weights: { elemRes: 1.5, defense: 0.5, health: 0.5 }, need: 'elemRes', blights: true, minDay: 6, returns: ANCIENT_FOREST,
  },
  {
    id: 'paolumu', name: 'Paolumu', stars: 4, locale: 'Coral Highlands',
    weights: { stamina: 1.5, defense: 0.5 }, need: 'stamina', blights: false, minDay: 6, returns: CORAL_HIGHLANDS,
  },
  {
    id: 'legiana', name: 'Legiana', stars: 5, locale: 'Coral Highlands',
    weights: { elemRes: 1.5, stamina: 0.5, health: 0.5 }, need: 'elemRes', blights: true, minDay: 7, returns: CORAL_HIGHLANDS,
  },
  {
    id: 'odogaron', name: 'Odogaron', stars: 5, locale: 'Rotten Vale',
    weights: { attack: 1.5, stamina: 0.5, health: 0.5 }, need: 'attack', blights: true, minDay: 8, returns: ROTTEN_VALE,
  },
  {
    id: 'rathalos', name: 'Rathalos', stars: 5, locale: 'Ancient Forest',
    weights: { elemRes: 1.5, defense: 0.5, health: 0.5 }, need: 'elemRes', blights: true, minDay: 9, returns: ANCIENT_FOREST,
  },
  {
    id: 'diablos', name: 'Diablos', stars: 5, locale: 'Wildspire Waste',
    weights: { defense: 1.5, health: 1 }, need: 'defense', blights: false, minDay: 10, returns: WILDSPIRE_WASTE,
  },
];

export const MONSTERS: Record<string, Monster> = Object.fromEntries(MONSTER_LIST.map((m) => [m.id, m]));

/** Completing this World quest levels up the Canteen (2 to 4 ingredient slots). */
export const CANTEEN_QUEST = { monsterId: 'tobiKadachi', name: 'Flying Sparks: Tobi-Kadachi' };

/** World's 4-star assignment against Zorah Magdaros; the Rush Hour day feeds the hunters heading out for it. */
export const ZORAH_QUEST = 'One for the History Books';
