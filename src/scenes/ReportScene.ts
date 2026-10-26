import Phaser from 'phaser';
import type { MealBuffs } from '../core/types';
import { resolveQuest, type QuestResult } from '../core/quests';
import { dishBuffs } from '../core/platters';
import { TRIAL_REPUTATION, addReputation, advanceDay, isTrialDay } from '../core/state';
import { saveGame } from '../core/save';
import { ARMOR_BY_ID, HUNTER_TYPES, WEAPONS_BY_ID, hunterLabel } from '../data/hunters';
import { INGREDIENTS } from '../data/ingredients';
import { CANTEEN_QUEST, MONSTERS } from '../data/monsters';
import { DISHES, SPIT_RESULTS } from '../data/dishes';
import { FOOD_SKILLS } from '../data/food-skills';
import { NEED_LABELS, QUALITY_NAMES, TIER_LABELS } from '../data/stations';
import { session, type ServedRecord } from '../session';
import {
  Button, COLORS, CREAM, GOLD, INK, INK_SOFT, W, badgeIcon, drawHunter, drawWoodBg, icon, iconText, panel, stars, title, txt,
} from '../ui/theme';
import { sfx } from '../ui/sfx';
import { MUSIC, playMusic } from '../ui/music';
import { HandlerTips } from '../ui/tutorial';

const COLS = 6;
/** Quality colors readable on parchment. */
const QUALITY_INK = ['#6a6a6a', '#c0601a', '#3e7a2a'];
const MAX_CARDS = 12;
const CARD_W = 296;
const CARD_H = 340;
const OUTCOME_TEXT = { success: 'Success!', barely: 'Barely made it', carted: 'Carted!' };
const OUTCOME_ICON = { success: 'trophy', barely: 'paw', carted: 'cart' };
const OUTCOME_COLOR = { success: '#3e7a2a', barely: '#c07a1a', carted: '#b03a2e' };

interface Row {
  record: ServedRecord;
  buffs: MealBuffs;
  result: QuestResult;
}

export class ReportScene extends Phaser.Scene {
  private cards: { back: Phaser.GameObjects.Container; front: Phaser.GameObjects.Container }[] = [];
  private revealed = 0;
  private footer!: Phaser.GameObjects.Container;
  private tips!: HandlerTips;

  constructor() {
    super('Report');
  }

