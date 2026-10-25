# Hunter's Canteen: Game Design Document

| | |
|---|---|
| **Version** | 0.1 (first draft) |
| **Date** | 2026-10-26 |
| **Genre** | 2D restaurant management / time management |
| **Platform** | Web browser (desktop first, mobile-friendly) |
| **Engine** | Phaser 3 + TypeScript + Vite |
| **Session length** | 4–6 min per service shift; 20–40 min per sitting |
| **Status** | Unofficial, non-commercial Monster Hunter fan game |

---

## 1. Vision

### 1.1 Elevator pitch
*Overcooked* meets *Diner Dash* in the Monster Hunter world. You are a Palico chef running the canteen of a hunting village. Every meal you serve goes out on a hunt with the hunter who ate it. Good food means successful quests and rare monster ingredients. Bad food means carted hunters and an empty dining hall.

### 1.2 Design pillars
1. **Cooking feels like hunting.** Every station is a tactile, timing-based minigame. Pulling a perfect *"So tasty!"* steak should feel as satisfying as landing a big sword charge.
2. **Your food has consequences.** Meals give buffs, and the buffs change quest outcomes. The player always sees the link between the kitchen and the hunt.
3. **The monster ecosystem is your pantry.** Ingredients come from the monsters hunters bring back. Better cooking leads to harder hunts, which bring rarer ingredients, which make better dishes.
4. **Cozy chaos.** Service shifts are frantic. The time between shifts is relaxed: planning, decorating and chatting with regulars.

### 1.3 Target audience
- Monster Hunter fans who enjoy the canteen scenes and Palico culture.
- Casual and mid-core players of time-management games (*Diner Dash*, *Cook Serve Delicious*, *Overcooked*).

---

## 2. Setting and tone

- **Location:** **Embervale**, a small hunting village on a frontier hub. It sits at the edge of a forest, a volcanic ridge and a frozen tundra. Each biome unlocks over time.
- **Protagonist:** a young Palico chef (player-named) who inherits the village's crumbling canteen from a retired Meowscular Chef. The old chef stays on as a mentor and tutorial NPC.
- **Tone:** warm, comedic and food-obsessed. Palicos speak in cat puns. Hunters are hungry, loud and dramatic. Monsters are scary out in the field but sometimes funny when they wander into town.
- **Supporting cast (original characters):**
  - **Grandmeowster Kiln:** the retired chef. Gives tips and teaches recipes.
  - **Hilde:** the Guild quest handler. Reports quest outcomes after each shift.
  - **Bartholo:** the village trader. Sells staple ingredients, and his prices change from day to day.
  - **Regular hunters:** a recurring cast, each with a favorite weapon, food preferences and a personal storyline.

---

## 3. Core loop

### 3.1 Moment-to-moment (service shift, ~5 min)
```
Hunter arrives → seat them → take order → cook at station(s) → plate → serve
      ↑                                                             ↓
      └──────────── tip + satisfaction ← hunter eats & leaves ←─────┘
```

### 3.2 Daily loop
1. **Morning prep:** check stock, buy ingredients, choose today's menu (up to N dishes), assign Palico staff to stations.
2. **Service shift:** cook and serve until the gong.
3. **Quest report:** Hilde reports how each fed hunter did on their quest, with success or failure based on their buffs. Successful hunters return monster materials.
4. **Evening:** spend Zenny, upgrade, decorate, send gathering expeditions, read letters and story beats.

### 3.3 Meta loop
Earn **Canteen Reputation** to reach new **Hunter Ranks** (Low, High, then Master). Each rank unlocks harder monsters, so hunters need stronger buffs, which call for new recipes and rarer ingredients.

---

## 4. Gameplay systems

### 4.1 Customers (hunters)
| Attribute | Description |
|---|---|
| **Patience** | Hearts that drain while the hunter waits. A hunter whose patience runs out leaves angry, which costs reputation. |
| **Order** | One dish from the active menu, sometimes with a modifier (extra spicy, no mushrooms). |
| **Quest** | Each hunter is heading to a quest against a named monster with a difficulty in stars. |
| **Buff wish** | Shown as an icon, e.g. "needs Fire Res" for a Rathalos quest. Matching it gives bonus satisfaction. |
| **Weapon class** | Cosmetic, plus small preferences (Great Sword users like big portions, Insect Glaive users like fruit). |

Customer types:
- **Rookie hunter:** patient, simple orders, small tips.
- **Veteran hunter:** impatient, complex orders, big tips.
- **Hunting party (2–4):** must be served together. Gives a group bonus.
- **Guild VIP / critic:** one per day at most, with a large reputation swing either way.
- **Wandering Palico or Lynian:** pays in odd items instead of Zenny.

### 4.2 Stations and cooking minigames
Each station is a short skill check. Quality is graded **Burnt / Rare / Well-done ("So tasty!")**. Better quality gives stronger buffs and bigger tips.

