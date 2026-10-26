# Hunter's Canteen: v0.4 Implementation Plan (Low Rank, core slice)

> **Status:** approved plan, not yet implemented. Written 2026-10-27.

## Context
v0.3.0 shipped the vertical slice. GDD §9.3 and milestone M4 ("Low Rank complete") list about 12 systems, which is too many for one release. v0.3 also left two problems:
- Zenny piles up once all four Smithy upgrades are bought (around Day 6).
- The Rank Trial is only a reputation check, not the special shift that GDD §4.10 describes.

v0.4 adds a fourth station, kitchen staff, the rest of the Act I monsters, VIP regulars, two events, and a real Rank Trial shift. Together these give the game a Low Rank arc that ends with the Zorah Magdaros operation.

## Decisions from the design Q&A (2026-10-27)

| # | Topic | Decision |
|---|---|---|
| 1 | Scope | **Core slice.** v0.4 = Soup Pot, kitchen Palicoes, 5 more Low Rank monsters, VIP regulars, Jagras raid and Rush Hour, the Low Rank Rank Trial as a special shift, and a Zenny sink. Deferred to **v0.5 (still Low Rank)**: Astera hub screen, Botanical Research, Grimalkyne trades, decor grid, daily skills and Vouchers, Poogie, Grimalkyne visitors, hunting parties. High Rank moves to v0.6 and Master Rank to v0.7. |
| 2 | Staff names | **Generic "kitchen Palicoes".** "Oven Felyne" and "Soup Felyne" could not be confirmed as canon, so they come out of the GDD (§2.3, §4.2, §4.7, A.4). |
| 3 | Soup Pot | **A step in the platters.** Fish and Veggie Platters go Chopping Board → Soup Pot. The Meat Platter stays Chopping Board → Grill. No new dishes. |
| 4 | Staff | **Assigned in prep, they auto-cook.** A kitchen Palico on a station cooks that station's orders by itself: Rare at level 1, Well-done at level 2. The player can still cook any order by hand. |
| 5 | Carried over | Canon *World* content only, no emoji, English only, desktop only, low punishment, assets under CC0, CC BY or SIL OFL only. Push to `main` and tag `v0.4.0`. Wiping saves is still fine, so the save schema goes to v4. |

## Work order and design

### 1. Canon fixes and data (do first)
- **GDD:** remove "Oven Felyne" and "Soup Felyne" and use "kitchen Palicoes". Renumber §9.5 (v0.5 = rest of Low Rank, v0.6 = High Rank, v0.7 = Master Rank). Add a "Changes since document version 0.4" note.
- **New monsters in `src/data/monsters.ts`:** Paolumu and Legiana (Coral Highlands), Odogaron (Rotten Vale), Rathalos (Ancient Forest) and Diablos (Wildspire Waste).
  - Before adding, verify each star rating and locale on Fextralife or monsterhunterwiki.org.
  - Weights and needs follow each monster's role, for example Legiana → Elemental Res, Diablos → Defense, Odogaron → Attack and Stamina.
  - `minDay` runs from 6 to 10.
- **New locale tables:** `CORAL_HIGHLANDS` and `ROTTEN_VALE`, using only the existing field items, with weights adjusted per locale. No new ingredients in v0.4.
- **VIP data:** add Field Team Leader, the Huntsman, the Seeker and the Admiral to `src/data/cast.ts`. Use their names and roles only; write no dialogue that puts invented words in their mouths beyond short generic lines.

### 2. Soup Pot station
- **Data:**
  - `StationId` gains `'pot'`.
  - `STATIONS.pot` = `{ name: 'Soup Pot', icon: 'pot', key: '4' }`.
  - `STATION_ORDER` gains `'pot'`.
  - `DISHES.fishPlatter.stations` and `DISHES.veggiePlatter.stations` become `['board', 'pot']`.
  - Add a cauldron icon (game-icons.net, CC BY 3.0) to `ICON_KEYS` and `ASSETS_LICENSES.md`.
- **Unlock:** the Soup Pot unlocks on **Day 3**, matching GDD §4.2's "Low Rank 3", with a Handler tip.
  - Until then, Fish and Veggie Platters use the Grill.
  - Add `stationsFor(dish, state)` in `src/core/economy.ts`. `ServiceScene.nextStation` and the ticket drawing call it.
