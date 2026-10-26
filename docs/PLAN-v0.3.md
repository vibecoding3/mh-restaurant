# Hunter's Canteen: v0.3 Implementation Plan (Vertical Slice)

> **Status:** implemented and released as v0.3.0 on 2026-10-26. Deviations: the Rank Trial target became 170 reputation (§6); the pixel pack has no floor or wall tiles, so the ship-timber walls and floor stay code-drawn (§5).

## Decisions from the design Q&A

| # | Topic | Decision |
|---|---|---|
| 1 | Art pass | Use a **free pixel-art pack** (CC0) for the dining hall and stations. Characters stay code-drawn. |
| 2 | Tutorial | **Guided Handler tips on Day 1, skippable.** The game pauses while the Handler talks, and the thing to click is highlighted. |
| 3 | Balance | **An average player passes the Rank Trial on Day 5**, and a sloppy one a day or two later. One upgrade is affordable every 1–2 days (GDD §4.6). |
| 4 | Rules carried over | Canon *World* content only. No emoji. English only, desktop only. Assets only under CC0, CC BY or SIL OFL. Push straight to `main` and tag releases. |
| 5 | Saves | Wiping saves is still fine until the Low Rank release. The save format goes to version 3. |

## Context
v0.2.0 already covers most of the MVP content list (GDD §9.4). What v0.3 still needs, per GDD §9.3 and §9.5 M3, is polish and onboarding:
1. a Handler tutorial;
2. balancing;
3. Favorite Platter presets;
4. an Ingredient book;
5. a first art pass;
6. a Settings screen;
7. a tagged release, which also covers the unreleased Fruit Ninja board and the weapon-free hunters.

## Work order and design

### 1. Settings screen and minigame assist
- **New `src/ui/settings.ts`** holds every player setting in localStorage (try/catch, as now): `muted`, `music`, `textScale` (1 or 1.15), `assist` (boolean).
  - It replaces `readSettings()`/`writeSettings()` in `src/ui/sfx.ts`.
  - It reads the old `hunters-canteen-audio` key once, so audio settings carry over.
  - `sfx.ts` and `music.ts` read their values through it.
- **New `src/scenes/SettingsScene.ts`**, opened from the Title screen and the Service pause menu, with:
  - mute;
  - music volume (reuse `cycleMusicVolume` in `src/ui/music.ts`);
  - text size: Normal or Large;
  - minigame assist: On or Off;
  - fullscreen through `this.scale.toggleFullscreen()`, also bound to the `F` key in every scene.
  - When opened from pause, it uses `scene.launch` and `sleep`/`wake` so the shift resumes intact.
- **Text size:** `txt()` in `src/ui/theme.ts` multiplies body sizes of 28px and under by `textScale`. Titles and banners are unchanged.
- **Assist mode:**
  - **BBQ Spit:** `spitWindow(tempered, assist)` in `src/core/cooking.ts` widens the gold window by about 0.06 on each side.
  - **Grill:** `gradeGrill(heat, assist)` uses a 0.55–1.0 golden range.
  - **Chopping Board:** `BoardGame` takes an `assist` option, with gravity ×0.8 and the hit radius ×1.25.
  - `ServiceScene.openMinigame` reads the setting and passes it to each minigame.

### 2. Favorite Platter presets
- **State** (`src/core/state.ts`): add `favorites: Record<PlatterId, (string[] | null)[]>`, with 3 slots per platter.
- **Core** (`src/core/economy.ts`), next to `togglePlatterIngredient`:
  - `saveFavorite(state, platter, slot)` stores the platter's current ingredients in a slot.
  - `loadFavorite(state, platter, slot)` sets them back, keeping only unlocked ingredients and trimming to `slotsFor(level)`.
- **UI** (`PrepScene.drawPlatterCard`): three small numbered preset buttons in each card header. Clicking an empty one saves the current platter; clicking a filled one loads it. Right-click overwrites a filled preset (the game already has `disableContextMenu`).

### 3. Ingredient book
- **New `src/scenes/BookScene.ts`**, opened from a "Book" button in the Prep footer, with a Back button to Prep. It has tabs for Meat, Fish, Vegetables, Field items and Food skills.
- **Ingredient rows:** `badgeIcon`, name, skill group, the stat it gives, the unlock source and whether it's in stock.
- **Locked ingredients** appear dimmed with their unlock requirement. Unlocking is already tracked in `state.unlocked`.
- **Unlock source helper:** `unlockSource(ing)` in `src/data/ingredients.ts` returns text such as "The Argosy from Day 1", "Delivery: 4 Herb" (from `DELIVERY_LIST`) or "Brought back by hunters".
- **Food skills tab:** the 15 skills from `FOOD_SKILL_LIST`, grouped by skill group, each with how many ingredients it needs (2/4/6), its *World* description and its `questEffect`.

