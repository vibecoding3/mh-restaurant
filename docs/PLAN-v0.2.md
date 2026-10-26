# Hunter's Canteen: v0.2 Implementation Plan

> **Status:** approved plan, not yet implemented. Written 2026-10-26.
> To resume: *"Implement the v0.2 plan in `docs/PLAN-v0.2.md`."*

## Decisions from the design Q&A

| # | Topic | Decision |
|---|---|---|
| 1 | Orders | Hunters order **pre-made dishes**. Players don't pick ingredients during service. |
| 2 | Interaction | **Point-and-click** (Diner Dash style). Not Overcooked style. |
| 3 | Difficulty | **Low punishment.** No game over. |
| 4 | Scope | Polish **Low Rank** as much as possible before starting High Rank or Master Rank. |
| 5 | Numbers | Invent gameplay numbers, but keep them **realistic**. |
| 6 | Returns | No monster parts in dishes. Hunters bring back **real gathered or carved items** using names from the game. |
| 7 | Canon | **Reference the game as much as possible and invent as little as possible.** Stay true to Monster Hunter: World. |
| 8 | Assets | **Free assets** for now. **No emoji** in the game. |
| 9 | Language | **English only**, permanently. |
| 10 | Music | Music **inspired by Monster Hunter: World** (original or free-licensed, not the game's own tracks). |
| 11 | Platform | **Desktop only** for now. Ignore mobile. |
| 12 | PWA | Offline install waits until **release**. |
| 13 | Workflow | **Push straight to `main`.** |
| 14 | Saves | Wiping saves is fine until the full Low Rank release. |
| 15 | Platters | Each platter's ingredients are **set in morning prep**, like World's "Favorite Platters". |
| 16 | Characters | Keep **code-drawn characters, improved**. Use free packs for everything else. |

## Context
Prototype v0.1.0 (tag `v0.1.0`, live on GitHub Pages) works, but it uses invented content: Embervale, Kiln and Hilde, made-up dishes, Great Jaggi instead of Great Jagras, and emoji icons. It also runs at 960×540 with no FPS cap.

The user's answers set the direction:
- Dishes are **pre-made and canon**. Interaction stays **point-and-click**, with **low punishment**.
- Focus is a **polished Low Rank** in Astera.
- Gameplay numbers may be invented if realistic. Hunters bring back **real gathered or carved items**, never monster parts.
- **As many World references as possible, inventing as little as possible.**
- **Free assets and no emoji.** Music should be **inspired by World**.
- **English only**, **desktop only**, PWA at release, push straight to `main`, and saves wipe freely until the Low Rank release.
- Platter contents are **set in morning prep**. Characters stay **code-drawn, but improved**.

v0.2 delivers all of that and updates the GDD and README to match.

## Canon content (researched, Monster Hunter World)
- **Menu (pre-made dishes):** Meat Platter, Fish Platter, Veggie Platter and Chef's Choice Platter (all real Canteen meals), plus **Well-Done Steak** from the BBQ Spit. Rare Steak and Burnt Meat are the real failed outcomes of the spit.
- **Buffs:**
  - Meat → Attack Up, Fish → Defense Up, Veggies → Elemental Res Up. Tiers (S/M/L) at 2/4/6 ingredients.
  - Fresh ingredients give +10 Health and +½★ skill chance each. Stamina is capped at +50.
  - Food skills come from the ingredient groups (Courage, Resilience, Vigor, Acumen, Artillery). The tables are already in GDD Appendix A.
  - Well-Done Steak gives +50 max Stamina.
- **Ingredients:** the real Canteen list (GDD A.2), bought from the Argosy (the Captain) and unlocked through Provisions Manager delivery requests.
- **What hunters bring back:** only real field items: **Raw Meat** (carved from Aptonoth/Apceros, used for the BBQ Spit), plus gathered **Herb, Blue Mushroom** and **Sushifish/Whetfish** (sold for Zenny or feeding later Oven Roast). Herbivore Egg and Wyvern Egg are both Canteen ingredients and carry items in World; exact spellings get re-checked at implementation.
- **Low Rank monsters:** Great Jagras, Kulu-Ya-Ku, Pukei-Pukei, Barroth, Jyuratodus, Tobi-Kadachi, Anjanath, Rathian, unlocking over the days. "Flying Sparks: Tobi-Kadachi" (3★) triggers the Canteen level-up from 2 to 4 ingredient slots, as in World.
- **Cast on screen:**
  - The player is the **Meowscular Chef**.
  - **The Handler** presents the quest report and the tutorial tips (replacing Hilde and Kiln).
  - **The Captain** runs the trader panel, the **Provisions Manager** posts delivery requests, and the **Second Fleet Master** sells Smithy upgrades.
  - The **Commander** sets the Rank Trial.
  - Customers are unnamed **Research Commission hunters**, shown in canon armor sets (Leather, Chainmail, Jagras, Kulu, Pukei and so on).
  - No invented hunter names; customers get labels like "Jagras-armor hunter".

## Implementation

### 1. Data (`src/data/`): rewrite as canon
- `ingredients.ts`: a canteen ingredient subset covering every group across Meat, Fish and Veggie (realistic Argosy prices), plus field items (Raw Meat, Herb, Blue Mushroom, Sushifish, Whetfish). New fields: `category` (meat/fish/veg/field), `group` (Courage, Resilience and so on), `source` note.
- `recipes.ts` → `dishes.ts`: the five canon dishes, each with stations and a base price anchored to World's 150 z meal cost.
  - Platters: Chopping Board → Grill.
  - Well-Done Steak: BBQ Spit.
  - Chef's Choice: Chopping Board only. Fast, uses fresh ingredients, random stat.
- `monsters.ts`: the 8 Low Rank monsters with star ratings, threat weights (Rathian: Elemental Res; Anjanath and Barroth: Defense; Great Jagras: Attack), locale, `minDay`, and a field-item return table.
- `cast.ts` (new): canon NPC names and roles used in UI text.
- `hunters.ts`: replace the names and colors with canon armor sets (with palette) and the 14 World weapon types.
- `upgrades.ts`: rename upgrades as Smithy/Canteen upgrades in World terms, keeping the mechanics.
- `food-skills.ts` (new): the skill table per group, and the subset used in Low Rank with its quest-simulation effect (Moxie: cart becomes "barely"; Heroics: bonus vs high stars; Carver (Hi) lookalike via Perception is not in Low Rank).
- `stations.ts`: drop the emoji icons in favor of texture keys.

### 2. Core logic (`src/core/`): extend, reusing what exists
- `platters.ts` (new): `platterBuffs(ingredients, fresh)` returns {attack/defense/elemRes tier, health, stamina, skill + activation chance}, following the GDD A.1 rules.
- `state.ts`:
  - Add `platters` (the prep-chosen ingredient ids per platter), `canteenLevel`, `fresh` (daily rotation), `deliveries` and `fieldItems`.
  - Reuse `rollPrices` in `economy.ts` for the Argosy, and roll the fresh set alongside it in `advanceDay`.
  - Clamp reputation at 0 or above.
- `economy.ts`:
  - Keep `portions`, `consumeIngredients`, `dishPayment` and `chooseOrder`, adapting them to dishes whose ingredients come from `state.platters`.
  - **Low punishment:** a walkout costs −1★ and no Zenny, a Burnt dish still pays 70%, and reputation never drops below 0.
- `quests.ts`:
  - Keep the `questChance` / `resolveQuest` structure.
  - Inputs change to stat tiers, Health and Stamina, and food skills.
  - **A cart costs no reputation**; the hunter just returns next day.
  - Successful hunts return field items from the monster's table, not monster parts.
- `cooking.ts`: unchanged (the grades already map to Burnt/Rare/Well-done, and the spit outcomes get named Burnt Meat / Rare Steak / Well-Done Steak).
- `save.ts`: bump `SAVE_VERSION` to 2 and store `gameVersion`. If a save doesn't match, wipe it and show a "New version, save reset" notice on the title screen (the user approved wiping).

### 3. Display, assets and audio
- **1920×1080 at 60 FPS:**
  - `src/main.ts`: `width: 1920, height: 1080`, `fps: { target: 60, limit: 60 }`, `Scale.FIT` with centering.
  - `src/ui/theme.ts`: set `W`/`H` to 1920/1080.
  - Re-lay out every scene for 1080p, roughly 2× the current coordinates and font sizes, with layout constants per scene.
- **No emoji anywhere:** replace every emoji and decorative symbol (♥ ★ ✔ ▶ ☑) with sprite icons. Add a unit test that scans `src/` for emoji/pictograph code points and fails if it finds any.
- **Free assets** in `public/assets/`, each with a recorded license:
  - **UI:** Kenney "UI Pack – RPG Expansion" (CC0) for wood and parchment panels and buttons.
  - **Icons:** game-icons.net SVGs (CC BY 3.0) for meat, fish, vegetable, knife, fire, shield, sword, heart, star, coin and cat.
  - **Food:** a CC0 pixel food pack from OpenGameArt or itch.io.
  - **Fonts:** Google Fonts under the OFL, bundled locally for offline play. A serif for titles in the spirit of World's UI, plus a readable sans-serif.
  - **Sound effects:** Kenney audio packs (CC0), replacing the synthesized ones in `src/ui/sfx.ts` (the API stays the same, now backed by loaded audio).
  - Each pack's license gets verified when it is downloaded. Anything not CC0, CC-BY or OFL is rejected.
- **Music "inspired by World"** (`src/ui/music.ts`, new): CC0/CC-BY orchestral and folk tracks from OpenGameArt, chosen to match World's feel:
  - a warm orchestral town theme for Title and Prep (in the spirit of Astera's theme);
  - an upbeat folk track for Service;
  - a short fanfare for the Report;
  - the BBQ Spit gets a short "cooking song" loop.

  No music from the original game is used. Volume and mute are remembered per player.
- **Credits screen** in a new `CreditsScene`, plus an `ASSETS_LICENSES.md` listing every asset, author, license and URL.
- **Characters** in `drawHunter` / `drawPalico` (`src/ui/theme.ts`): richer code-drawn art. The Palico chef gets a proper Meowscular Chef look (big hat, scarf, cleaver). Hunters get canon armor-set color palettes and weapon silhouettes.
- A **`Preload` scene** (new) loads the assets, with a loading bar.

### 4. Scenes (`src/scenes/`)
- **TitleScene:** canon title text, version label from `__APP_VERSION__`, the save-reset notice, and Credits.
- **PrepScene:**
  - **The Argosy** (the Captain) shows prices and buying.
  - **Set Platters:** for each of Meat/Fish/Veggie Platter, choose stocked ingredients for the current slots (2 at Canteen level 1). It shows the resulting buffs and skill live, using `platterBuffs`, and highlights today's fresh ingredients.
  - **Menu**, **Provisions Manager deliveries** and **Smithy** upgrades.
  - The Handler's tip of the day.
- **ServiceScene:**
  - Same flow and code structure as now (seat → ticket → station → serve).
  - Tickets show the dish name, a dish icon and the hunter's need (stat icon from the monster's threat).
  - Customers appear as armor-set hunters.
  - Patience is more generous, and walkouts carry only the small penalty above.
- **Minigames:** keep `SpitGame`, `BoardGame` and `GrillGame`, re-laid out for 1080p with sprite art. The grill becomes a generic "Grill" (searing cuts, not skewers). The spit's result label names Rare Steak / Well-Done Steak / Burnt Meat.
- **ReportScene:** the Handler presents. Cards show the armor-set hunter, monster and stars, dish, buffs, odds and outcome. Rewards are field items and delivery progress.
- **Rank Trial:** on Day 5, the Commander checks reputation. Failing just allows a retry the next day; there is no game over.

### 5. Versioning and docs
- Set `package.json` `version` to `0.2.0`. Vite `define` injects `__APP_VERSION__`.
- Add `CHANGELOG.md` with entries for 0.1.0 and 0.2.0.
- `docs/GDD.md`: record the decisions. Pre-made canon dishes plus prep-set platters (replacing Custom Platter in §4.3), low punishment, field-item returns, desktop-only and English-only, PWA at release, free assets and music policy, no emoji. Bump it to document version 0.3.
- `README.md`: update the setting, how to play, controls and credits link.
- After the work, push to `main`, then tag `v0.2.0` and push the tag.

## Verification
1. `npm test`: existing tests rewritten for canon data, plus new tests for `platterBuffs` (tiers at 2/4/6, fresh bonuses, skill chance), low-punishment clamps (reputation ≥ 0, carts cost no reputation), field-item returns, save wipe on a version mismatch, and the no-emoji scan of `src/`.
2. `npm run build` (type check plus Vite build).
3. Scripted Chrome playtest (reusing the playwright-core scripts in the scratchpad) at a **1920×1080 viewport** with `?shift=20`: title → prep (set a platter) → service (seat, cook on all three stations, serve) → report → Day 2 → Continue. Capture screenshots and review each one for layout, missing textures and leftover emoji. Check that there are no console errors and no network requests other than same-origin assets (offline check).
4. FPS cap: with `?debug`, expose the game object and confirm `game.loop.actualFps` reads about 60 or less.
5. After the push, watch the GitHub Actions run, then load the live Pages URL and play a shift.

## Research sources
- [Fextralife: Canteen](https://monsterhunterworld.wiki.fextralife.com/Canteen)
- [Fextralife: Chef's Choice Platter](https://monsterhunterworld.wiki.fextralife.com/Chef's+Choice+Platter)
- [Fextralife: Meat Platter](https://monsterhunterworld.wiki.fextralife.com/Meat+Platter)
- [Fextralife: Raw Meat](https://monsterhunterworld.wiki.fextralife.com/Raw+Meat)
- [Fextralife: Well-Done Steak](https://monsterhunterworld.wiki.fextralife.com/Well-Done+Steak)
- [Fextralife: Astera](https://monsterhunterworld.wiki.fextralife.com/Astera)
- [Fextralife: Seliana](https://monsterhunterworld.wiki.fextralife.com/Seliana)
- [monsterhunterwiki.org: MHWI Canteen](https://monsterhunterwiki.org/wiki/MHWI/Canteen)
- [monsterhunterwiki.org: The Grammeowster Chef](https://monsterhunterwiki.org/wiki/The_Grammeowster_Chef)
- [GamersDecide: MHW best food](https://gamersdecide.com/articles/mhw-best-food)
- [Steam discussion: canteen buffs](https://steamcommunity.com/app/582010/discussions/0/2521353993637599150)
- [Steam discussion: Oven Roast](https://steamcommunity.com/app/582010/discussions/0/1735462352481152733)
- [SegmentNext: MHW fishing guide](https://segmentnext.com/2018/01/30/monster-hunter-world-fishing)
