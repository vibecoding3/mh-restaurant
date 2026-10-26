import { TRIAL_DAY, TRIAL_REPUTATION } from '../core/state';

// The Handler's Day 1 tutorial. Each tip is shown once, the first time its moment comes up.

export type TipScene = 'Prep' | 'Service' | 'Report';

export interface TipRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TutorialStep {
  id: string;
  scene: TipScene;
  text: string;
  /** What to highlight. Steps without one get their target from the scene (a hunter, a ticket). */
  target?: TipRect;
}

/** The minigame panel in Service. */
const MINIGAME: TipRect = { x: 380, y: 150, w: 1160, h: 800 };

export const TUTORIAL_STEPS: TutorialStep[] = [
  // Morning prep
  {
    id: 'prep-argosy', scene: 'Prep', target: { x: 24, y: 90, w: 620, h: 900 },
    text: "Morning, Chef! This is the Argosy. The Captain sells Canteen ingredients here and his prices change every day. Buy with +1 or +5.",
  },
  {
    id: 'prep-platter', scene: 'Prep', target: { x: 680, y: 164, w: 608, h: 222 },
    text: 'Set what goes on each platter: click an ingredient below to add it, or a filled slot to remove it. Two of one kind give a stat: Meat for Attack Up, Fish for Defense Up, Vegetables for Elemental Res Up. The boxes 1, 2 and 3 save a Favorite Platter: click to save or load, right-click to overwrite.',
  },
  {
    id: 'prep-fresh', scene: 'Prep', target: { x: 24, y: 90, w: 620, h: 900 },
    text: 'Ingredients marked "Fresh today" add +10 Health and half a star to the food skill rating. Put them on your platters!',
  },
  {
    id: 'prep-menu', scene: 'Prep', target: { x: 664, y: 90, w: 640, h: 900 },
    text: "The ticks choose today's menu. Hunters only order what the kitchen can make, and each dish shows how many portions your stock allows.",
  },
  {
    id: 'prep-open', scene: 'Prep', target: { x: 1430, y: 996, w: 460, h: 88 },
    text: `When you're ready, open the Canteen! Reach ${TRIAL_REPUTATION} reputation by Day ${TRIAL_DAY} to pass the Commander's Rank Trial.`,
  },

  // Service
  {
    id: 'svc-seat', scene: 'Service', target: { x: 30, y: 380, w: 440, h: 300 },
    text: 'Hunters gather at the door. Click one to seat them at a free table. Their patience starts running out while they wait!',
  },
  {
    id: 'svc-need', scene: 'Service',
    text: 'Over each hunter: what they need for their next quest, and their patience in hearts. A dish that gives what they need pays a bonus and helps them on the hunt.',
  },
  {
    id: 'svc-ticket', scene: 'Service',
    text: 'Their order goes up on the rail. The ticket shows every station the dish needs. Click the glowing station below, or press 1, 2 or 3.',
  },
  {
    id: 'svc-board', scene: 'Service', target: MINIGAME,
    text: 'The Chopping Board: hold the mouse button and slash through every ingredient before it falls. Miss none for a Well-done dish.',
  },
  {
    id: 'svc-spit', scene: 'Service', target: MINIGAME,
    text: 'The BBQ Spit! Hold to turn the meat and let go while the needle is in the gold for a Well-Done Steak.',
  },
  {
    id: 'svc-grill', scene: 'Service', target: MINIGAME,
    text: 'The Grill: click each cut when it turns golden to flip it. Every cut needs both sides done. Space flips the hottest one.',
  },
  {
    id: 'svc-serve', scene: 'Service',
    text: 'That dish is ready! Click the ticket or the hunter to serve it before their hearts run out.',
  },

  // Quest report
  {
    id: 'rep-cards', scene: 'Report', target: { x: 24, y: 126, w: 1872, h: 716 },
    text: 'After their meal the hunters head out on quests. Each card shows how the hunt went. A well-cooked meal that gives what they need means better odds.',
  },
  {
    id: 'rep-items', scene: 'Report', target: { x: 30, y: 856, w: 1200, h: 200 },
    text: 'Hunters bring back what they gather. Sell the surplus to the Captain, or hand it to the Provisions Manager to unlock new ingredients.',
  },
  {
    id: 'rep-trial', scene: 'Report', target: { x: 30, y: 856, w: 1200, h: 200 },
    text: `Good meals and successful hunts earn reputation. Reach ${TRIAL_REPUTATION} by Day ${TRIAL_DAY} and the Commander approves your Canteen in the Rank Trial.`,
  },
];

export const TUTORIAL: Record<string, TutorialStep> = Object.fromEntries(TUTORIAL_STEPS.map((t) => [t.id, t]));
