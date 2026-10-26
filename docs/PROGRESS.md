# Hunter's Canteen: Progress Report

> **As of:** 2026-10-26
>
> **Current version:** v0.3.0 (vertical slice), released.
>
> **Play it:** https://vibecoding3.github.io/mh-restaurant/
>
> **Next milestone:** v0.4, the rest of Low Rank (GDD §9.3, §9.5 M4).

This document summarizes what works in the game today and what the [Game Design Document](GDD.md) still plans. Section numbers (§) refer to the GDD.

## Status at a glance

| Area | Status |
|---|---|
| Core daily loop (prep, service, quest report) | Done |
| Canon *World* content (Low Rank, Astera) | Mostly done |
| Cooking stations | 3 of 4 Low Rank stations |
| Canteen rules (platters, buffs, food skills, fresh ingredients) | Done for 2 and 4 slots |
| Economy and progression | Basic version done |
| Kitchen staff, hub facilities, events, VIPs | Not started |
| High Rank, Master Rank and Seliana | Not started |
| Art and audio | First pixel-art pass on the dining hall and stations; free UI, sounds and music |
| Release work (PWA, settings, accessibility) | Settings done (text size, assist, fullscreen); PWA not started |

## Implemented

### Core loop
- **Morning prep:**
  - buy ingredients from the Argosy;
  - set the ingredients of each platter;
  - choose today's menu;
  - complete delivery requests;
  - buy Smithy upgrades;
  - read the Handler's tip of the day.
- **Service shift (about 2 minutes):**
  - Hunters queue at the door. Click one to seat them.
  - The hunter orders a dish from the menu, and a ticket appears on the rail.
  - Click the glowing station, or press `1` `2` `3`, to cook, then click the ticket to serve.
  - Patience hearts drain while the hunter waits.
  - After the closing gong, the shift ends once everyone inside has been served.
- **Quest report:** the Handler reveals each fed hunter's result on flip cards: the odds, whether the food skill activated, and success, barely made it or carted. Below the cards are the rewards and the items hunters brought back.
- **Autosave** at the end of every day, with Continue from the title screen.
- **The Handler's tutorial:** 15 tips on a new game, each shown the first time its moment comes up, with the target highlighted and the shift paused. Skippable, and replayable from Settings.
- **Favorite Platters:** three presets per platter in morning prep.
- **Ingredient Book:** every ingredient with its skill group, stat, unlock source and stock, plus the 15 food skills.

### Dishes and Canteen rules (as in *World*)
- **Five canon dishes:**
  - Meat Platter, Fish Platter and Veggie Platter, whose ingredients you set in morning prep, like *World's* Favorite Platters;
  - Chef's Choice Platter, which uses fresh ingredients first and gives a random stat;
  - Well-Done Steak, from Raw Meat on the BBQ Spit.
- **Stats:** Meat gives Attack Up, Fish gives Defense Up and Vegetables give Elemental Res Up, with (S)/(M)/(L) tiers at 2/4/6 ingredients.
- **Food skills:** 2/4/6 ingredients of one skill group activate that group's first, second or third skill. All 15 group skills have a *World* description and an effect in the quest simulation.
- **Fresh ingredients:**
  - One meat, one fish and one vegetable are fresh each day.
  - Each one in a meal adds +10 Health and half a star to the skill activation rating (1 to 3 stars).
- **Stamina:** +25 from platters, +50 after the Canteen levels up. A Well-Done Steak gives +50.
- **Canteen level-up:** when a hunter completes "Flying Sparks: Tobi-Kadachi", platters go from 2 to 4 ingredient slots.

### Content
- **Ingredients:** 26 canon Canteen ingredients across all five skill groups. 15 are available from Day 1, 9 more unlock through three Provisions Manager deliveries, and the 2 eggs come back with hunters.
- **Field items** that hunters bring back: Raw Meat, Herb, Blue Mushroom, Sushifish, Whetfish, Herbivore Egg and Wyvern Egg. Never monster parts.
- **Monsters:** 8 Low Rank quest targets with *World* star ratings, unlocking over the days: Great Jagras, Kulu-Ya-Ku, Pukei-Pukei, Barroth, Jyuratodus, Tobi-Kadachi, Anjanath and Rathian.
- **Customers:**
  - Unnamed Research Commission hunters, as rookies or veterans.
  - They wear 13 Low Rank armor sets and use the 14 *World* weapon types.
  - They leave their weapons outside the canteen.
- **Cast on screen:** the Meowscular Chef (player), the Handler, the Captain, the Provisions Manager, the Second Fleet Master and the Commander.
- **Smithy upgrades:** Hanging Lanterns, Iron Spit Frame, Canteen Bell and Extra Table.

### Stations (minigames)
- **Chopping Board:** ingredients are tossed into the air. Slash through them with the mouse before they fall (Fruit Ninja style).
- **BBQ Spit:** hold to spin the meat and release in the gold. The results are Burnt Meat, Rare Steak or Well-Done Steak.
- **Grill:** flip each cut when it turns golden, twice.

### Rules and difficulty
- **Low punishment, no game over:**
  - A walkout costs 1 reputation.
  - A burnt dish still pays 70%.
  - Reputation never drops below 0.
  - A carted hunter costs nothing and comes back the next day.
- **Rank Trial:** the Commander checks for 170 reputation on Day 5. If you miss it, the trial repeats each day until passed, then play continues.
- **Balance** is checked by `tests/balance.test.ts`: 200 seeded runs of Days 1–7 for a good, an average and a sloppy player. An average player passes the trial on Day 5 and buys a Smithy upgrade every one or two days.

