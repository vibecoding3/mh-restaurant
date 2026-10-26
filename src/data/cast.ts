// Canon World cast members who appear in UI text. No invented characters.
export const CAST = {
  chef: 'Meowscular Chef',
  handler: 'the Handler',
  captain: 'the Captain',
  provisions: 'Provisions Manager',
  smithy: 'Second Fleet Master',
  commander: 'the Commander',
} as const;

/** Canon Astera regulars who drop by as VIPs. Only their names and roles are used. */
export const VIPS = [
  { id: 'fieldTeamLeader', name: 'Field Team Leader' },
  { id: 'huntsman', name: 'The Huntsman' },
  { id: 'seeker', name: 'The Seeker' },
  { id: 'admiral', name: 'The Admiral' },
] as const;
export type VipId = (typeof VIPS)[number]['id'];
export const VIP_BY_ID = Object.fromEntries(VIPS.map((v) => [v.id, v])) as Record<VipId, (typeof VIPS)[number]>;

/** The Handler's tips of the day in morning prep. */
export const HANDLER_TIPS = [
  'Each hunter shows what they need over their head. Serve a dish that gives it for a bigger tip and better odds on the hunt!',
  'Set your platters before opening. Two ingredients of the same skill group give a food skill, like Felyne Polisher for Courage.',
  'Fresh ingredients change every day. Each one adds +10 Health and half a star to the skill activation rating.',
  'Kulu-Ya-Ku hunters need Stamina. A Well-Done Steak from the BBQ Spit gives +50!',
  'Hunters bring back what they gather. The Provisions Manager unlocks new ingredients for deliveries.',
  'Complete "Flying Sparks: Tobi-Kadachi" and the Canteen levels up: four ingredients per platter!',
  'Rathian breathes fire. Hunters heading out after her want Elemental Res, so keep a Veggie Platter ready.',
];