### 4. Handler tutorial (Day 1, skippable)
- **Steps** live in `src/data/tutorial.ts`, as an ordered list of `{ id, scene, text, target }`.
  - **Prep:** the Argosy, setting a platter, fresh ingredients, the menu, Open the Canteen.
  - **Service:** seating a hunter, the need icon and hearts, tickets and stations, each minigame on first use, serving.
  - **Report:** the card results, items brought back, the Rank Trial goal.
  - All text is the Handler's voice; no invented characters.
- **New `src/ui/tutorial.ts`, a `HandlerTip` overlay:**
  - It dims the screen except for a highlight rectangle around the target, which is drawn as four dim rectangles so the hole stays clickable.
  - It shows a Handler panel (paw icon, name, text) with Next and "Skip tutorial" buttons.
  - In Service it pauses the scene. A new `setPaused(on)` helper is split out of `ServiceScene.togglePause`, and the pause menu layer reuses it.
- **State:** `tutorial: string[]` records the step ids already shown; Skip marks them all.
  - Each scene calls `showTip(id)` at the right moment, for example `spawnHunter` for the first hunter, `placeOrder` for the first ticket, and `openMinigame` the first time each station is used.
  - Settings gets a "Replay tutorial" button.
- **Save schema:** `SAVE_VERSION` goes to 3 because of the new `favorites` and `tutorial` fields. Older saves are wiped with the existing title-screen notice, which the user has approved until the Low Rank release.

### 5. Art pass with a free pixel-art pack
- **Primary pack:** Kenney **Roguelike Indoors** (CC0, 16 px, 480 assets): https://kenney.nl/assets/roguelike-indoors.
  - **Use it for:** wood floor and walls, tables and chairs, barrels, shelves and crates, a kitchen counter and stove pieces.
  - **Fallbacks (both CC0):** Kenney Tiny Town and the 1-Bit Pack.
  - **Rejected:** the LPC Tavern, because it is CC-BY-SA, which is outside the allowed licenses.
  - Check the license file when downloading, then add it to `ASSETS_LICENSES.md` and `src/data/credits.ts`.
- **Rendering:**
  - Tiles are scaled ×4 (16 to 64 px) with nearest-neighbor filtering, set per texture with `setFilter(NEAREST)` in `PreloadScene`.
  - A new `PIXEL_KEYS` list goes in `src/scenes/PreloadScene.ts`. Tiles are loaded from a spritesheet, so the file count stays small.
- **`ServiceScene.drawRoom` and `drawStations`:**
  - Replace the flat rectangles with a tiled floor and back wall, pack tables and chairs at `TABLE_X`, wall shelves and barrels, and a tiled kitchen counter.
  - Stations get pack props where they exist: a counter and board for the Chopping Board, a stove or grill for the Grill.
  - The BBQ Spit keeps its code-drawn spit and fire on pack bricks, because no pack has a spit.
  - The Research Commission banner stays code-drawn.
- **Fit check:** first take screenshots of a mock-up with the code-drawn hunters and the Meowscular Chef. If the 3/4-view tiles clash with the side-view characters, try a fallback pack before going further.

### 6. Balancing
- **Make arrival timing testable:** move the arrival math out of `ServiceScene.update` (the spawn interval and the `bell` and day speed-up) into `arrivalInterval(day, bell, rng)` in a new `src/core/shift.ts`. Patience values stay in `src/data/hunters.ts`.
- **Add `tests/balance.test.ts`,** a headless simulation of Days 1–7 built only from core functions (`dishPayment`, `resolveQuest`, `addReputation`, `advanceDay`, `buyIngredient`, `buyUpgrade`). Three player profiles:

  | Profile | Hunters served | Quality (well-done / rare / burnt) | Needs met |
  |---|---|---|---|
  | Good | ~95% | 80 / 15 / 5% | 70% |
  | Average | ~80% | 55 / 30 / 15% | 45% |
  | Sloppy | ~60% | 30 / 40 / 30% | 20% |

  The simulation buys ingredients to keep the platters stocked and buys the cheapest upgrade it can afford. Each profile runs on 200 seeded runs.