| Station | Minigame | Unlock |
|---|---|---|
| **BBQ Spit** | Hold to spin the meat and release in the golden window. The window gets narrower at higher ranks. | Start |
| **Chopping Board** | Tap or swipe the ingredients in sequence. | Start |
| **Skewer Grill** | Several skewers at once. Flip each one when it changes color. | Day 3 |
| **Hotpot / Stew Cauldron** | Keep the heat gauge in the green zone and add ingredients on cue. | Day 5 |
| **Fryer** | Drop ingredients in and pull them out on the beat (rhythm mechanic). | Low Rank 3 |
| **Bakery Oven** | Set it and forget it, but it can burn if left alone. | High Rank |
| **Drink Barrel** | Mix drinks by pouring ratios. | High Rank |

Assigned Palico staff can **auto-run** a station at a fixed quality. This frees the player to focus elsewhere.

### 4.3 Recipes and meals
- A **recipe** is a list of ingredients plus a sequence of stations, e.g. *Wyvern Steak = Raw Meat → BBQ Spit → Plate*.
- Recipes are discovered through the mentor, letters from hunters, experiments (combining ingredients freely) and rank rewards.
- Every dish has **buffs** and a **base price**.

Sample recipes (initial set):

| Dish | Ingredients | Stations | Buffs |
|---|---|---|---|
| Well-Done Steak | Raw Meat | BBQ Spit | Health +20 |
| Kokoto Skewers | Kelbi Meat, Herb | Board → Grill | Stamina +25 |
| Popo Tongue Stew | Popo Tongue, Tundra Root | Board → Cauldron | Cold Res +10, Health +30 |
| Rathian Fire Wings | Wyvern Meat, Firecell Pepper | Board → Fryer | Attack +10, Fire Res +5 |
| Mega Hunter Platter | Prime Meat, Royal Cheese, Gourmet Fish | Spit + Grill + Cauldron | Attack +15, Def +15, Felyne Heroics |

### 4.4 Buffs and quest resolution
- Each quest has a **threat profile**: base difficulty plus elemental and status demands, e.g. Rathalos = high difficulty, needs Fire Res.
- After the shift, each fed hunter's success chance is:
  `base_skill + Σ(buff value × relevance to quest) + dish quality bonus`
- **Outcomes:**
  - *Success:* the hunter returns monster parts (ingredients), a Zenny bonus and reputation.
  - *Barely made it:* the hunter returns partial materials.
  - *Carted:* no materials, a small reputation loss, and the hunter comes back next day demanding a better meal.
- Food skills (from combos and rare dishes) work as cheat-death or bonus mechanics, e.g. **Felyne Heroics**, **Felyne Carver** (+1 material) and **Felyne Moxie**.

### 4.5 Ingredients and inventory
- **Categories:** Meat, Fish, Grain, Vegetable, Dairy, Drink, Spice/Herb, Monster Part.
- **Freshness:** perishable items lose a tier after N days unless kept in an upgraded **Cold Storage**.
- **Sources:**
  1. **Trader Bartholo:** staples at fluctuating prices.
  2. **Quest returns:** monster parts from successful hunters.
  3. **Palico gathering expeditions:** send a team to a biome for 1–3 days to bring back biome-specific produce. Risky biomes give better loot and carry a chance of injury.
  4. **Village farm (later):** grow herbs, mushrooms and honey.

### 4.6 Economy
- **Currency:** Zenny. **Reputation** is a separate meta-currency used for unlocks.
- **Income:** dish price × quality multiplier + tips (scaled by patience left) + quest bonuses.
- **Expenses:** ingredients, staff wages (paid in fish), upgrades, decor and repairs after monster events.
- Target pacing: the player can afford one meaningful upgrade every 1–2 days.

### 4.7 Palico staff
- Hire them from the village board. Each Palico has **traits** (Fast Paws, Fireproof, Clumsy, Charmer) and a **level**.
- Roles: **Chef** (auto-runs a station), **Waiter** (auto-serves or auto-seats), **Gatherer** (goes on expeditions).
- They level up through work, and can be dressed in cosmetic gear.

### 4.8 Restaurant layout and decor
- Grid-based dining hall. Place tables, stations and decor in the evening phase.
- Decor (monster trophies, banners, lanterns) gives passive bonuses, e.g. +patience or bigger tips from fans of a given monster.
- The canteen expands in stages as reputation grows: Shack → Tavern → Grand Canteen.

### 4.9 Events
- **Rush Hour:** a big wave of hunters before an Urgent Quest.
- **Monster Incursion:** a small monster (Jaggi, Kelbi, Bnahabra swarm) or, rarely, a large one wanders into the canteen during service. Drive it off with a minigame (throw pots, use the Palico gong) before it wrecks stations.
- **Festivals:** seasonal themed menus with cosmetic rewards.
- **Critic Visit:** a Guild food critic whose review swings reputation.

### 4.10 Progression
| Rank | Region focus | Example monsters (quest targets / ingredient sources) | New mechanics |
|---|---|---|---|
| **Low Rank** | Forest & grassland | Great Jaggi, Kulu-Ya-Ku, Rathian | Basic stations, staff hiring |
| **High Rank** | Volcano & desert | Rathalos, Diablos, Barroth | Elemental resist demands, fryer, oven, cold storage |
| **Master Rank** | Tundra & ancient forest | Tigrex, Nargacuga, Zinogre | Multi-buff orders, VIP chains, large incursions |
| **Endgame** | — | Elder Dragon "Urgent Banquet" events | Endless mode, leaderboards (local) |