- **New minigame `src/scenes/minigames/PotGame.ts`,** extending `BaseMinigame`:
  - Hold the mouse button or Space to stoke the fire, which raises the heat gauge; release and it falls. Keep the needle in the green band.
  - The prompts "Add ingredient!" appear 3 times; click the pot inside each prompt's window. Each ingredient icon comes from the ticket.
  - **Pure grading in `src/core/cooking.ts`:** `gradePot(timeInGreen, hits)` returns Well-done if ≥ 75% of the time was in green and all 3 cues were hit, Rare if ≥ 45% and ≥ 2 cues, Burnt otherwise.
  - **Assist:** the green band widens and the cue windows get longer (`potBand(assist)`).
  - Lasts about 6 s.
- **Service layout:**
  - Four stations, each 372 px wide at `x = 20 + i * 388`. Keys `1` to `4`.
  - The pot uses Kenney pixel props: stove tiles with a code-drawn cauldron.
  - The Handler hint panel and the Meowscular Chef keep the right edge.
  - Add a tutorial step `svc-pot` in `src/data/tutorial.ts`.

### 3. Kitchen Palicoes (staff) and the Zenny sink
- **State:** `staff: { id: string; station: StationId | null; cooked: number }[]` (up to 2 in v0.4).
- **Core, in a new `src/core/staff.ts`:**
  - `hireStaff(state)`: 1500z for the first, 2500z for the second.
  - `assignStaff(state, id, station)`: at most one Palico per station.
  - `payWages(state)`: 100z per Palico each morning, inside `advanceDay`. If the player can't pay, the Palico takes the day off; there is no debt (low punishment).
  - `staffQuality(p)`: Rare, or Well-done once `cooked >= 25`.
  - `STAFF_COOK_MS = 7000`.
- **Prep UI:** the right column becomes tabbed: **Smithy | Kitchen | Deliveries**, reusing the tab buttons from `PrepScene.drawArgosy`.
  - The Kitchen tab shows hire buttons, each Palico's level and dishes cooked, and a station picker.
  - The Handler's tip moves to a one-line strip above the footer.
- **Service:**
  - A staffed station picks the waiting ticket that has waited longest for it, cooks it for `STAFF_COOK_MS` behind a progress ring on the station, then applies `staffQuality`.
  - A code-drawn kitchen Palico stands at the station, using a smaller `drawPalico` without the chef's hat.
  - Clicking that station still opens the minigame for the selected ticket.
  - Report: "Kitchen Palicoes cooked N dishes".

### 4. VIP regulars
- **Spawning:** from Day 4, at most one per day, with a 40% chance. A VIP takes a queue slot like any hunter.
  - They are drawn with `drawHunter` plus a gold name plate. The armor colors are generic; no claim is made of their exact look.
- **Rules,** in pure helpers in `src/core/economy.ts` (`vipPayment`):
  - patience ×1.2;
  - pays ×2;
  - +3 bonus reputation if the dish is Well-done and meets their need;
  - a walkout costs 2 reputation instead of 1 (still low punishment);
  - they always pick a monster of 4★ or higher.
- **Report:** the VIP card gets a gold frame and their name.

### 5. Events
- **Jagras raid,** in a new `src/scenes/events/JagrasRaid.ts`:
  - From Day 3, a 25% chance once per shift, at 40–80% of the shift.
  - 3–5 Jagras, drawn in code as small green and yellow lizards, run from the door toward the kitchen counter. Click each one to shoo it.
  - Each one that reaches the counter eats 1 unit of a random stocked platter ingredient. That is the only penalty.
  - The shift does not pause.
  - The roll is pure in `src/core/shift.ts` (`raidToday(day, rng)`).
- **Rush Hour before the Zorah Magdaros operation:**
  - It is a fixed day: 2 days after the Rank Trial is passed. The Handler announces it in prep the day before.
  - Arrivals ×1.6 (an `arrivalInterval` multiplier) and patience ×1.2.
  - Every served hunter gives +1 bonus reputation.
  - The report closes Act I with "The Commission sets out for Zorah Magdaros. Low Rank complete!" and play continues.
  - State: `rushDay: number | null`, `actOneDone: boolean`.

### 6. The Low Rank Rank Trial as a special shift
- **Unlock:** 170 reputation (`TRIAL_REPUTATION`) still unlocks the trial from Day 5. The trial is now the next shift, not a passive check.
- **Trial shift:**
  - The banner reads "Commander's Rank Trial".
  - The HUD shows the goal, built by `trialGoal(day)` in `src/core/state.ts`: serve **8 hunters at Rare or better, with at least 4 needs met**. A walkout doesn't fail the trial.
  - The Commander's verdict appears in the report.
  - If the trial fails, it is retried in the next shift. There is no penalty.