- **Assertions (target bands):**
  - **Average** reaches `TRIAL_REPUTATION` by the end of Day 5 in at least 70% of runs, but by Day 3 in under 10%.
  - **Sloppy** passes by Day 7 in most runs.
  - **Good** passes on Day 5 in nearly every run.
  - **Average** can afford its first upgrade on Day 1 or 2 and owns all four by about Day 6.
- **Tuning knobs:**
  - `TRIAL_REPUTATION`, `QUALITY_REP` / `QUALITY_PRICE` (`src/core/economy.ts`);
  - quest rewards (`src/core/quests.ts`);
  - upgrade costs (`src/data/upgrades.ts`);
  - starting Zenny (`newGame`);
  - Argosy base prices;
  - the arrival interval.
- **Afterwards:** check the result once in a real playtest, and record the final numbers in GDD §4.6 and §11.

### 7. Release v0.3.0
- Set `package.json` to `0.3.0`.
- Write the `CHANGELOG.md` 0.3.0 section, absorbing the current "Unreleased" entries (Fruit Ninja board, weapon-free hunters).
- Update `docs/PROGRESS.md` (tick the v0.3 checklist), GDD §9.2 and §9.3 (the next version becomes 0.4) and the README (settings, book, presets, tutorial).
- Commit, push `main`, tag `v0.3.0`, push the tag, watch the deploy, and check the live site.

## Critical files
- **New:**
  - `src/ui/settings.ts`, `src/ui/tutorial.ts`
  - `src/data/tutorial.ts`
  - `src/scenes/SettingsScene.ts`, `src/scenes/BookScene.ts`
  - `src/core/shift.ts`
  - `tests/balance.test.ts`
  - pixel-pack assets under `public/assets/pixel/`
- **Modified:**
  - `src/core/state.ts`, `src/core/economy.ts`, `src/core/cooking.ts`
  - `src/scenes/PrepScene.ts`, `src/scenes/ServiceScene.ts`, `src/scenes/ReportScene.ts`, `src/scenes/TitleScene.ts`, `src/scenes/PreloadScene.ts`
  - `src/scenes/minigames/*`
  - `src/ui/theme.ts`, `src/ui/sfx.ts`, `src/main.ts` (register scenes)
  - docs and `ASSETS_LICENSES.md`
- **Reused:**
  - `badgeIcon`, `iconText`, `panel`, `Button`, `txt` (`src/ui/theme.ts`)
  - `slotsFor` and `platterBuffs` (`src/core/platters.ts`)
  - `togglePlatterIngredient` (`src/core/economy.ts`)
  - `cycleMusicVolume` (`src/ui/music.ts`)
  - the save wipe notice (`src/core/save.ts`, `TitleScene`)

## Verification
1. **`npm test`:** existing tests plus new tests for:
   - favorites (save, load, trimming to slots, locked ingredients);
   - assist windows;
   - `unlockSource`;
   - settings migration from the old audio key;
   - the balance bands.
   - The emoji scan still has to pass.
2. **`npm run build`.**
3. **Playwright at 1920×1080** (scratchpad `playtest.mjs`, extended):
   - fresh save: step through every tutorial tip with screenshots, then Skip on a second fresh save;
   - Settings: Large text screenshots of Prep, Service and Report, checking for overlaps;
   - assist on, then a cook on each station;
   - fullscreen: `game.scale.isFullscreen` after the toggle;
   - Book: every tab;
   - presets: save and load;
   - the new pixel-art Service and stations.
   - Each run must show no console errors, no external requests and about 60 game steps per second.
4. **After the push:** the GitHub Actions deploy passes, and a scripted shift runs on the live URL.

## Research sources
- [Kenney: Roguelike Indoors](https://kenney.nl/assets/roguelike-indoors) (CC0, the primary art pack)
- [Kenney: Tiny Town](https://kenney.nl/assets/tiny-town) and [Kenney: 1-Bit Pack](https://kenney.nl/assets/1-bit-pack) (CC0 fallbacks)
- [OpenGameArt: [LPC] Tavern](https://opengameart.org/content/lpc-tavern) (rejected: CC-BY-SA 3.0)
- [monsterhunterwiki.org: MHWI Canteen](https://monsterhunterwiki.org/wiki/MHWI/Canteen) (Favorite Platters, ingredient slots)
