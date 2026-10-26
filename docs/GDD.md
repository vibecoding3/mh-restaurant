# Hunter's Canteen: Game Design Document

| | |
|---|---|
| **Document version** | 0.4 |
| **Date** | 2026-10-26 |
| **Game version covered** | 0.3 (vertical slice, released) → 0.4 (next) |
| **Genre** | 2D restaurant management / time management |
| **Platform** | Desktop web browsers, 100% offline. English only. |
| **Engine** | Phaser 3 + TypeScript + Vite |
| **Default resolution** | 1920 × 1080, capped at 60 FPS |
| **Session length** | 4–6 min per service shift; 20–40 min per sitting |
| **Status** | Unofficial, non-commercial fan game based on *Monster Hunter: World* (and its *Iceborne* expansion) |

### Changes since document version 0.2
These record the design decisions made for game version 0.2 (full list in [PLAN-v0.2.md](PLAN-v0.2.md)).
- **Pre-made canon dishes:** hunters order Meat, Fish or Veggie Platters, the Chef's Choice Platter or a Well-Done Steak. Platter ingredients are **set in morning prep**, like *World's* Favorite Platters. This replaces the Custom Platter order in §4.3.
- **Point-and-click** interaction (Diner Dash style), not a walking chef.
- **Low punishment, no game over.**
  - A walkout costs 1 reputation and no Zenny.
  - A burnt dish still pays 70%.
  - Reputation never drops below 0.
  - A cart costs nothing, and the hunter returns the next day.
  - A missed Rank Trial is retried the next day.
- **Field-item returns:** hunters bring back only real gathered or carved items, never monster parts.
- **Platform:** desktop only and English only. The offline install (PWA) waits until release.
- **Assets:**
  - free assets only (CC0, CC BY, SIL OFL);
  - **no emoji** anywhere in the game;
  - music *inspired by* *World*, never its own tracks;
  - characters stay code-drawn.
- **Scope:** polish Low Rank before starting High Rank or Master Rank.
- **Ingredient slots:** confirmed as 2 per platter at first, then 4 after "Flying Sparks: Tobi-Kadachi".

### Changes since document version 0.1
- The setting is now **Monster Hunter: World** only. Content from other Monster Hunter games has been removed.
- The canteen is in **Astera**. **Seliana** (from *Iceborne*) unlocks later.
- All invented characters, dishes and locations (Embervale, Grandmeowster Kiln, Hilde, Bartholo, Kokoto Skewers and so on) have been removed. The game now uses only characters, ingredients, meals and food skills from *Monster Hunter: World*.
- Co-op is out of scope (§10).
- The game now targets 1920 × 1080 at a 60 FPS cap (§8).
- A versioning scheme has been added. The current prototype is **v0.1** (§9).

---

## 1. Vision

### 1.1 Elevator pitch
*Overcooked* meets *Diner Dash* in Astera. You are the **Meowscular Chef**, and you run the Canteen at the heart of the Research Commission's base in the New World. Every platter you serve goes out on a hunt with the hunter who ate it. Good food means successful quests and new ingredients. Bad food means carted hunters and an empty canteen.

### 1.2 Design pillars
1. **Cooking feels like hunting.** Every station is a tactile, timing-based minigame. Pulling a perfect *Well-Done Steak* off the BBQ Spit should feel as satisfying as landing a Great Sword charge.
2. **Your food has consequences.** Meals give the same kinds of buffs as in *World* (Health, Stamina, Attack, Defense, Elemental Res and Felyne food skills). The buffs change quest outcomes, and the player always sees the link between the kitchen and the hunt.
3. **The New World is your pantry.** Ingredients unlock as hunters push deeper into the New World, the same way the original Canteen grows through quests and deliveries.
4. **Cozy chaos.** Service shifts are frantic. The time between shifts is relaxed: planning, upgrading and chatting with Astera's residents.

### 1.3 Target audience
- *Monster Hunter: World* fans who love the Canteen cutscenes and the Meowscular Chef's kitchen crew.
- Casual and mid-core players of time-management games (*Diner Dash*, *Cook Serve Delicious*, *Overcooked*).

### 1.4 Canon rule
Every **character, dish, ingredient, food skill, monster and location** comes from *Monster Hunter: World* or *Iceborne*. Gameplay systems such as the economy, minigames and patience are free to adapt. Content is not. Where a gameplay system needs something the original game doesn't name, we use a generic role (for example "a Research Commission hunter") instead of inventing a named character or dish. The full canon reference is in Appendix A.

---

## 2. Setting and tone

### 2.1 Locations
- **Astera (main hub, available from the start).** The Research Commission's base in the New World. The canteen is Astera's open-air Canteen, run by the Meowscular Chef. Astera's facilities appear as menu hubs: the Resource Center, Ecological Research, Botanical Research, the Tradeyard (the Argosy), the Smithy and the Gathering Hub.
- **Seliana (unlocks with Master Rank).** The *Iceborne* base built in the Hoarfrost Reach. Its canteen is run by the **Grammeowster Chef**, who comes out of retirement at the Commander's request. Her specialty is piping-hot gratins and hearty stews, which gives Seliana its own station set and cold-climate feel (§4.2).
- **Hunting locales (quest destinations, never visited directly):** Ancient Forest, Wildspire Waste, Coral Highlands, Rotten Vale, Elder's Recess, and later the Hoarfrost Reach and the Guiding Lands.

