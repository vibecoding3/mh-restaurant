# Hunter's Canteen

*Working title.* An unofficial, non-commercial fan game set in the **Monster Hunter** world, built as a 2D restaurant management game.

You play a Palico chef who has just taken over a run-down canteen in a hunting village. Hunters come in before their quests and order hearty meals. Cook them well and the hunters set out with better buffs, come back alive, and bring you rare monster ingredients. Cook them badly and they get carted, so your reputation suffers.

> **Status:** playable prototype (M1/M2). Greybox art drawn in code, synthesized sound effects.
>
> **▶ Play it in your browser: https://vibecoding3.github.io/mh-restaurant/**
>
> The game runs 100% offline in the browser. There is no backend; progress is saved in `localStorage`.

## How to play the prototype

1. **Morning prep.** Buy ingredients from Bartholo (prices change daily), pick up to 4 dishes for the menu, and buy upgrades.
2. **Service shift (about 2 min).** Tap a hunter at the door to seat them. Their order appears as a ticket above their table. Tap the glowing station (or press `1` `2` `3`) to cook:
   - **Chopping Board:** tap the ingredients in numbered order before the timer runs out.
   - **BBQ Spit:** hold the mouse, a finger or `Space` to spin the meat, and release in the golden zone.
   - **Skewer Grill:** flip each skewer when it turns golden, twice. `Space` flips the hottest one.

   When the ticket says READY, tap it (or the hunter) to serve. Each hunter wants a buff (the badge by their hearts); matching it earns bonus tips. `Esc` pauses the game.
3. **Quest report.** See whether each fed hunter succeeded, barely made it or got carted. Successful hunters bring back monster materials that unlock the best recipes.

Goal: reach ⭐60 reputation by the end of Day 5 to pass the Rank Trial. After that, the game continues in endless mode.

Debug: add `?shift=20` to the URL to shorten a shift to 20 seconds.

## Planned features

- **Fast-paced service shifts.** Seat hunters, take orders, cook, plate and serve before their patience runs out.
- **Cooking minigames.** Spin the meat on the BBQ spit (*"So tasty!"*), flip skewers on the grill, and simmer hotpots without burning them.
- **Meals that matter.** Each dish gives the hunter buffs (Attack, Defense, Health, Stamina, plus skills such as Felyne Heroics). The buffs change their odds on the quest, and you see the result when they return.
- **Ingredient economy.** Buy staples from the village trader, send Palico gathering teams out on expeditions, and trade monster parts for rare produce.
- **Restaurant growth.** Upgrade stations, hire and train Palico staff, unlock tables, and decorate with monster trophies.
- **Village events.** Festivals, rush hours, and the occasional monster crashing into the dining hall.
- **Progression across regions.** Move from Low Rank to High Rank to Master Rank menus, each with new hunters, monsters and recipes.

## Tech stack

| Area      | Choice                                          |
|-----------|-------------------------------------------------|
| Engine    | [Phaser 3](https://phaser.io/) (2D, WebGL/Canvas) |
| Language  | TypeScript                                      |
| Build     | Vite                                            |
| Platform  | Desktop and mobile browsers, deployable as a static site |
| Saves     | Browser `localStorage`                          |

## Documentation

- [Game Design Document](docs/GDD.md): vision, core loop, systems, content and roadmap.
- [v0.2 Implementation Plan](docs/PLAN-v0.2.md): the next version (canon content pass), with the design decisions behind it.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests for the pure game logic (src/core)
npm run build    # type-check + production build into dist/
```

Code layout follows the GDD: `src/core/` is pure, Phaser-free game logic (economy, cooking grades, quest resolution, save); `src/data/` holds the content definitions; `src/scenes/` holds the Phaser scenes and minigames.

Every push to `main` runs the tests, builds the game and deploys it to GitHub Pages via `.github/workflows/deploy.yml`.

## Disclaimer

This is a fan project made for fun and is **not for sale**. It has no affiliation with Capcom and is not endorsed by it. *Monster Hunter* and all related names, characters and marks are the property of Capcom Co., Ltd. The project will not distribute ripped game assets: all art, audio and code in this repository are original or properly licensed.