Promotion needs a **Rank Trial**: a special shift with a target score and a story quest.

---

## 5. Controls

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Select hunter / dish / station | Click / tap | Number keys 1–9 to pick a station |
| Move item | Drag and drop | — |
| Station minigame | Hold / release / tap, depending on station | Space |
| Pause | Button | Esc |

The game must be fully playable with one input method (mouse or touch). The keyboard is an optional accelerator.

---

## 6. UI and screens

1. **Title screen:** New Game, Continue, Settings, Credits.
2. **Village hub (evening):** map with buildings: Canteen (layout/decor), Trader, Guild Board (staff, quests), Gathering Hub (expeditions) and Cold Storage.
3. **Morning prep:** menu selection, stock check, staff assignment.
4. **Service shift:** the main gameplay view, side-on or 3/4 dining hall. HUD shows the clock, Zenny, reputation, order tickets and patience hearts.
5. **Quest report:** card-flip reveal of each hunter's outcome and the materials they bring back.
6. **Recipe book:** discovered dishes, ingredients and buffs.
7. **Settings:** audio, text size, minigame assist (wider timing windows), language.

---

## 7. Art and audio direction

- **Art style:** hand-drawn chibi pixel art at a 32×32 base tile, upscaled crisply. Warm lantern lighting in the canteen and saturated colors for food. Food sprites should look delicious enough to carry the game; give them extra animation frames (steam, sizzle, glisten).
- **Characters:** small chibi hunters in recognizable armor silhouettes. Palicos are expressive and get the most animation.
- **UI:** wood, parchment and leather textures. Order tickets look like Guild quest slips.
- **Audio:** upbeat folk instruments (fiddle, drums, flute) in the canteen. Big comic stingers for "So tasty!" and burnt food. Monster roars during incursions.
- **Asset policy:** all assets are original or openly licensed (CC0/CC-BY). No ripped sprites, music or sound from official games.

---

## 8. Technical design

### 8.1 Stack
- **Phaser 3** for rendering, input, tweens and scenes.
- **TypeScript** with strict mode.
- **Vite** for the dev server and builds. The output is a static site that can be hosted on GitHub Pages.
- **Vitest** for unit tests of pure game logic (economy, quest resolution, recipes).

### 8.2 Architecture
- **Data-driven content:** recipes, ingredients, monsters, hunters, stations and upgrades live in JSON/TS data files under `src/data/`. Adding a dish should not require code changes.
- **Game logic separate from rendering:** simulation code (`src/core/`) is pure TypeScript with no Phaser imports, so it can be tested on its own.
- **Phaser scenes:** `Boot`, `Preload`, `Title`, `VillageHub`, `MorningPrep`, `Service`, `QuestReport`, `RecipeBook`, `Settings`.
- **Save system:** a versioned JSON save in `localStorage`, with migration functions for schema changes. Autosave at the end of each day.

### 8.3 Planned folder structure
```
mh-restaurant/
├── docs/            design docs
├── public/          static assets (sprites, audio, fonts)
├── src/
│   ├── core/        pure game logic (economy, quests, recipes, save)
│   ├── data/        content definitions
│   ├── scenes/      Phaser scenes
│   ├── ui/          reusable UI components
│   └── main.ts
└── tests/
```

### 8.4 Performance targets
- 60 FPS on mid-range laptops and recent phones.
- Initial download under 15 MB, with lazy-loaded audio.

---

## 9. Scope and roadmap

### 9.1 MVP / vertical slice
- One canteen layout and one biome (forest).
- 3 stations: BBQ Spit, Chopping Board, Skewer Grill.
- 6 recipes, 10 ingredients and 3 quest monsters.
- 5 days of play: service shifts, quest reports, trader and one upgrade tree.
- Placeholder art; save/load.

### 9.2 Milestones
| # | Milestone | Contents |
|---|---|---|
| M0 | Pre-production | README, GDD, repo scaffold |
| M1 | Prototype | Service scene with one station and hunters that order, wait and leave. Greybox art. |
| M2 | Core loop | Full day cycle, quest resolution, economy and save |
| M3 | Vertical slice | MVP content, first art pass, audio, tutorial |
| M4 | Low Rank complete | Staff, expeditions, decor, incursion events, Rank Trial |
| M5 | High / Master Rank | New biomes, stations and monsters; story |
| M6 | Polish & release | Balancing, accessibility, mobile QA, GitHub Pages deploy |

---

## 10. Open questions
- Camera: single-screen dining hall or a scrolling, expandable hall?
- Should the player character walk around (Overcooked-style), or is everything point-and-click (Diner Dash-style)? *Current lean: point-and-click for mobile friendliness.*
- Local co-op as a stretch goal?
- How much story? Hunter side-stories versus a main narrative arc.
- Difficulty modes: casual (no failures) versus standard.