### 2.2 Tone
Warm, comedic and food-obsessed, like the Canteen cutscenes in *World*. The Palico chefs are loud and theatrical, hunters are hungry and dramatic, and the Handler is the canteen's most enthusiastic customer.

### 2.3 Cast (all from *Monster Hunter: World* / *Iceborne*)
| Character | Role in this game |
|---|---|
| **Meowscular Chef** | **Player character.** Head chef of the Astera Canteen and a former First Fleet Palico. |
| **Oven Felyne, Soup Felyne** | The Meowscular Chef's kitchen crew in Astera. They become the auto-run station staff (§4.7). |
| **The Handler** | Tutorial guide and quest handler. She reports each fed hunter's quest outcome after every shift, and she is also the canteen's most frequent customer. |
| **The Commander** | Leader of the Research Commission. He sets the Rank Trials and approves canteen expansions. |
| **Field Team Leader, the Huntsman, the Seeker, the Admiral** | Recurring VIP regulars with their own food preferences. |
| **The Hunter (the Fifth Fleet's hunter, the protagonist of *World*) and their Palico** | The star VIP, who orders before story-critical hunts. |
| **Provisions Manager** | Runs the Resource Center. She posts canteen delivery requests and daily bounties. |
| **The Captain** (Argosy, Tradeyard) | Brings imported ingredients from the Old World. His stock and prices change daily. |
| **Chief Botanist** | Runs Botanical Research, which grows vegetable ingredients over several days. |
| **Lynian Researcher, Chief Ecologist** | Ecological Research. They broker trades with the Grimalkyne and share monster threat data that helps you read quest demands. |
| **Second Fleet Master** | Runs the Smithy, which forges kitchen equipment upgrades. |
| **Poogie** | The canteen mascot. Petting Poogie between shifts gives a small morale bonus, purely as a cosmetic and fun interaction. |
| **Seliana (MR):** **Grammeowster Chef**, the Tracker, the Serious Handler, the Excitable A-Lister, the Seliana Sailor | The Grammeowster Chef runs the Seliana canteen and teaches the oven and stew stations. The Seliana Sailor runs Seliana's Argosy and Botanical Research. The others are Seliana regulars. |

Ordinary customers are **unnamed Research Commission hunters** (Fivers, members of other fleets, Gathering Hub visitors), identified by their armor set (Jagras, Kulu-Ya-Ku, Anjanath, Rathalos and so on) and weapon type.

### 2.4 Story (light framing; story is not the focus)
- **Act I, Low Rank (Astera):** The Fifth Fleet has arrived. With so many new hunters, the Meowscular Chef has to turn the Canteen into a proper operation. The Handler, who is constantly hungry, helps him learn the ropes. Early hunts target the Ancient Forest and Wildspire Waste, and the act ends with the rush to feed everyone before the **Zorah Magdaros** operation.
- **Act II, High Rank (Astera):** The Elder Crossing investigation brings Elder Dragon hunts. Hunters need stronger meals, the Gathering Hub opens, and festivals bring the Grand Appreciation Platter.
- **Act III, Master Rank (Seliana):** The Commission builds Seliana in the Hoarfrost Reach. The Commander brings the **Grammeowster Chef** out of retirement, the player cooks alongside his old mentor, and from then on each day starts by choosing which canteen to run.

---

## 3. Core loop

### 3.1 Moment-to-moment (service shift, ~5 min)
```
Hunter arrives → seat them → read their ticket → pick ingredients → cook at station(s) → serve
      ↑                                                                                      ↓
      └──────────────────── tip + satisfaction ← hunter eats & departs on quest ←────────────┘
```

### 3.2 Daily loop
1. **Morning prep:** check stock, buy ingredients (Argosy and deliveries), see today's **fresh ingredients**, and assign the Oven Felyne and Soup Felyne to stations.
2. **Service shift:** cook and serve until the closing gong.
3. **Quest report:** the Handler reports how each fed hunter did on their quest. Successful hunts complete delivery requests and unlock ingredients.
4. **Evening:** spend Zenny, buy Smithy upgrades, collect from Botanical Research, and read Handler and Commander story beats.

### 3.3 Meta loop
Earn **Canteen Reputation** to clear the Commander's **Rank Trials** and move from Low Rank to High Rank, and then to Master Rank in Seliana. Each rank unlocks harder monsters, so hunters need bigger stat tiers and food skills, which call for more ingredient slots and new ingredients.

---

## 4. Gameplay systems

### 4.1 Customers (hunters)
| Attribute | Description |
|---|---|
| **Patience** | Hearts that drain while the hunter waits. A hunter whose patience runs out leaves, which costs 1 reputation (low punishment). |
| **Need** | What the hunter needs for their quest (Attack, Defense, Elemental Res or Stamina), shown as an icon over their head. A dish that meets it earns a bigger tip and better quest odds. |
| **Ticket (order)** | The pre-made dish the hunter picked from today's menu. Hunters prefer dishes that meet their need. See §4.3. |
| **Quest** | A *World* monster (e.g. Great Jagras, Anjanath, Rathalos) at a star rating. |
| **Threat profile** | Taken from the monster's role in *World*. Elemental attackers (Rathian, Rathalos, Legiana, Kirin) make Elemental Res matter, and hard hitters (Anjanath, Barroth) make Defense matter. |
| **Armor / weapon** | Mostly cosmetic. The armor set hints at their rank and favourite targets. |

Customer types:
- **Fiver:** patient, simple tickets, small tips.
- **Veteran Commission hunter:** impatient, complex tickets, big tips.
- **Hunting party (2–4):** must be served together and gives a group bonus.
- **VIP regular:** a named cast member from §2.3, at most one per day, with a large reputation swing either way.
- **Grimalkyne visitor:** pays in Lynian trade items instead of Zenny.

### 4.2 Stations and cooking minigames
Each station is a short skill check, graded **Burnt / Rare / Well-done**. These are the same three outcomes as the BBQ Spit in *World* (Burnt Meat / Rare Steak / Well-Done Steak). Better quality makes food skills more likely to activate and earns bigger tips.

| Station | Minigame | Hub / unlock |
|---|---|---|
| **Chopping Board** | The ingredients are tossed into the air: slash through them with the mouse before they fall (Fruit Ninja style). Each one that drops lowers the grade. | Astera, start |
| **Grill** (the Meowscular Chef's flame-searing) | Flip the cuts when they turn golden. | Astera, start |
| **BBQ Spit** | Hold to spin the meat and release in the golden window, exactly as in *World*. Produces Rare Steak, Well-Done Steak or Burnt Meat as side orders. | Astera, start |
| **Soup Pot** (Soup Felyne) | Keep the heat gauge in the green zone and add ingredients on cue. | Astera, Low Rank 3 |
| **Oven** (Oven Felyne; also used for Oven Roast) | Set it and forget it, but it burns if left alone. Oven Roast turns surplus ingredients into Rations, Nutrients or Lifepowder that can be sold. | Astera, High Rank |
| **Drinks Keg** | Pour drinks to the right fill line. Drinks carry the Perception, Fortune, Preparation and Trailblazer skills. | Seliana, Master Rank |
| **Stew Cauldron and Gratin Oven** (the Grammeowster Chef's specialties) | Long cooks that need stirring and timing while you handle other orders. | Seliana, Master Rank |

The Oven Felyne and Soup Felyne, plus extra kitchen Palicoes later on, can **auto-run** a station at a fixed quality. This frees the player to focus elsewhere.

### 4.3 Meals: canon platters only
*World's* Canteen has no fixed named dishes. A meal is a **platter built from ingredients**, and the ingredient mix sets its buffs. Hunter's Canteen keeps that model exactly:

- **Pre-made platters (v0.2):** the **Meat Platter**, **Fish Platter** and **Veggie Platter** are on the menu. The player sets each platter's ingredients during **morning prep**, like *World's* **Favorite Platters**. Hunters then order dishes, not ingredients.
  - **Meat** gives **Attack Up**, **Fish** gives **Defense Up**, and **Vegetables** give **Elemental Res Up**. Tiers are **(S) / (M) / (L)** at 2 / 4 / 6 matching ingredients.
  - Every ingredient belongs to a **skill group**. Food ingredients are in Courage, Resilience, Vigor, Acumen or Artillery, and drinks are in Perception, Fortune, Preparation or Trailblazer.
    - 2 / 4 / 6 ingredients of one group activate that group's first / second / third **food skill**. For example, two Courage ingredients give Felyne Polisher. Full table in Appendix A.3.
    - Skills roll against an activation rating of 1 to 3 stars. Burnt or rare cooking lowers the activation chance.
  - **Fresh ingredients** rotate daily (one meat, one fish, one vegetable). Each one adds **+10 max Health** and half a star to the skill-activation rating. Three stars means the skill is guaranteed.
  - **Stamina** bonus scales with Canteen level, up to +50.
  - Ingredient slots per platter: **2**, then **4** after "Flying Sparks: Tobi-Kadachi".
- **Chef's Choice Platter:** the one-tap option, which uses as many fresh ingredients as possible. Fast to cook but random in result. Good for impatient hunters.
- **Favorite Platters:** saved presets. Once a ticket type repeats, the player can save its ingredient set for fast plating.
- **Daily skills:** three random daily food skills (from *World's* daily pool, e.g. Felyne Weakener, Felyne Temper, Felyne Booster) that activate only when the platter doesn't qualify for a standard skill.
- **Vouchers:** canonical items. A **Voucher** guarantees three-star activation, and a **Gourmet Voucher** makes every ingredient fresh. VIPs sometimes pay with one, and they are also rare rewards.
- **Field cooking side orders:** **Well-Done Steak** (the canon effect is +50 max Stamina), **Rare Steak** and **Burnt Meat**, all cooked on the BBQ Spit from **Raw Meat**.
- **Grand Appreciation Platter:** a festival-only Gathering Hub meal (§4.9).

v0.2 implements the pre-made platters, the Chef's Choice Platter and the BBQ Spit steaks. Favorite Platter presets beyond the three menu platters, daily skills, Vouchers and the Grand Appreciation Platter come later.

### 4.4 Buffs and quest resolution
- Each quest has a **threat profile**: base difficulty from the monster's star rating, plus how much Attack, Defense, Elemental Res, Health and Stamina matter against it.
- After the shift, each fed hunter's success chance is:
  `base_skill + Σ(stat tier × relevance to quest) + Health/Stamina bonus + quality bonus + food-skill effects`
- **Outcomes:**
  - *Success:* Zenny bonus, reputation, and progress on canteen delivery requests and ingredient unlocks.
  - *Barely made it:* partial rewards.
  - *Carted:* no rewards, but **no penalty** (low punishment). The hunter comes back the next day wanting a better meal.
- **Returns:** successful hunters bring back **field items** from the monster's locale: Raw Meat, Herb, Blue Mushroom, Sushifish, Whetfish, Herbivore Egg and Wyvern Egg. They never bring back monster parts. Some items are Canteen ingredients, some feed Provisions Manager deliveries, and the rest sell for a few Zenny.
- **Food skills in the quest simulation.** These are simplified stand-ins for each skill's effect in *World*:
  - **Felyne Moxie:** turns a cart into "barely made it."
  - **Felyne Heroics:** a bonus against high-star monsters.
  - **Felyne Carver (Hi):** extra rewards.
  - **Felyne Bombardier:** a bonus on Artillery-style weapons (Gunlance, bowguns).

  Each skill used in content gets a one-line effect in the data files, checked against its *World* description.

### 4.5 Ingredients and inventory
- **Ingredients:** the real ingredients from *World's* Canteen, in the categories **Meat, Fish, Vegetables** and (Seliana) **Drinks**. The full list is in Appendix A.2.
- **Freshness:** fresh status rotates daily as in *World*. As a gameplay adaptation, the canteen also keeps a **stock count** so there is an economy, which the original game doesn't have.
- **Sources:**
  1. **The Captain's Argosy:** staple ingredients at prices that change daily.
  2. **Resource Center delivery requests (Provisions Manager)** and **Meowscular Chef optional quests:** in *World*, this is how new Canteen ingredients unlock. Here, hunters complete them off-screen when their quests succeed.
  3. **Botanical Research (Chief Botanist):** grows vegetables over 1–3 days.
  4. **Grimalkyne trades (Lynian Researcher):** exchange Lynian items for rare ingredients.
- **Canteen upgrades follow *World*:** the Canteen levels up after the **3★ "Flying Sparks: Tobi-Kadachi"** quest, the **6★ "Tickled Pink"** quest and, in Master Rank, **"Investigation: Hoarfrost Reach"**. Each level adds ingredient slots per platter (it starts at 2) and raises the Stamina cap.

### 4.6 Economy
- **Currency:** Zenny. **Reputation** is a separate meta-currency used for Rank Trials and unlocks.
- **Income:** platter price × quality multiplier + tips (scaled by patience left) + quest bonuses. The base platter price is anchored to *World's* meal cost of **150 z**.
- **Expenses:** ingredients, kitchen-Palico wages (paid in fish), Smithy upgrades and decor.
- Target pacing: the player can afford one meaningful upgrade every 1–2 days.
- **Tuned numbers (v0.3):** Smithy upgrades cost 1000z (Hanging Lanterns), 1800z (Iron Spit Frame), 3000z (Canteen Bell) and 4500z (Extra Table). The Rank Trial needs 170 reputation on Day 5. With about 13 hunters a shift on Day 1 (rising with the day and the Canteen Bell), an average player passes on Day 5 and a sloppy one on Day 6–7. `tests/balance.test.ts` simulates 200 runs per player type and keeps these bands.

### 4.7 Kitchen staff
- Astera starts with the **Oven Felyne** and the **Soup Felyne**. More generic kitchen Palicoes (unnamed, as in the Canteen cutscenes) join as the canteen expands.
- Roles: **Chef** (auto-runs a station), **Waiter** (auto-seats or auto-serves) and **Forager** (boosts Botanical Research or Grimalkyne trade yields).
- Staff level up through work and can wear cosmetic Palico gear from *World*.

### 4.8 Canteen layout and decor
- The dining area uses a grid. Place tables, stations and decor in the evening phase.
- Decor uses *World* motifs: monster trophies, Research Commission banners, fleet flags and lanterns. It gives passive bonuses, e.g. more patience or bigger tips from hunters wearing a matching armor set.
- Expansion is built by the Second Fleet Master's Smithy team and approved by the Commander. The canteen grows in stages as reputation rises.

### 4.9 Events
- **Rush Hour:** a large wave of hunters before a big operation, such as the Zorah Magdaros operation in Act I.
- **Jagras raid:** a Jagras pack sneaks into the canteen after the meat. Drive them off with a quick tap minigame before they eat your stock.
- **Gathering Hub festivals (High Rank+):** themed decor plus the **Grand Appreciation Platter** as a special order.
- **VIP Visit:** a named regular (the Admiral, the Huntsman and so on) whose verdict swings reputation.

### 4.10 Progression
| Rank | Hub | Locales | Example monsters (quest targets) | New mechanics |
|---|---|---|---|---|
| **Low Rank** | Astera | Ancient Forest, Wildspire Waste, then Coral Highlands, Rotten Vale, Elder's Recess | Great Jagras, Kulu-Ya-Ku, Pukei-Pukei, Barroth, Jyuratodus, Tobi-Kadachi, Anjanath, Rathian, Paolumu, Legiana, Odogaron, Rathalos, Diablos | Chopping Board, Grill, BBQ Spit, Soup Pot; Canteen level 2 after "Flying Sparks: Tobi-Kadachi" |
| **High Rank** | Astera + Gathering Hub | All base locales | Kirin, Uragaan, Lavasioth, Bazelgeuse, Nergigante, Kushala Daora, Teostra, Vaal Hazak, Deviljho | Oven and Oven Roast, festivals, Canteen level 3 after "Tickled Pink" |
| **Master Rank** | Seliana (Astera still playable) | Hoarfrost Reach, Guiding Lands | Banbaro, Beotodus, Velkhana, Tigrex, Nargacuga, Barioth, Glavenus, Brachydios, Zinogre, Namielle, Rajang | Grammeowster Chef, drinks and drink skills, stew and gratin stations; Canteen level 4 after "Investigation: Hoarfrost Reach" |
| **Endgame** | Both | Guiding Lands | Safi'jiiva, Alatreon, Fatalis | Endless mode with local high scores |

Promotion to the next rank needs a **Rank Trial**: a special shift set by the Commander, with a reputation target.

---

## 5. Controls

| Action | Mouse | Keyboard |
|---|---|---|
| Select hunter / ticket / station | Click | Number keys 1–9 to pick a station |
| Pick ingredients for a platter | Click / tap | Arrow keys + Enter |
| Station minigame | Hold / release / click, depending on the station | Space |
| Pause | Button | Esc |

The game targets **desktop only** and must be fully playable with the mouse alone. The keyboard is an optional accelerator.

---

## 6. UI and screens

1. **Title screen:** New Game, Continue, Settings, Credits, and the **game version number** (§9).
2. **Astera hub (evening):** facilities as hotspots: Canteen (layout and decor), Tradeyard (Argosy), Resource Center (deliveries and bounties), Botanical Research, Ecological Research and the Smithy. Seliana has its own hub screen after MR unlocks.
3. **Morning prep:** stock, today's fresh ingredients, Favorite Platters and staff assignment.
4. **Service shift:** the main gameplay view of the Canteen. The HUD shows the clock, Zenny, reputation, order tickets and patience hearts.
5. **Quest report:** the Handler presents a card-flip reveal of each hunter's outcome.
6. **Ingredient book:** every ingredient with its category, skill group and unlock source, plus the food-skill list.
7. **Settings:** audio, text size, minigame assist (wider timing windows), language and fullscreen.

All UI is laid out for **1920 × 1080** and scales to fit (§8.4).

---

## 7. Art and audio direction

- **Art style:** hand-drawn chibi pixel art upscaled by whole-number factors for crisp pixels, with warm lantern light and saturated food colors. The look references Astera's ship-timber buildings and the Canteen's open kitchen, and Seliana's snow and hot steam. Food sprites need extra animation frames (steam, sizzle, glisten).
- **Characters:** chibi versions of the *World* cast and of hunters in recognizable *World* armor silhouettes. The Meowscular Chef and his Palico crew get the most animation.
- **UI:** wood, parchment and Research Commission styling. Tickets look like *World* quest slips.
- **Audio:** upbeat folk instruments in the canteen, big comic stingers for Well-done and Burnt, and the "cooking song" timing cue on the BBQ Spit.
- **Asset policy:**
  - All assets are original or openly licensed (CC0, CC BY or SIL OFL), recorded in `ASSETS_LICENSES.md` and on the Credits screen.
  - No ripped sprites, music or sound from official games. Names and content are referenced for this fan project; art and audio are made fresh or come from free packs.
  - **No emoji** anywhere in the game: icons are sprites. A unit test scans `src/` for emoji.
- **v0.2 assets:**
  - **Icons:** game-icons.net (CC BY 3.0).
  - **Panels and buttons:** Kenney's UI Pack RPG Expansion (CC0).
  - **Fonts:** Cinzel and Alegreya Sans (SIL OFL), bundled locally.
  - **Sound effects:** Kenney (CC0).
  - **Characters:** still code-drawn, improved.
- **Music:** *inspired by World*, never its own tracks. CC0 tracks: a warm town theme for the title and prep, an upbeat tavern song for service, a cooking song for the BBQ Spit and a fanfare for the report.

---

## 8. Technical design

### 8.1 Stack
- **Phaser 3** for rendering, input, tweens and scenes.
- **TypeScript** in strict mode.
- **Vite** for the dev server and builds. The output is a static site hosted on GitHub Pages.
- **Vitest** for unit tests of the pure game logic (economy, quest resolution, platter rules, saves).

### 8.2 100% offline
- No backend, no server code, no accounts, no network calls during play. Everything ships in the static build.
- Fonts and assets are bundled locally, with no CDN at runtime.
- At **release** (M6): a **service worker / PWA manifest**, so the game keeps working with no connection after the first visit and can be "installed" from the browser.
- No co-op or multiplayer of any kind (§10).

### 8.3 Architecture
- **Data-driven content:** ingredients, skill groups, food skills, monsters, cast and stations live in data files under `src/data/`. Adding an ingredient or a monster should not require code changes. Every canon entry records its source (Appendix A).
- **Game logic separate from rendering:** simulation code in `src/core/` is pure TypeScript with no Phaser imports, so it can be tested on its own.
- **Phaser scenes (planned):** `Boot`, `Preload`, `Title`, `Hub` (Astera / Seliana), `MorningPrep`, `Service`, `QuestReport`, `IngredientBook`, `Settings`. v0.2 has `Preload`, `Title`, `Credits`, `Prep`, `Service` and `Report`.
- **Save system:** a versioned JSON save in `localStorage`. Each save stores the **save-schema version** and the **game version** that wrote it. The game autosaves at the end of each day.
  - Until the Low Rank release, a save from another schema version is **wiped**, and the title screen says so.
  - After that, migration functions will handle schema changes.

### 8.4 Display and performance
- **Default (design) resolution: 1920 × 1080.** All layout coordinates are authored at this size. The canvas uses Phaser's `Scale.FIT` with centering, so it letterboxes on other aspect ratios and scales to any desktop window.
- **Frame rate capped at 60 FPS** through the Phaser game config (`fps: { target: 60, limit: 61 }`), so 120/144 Hz monitors don't run the game faster or burn extra battery. The limit is 61 rather than 60 because high-refresh frames add up to just under 1/60 s; at 60, a 180 Hz display drops to about 52 steps a second. Game logic uses frame delta time and is clamped against long frames.
- Targets: a steady 60 FPS on mid-range laptops and an initial download under 15 MB. v0.2 is about 5.6 MB, mostly music.

### 8.5 Folder structure
```
mh-restaurant/
├── docs/            design docs
├── public/          static assets (sprites, audio, fonts)
├── src/
│   ├── core/        pure game logic (economy, quests, platters, save)
│   ├── data/        canon content definitions
│   ├── scenes/      Phaser scenes and minigames
│   ├── ui/          reusable UI components
│   └── main.ts
├── tests/
└── CHANGELOG.md     per-version change log (from v0.2)
```

---

## 9. Versioning, scope and roadmap

### 9.1 Versioning system
- The game uses **Semantic Versioning**: `MAJOR.MINOR.PATCH`.
  - `0.x` covers pre-release development.
  - Each roadmap milestone bumps **MINOR**.
  - Bug fixes on a released version bump **PATCH**.
  - **1.0.0** is the first complete release (M6).
- **The current version is v0.3** (`0.3.0`).
- The single source of truth is `version` in `package.json`. The build injects it (Vite `define`), and it shows on the title screen and in saves.
- Each release gets a git tag `vX.Y.Z` on `main` and an entry in `CHANGELOG.md`. The GitHub Pages deployment always serves the latest commit on `main`.
- This design document has its own document version in its header, separate from the game version.

### 9.2 Version history
| Version | Contents |
|---|---|
| **0.3.0** (vertical slice, released) | The Handler's Day 1 tutorial (15 skippable tips, the shift pauses while she talks); Favorite Platter presets; the Ingredient Book with all 15 food skills; a Settings screen (sound, music, Large text, minigame assist, fullscreen, replay tutorial); a first pixel-art pass with Kenney's CC0 *Roguelike Indoors*; the Fruit Ninja style Chopping Board; weapon-free customers; balance from simulation (Rank Trial at 170 reputation, upgrades 1000–4500z); save-schema v3. |
| **0.2.0** (canon pass, released) | Content is canon *World* throughout: Astera and the Meowscular Chef; the five canon dishes with platters set in morning prep; 26 Canteen ingredients and 15 food skills under *World's* rules; 8 Low Rank monsters; field-item returns; Provisions Manager deliveries; the Canteen level-up after "Flying Sparks: Tobi-Kadachi". Gameplay is low punishment with no game over. Presentation: 1920 × 1080 with a 60 FPS cap, no emoji, free icons, UI, sound and music, a Credits screen, the version on the title screen, and save-schema v2. |
| **0.1.0** (prototype, released) | Playable greybox core loop: morning prep, service shift, three minigames (Chopping Board, BBQ Spit, Skewer Grill), quest report, upgrades, `localStorage` saves, GitHub Pages deploy. **Known gaps:** the content is placeholder and not yet canon (invented dishes, characters and village; Great Jaggi instead of Great Jagras), the resolution is 960 × 540, and there is no FPS cap or version display. |

### 9.3 Next version: 0.4 (Low Rank complete)
- The rest of Low Rank (§9.5 M4):
  - the Soup Pot station and the Soup Felyne;
  - kitchen staff (Oven Felyne, Soup Felyne, Waiter and Forager roles);
  - Botanical Research and Grimalkyne trades;
  - Jagras raids and the Rush Hour event;
  - hunting parties, VIP regulars and Grimalkyne visitors;
  - more Low Rank monsters (Paolumu, Legiana, Odogaron, Rathalos, Diablos);
  - the Low Rank Rank Trial as a special shift.
- Something to spend Zenny on after the four Smithy upgrades (staff, decor).

### 9.4 MVP / vertical slice
- Astera only, Low Rank.
- Stations: Chopping Board, Grill and BBQ Spit.
- The Custom Platter and Chef's Choice with a starter set of canon ingredients (the first ingredient of each skill group in Meat, Fish and Vegetables), plus the BBQ Spit steaks.
- 6 quest monsters and 5 days of play: service shifts, quest reports, the Argosy, Resource Center deliveries and the first Canteen level-up.
- Placeholder art; save/load.

### 9.5 Milestones
| # | Milestone | Version | Contents |
|---|---|---|---|
| M0 | Pre-production | — | README, GDD, repo scaffold |
| M1–M2 | Prototype | **0.1** | Greybox core loop (done) |
| M2.5 | Canon pass | **0.2** | Canon content, 1080p, 60 FPS cap, versioning (done) |
| M3 | Vertical slice | **0.3** | MVP content (§9.4), first art pass, audio, Handler tutorial (done) |
| M4 | Low Rank complete | 0.4 | Soup Pot, staff, Botanical Research, Grimalkyne trades, Jagras raids, LR Rank Trial |
| M5a | High Rank | 0.5 | Oven / Oven Roast, Gathering Hub festivals, HR monsters |
| M5b | Master Rank / Seliana | 0.6 | Seliana hub, Grammeowster Chef, drinks, stews and gratins, MR monsters |
| M6 | Polish & release | 1.0 | Balancing, accessibility, PWA offline install |

---

## 10. Out of scope
- **Co-op and any other multiplayer** (local or online).
- Any backend: servers, accounts, cloud saves, online leaderboards, analytics.
- Content from *Monster Hunter* games other than *World* and *Iceborne*.
- Invented named characters, dishes or locations.

## 11. Open questions
- Camera: single-screen dining hall or a scrolling, expandable hall?
- ~~Point-and-click or a walking chef?~~ *Decided: point-and-click.*
- ~~Ingredient slots per Canteen level?~~ *Decided: 2, then 4 after "Flying Sparks: Tobi-Kadachi" (monsterhunterwiki.org). The later levels (6?) still need checking.*
- ~~Food skills in the quest simulation?~~ *Decided: every group skill has a one-line effect in `src/data/food-skills.ts`. With 2 or 4 slots, Low Rank reaches each group's first and second skills.*
- ~~Balance: are 80 reputation by Day 5, and the current hunter arrival rate, the right pace?~~ *Decided in v0.3: 170 reputation by Day 5 with the current arrival rate, upgrades at 1000–4500z (§4.6). Re-check once staff and events land.*
- Art: the CC0 pixel props are top-down 3/4 view while characters are side view. Keep this mix, or move to a side-view pack or custom art for v1.0 (§7)?

---

## Appendix A. Canon reference (Monster Hunter: World / Iceborne)

Sources: [monsterhunterwiki.org: MHWI Canteen](https://monsterhunterwiki.org/wiki/MHWI/Canteen), [Fextralife: Astera](https://monsterhunterworld.wiki.fextralife.com/Astera), [Fextralife: Seliana](https://monsterhunterworld.wiki.fextralife.com/Seliana), [monsterhunterwiki.org: The Grammeowster Chef](https://monsterhunterwiki.org/wiki/The_Grammeowster_Chef), [Fextralife: Well-Done Steak](https://monsterhunterworld.wiki.fextralife.com/Well-Done+Steak). Check in-game spelling before any name ships.

### A.1 Canteen rules (as in *World*)
- A meal is a platter of ingredients that costs 150 z (or resource points, or a Voucher).
- Meat → Attack Up, Fish → Defense Up, Vegetables → Elemental Res Up. Tiers (S/M/L) at 2/4/6 ingredients. Drinks give no stat.
- Each fresh ingredient gives +10 max Health and +½★ skill activation; 3★ means 100%.
- Stamina gain scales with Canteen level, up to +50.
- Meal effects end when a quest is completed, when the hunter returns from a quest or expedition, or when they faint.
- Platter options: preset platters, Custom Platter, Favorite Platters and the Chef's Choice Platter. The Grand Appreciation Platter is served at hub festivals.
- Canteen upgrades come from "Flying Sparks: Tobi-Kadachi" (3★), "Tickled Pink" (6★) and "Investigation: Hoarfrost Reach" (MR 1★).

### A.2 Ingredients by category and skill group
| Group | Meat | Fish | Vegetables |
|---|---|---|---|
| **Courage** | Wyvern Thigh, Wyvern Skirt Steak, Wyvern Egg, Wyvern Tail, Wyvern Head, Wyvern Filet | Ridgemane Tuna*, Serpentine Salmon, Courageous Eel, Sushifish, Ancient Seabream, Boorish Yellowtail | Magnicelery, Rapscallion, Jewel Cactus, Dragonbloom, Kingly Cactus, Fatty Tomato |
| **Resilience** | Tough Meat, Thorny Meat, Bullion Meat, Steeled Meat, Wild Chicken, Marinated Carpaccio | Jumbo Whelk, Scallop Chips, Choice Abalone, Violet Abalone, Precious Abalone, Large-horned Turban | Stonecorn, Steadfast Spud, Exquisite Shroomcap, Moonlit Mushroom, Spirit Shroomcap, Soiled Shroomcap |
| **Vigor** | Aptonoth Meat, Apceroast, Diced Steak, Giant Sirloin, Big Bite Burger, Giga Steak | Squad Sardine, Samurai Tuna, Gajau Gill, Gajau Liver, Shogun Tuna, Fiery Seabream | Plumpkin, Cudgel Onion, Shinebloom, Sunkissed Grass, Goldbloom, King Truffle |
| **Acumen** | White Liver, Barbecued Short Rib, Tangy Tripe, Hot Heart, Rich Rump, Grand Foie Gras | Bent-backed Shrimp, Armor Crab, Coral Shrimp, Fortress Crab, Queen Shrimp, Millenary Crab | Aromaticelery, Prismatic Paprika, Tainted Fruit, Heavenberry, Elysian Fruit, Millionfold Cabbage |
| **Artillery** | Peon Turkey, Great Mutton, Herbivore Egg, King Turkey, Magma Mutton, Kaiser Turkey | Osseoctopus, Pink Caviar, Lily Squid, Ballerina Octopus, Soulful Caviar, Sovereign Squid | Kut-Ku Bean, Molten Mango, Rockfruit, Divineapple, Wildfruit, Emerald Durian |

\* The source lists "Ridgemane Tune". It is likely "Tuna"; check in-game.

**Drinks:**
- **Perception:** Tater Mud, Dragon Ale, Demontater Brew, Wyvern Amber Ale, Goldenfish Brew, Dragonkiller Sake
- **Fortune:** Hunter's Brew, Star Brandy, Master Ale, Ratha Whiskey, Astera Beer, Blessed Wine
- **Preparation:** Greathorn's Gulp, Auspicious Ale, Butterbrew, Fortified Honeywine, Entrancing Alembic, Tequila de Locos
- **Trailblazer:** Glacial Vodka, Toasting Tequila, Snowmelt Snifter, Frostpeak Fizz, Crystal Quaff, Searing Spirit

**Field cooking:** Raw Meat on the BBQ Spit gives Well-Done Steak (+50 max Stamina), or Rare Steak or Burnt Meat if the timing is off.

### A.3 Food skills
| Group | Standard skills |
|---|---|
| Courage | Felyne Polisher, Felyne Rider, Felyne Slugger |
| Resilience | Felyne Acrobat, Felyne Feet, Felyne Moxie |
| Vigor | Felyne Riser (Hi), Felyne Black Belt, Felyne Heroics |
| Acumen | Felyne Groomer, Felyne Medic, Felyne Specialist |
| Artillery | Felyne Sharpshooter, Felyne Bombardier, Felyne Pyro |
| Perception | Felyne Iron Carver, Felyne Exchanger, Felyne Carver (Hi) |
| Fortune | Felyne Harvester, Felyne Fat Cat, Lucky Cat |
| Preparation | Felyne Cleats, Felyne Tailor, Felyne Safeguard |
| Trailblazer | Felyne Gardener, Felyne Scavenger, Felyne Zoomaster |

**Daily skill pool** (three are drawn each cycle): Felyne Carver (Lo), Felyne Defender (Hi), Felyne Defender (Lo), Felyne Deflector, Felyne Escape Artist, Felyne Sprinter, Felynebacker, Felyne Weakener, Felyne Riser (Lo), Felyne Temper, Felyne Cliffhanger, Felyne Gripper, Felyne Lander, Felyne Bulldozer, Felyne Foodie, Felyne Dungmaster, Felyne Fur Coating, Felyne Trainer, Felyne Booster, Felyne Fisher, Cool Cat, Felyne Insurance, Felyne Provoker, Felyne Parting Gift, Felyne Researcher, Felyne Weathercat, Felyne Biologist, Felyne Macrozoologist, Felyne Microzoologist.

### A.4 Characters
- **Astera:** Commander, the Handler, Field Team Leader, the Huntsman, Meowscular Chef, Second Fleet Master (Smithy), the Seeker, Admiral, Poogie, Provisions Manager, Tech Chief, Analytics Director (Resource Center), Smart Biologist, Lynian Researcher, Chief Ecologist (Ecological Research), Chief Botanist, Laid-back Botanist, Impatient Biologist (Botanical Research), the Captain (Argosy), Elder Melder, Fish Aficionado, Oven Felyne, Soup Felyne.
- **Seliana:** the Handler, Field Team Leader, Grammeowster Chef, Second Fleet Master, the Seeker, the Tracker, Admiral, Serious Handler, Excitable A-Lister, Provisions Manager (Resource Center), Seliana Sailor (Botanical Research and Argosy).
- **Background:** the Grammeowster Chef trained the Meowscular Chef for ten years, after the former First Fleet Palico's blade broke.
