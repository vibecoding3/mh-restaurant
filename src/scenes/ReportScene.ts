import Phaser from 'phaser';
import { resolveQuest, type QuestResult } from '../core/quests';
import { FINAL_DAY, TRIAL_REPUTATION, advanceDay, rankFor } from '../core/state';
import { saveGame } from '../core/save';
import { HUNTER_TYPES } from '../data/hunters';
import { INGREDIENTS } from '../data/ingredients';
import { MONSTERS } from '../data/monsters';
import { RECIPES } from '../data/recipes';
import { QUALITY_COLORS, QUALITY_LABELS } from '../data/stations';
import { session, type ServedRecord } from '../session';
import { Button, COLORS, CREAM, INK, W, drawHunter, drawWoodBg, panel, txt } from '../ui/theme';
import { sfx } from '../ui/sfx';

const COLS = 6;
const MAX_CARDS = 12;
const OUTCOME_TEXT = { success: '✅ Success!', barely: '😅 Barely made it', carted: '💀 Carted!' };
const OUTCOME_COLOR = { success: '#3e7a2a', barely: '#c07a1a', carted: '#b03a2e' };

interface Row {
  record: ServedRecord;
  result: QuestResult;
}

export class ReportScene extends Phaser.Scene {
  private cards: { back: Phaser.GameObjects.Container; front: Phaser.GameObjects.Container }[] = [];
  private revealed = 0;
  private footer!: Phaser.GameObjects.Container;

  constructor() {
    super('Report');
  }

  create(): void {
    const s = session.state;
    const shift = session.shift ?? { served: [], earned: 0, repDelta: 0, angry: 0 };
    session.shift = null;

    // Resolve every fed hunter's quest and apply the rewards right away, then save.
    const rows: Row[] = shift.served.map((record) => ({
      record,
      result: resolveQuest(Math.random, HUNTER_TYPES[record.typeId].skill, MONSTERS[record.monsterId], RECIPES[record.recipeId], record.quality),
    }));
    let questZenny = 0;
    let questRep = 0;
    const drops: Record<string, number> = {};
    for (const { record, result } of rows) {
      const drop = MONSTERS[record.monsterId].drop;
      s.stock[drop] = (s.stock[drop] ?? 0) + result.drops;
      if (result.drops) drops[drop] = (drops[drop] ?? 0) + result.drops;
      s.zenny += result.zenny;
      s.reputation += result.reputation;
      questZenny += result.zenny;
      questRep += result.reputation;
      if (result.outcome === 'carted') s.stats.carted++;
      else s.stats.questsWon++;
    }
    const finishedDay = s.day;
    advanceDay(s);
    saveGame(s);

    drawWoodBg(this, COLORS.woodDark);
    txt(this, 20, 12, `Quest Report: Day ${finishedDay}`, 26, CREAM, { fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 5 });
    txt(this, 20, 46, `Hilde: "Here's how the hunters you fed got on out there!"`, 14, '#f2c94c');
    txt(this, 940, 16, `Served ${shift.served.length}  •  Walked out ${shift.angry}  •  Earned ${shift.earned}z`, 15, CREAM)
      .setOrigin(1, 0);

    this.cards = [];
    this.revealed = 0;
    if (rows.length === 0) {
      txt(this, W / 2, 220, 'No hunters went out on a quest today...\nSeat hunters quickly and serve them before their hearts run out!', 18, CREAM, { align: 'center' })
        .setOrigin(0.5);
    }
    rows.slice(0, MAX_CARDS).forEach((row, i) => this.makeCard(row, 20 + (i % COLS) * 155, 76 + Math.floor(i / COLS) * 172));
    if (rows.length > MAX_CARDS) {
      txt(this, W / 2, 422, `...and ${rows.length - MAX_CARDS} more hunters`, 13, CREAM).setOrigin(0.5);
    }

    // Footer with totals, hidden until all cards are revealed.
    this.footer = this.add.container(0, 0).setAlpha(0);
    this.footer.add(panel(this, 20, 432, 600, 96, COLORS.parchment));
    const dropText = Object.entries(drops).map(([id, n]) => `${INGREDIENTS[id].icon}×${n}`).join('  ') || 'none';
    this.footer.add(txt(this, 36, 442, [
      `Quest rewards: +${questZenny}z   ${questRep >= 0 ? '+' : ''}${questRep}⭐`,
      `Materials brought back: ${dropText}`,
      `Canteen: 💰 ${s.zenny}z   ⭐ ${s.reputation}   ${rankFor(s.reputation)}`,
    ].join('\n'), 15, INK, { lineSpacing: 6 }));
    if (finishedDay === FINAL_DAY) {
      const passed = s.reputation >= TRIAL_REPUTATION;
      this.footer.add(txt(this, 640, 440, passed
        ? `🏆 Rank Trial passed!\nThe Guild approves your canteen.\nKeep cooking in endless mode.`
        : `Rank Trial missed (⭐${s.reputation}/${TRIAL_REPUTATION}).\nThe Guild will keep watching.\nKeep cooking in endless mode!`, 14, passed ? '#f2c94c' : '#ffb4a0', { lineSpacing: 4 }));
    }
    const next = new Button(this, 840, 500, 200, 46, `Day ${s.day} ▶`, () => {
      sfx.click();
      this.scene.start('Prep');
    }, { fill: COLORS.green, size: 18 });
    this.footer.add(next);

    this.input.on('pointerdown', () => this.revealAll());
    this.time.addEvent({ delay: 450, repeat: Math.max(0, this.cards.length - 1), startAt: 0, callback: () => this.revealNext() });
    if (this.cards.length === 0) this.showFooter();
  }

