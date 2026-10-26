# Hunter's Canteen

*Working title.* An unofficial, non-commercial fan game set in the **Monster Hunter** world, built as a 2D restaurant management game.

You are the **Meowscular Chef** running the Canteen in **Astera**, from *Monster Hunter: World*. Research Commission hunters drop in before their quests and order canon Canteen meals. Cook them well and they head out with the right buffs and food skills, come back safe, and bring you gathered items. Every character, dish, ingredient, food skill and monster comes from *World*.

> **Status:** v0.2.0, the *World* canon pass. Code-drawn characters, free-licensed icons, UI, sound and music (see [ASSETS_LICENSES.md](ASSETS_LICENSES.md)).
>
> **Play it in your browser: https://vibecoding3.github.io/mh-restaurant/**
>
> Desktop browsers, English only. The game runs 100% offline in the browser. There is no backend, and progress is saved in `localStorage`.

## How to play

1. **Morning prep.**
   - **The Argosy:** buy ingredients from the Captain. Prices change daily, and three ingredients are fresh each day.
   - **Set Platters:** pick the ingredients for the Meat, Fish and Veggie Platters.
     - Meat gives Attack Up, Fish gives Defense Up and Vegetables give Elemental Res Up.
     - Two ingredients of the same skill group (Courage, Resilience, Vigor, Acumen, Artillery) give a food skill.
     - Fresh ingredients add Health and make the skill more likely to activate.
   - **Menu:** choose which dishes are on today's menu, including the Chef's Choice Platter and the Well-Done Steak.
   - **Delivery requests:** hand items to the Provisions Manager to unlock new ingredients.
   - **Smithy upgrades:** buy canteen improvements from the Second Fleet Master's team.
2. **Service shift (about 2 min).** Click a hunter at the door to seat them. The icon over their head shows what they need for their quest. Their order appears as a ticket on the rail. Click the glowing station (or press `1` `2` `3`) to cook:
   - **Chopping Board:** the ingredients are tossed up over the board. Hold the mouse button and slash through them before they fall, Fruit Ninja style.
   - **BBQ Spit:** hold the mouse button or `Space` to spin the Raw Meat, and release in the gold for a Well-Done Steak.
   - **Grill:** flip each cut when it turns golden, twice. `Space` flips the hottest one.

   When the ticket says READY, click it (or the hunter) to serve. A dish that gives what the hunter needs earns a bigger tip. `Esc` pauses the game.
3. **Quest report.** The Handler shows whether each hunter succeeded, barely made it or got carted.
   - Hunters bring back field items such as Raw Meat, Herbs and Whetfish.
   - Carted hunters come back the next day.
   - Completing "Flying Sparks: Tobi-Kadachi" levels up the Canteen to 4 ingredients per platter.

Goal: reach 80 reputation by Day 5 to pass the Commander's Rank Trial. There is no game over. A missed trial can be retried the next day.

Debug: `?shift=20` shortens a shift to 20 seconds, and `?debug` exposes the game object as `window.game`.

## Planned features

Following the [GDD](docs/GDD.md), the Low Rank is polished first, then High Rank and Master Rank.

- **More Low Rank:**
  - the Soup Pot station;
  - kitchen Palicoes who auto-run stations;
  - Botanical Research and Grimalkyne trades for ingredients;
  - Jagras raids and rush hours;
  - a Handler tutorial.
- **High Rank:**
  - the Oven and Oven Roast;
  - Gathering Hub festivals with the Grand Appreciation Platter;
  - the next Canteen level after "Tickled Pink".
- **Master Rank in Seliana:**
  - the Grammeowster Chef;
  - drinks and drink skills;
  - stews and gratins.
- **Release:** balancing, accessibility and an offline install (PWA).

## Tech stack

| Area      | Choice                                          |
|-----------|-------------------------------------------------|
| Engine    | [Phaser 3](https://phaser.io/) (2D, WebGL/Canvas) |
| Language  | TypeScript                                      |
| Build     | Vite                                            |
| Platform  | Desktop browsers, deployable as a static site; 1920 × 1080 scaled to fit, 60 FPS cap |
| Saves     | Browser `localStorage`                          |

## Documentation

- [Game Design Document](docs/GDD.md): vision, core loop, systems, content and roadmap.
- [v0.2 Implementation Plan](docs/PLAN-v0.2.md): the canon content pass, with the design decisions behind it.
- [Progress report](docs/PROGRESS.md): what is implemented and what is still to come.
- [Changelog](CHANGELOG.md): what changed in each version.
- [Asset licenses](ASSETS_LICENSES.md): every third-party icon, sound, track and font, with author and license.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the pure game logic (src/core)
npm run build    # type-check + production build into dist/
```

Code layout follows the GDD:
- `src/core/` is pure, Phaser-free game logic: platter rules, economy, cooking grades, quest resolution and saves.
- `src/data/` holds the canon content definitions.
- `src/scenes/` holds the Phaser scenes and minigames.
- `src/ui/` holds the theme, audio and music helpers.
- `public/assets/` holds the bundled icons, UI art, sounds, music and fonts.

Every push to `main` runs the tests, builds the game and deploys it to GitHub Pages via `.github/workflows/deploy.yml`.

## Disclaimer

This is a fan project made for fun and is **not for sale**. It has no affiliation with Capcom and is not endorsed by it. *Monster Hunter* and all related names, characters and marks are the property of Capcom Co., Ltd. The project will not distribute ripped game assets: all art, audio and code in this repository are original or openly licensed (CC0, CC BY or SIL OFL; see [ASSETS_LICENSES.md](ASSETS_LICENSES.md)).