### Presentation and tech
- **Display:** 1920 × 1080 design resolution, scaled to fit, with a 60 FPS cap. Desktop browsers, English only.
- **No emoji anywhere.** A unit test enforces this.
- **Art:** code-drawn Meowscular Chef and hunters; Kenney's *Roguelike Indoors* pixel art (CC0) for the tables, wall decor, counter, cabinets and stove.
- **Free assets:**
  - **Icons:** game-icons.net.
  - **UI and sound effects:** Kenney.
  - **Music:** four CC0 tracks chosen to feel like *World*.
  - **Fonts:** Cinzel and Alegreya Sans.
- **Screens:** loading screen, title (with the version number), Credits, Settings (sound, music, text size, minigame assist, fullscreen, replay tutorial) and the Ingredient Book. Settings are remembered.
- **Saves:** schema v3. Saves from an older version are wiped, with a notice on the title screen.
- **Development:**
  - 41 unit tests for the game logic, including the balance simulation;
  - a GitHub Actions deploy to GitHub Pages on every push to `main`;
  - `?shift=` and `?debug` URL flags for playtests.

## Yet to be implemented

### Done in v0.3, vertical slice (§9.3, §9.4)
Detailed plan: [PLAN-v0.3.md](PLAN-v0.3.md).

- [x] Handler tutorial on Day 1
- [x] Balancing: the reputation target, upgrade costs, checked by simulation and a bot playtest
- [x] Favorite Platter presets for repeated orders
- [x] Ingredient book: every ingredient with its category, skill group and unlock source, plus the food-skill list (§6)
- [x] Art pass on the dining hall and stations
- [x] Settings screen: text size, minigame assist (wider timing windows) and fullscreen
- [x] Tag a release (v0.3.0) for the changes made since v0.2.0

### Next: rest of Low Rank, v0.4 (§9.5 M4)
- [ ] **Soup Pot** station (Soup Felyne): keep the heat in the green zone and add ingredients on cue (§4.2)
- [ ] **Kitchen staff:** the Oven Felyne and Soup Felyne auto-run stations; Waiter and Forager roles; staff level-ups (§4.7)
- [ ] **Botanical Research** (Chief Botanist): grows vegetables over 1–3 days (§4.5)
- [ ] **Grimalkyne trades** (Lynian Researcher): Lynian items for rare ingredients (§4.5)
- [ ] **Events** (§4.9):
  - [ ] Jagras raids
  - [ ] Rush Hour before the Zorah Magdaros operation
- [ ] **Customer types** (§4.1):
  - [ ] hunting parties served together
  - [ ] VIP regulars from the cast (Field Team Leader, Huntsman, Seeker, Admiral, the Fifth Fleet's Hunter)
  - [ ] Grimalkyne visitors who pay in trade items
- [ ] **More Low Rank monsters:** Paolumu, Legiana, Odogaron, Rathalos and Diablos (§4.10)
- [ ] **Daily food skills** (from *World's* daily pool) and **Vouchers / Gourmet Vouchers** (§4.3)
- [ ] **Light story beats** for Act I with the Handler and the Commander (§2.4)
- [ ] **Poogie** as the canteen mascot (§2.3)
- [ ] **Canteen layout and decor** placed on a grid, with passive bonuses (§4.8)
- [ ] **Astera hub screen** with facility hotspots (§6)

### High Rank: v0.5 (§9.5 M5a)
- [ ] Oven station and Oven Roast (turns surplus into Rations, Nutrients and Lifepowder)
- [ ] Gathering Hub festivals and the Grand Appreciation Platter
- [ ] High Rank monsters: Kirin, Uragaan, Lavasioth, Bazelgeuse and the Elder Dragons
- [ ] Canteen level 3 after "Tickled Pink" (6 ingredient slots; the exact count still needs checking in-game)
- [ ] High Rank Rank Trial and Act II framing

### Master Rank and Seliana: v0.6 (§9.5 M5b)
- [ ] Seliana hub, run by the Grammeowster Chef
- [ ] Drinks Keg station, plus drinks and drink skills (Perception, Fortune, Preparation, Trailblazer)
- [ ] Stew Cauldron and Gratin Oven stations
- [ ] Master Rank monsters and Canteen level 4 after "Investigation: Hoarfrost Reach"

### Release: v1.0 (§9.5 M6)
- [ ] Final balancing
- [ ] Accessibility
- [ ] Offline install (PWA: service worker and manifest)
- [ ] Endless mode with local high scores (§4.10)
- [ ] Final art: chibi pixel art and food animations (steam, sizzle, glisten) (§7)
- [ ] Audio formats other than OGG, so that Safari plays sound
- [ ] Save migrations instead of wiping, once Low Rank is released

## Known issues and open questions
- **Balance:** once all four upgrades are bought (around Day 6), Zenny piles up with nothing to spend it on. Staff, decor and Botanical Research in v0.4 should give it a use. The simulation assumes about 13 hunters a shift on Day 1; a bot that cooks perfectly serves all of them.
- **Art:** the pixel-art props are drawn in a top-down 3/4 view, while the characters are side-view. The pack has no wooden floor or wall tiles, so those stay code-drawn ship timber, and no spit, so the BBQ Spit stays code-drawn.
- **Food skills:** Felyne Moxie and Felyne Heroics need 6 ingredients of one group, so they can't appear in Low Rank (2 or 4 slots).
- **Weapons:** customers no longer show weapons, but each hunter still has a weapon type. It appears on report cards and affects some food skills (for example Felyne Sharpshooter for bowguns and the Bow). Whether to keep it is undecided.
- **Meowscular Chef design:** his look (tall hat, red scarf, cleaver) has not been checked against his in-game design.
- **Sizzle:** the BBQ Spit uses a pitched-up pot sound, because the free packs have no real sizzle.
- **Keyboard:** the Chopping Board can only be played with the mouse.