- **Prep:** shows the trial goal in place of the current trial label.
- **Code:** `ReportScene` replaces its `isTrialDay` reputation check with `trialResult(shift)`.

### 7. Balance
- **Extend `tests/balance.test.ts`:**
  - kitchen Palicoes, which add to the served share once hired, cook at Rare, and are paid wages;
  - the Soup Pot step, which costs no extra serve rate;
  - VIPs;
  - raids, which cost ingredients;
  - the trial-shift goal, using the profile's quality and need rates.
- **New assertions:**
  - an average player hires the first Palico on Day 5–7;
  - Zenny on Day 10 stays under about 3× Day 5 (the sink works);
  - an average player passes the trial shift by Day 6 in at least 70% of runs, and a sloppy one by Day 8;
  - the v0.3 bands still hold.
- **Bot check:** re-run the bot playtest (`pt/bot.mjs`, extended to restock and use 4 stations) for one full 120 s shift on Days 3 and 6, to confirm a perfect cook can serve the shift.
- **Record the final numbers** in GDD §4.6 and §11.

### 8. Saves, tutorial, docs, release
- **Saves:** `SAVE_VERSION = 4` for `staff`, `rushDay` and `actOneDone`. `validate` checks the new fields, and older saves are wiped with the existing notice.
- **New tutorial tips:** `svc-pot`, `prep-kitchen` (shown when staff are first affordable), `svc-vip`, `svc-raid` and `prep-trial`. Each shows once, and Skip covers them.
- **Release:**
  - `package.json` 0.4.0;
  - a CHANGELOG 0.4.0 section;
  - PROGRESS (tick v0.4 and move the deferred items to v0.5);
  - GDD §9.2 and §9.3 (the next version becomes 0.5);
  - README (Soup Pot, staff, VIPs, events, trial shift, keys `1`–`4`);
  - commit, push `main`, tag `v0.4.0`, watch the deploy, and run a scripted shift on the live site.

## Critical files
- **New:**
  - `src/scenes/minigames/PotGame.ts`, `src/scenes/events/JagrasRaid.ts`
  - `src/core/staff.ts`
  - the cauldron icon SVG
- **Modified:**
  - core: `src/core/types.ts`, `state.ts`, `economy.ts`, `cooking.ts`, `shift.ts`, `save.ts`
  - data: `src/data/stations.ts`, `dishes.ts`, `monsters.ts`, `cast.ts`, `tutorial.ts`
  - scenes: `src/scenes/ServiceScene.ts` (four stations, staff, VIPs, raid, trial HUD), `PrepScene.ts` (tabs, Kitchen), `ReportScene.ts`, `PreloadScene.ts`
  - tests: `tests/core.test.ts`, `tests/balance.test.ts`
  - docs
- **Reused:**
  - `BaseMinigame` (`src/scenes/minigames/base.ts`)
  - `HandlerTips` (`src/ui/tutorial.ts`)
  - `prop`, `strip`, `PROPS` (`src/ui/pixel.ts`)
  - `drawHunter`, `drawPalico`, `Button`, `fitWidth`, `iconText` (`src/ui/theme.ts`)
  - `arrivalInterval`, `veteranChance` (`src/core/shift.ts`)
  - `dishPayment`, `addReputation`
  - `settings().assist`

## Verification
1. **`npm test`:**
   - new unit tests: `gradePot` and `potBand`, `stationsFor` before and after Day 3, hire, assign and wages (including the unpaid day off), `staffQuality` level-up, `vipPayment`, `raidToday`, `trialGoal` and `trialResult`, save v4 wipe of v3;
   - the extended balance bands;
   - the emoji scan.
2. **`npm run build`.**
3. **Playwright at 1920×1080 with `?shift=25&debug`:**
   - Soup Pot minigame at assist off and on;
   - four-station layout screenshots at Normal and Large text;
   - hire and assign a Palico, then watch it auto-cook a ticket;
   - force a VIP and a raid through `window.game` and screenshot each;
   - play the trial shift to pass and to fail;
   - Rush Hour day and the Act I report.
   - Each run must show no console errors, no external requests and about 60 game steps per second.
4. **Bot full-shift check (§7), then after the push:** the deploy passes and a scripted shift runs on the live URL.

## Research sources
- [Fextralife: Canteen](https://monsterhunterworld.wiki.fextralife.com/Canteen) and [monsterhunterwiki.org: MHWI Canteen](https://monsterhunterwiki.org/wiki/MHWI/Canteen): the Canteen crew is unnamed; soups are boiled in a cauldron.
- Monster star ratings and locales: to be verified on Fextralife or monsterhunterwiki.org before data entry.
