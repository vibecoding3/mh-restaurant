# Hunter's Canteen

*Working title.* An unofficial, non-commercial fan game set in the **Monster Hunter** world, built as a 2D restaurant management game.

You play a Palico chef who has just taken over a run-down canteen in a hunting village. Hunters come in before their quests and order hearty meals. Cook them well and the hunters set out with better buffs, come back alive, and bring you rare monster ingredients. Cook them badly and they get carted, so your reputation suffers.

> **Status:** pre-production. Only the design documents exist so far. No playable build yet.

## Planned features

- **Fast-paced service shifts.** Seat hunters, take orders, cook, plate and serve before their patience runs out.
- **Cooking minigames.** Spin the meat on the BBQ spit (*"So tasty!"*), flip skewers on the grill, and simmer hotpots without burning them.
- **Meals that matter.** Each dish gives the hunter buffs (Attack, Defense, Health, Stamina, plus skills such as Felyne Heroics). The buffs change their odds on the quest, and you see the result when they return.
- **Ingredient economy.** Buy staples from the village trader, send Palico gathering teams out on expeditions, and trade monster parts for rare produce.
- **Restaurant growth.** Upgrade stations, hire and train Palico staff, unlock tables, and decorate with monster trophies.
- **Village events.** Festivals, rush hours, and the occasional monster crashing into the dining hall.
- **Progression across regions.** Move from Low Rank to High Rank to Master Rank menus, each with new hunters, monsters and recipes.

## Tech stack (planned)

| Area      | Choice                                          |
|-----------|-------------------------------------------------|
| Engine    | [Phaser 3](https://phaser.io/) (2D, WebGL/Canvas) |
| Language  | TypeScript                                      |
| Build     | Vite                                            |
| Platform  | Desktop and mobile browsers, deployable as a static site |
| Saves     | Browser `localStorage`                          |

## Documentation

- [Game Design Document](docs/GDD.md): vision, core loop, systems, content and roadmap.

## Getting started

The project has no code yet. Once the scaffold is in place:

```bash
npm install
npm run dev      # local dev server
npm run build    # production build into dist/
```

## Disclaimer

This is a fan project made for fun and is **not for sale**. It has no affiliation with Capcom and is not endorsed by it. *Monster Hunter* and all related names, characters and marks are the property of Capcom Co., Ltd. The project will not distribute ripped game assets: all art, audio and code in this repository are original or properly licensed.
