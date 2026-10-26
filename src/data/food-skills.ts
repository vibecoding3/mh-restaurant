import type { FoodSkill, SkillGroup } from '../core/types';

// Food skills from World's Canteen. Descriptions follow World; bonuses are gameplay numbers.
const melee = (cls: string) => cls === 'blade' || cls === 'blunt' || cls === 'gunlance';

export const FOOD_SKILL_LIST: FoodSkill[] = [
  {
    id: 'polisher', name: 'Felyne Polisher', group: 'courage', tier: 0,
    description: 'Often speeds up sharpening time.', questEffect: 'Small bonus for melee weapons.',
    bonus: (_m, w) => (melee(w.cls) ? 0.04 : 0),
  },
  {
    id: 'rider', name: 'Felyne Rider', group: 'courage', tier: 1,
    description: 'Makes it easier to mount monsters.', questEffect: 'Bonus on every hunt.',
    bonus: () => 0.05,
  },
  {
    id: 'slugger', name: 'Felyne Slugger', group: 'courage', tier: 2,
    description: 'Makes it easier to stun monsters.', questEffect: 'Big bonus for Hammer and Hunting Horn.',
    bonus: (_m, w) => (w.cls === 'blunt' ? 0.1 : 0.03),
  },
  {
    id: 'acrobat', name: 'Felyne Acrobat', group: 'resilience', tier: 0,
    description: 'Lets you recover quickly when sent flying.', questEffect: 'Small bonus on every hunt.',
    bonus: () => 0.04,
  },
  {
    id: 'feet', name: 'Felyne Feet', group: 'resilience', tier: 1,
    description: 'Prevents you from getting knocked on your butt.', questEffect: 'Bonus on every hunt.',
    bonus: () => 0.05,
  },
  {
    id: 'moxie', name: 'Felyne Moxie', group: 'resilience', tier: 2,
    description: 'Prevents fainting once when damage exceeds your remaining health.',
    questEffect: 'Turns a cart into a narrow escape.',
    bonus: () => 0,
  },
  {
    id: 'riserHi', name: 'Felyne Riser (Hi)', group: 'vigor', tier: 0,
    description: 'Greatly extends the invulnerability period when getting up.', questEffect: 'Small bonus on every hunt.',
    bonus: () => 0.04,
  },
  {
    id: 'blackBelt', name: 'Felyne Black Belt', group: 'vigor', tier: 1,
    description: 'Reduces stamina depletion from evading, blocking and some other actions.',
    questEffect: 'Bonus against monsters that test your Stamina.',
    bonus: (m) => ((m.weights.stamina ?? 0) > 0 ? 0.08 : 0.03),
  },
  {
    id: 'heroics', name: 'Felyne Heroics', group: 'vigor', tier: 2,
    description: 'Increases attack and defense when health is dangerously low.',
    questEffect: 'Bonus that grows with the monster\'s star rating.',
    bonus: (m) => 0.03 * m.stars,
  },
  {
    id: 'groomer', name: 'Felyne Groomer', group: 'acumen', tier: 0,
    description: 'Shortens Defense Down and speeds up blight recovery.', questEffect: 'Bonus against monsters that inflict blights.',
    bonus: (m) => (m.blights ? 0.06 : 0),
  },
  {
    id: 'medic', name: 'Felyne Medic', group: 'acumen', tier: 1,
    description: 'Increases health recovered from items.', questEffect: 'Bonus on every hunt.',
    bonus: () => 0.05,
  },
  {
    id: 'specialist', name: 'Felyne Specialist', group: 'acumen', tier: 2,
    description: 'Increases the potency of abnormal status attacks.', questEffect: 'Bonus on every hunt.',
    bonus: () => 0.07,
  },
  {
    id: 'sharpshooter', name: 'Felyne Sharpshooter', group: 'artillery', tier: 0,
    description: 'Increases the power of normal shots and normal arrows.', questEffect: 'Bonus for bowguns and the Bow.',
    bonus: (_m, w) => (w.cls === 'gun' || w.cls === 'bow' ? 0.08 : 0),
  },
  {
    id: 'bombardier', name: 'Felyne Bombardier', group: 'artillery', tier: 1,
    description: 'Increases ballista, sticky ammo and gunlance shell damage.', questEffect: 'Big bonus for Gunlance and bowguns.',
    bonus: (_m, w) => (w.cls === 'gunlance' || w.cls === 'gun' ? 0.1 : 0.02),
  },
  {
    id: 'pyro', name: 'Felyne Pyro', group: 'artillery', tier: 2,
    description: 'Upgrades Large Barrel Bombs to Mega Barrel Bombs.', questEffect: 'Bonus on every hunt.',
    bonus: () => 0.06,
  },
];

export const FOOD_SKILLS: Record<string, FoodSkill> = Object.fromEntries(FOOD_SKILL_LIST.map((s) => [s.id, s]));

/** The skill a group grants for 2, 4 or 6 of its ingredients (tier 0, 1, 2). */
export function groupSkill(group: SkillGroup, tier: number): FoodSkill | undefined {
  return FOOD_SKILL_LIST.find((s) => s.group === group && s.tier === tier);
}