  private makeCard({ record, result }: Row, x: number, y: number): void {
    const back = this.add.container(x + 72, y + 82);
    const bg = this.add.graphics();
    bg.fillStyle(0x8a5a34, 1).fillRoundedRect(-72, -82, 144, 164, 10);
    bg.lineStyle(3, 0x2a1a0e, 1).strokeRoundedRect(-72, -82, 144, 164, 10);
    bg.fillStyle(0xa83a2a, 1).fillCircle(0, 0, 26);
    back.add(bg);
    back.add(txt(this, 0, 0, '🐾', 26).setOrigin(0.5));

    const monster = MONSTERS[record.monsterId];
    const recipe = RECIPES[record.recipeId];
    const front = this.add.container(x + 72, y + 82).setScale(0, 1);
    const fg = this.add.graphics();
    fg.fillStyle(COLORS.parchment, 1).fillRoundedRect(-72, -82, 144, 164, 10);
    fg.lineStyle(3, 0x2a1a0e, 1).strokeRoundedRect(-72, -82, 144, 164, 10);
    front.add(fg);
    const hunter = drawHunter(this, record.armor, record.weapon, record.typeId === 'veteran').setPosition(-46, -16).setScale(0.75);
    front.add(hunter);
    front.add(txt(this, -24, -74, `${record.name}\n${HUNTER_TYPES[record.typeId].label}`, 12, INK, { fontStyle: 'bold' }));
    front.add(txt(this, -24, -44, `vs ${monster.name}\n${'★'.repeat(monster.stars)}`, 11, '#6b4a30'));
    front.add(txt(this, -64, -6, `${recipe.icon} ${recipe.name}`, 11, INK, { fixedWidth: 132 }));
    front.add(txt(this, -64, 10, QUALITY_LABELS[record.quality], 12, QUALITY_COLORS[record.quality], { fontStyle: 'bold', stroke: '#3a2414', strokeThickness: 2 }));
    front.add(txt(this, 64, 10, `${Math.round(result.chance * 100)}% odds`, 11, '#6b4a30').setOrigin(1, 0));
    front.add(txt(this, 0, 36, OUTCOME_TEXT[result.outcome], 14, OUTCOME_COLOR[result.outcome], { fontStyle: 'bold' }).setOrigin(0.5));
    const extra = [
      result.drops ? `+${result.drops} ${INGREDIENTS[monster.drop].icon}` : '',
      result.zenny ? `+${result.zenny}z` : '',
      result.heroicsSaved ? '🐱 Heroics!' : '',
    ].filter(Boolean).join('  ');
    front.add(txt(this, 0, 60, extra || 'no rewards', 12, INK).setOrigin(0.5));
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
    if (this.footer.alpha === 0) this.tweens.add({ targets: this.footer, alpha: 1, duration: 300 });
  }
}