  create(): void {
    const s = session.state;
    const shift = session.shift ?? { served: [], earned: 0, repDelta: 0, walkouts: 0 };
    session.shift = null;
    playMusic(MUSIC.fanfare, false);

    // Resolve every fed hunter's quest and apply the rewards right away, then save.
    const rows: Row[] = shift.served.map((record) => {
      const buffs = dishBuffs(record.dishId, record.ingredients, s.fresh, s.canteenLevel, record.quality);
      const result = resolveQuest(
        Math.random, HUNTER_TYPES[record.typeId].skill, MONSTERS[record.monsterId], buffs, record.quality, WEAPONS_BY_ID[record.weaponId],
      );
      return { record, buffs, result };
    });
    let questZenny = 0;
    let questRep = 0;
    let levelUp = false;
    const items: Record<string, number> = {};
    for (const { record, result } of rows) {
      for (const id of result.items) {
        s.stock[id] = (s.stock[id] ?? 0) + 1;
        items[id] = (items[id] ?? 0) + 1;
      }
      s.zenny += result.zenny;
      questZenny += result.zenny;
      questRep += addReputation(s, result.reputation);
      if (result.outcome === 'carted') {
        s.stats.carted++;
        s.returning.push({ typeId: record.typeId, monsterId: record.monsterId, armorId: record.armorId, weaponId: record.weaponId });
      } else {
        s.stats.questsWon++;
        if (record.monsterId === CANTEEN_QUEST.monsterId && s.canteenLevel < 2) {
          s.canteenLevel = 2;
          levelUp = true;
        }
      }
    }
    const finishedDay = s.day;
    const trialToday = isTrialDay(s);
    const trialPassed = trialToday && s.reputation >= TRIAL_REPUTATION;
    if (trialPassed) s.trialPassed = true;
    advanceDay(s);
    saveGame(s);

    drawWoodBg(this, COLORS.woodDark);
    title(this, 30, 18, `Quest Report: Day ${finishedDay}`, 44, CREAM);
    txt(this, 32, 86, `The Handler: "Here's how the hunters you fed got on out there!"`, 28, GOLD);
    txt(this, 1890, 40, `Served ${shift.served.length}   Walked out ${shift.walkouts}   Earned ${shift.earned}z`, 28, CREAM)
      .setOrigin(1, 0.5);

    this.cards = [];
    this.revealed = 0;
    this.tips = new HandlerTips(this, () => session.state, { onSeen: () => saveGame(session.state) });
    if (rows.length === 0) {
      txt(this, W / 2, 440, 'No hunters went out on a quest today...\nSeat hunters quickly and serve them before their hearts run out!', 36, CREAM, { align: 'center' })
        .setOrigin(0.5);
    }
    rows.slice(0, MAX_CARDS).forEach((row, i) => this.makeCard(row, 30 + (i % COLS) * (CARD_W + 15), 132 + Math.floor(i / COLS) * (CARD_H + 12)));
    if (rows.length > MAX_CARDS) {
      txt(this, W / 2, 836, `...and ${rows.length - MAX_CARDS} more hunters`, 26, CREAM).setOrigin(0.5);
    }

    // Footer with totals, hidden until all cards are revealed.
    this.footer = this.add.container(0, 0).setAlpha(0);
    this.footer.add(panel(this, 30, 856, 1200, 200, 'paper'));
    this.footer.add(txt(this, 60, 880, `Quest rewards: +${questZenny}z   +${questRep} reputation`, 30, INK, { fontStyle: 'bold' }));
    this.footer.add(txt(this, 60, 930, 'Brought back:', 26, INK));
    const entries = Object.entries(items);
    if (entries.length === 0) this.footer.add(txt(this, 230, 930, 'nothing', 26, INK_SOFT));
    entries.forEach(([id, n], i) => {
      const ing = INGREDIENTS[id];
      this.footer.add(badgeIcon(this, 250 + i * 130, 946, ing.icon, 44, ing.tint));
      this.footer.add(txt(this, 278 + i * 130, 946, `x${n}`, 26, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
    });
    this.footer.add(iconText(this, 60, 1012, 'coin', `${s.zenny}z`, 28, INK, 0xb08a2a));
    this.footer.add(iconText(this, 260, 1012, 'star', `${s.reputation} reputation`, 28, INK, 0xd0a020));
    const notes: string[] = [];
    if (levelUp) notes.push(`"${CANTEEN_QUEST.name}" complete! The Canteen levels up: platters now hold 4 ingredients.`);
    if (trialToday) {
      notes.push(trialPassed
        ? 'The Commander: "Rank Trial passed. Your Canteen has the Commission\'s approval!"'
        : `The Commander: "Not yet (${s.reputation}/${TRIAL_REPUTATION}). Try the Rank Trial again tomorrow."`);
    }
    if (s.returning.length) notes.push(`${s.returning.length} carted hunter${s.returning.length > 1 ? 's' : ''} will be back tomorrow.`);
    this.footer.add(txt(this, 1250, 870, notes.join('\n'), 24, levelUp || trialPassed ? GOLD : CREAM, {
      wordWrap: { width: 380 }, lineSpacing: 4,
    }));
    const next = new Button(this, 1770, 1020, 240, 72, `Day ${s.day}`, () => {
      sfx.click();
      this.scene.start('Prep');
    }, { style: 'go', size: 32, icon: 'play' });
    this.footer.add(next);

    this.input.on('pointerdown', () => this.revealAll());
    this.time.addEvent({ delay: 450, repeat: Math.max(0, this.cards.length - 1), startAt: 0, callback: () => this.revealNext() });
    if (this.cards.length === 0) this.showFooter();
  }

  private makeCard({ record, buffs, result }: Row, x: number, y: number): void {
    const cx = x + CARD_W / 2;
    const cy = y + CARD_H / 2;
    const back = this.add.container(cx, cy);
    const bg = this.add.graphics();
    bg.fillStyle(0x8a5a34, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
    bg.lineStyle(6, 0x2a1a0e, 1).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
    bg.fillStyle(0xa83a2a, 1).fillCircle(0, 0, 54);
    back.add(bg);
    back.add(icon(this, 0, 0, 'paw', 60, 0xf7ead0));

    const monster = MONSTERS[record.monsterId];
    const dish = DISHES[record.dishId];
    const armor = ARMOR_BY_ID[record.armorId];
    const weapon = WEAPONS_BY_ID[record.weaponId];
    const front = this.add.container(cx, cy).setScale(0, 1);
    const fg = this.add.graphics();
    fg.fillStyle(COLORS.parchment, 1).fillRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
    fg.lineStyle(6, 0x2a1a0e, 1).strokeRoundedRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 18);
    front.add(fg);
    const L = -CARD_W / 2 + 16;
    front.add(drawHunter(this, armor, record.typeId === 'veteran').setPosition(L + 44, -38).setScale(0.62));
    front.add(txt(this, L + 92, -150, hunterLabel(record.armorId), 22, INK, { fontStyle: 'bold' }));
    front.add(txt(this, L + 92, -124, weapon.name, 19, INK_SOFT));
    front.add(txt(this, L + 92, -94, monster.name, 22, INK, { fontStyle: 'bold' }));
    front.add(stars(this, L + 92, -60, monster.stars, 20));

    const dishName = record.dishId === 'steak' ? SPIT_RESULTS[record.quality] : dish.name;
    front.add(icon(this, L + 14, -10, dish.icon, 30, dish.tint === 0xf2e6c8 ? 0x8a6a4a : dish.tint));
    front.add(txt(this, L + 36, -10, dishName, 20, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
    front.add(txt(this, L, 18, QUALITY_NAMES[record.quality], 20, QUALITY_INK[record.quality], { fontStyle: 'bold' }).setOrigin(0, 0.5));
    const buffText = buffs.stat
      ? `${NEED_LABELS[buffs.stat].name} ${TIER_LABELS[buffs.tier]}`
      : `Stamina +${buffs.stamina}`;
    front.add(txt(this, L + 110, 18, buffText, 18, INK_SOFT).setOrigin(0, 0.5));
    if (buffs.skill) {
      const name = FOOD_SKILLS[buffs.skill].name;
      front.add(txt(this, L, 44, result.skillActive ? `${name}: activated` : `${name}: no luck`, 18,
        result.skillActive ? '#7a3a8a' : INK_SOFT).setOrigin(0, 0.5));
    }
    front.add(txt(this, CARD_W / 2 - 16, 70, `${Math.round(result.chance * 100)}% odds`, 18, INK_SOFT).setOrigin(1, 0.5));
    front.add(iconText(this, L, 100, OUTCOME_ICON[result.outcome], OUTCOME_TEXT[result.outcome], 28, OUTCOME_COLOR[result.outcome],
      Phaser.Display.Color.HexStringToColor(OUTCOME_COLOR[result.outcome]).color));
    if (result.moxieSaved) front.add(txt(this, L, 70, 'Felyne Moxie saved them!', 18, '#7a3a8a', { fontStyle: 'bold' }).setOrigin(0, 0.5));
    // rewards row
    let rx = L;
    if (result.zenny) {
      const z = iconText(this, rx, 146, 'coin', `+${result.zenny}z`, 20, INK, 0xb08a2a);
      front.add(z);
      rx += z.width + 16;
    }
    for (const id of result.items) {
      const ing = INGREDIENTS[id];
      front.add(badgeIcon(this, rx + 16, 146, ing.icon, 32, ing.tint));
      rx += 38;
    }
    if (!result.zenny && result.items.length === 0) front.add(txt(this, L, 146, 'Back tomorrow for a better meal', 18, INK_SOFT).setOrigin(0, 0.5));
    this.cards.push({ back, front });
  }

  private revealNext(): void {
    const card = this.cards[this.revealed];
    if (!card) return;
    this.revealed++;
    sfx.flip();
    this.tweens.add({
      targets: card.back, scaleX: 0, duration: 120,
      onComplete: () => this.tweens.add({ targets: card.front, scaleX: 1, duration: 120 }),
    });
    if (this.revealed >= this.cards.length) this.time.delayedCall(400, () => this.showFooter());
  }

  private revealAll(): void {
    while (this.revealed < this.cards.length) this.revealNext();
  }

  private showFooter(): void {
    if (this.footer.alpha !== 0) return;
    this.tweens.add({ targets: this.footer, alpha: 1, duration: 300 });
    if (this.cards.length) this.tips.show('rep-cards');
    this.tips.show('rep-items');
    this.tips.show('rep-trial');
  }
}
