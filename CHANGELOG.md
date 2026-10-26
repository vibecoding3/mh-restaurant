# Changelog

All notable changes to Hunter's Canteen. The project follows [Semantic Versioning](https://semver.org); see GDD §9.1.

## Unreleased

- **Chopping Board is now a slicing minigame, Fruit Ninja style.**
  - Six ingredients from the dish are tossed up over the board.
  - Hold the mouse button and slash through them before they fall.
  - Missing none is Well-done, missing 1 or 2 is Rare, and missing 3 or more is Burnt.

## 0.2.0: Monster Hunter: World canon pass (2026-10-26)

### Content
- All invented content is gone. The game is set in **Astera** and you play the **Meowscular Chef**.
- **Menu:** five pre-made canon dishes: Meat Platter, Fish Platter, Veggie Platter, Chef's Choice Platter and Well-Done Steak.
- **Canteen rules from World:**
  - Meat gives Attack Up, Fish gives Defense Up, Vegetables give Elemental Res Up, with (S)/(M)/(L) tiers at 2/4/6 ingredients.
  - Two ingredients of one skill group give that group's food skill.
  - Each fresh ingredient adds +10 Health and half a star to the skill activation rating.
  - Stamina is up to +50.
- **Ingredients:**
  - 26 real Canteen ingredients across all five skill groups, bought from **the Argosy**.
  - New ingredients unlock through **Provisions Manager** delivery requests.
- **Platters are set in morning prep**, like World's Favorite Platters, with a live preview of buffs and skills.
- **Low Rank quests:** Great Jagras, Kulu-Ya-Ku, Pukei-Pukei, Barroth, Jyuratodus, Tobi-Kadachi, Anjanath and Rathian, with World star ratings.
  - Completing "Flying Sparks: Tobi-Kadachi" levels up the Canteen to 4 ingredients per platter.
- **Field items:** hunters bring back only real gathered or carved items (Raw Meat, Herb, Blue Mushroom, Sushifish, Whetfish, Herbivore Egg, Wyvern Egg), never monster parts.
- **Food skills:** 15 food skills, each with its World description and an effect in the quest simulation.
- **Customers:** unnamed Research Commission hunters in Low Rank armor sets (Leather, Chainmail, Jagras, Kulu, Pukei and more), using the 14 weapon types.
- **Cast:** the Handler presents the quest report and tips, and the Commander runs the Rank Trial.

### Gameplay
- **Low punishment, no game over:**
  - A walkout costs 1 reputation and no Zenny.
  - A burnt dish still pays 70%.
  - Reputation never drops below 0.
  - A cart costs nothing: the hunter comes back the next day for a better meal.
- **Rank Trial:** checked on Day 5 at 80 reputation, and it repeats daily until passed.
- More patient hunters.
- The Skewer Grill is now a generic **Grill**.
- The BBQ Spit names its real outcomes: Burnt Meat, Rare Steak and Well-Done Steak.

### Presentation
- **1920 × 1080** design resolution, scaled to fit, with a **60 FPS cap**.
- **No emoji anywhere.** Icons come from game-icons.net, panels and buttons from Kenney's UI pack, and fonts are Cinzel and Alegreya Sans, bundled for offline play.
- Sound effects come from Kenney's CC0 audio packs. Music is CC0 tracks chosen to feel like World: a town theme, a tavern song for service, a cooking song for the BBQ Spit and a report fanfare. Mute and music volume are remembered.
- The code-drawn Meowscular Chef and hunters were redrawn: a chef's hat, scarf and cleaver; armor-set colors; weapon silhouettes.
- New loading screen, Credits screen and `ASSETS_LICENSES.md`.
- The version number shows on the title screen.

### Technical
- **Saves:** the schema is now version 2, and saves store the game version. Older saves are wiped, with a notice on the title screen.
- **New tests:**
  - platter rules;
  - low-punishment clamps;
  - field-item returns;
  - save wipe;
  - a scan that fails if `src/` contains emoji.
- `?debug` exposes the game object for playtests.

## 0.1.0: Prototype (2026-10-26)

- Playable greybox core loop: morning prep, service shift, three minigames (Chopping Board, BBQ Spit, Skewer Grill), quest report, upgrades, `localStorage` saves and GitHub Pages deploy.
- Placeholder content that was not yet canon.
