import Phaser from 'phaser';
import type { HunterType, Monster, Quality, Recipe, StationId } from '../core/types';
import { chooseOrder, consumeIngredients, dishPayment, recipeHasBuff } from '../core/economy';
import { combineQuality, spitWindow } from '../core/cooking';
import { monsterPool } from '../core/quests';
import { hasUpgrade } from '../core/state';
import { HUNTER_NAMES, HUNTER_TYPES, WEAPONS, ARMOR_COLORS } from '../data/hunters';
import { INGREDIENTS } from '../data/ingredients';
import { MONSTER_LIST } from '../data/monsters';
import { RECIPES } from '../data/recipes';
import { BUFF_LABELS, QUALITY_COLORS, STATIONS, STATION_ORDER } from '../data/stations';
import { session, type ShiftSummary } from '../session';
import { Button, COLORS, CREAM, H, INK, W, drawHunter, drawPalico, floatText, panel, txt } from '../ui/theme';
import { isMuted, sfx, toggleMute } from '../ui/sfx';
import type { Minigame } from './minigames/base';
import { SpitGame } from './minigames/SpitGame';
import { BoardGame } from './minigames/BoardGame';
import { GrillGame } from './minigames/GrillGame';

// `?shift=<seconds>` shortens the shift for quick playtests.
const SHIFT_MS = (Number(new URLSearchParams(location.search).get('shift')) || 120) * 1000;
const TABLE_X = [250, 390, 530, 670, 810];
const SEAT_Y = 252;
const QUEUE_SLOTS = [{ x: 66, y: 300 }, { x: 128, y: 326 }, { x: 186, y: 300 }];
const DOOR = { x: -30, y: 306 };
const QUEUE_DRAIN = 0.75;
const QUEUE_DRAIN_CLOSING = 2;
const ANGRY_REP = 5;

type HunterState = 'walking' | 'queue' | 'deciding' | 'waiting' | 'eating';

interface Ticket {
  recipe: Recipe;
  step: number;
  grades: Quality[];
  quality: Quality | null;
  view: Phaser.GameObjects.Container;
}

interface Hunter {
  id: number;
  name: string;
  type: HunterType;
  monster: Monster;
  armor: number;
  weapon: string;
  patience: number;
  patienceMax: number;
  state: HunterState;
  table: number;
  timer: number;
  view: Phaser.GameObjects.Container;
  hearts: Phaser.GameObjects.Text;
  bubble: Phaser.GameObjects.Text;
  ticket: Ticket | null;
}

interface StationView {
  frame: Phaser.GameObjects.Rectangle;
  count: Phaser.GameObjects.Text;
}

export class ServiceScene extends Phaser.Scene {
  private hunters: Hunter[] = [];
  private tables: (Hunter | null)[] = [];
  private queue: Hunter[] = [];
  private selected: Hunter | null = null;
  private stations = {} as Record<StationId, StationView>;
  private minigame: Minigame | null = null;
  private overlay: Phaser.GameObjects.Container | null = null;
  private pauseLayer: Phaser.GameObjects.Container | null = null;
  private nextId = 1;
  private elapsed = 0;
  private spawnTimer = 0;
  private arrivalsOpen = true;
  private ended = false;
  private summary!: ShiftSummary;
  private hud!: { clock: Phaser.GameObjects.Text; clockBar: Phaser.GameObjects.Rectangle; money: Phaser.GameObjects.Text; rep: Phaser.GameObjects.Text };
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('Service');
  }

  create(): void {
    const s = session.state;
    this.hunters = [];
    this.queue = [];
    this.selected = null;
    this.minigame = null;
    this.overlay = null;
    this.pauseLayer = null;
    this.elapsed = 0;
    this.spawnTimer = 1200;
    this.arrivalsOpen = true;
    this.ended = false;
    this.tables = Array(hasUpgrade(s, 'table') ? 5 : 4).fill(null);
    this.summary = { served: [], earned: 0, repDelta: 0, angry: 0 };
    session.shift = this.summary;

    this.drawRoom();
    this.drawHud();
    this.drawStations();

    const kb = this.input.keyboard;
    (['ONE', 'TWO', 'THREE'] as const).forEach((key, i) => kb?.on(`keydown-${key}`, () => this.useStation(STATION_ORDER[i])));
    kb?.on('keydown-ESC', () => this.togglePause());
    this.events.once('shutdown', () => {
      kb?.removeAllListeners();
      this.minigame?.destroy();
    });

    this.banner(`Day ${s.day}: doors open!`);
    this.setHint('Hunters gather at the door. Tap one to seat them.');
  }

  // ---------------------------------------------------------------- layout

  private drawRoom(): void {
    const g = this.add.graphics();
    // back wall
    g.fillStyle(0x7a4e2e, 1).fillRect(0, 0, W, 200);
    g.fillStyle(0x6a4228, 1);
    for (let x = 0; x < W; x += 48) g.fillRect(x, 0, 3, 200);
    // floor
    g.fillStyle(COLORS.floor, 1).fillRect(0, 200, W, 140);
    g.fillStyle(0x5e4129, 1);
    for (let y = 214; y < 340; y += 18) g.fillRect(0, y, W, 2);
    // door
    g.fillStyle(0x2a1a0e, 1).fillRoundedRect(4, 214, 34, 110, 6);
    g.fillStyle(COLORS.gold, 1).fillCircle(30, 270, 3);
    // banner on wall
    g.fillStyle(0xa83a2a, 1).fillRect(20, 128, 160, 30);
    txt(this, 100, 143, "Hunter's Canteen", 15, CREAM, { fontStyle: 'bold' }).setOrigin(0.5);
    if (hasUpgrade(session.state, 'lanterns')) {
      [300, 500, 700, 900].forEach((x) => {
        g.fillStyle(0xf6c445, 0.18).fillCircle(x, 140, 30);
        g.fillStyle(0xd9542a, 1).fillRoundedRect(x - 9, 128, 18, 24, 6);
      });
    }
    // tables (drawn above seated hunters via depth)
    this.tables.forEach((_, i) => {
      const t = this.add.graphics().setDepth(20);
      const x = TABLE_X[i];
      t.fillStyle(0x000000, 0.25).fillEllipse(x, 300, 110, 22);
      t.fillStyle(0x8a5a34, 1).fillRoundedRect(x - 52, 250, 104, 22, 6);
      t.fillStyle(0x6a4226, 1).fillRect(x - 44, 272, 10, 24).fillRect(x + 34, 272, 10, 24);
      txt(this, x, 261, `Table ${i + 1}`, 11, CREAM).setOrigin(0.5).setDepth(21);
    });
    // ticket rail
    g.fillStyle(0x3e2716, 1).fillRect(0, 40, W, 82);
    g.fillStyle(0x9aa3a8, 1).fillRect(0, 48, W, 4);
    // kitchen counter
    g.fillStyle(0x3e2716, 1).fillRect(0, 336, W, H - 336);
    g.fillStyle(0x9a6a3e, 1).fillRect(0, 336, W, 8);
  }

  private drawHud(): void {
    const s = session.state;
    this.add.rectangle(0, 0, W, 40, 0x2a1a0e).setOrigin(0);
    txt(this, 12, 9, `Day ${s.day}`, 18, CREAM, { fontStyle: 'bold' });
    const clock = txt(this, 90, 9, '08:00', 18, CREAM, { fontStyle: 'bold' });
    this.add.rectangle(160, 20, 160, 10, 0x4a3020).setOrigin(0, 0.5);
    const clockBar = this.add.rectangle(160, 20, 0, 10, COLORS.gold).setOrigin(0, 0.5);
    const money = txt(this, 360, 9, '', 18, CREAM, { fontStyle: 'bold' });
    const rep = txt(this, 500, 9, '', 18, CREAM, { fontStyle: 'bold' });
    this.hud = { clock, clockBar, money, rep };
    const muteBtn: Button = new Button(this, 870, 20, 50, 28, isMuted() ? '🔇' : '🔊',
      () => muteBtn.setText(toggleMute() ? '🔇' : '🔊'), { size: 15 });
    new Button(this, 928, 20, 50, 28, '⏸', () => this.togglePause(), { size: 15 });
    // rail label
    txt(this, 14, 64, '🧾 Orders', 14, CREAM, { fontStyle: 'bold' });
    txt(this, 14, 84, 'Tap a ticket\nto pick it', 11, '#c9b08a');
    this.refreshHud();
  }

  private refreshHud(): void {
    const s = session.state;
    this.hud.money.setText(`💰 ${s.zenny}z`);
    this.hud.rep.setText(`⭐ ${s.reputation}`);
    const frac = Math.min(1, this.elapsed / SHIFT_MS);
    const minutes = 8 * 60 + Math.floor(frac * 6 * 60);
    this.hud.clock.setText(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    this.hud.clockBar.width = 160 * frac;
  }

  private drawStations(): void {
    STATION_ORDER.forEach((st, i) => {
      const x = 20 + i * 256;
      const info = STATIONS[st];
      const frame = this.add.rectangle(x, 354, 240, 170, 0x5b3a24).setOrigin(0).setStrokeStyle(3, 0x2a1a0e)
        .setInteractive({ useHandCursor: true });
      frame.on('pointerdown', () => this.useStation(st));
      const g = this.add.graphics();
      this.drawStationArt(g, st, x + 120, 450);
      txt(this, x + 12, 362, `${info.key}  ${info.name}`, 17, CREAM, { fontStyle: 'bold' });
      const count = txt(this, x + 228, 500, '', 13, '#f2c94c', { fontStyle: 'bold' }).setOrigin(1, 0.5);
      this.stations[st] = { frame, count };
    });
    drawPalico(this, 880, 512).setScale(1.1);
    this.hint = txt(this, 880, 360, '', 12, CREAM, { wordWrap: { width: 150 }, align: 'center' }).setOrigin(0.5, 0);
  }

  private drawStationArt(g: Phaser.GameObjects.Graphics, st: StationId, cx: number, cy: number): void {
    if (st === 'board') {
      g.fillStyle(0xc89a62, 1).fillRoundedRect(cx - 80, cy - 30, 160, 70, 10);
      g.fillStyle(0x9aa3a8, 1).fillRect(cx + 10, cy - 10, 60, 10);
      g.fillStyle(0x3e2716, 1).fillRect(cx - 20, cy - 10, 30, 10);
      g.fillStyle(0x6c9a4b, 1).fillCircle(cx - 50, cy + 10, 12);
      g.fillStyle(0xd96b6b, 1).fillEllipse(cx - 20, cy + 18, 30, 18);
    } else if (st === 'spit') {
      g.fillStyle(0x2a1a0e, 1).fillRect(cx - 70, cy - 30, 8, 70).fillRect(cx + 62, cy - 30, 8, 70);
      g.fillStyle(0x9aa3a8, 1).fillRect(cx - 70, cy - 22, 140, 4);
      g.fillStyle(0xa0582a, 1).fillEllipse(cx, cy - 20, 70, 40);
      g.fillStyle(0xe8542a, 1).fillTriangle(cx - 40, cy + 40, cx - 20, cy + 40, cx - 30, cy + 10)
        .fillTriangle(cx - 10, cy + 40, cx + 10, cy + 40, cx, cy + 5).fillTriangle(cx + 20, cy + 40, cx + 40, cy + 40, cx + 30, cy + 12);
    } else {
      g.fillStyle(0x2a2a2a, 1).fillRoundedRect(cx - 80, cy - 25, 160, 60, 6);
      g.lineStyle(3, 0x777777, 1);
      for (let y = cy - 15; y < cy + 35; y += 12) g.lineBetween(cx - 75, y, cx + 75, y);
      [-40, 0, 40].forEach((dx) => {
        g.fillStyle(0xd8c49a, 1).fillRect(cx + dx - 2, cy - 35, 4, 70);
        g.fillStyle(0xd9902f, 1).fillRoundedRect(cx + dx - 10, cy - 20, 20, 16, 5).fillRoundedRect(cx + dx - 10, cy + 2, 20, 16, 5);
      });
    }
  }

  private refreshStations(): void {
    const next = this.selected?.ticket ? this.nextStation(this.selected.ticket) : null;
    STATION_ORDER.forEach((st) => {
      const n = this.waitingTickets().filter((t) => this.nextStation(t) === st).length;
      const v = this.stations[st];
      v.count.setText(n > 0 ? `${n} order${n > 1 ? 's' : ''} waiting` : '');
      const lit = next === st;
      v.frame.setStrokeStyle(lit ? 5 : 3, lit ? COLORS.gold : n > 0 ? 0xb07a3a : 0x2a1a0e);
    });
  }

  private setHint(s: string): void {
    this.hint.setText(s);
  }

  private banner(s: string): void {
    const t = txt(this, W / 2, 230, s, 40, '#f2c94c', { fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 8 })
      .setOrigin(0.5).setDepth(800).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut', hold: 1100, yoyo: true, onComplete: () => t.destroy() });
  }

  // ---------------------------------------------------------------- hunters

  private spawnHunter(): void {
    const s = session.state;
    const vetChance = Math.min(0.5, 0.1 + (s.day - 1) * 0.1);
    const type = Math.random() < vetChance ? HUNTER_TYPES.veteran : HUNTER_TYPES.rookie;
    const monster = Phaser.Utils.Array.GetRandom(monsterPool(MONSTER_LIST, s.day)) as Monster;
    const armor = Phaser.Utils.Array.GetRandom(ARMOR_COLORS) as number;
    const weapon = Phaser.Utils.Array.GetRandom(WEAPONS) as string;
    const patienceMax = type.patience * 1000 * (hasUpgrade(s, 'lanterns') ? 1.25 : 1);

    const view = this.add.container(DOOR.x, DOOR.y).setDepth(10);
    const sprite = drawHunter(this, armor, weapon, type.id === 'veteran');
    const wish = BUFF_LABELS[monster.wish];
    const badge = txt(this, -30, -86, wish.icon, 14).setOrigin(0.5);
    const hearts = txt(this, 6, -86, '', 13, '#e04a3a').setOrigin(0.5);
    const bubble = txt(this, 0, -112, '', 22).setOrigin(0.5);
    const hit = this.add.rectangle(0, -38, 50, 84, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    view.add([sprite, badge, hearts, bubble, hit]);

    const h: Hunter = {
      id: this.nextId++, name: Phaser.Utils.Array.GetRandom(HUNTER_NAMES) as string, type, monster, armor, weapon,
      patience: patienceMax, patienceMax, state: 'walking', table: -1, timer: 0, view, hearts, bubble, ticket: null,
    };
    hit.on('pointerdown', () => this.clickHunter(h));
    this.hunters.push(h);
    this.queue.push(h);
    sfx.arrive();
    this.layoutQueue();
    this.drawHearts(h);
  }

  private layoutQueue(): void {
    this.queue.forEach((h, i) => {
      this.tweens.killTweensOf(h.view);
      this.tweens.add({
        targets: h.view, x: QUEUE_SLOTS[i].x, y: QUEUE_SLOTS[i].y, duration: 500,
        onComplete: () => { if (h.state === 'walking') h.state = 'queue'; },
      });
    });
  }

  private clickHunter(h: Hunter): void {
    if (this.overlay || this.pauseLayer) return;
    if (h.state === 'queue' || (h.state === 'walking' && this.queue.includes(h))) this.seat(h);
    else if (h.state === 'waiting' && h.ticket) this.clickTicket(h);
  }

  private seat(h: Hunter): void {
    const table = this.tables.indexOf(null);
    if (table < 0) {
      this.setHint('All tables are taken! Serve someone first.');
      floatText(this, h.view.x, h.view.y - 120, 'No free table!', '#ffb4a0', 14);
      return;
    }
    sfx.click();
    this.queue = this.queue.filter((q) => q !== h);
    this.layoutQueue();
    this.tables[table] = h;
    h.table = table;
    h.state = 'walking';
    this.tweens.killTweensOf(h.view);
    h.patience = Math.min(h.patienceMax, h.patience + h.patienceMax * 0.2);
    this.tweens.add({
      targets: h.view, x: TABLE_X[table], y: SEAT_Y, duration: 550, ease: 'Quad.easeInOut',
      onComplete: () => {
        h.state = 'deciding';
        h.timer = 1000;
        h.bubble.setText('💭');
      },
    });
    this.setHint(`${h.name} is reading the menu...`);
  }

  private placeOrder(h: Hunter): void {
    const s = session.state;
    const menu = s.menu.map((id) => RECIPES[id]);
    const recipe = chooseOrder(Math.random, menu, s.stock, h.monster.wish);
    if (!recipe || !consumeIngredients(s.stock, recipe)) {
      h.bubble.setText('❓');
      floatText(this, h.view.x, h.view.y - 120, 'Out of food?!', '#ffb4a0', 14);
      this.leave(h, true);
      return;
    }
    h.state = 'waiting';
    h.bubble.setText(recipe.icon);
    h.ticket = { recipe, step: 0, grades: [], quality: null, view: this.add.container(TABLE_X[h.table], 86) };
    this.drawTicket(h);
    if (!this.selected) this.select(h);
    this.setHint(`${h.name} wants ${recipe.name}. Tap the glowing station!`);
  }

  private leave(h: Hunter, angry: boolean): void {
    const s = session.state;
    if (angry) {
      sfx.angry();
      h.bubble.setText('💢');
      s.reputation -= ANGRY_REP;
      s.stats.angry++;
      this.summary.repDelta -= ANGRY_REP;
      this.summary.angry++;
      floatText(this, h.view.x, h.view.y - 140, `-${ANGRY_REP}⭐`, '#ff6b5a');
    }
    h.ticket?.view.destroy();
    h.ticket = null;
    if (this.selected === h) this.selected = null;
    if (h.table >= 0) this.tables[h.table] = null;
    if (this.queue.includes(h)) {
      this.queue = this.queue.filter((q) => q !== h);
      this.layoutQueue();
    }
    this.hunters = this.hunters.filter((x) => x !== h);
    h.hearts.setText('');
    this.tweens.killTweensOf(h.view);
    this.tweens.add({
      targets: h.view, x: DOOR.x, y: DOOR.y, duration: 900, delay: 300, onComplete: () => h.view.destroy(),
    });
    this.refreshHud();
    this.refreshStations();
    if (!this.selected) this.autoSelect();
  }

  private drawHearts(h: Hunter): void {
    const frac = Math.max(0, h.patience / h.patienceMax);
    const full = Math.ceil(frac * 5);
    h.hearts.setText('♥'.repeat(full) + '♡'.repeat(5 - full));
    h.hearts.setAlpha(frac < 0.3 ? 0.5 + 0.5 * Math.abs(Math.sin(this.time.now / 150)) : 1);
  }

  // ---------------------------------------------------------------- tickets

  private nextStation(t: Ticket): StationId | null {
    return t.step < t.recipe.stations.length ? t.recipe.stations[t.step] : null;
  }

  private waitingTickets(): Ticket[] {
    return this.hunters.filter((h) => h.state === 'waiting' && h.ticket).map((h) => h.ticket as Ticket);
  }

  private drawTicket(h: Hunter): void {
    const t = h.ticket;
    if (!t) return;
    const c = t.view;
    c.removeAll(true);
    this.tweens.killTweensOf(c);
    c.y = 86;
    const ready = t.quality !== null;
    const sel = this.selected === h;
    const bg = this.add.rectangle(0, 0, 130, 66, ready ? 0xfff1b8 : COLORS.parchment)
      .setStrokeStyle(sel ? 4 : 2, sel ? COLORS.gold : COLORS.woodDark)
      .setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.clickTicket(h));
    c.add(bg);
    c.add(this.add.rectangle(0, -33, 10, 10, 0x9aa3a8)); // clip on the rail
    c.add(txt(this, 0, -19, `${t.recipe.icon} ${t.recipe.name}`, 10, INK, { fontStyle: 'bold' }).setOrigin(0.5));
    t.recipe.stations.forEach((st, i) => {
      const x = -48 + i * 30;
      const done = i < t.step;
      const current = i === t.step && !ready;
      const fill = done ? Phaser.Display.Color.HexStringToColor(QUALITY_COLORS[t.grades[i]]).color : 0xd9c49a;
      c.add(this.add.circle(x, 2, 11, fill).setStrokeStyle(current ? 3 : 1, current ? 0xc0392b : COLORS.woodDark));
      c.add(txt(this, x, 2, STATIONS[st].icon, 11).setOrigin(0.5));
    });
    const status = ready
      ? `READY! ${['Burnt', 'Rare', 'Tasty'][t.quality as number]} • tap`
      : `Next: ${STATIONS[this.nextStation(t) as StationId].name} [${STATIONS[this.nextStation(t) as StationId].key}]`;
    c.add(txt(this, 0, 23, status, 10, ready ? '#3e7a2a' : '#6b4a30', { fontStyle: 'bold' }).setOrigin(0.5));
    if (ready) this.tweens.add({ targets: c, y: 90, duration: 300, yoyo: true, repeat: -1 });
  }

  private select(h: Hunter | null): void {
    const prev = this.selected;
    this.selected = h;
    if (prev?.ticket) this.drawTicket(prev);
    if (h?.ticket) this.drawTicket(h);
    this.refreshStations();
  }

  private autoSelect(): void {
    const next = this.hunters.find((h) => h.state === 'waiting' && h.ticket && h.ticket.quality === null);
    if (next) this.select(next);
  }

  private clickTicket(h: Hunter): void {
    if (this.overlay || this.pauseLayer || !h.ticket) return;
    if (h.ticket.quality !== null) return this.serve(h);
    sfx.click();
    this.select(this.selected === h ? null : h);
  }

  private serve(h: Hunter): void {
    const t = h.ticket;
    if (!t || t.quality === null) return;
    const s = session.state;
    const pay = dishPayment(t.recipe, t.quality, h.patience / h.patienceMax, h.type.tipRate, h.monster.wish);
    s.zenny += pay.total;
    s.reputation += pay.reputation;
    s.stats.served++;
    if (t.quality === 2) s.stats.soTasty++;
    this.summary.earned += pay.total;
    this.summary.repDelta += pay.reputation;
    this.summary.served.push({
      name: h.name, typeId: h.type.id, monsterId: h.monster.id, recipeId: t.recipe.id,
      quality: t.quality, armor: h.armor, weapon: h.weapon,
    });

    // plate flies from the ticket to the table
    const plate = txt(this, t.view.x, t.view.y, t.recipe.icon, 26).setOrigin(0.5).setDepth(30);
    this.tweens.add({ targets: plate, x: h.view.x, y: SEAT_Y - 4, duration: 350, ease: 'Quad.easeIn', onComplete: () => plate.destroy() });
    t.view.destroy();
    h.ticket = null;
    if (this.selected === h) this.selected = null;

    sfx.coin();
    floatText(this, h.view.x, h.view.y - 130, `+${pay.total}z`);
    if (recipeHasBuff(t.recipe, h.monster.wish)) {
      this.time.delayedCall(250, () => floatText(this, h.view.x, h.view.y - 105, `${BUFF_LABELS[h.monster.wish].icon} Buff match!`, '#9be36a', 14));
    }
    h.state = 'eating';
    h.timer = 1800;
    h.bubble.setText(t.quality === 0 ? '🤢' : '😋');
    h.hearts.setText('');
    this.refreshHud();
    this.refreshStations();
    this.autoSelect();
    this.setHint(`${h.name} heads to hunt ${h.monster.name}. Good luck!`);
  }

  // ---------------------------------------------------------------- stations

  private useStation(st: StationId): void {
    if (this.overlay || this.pauseLayer || this.ended) return;
    let h: Hunter | undefined;
    const selNext = this.selected?.ticket ? this.nextStation(this.selected.ticket) : null;
    if (selNext === st && this.selected) h = this.selected;
    else {
      h = this.hunters.find((x) => x.state === 'waiting' && x.ticket && this.nextStation(x.ticket) === st);
      if (!h) {
        const msg = selNext
          ? `That order needs the ${STATIONS[selNext].name} next.`
          : `No order needs the ${STATIONS[st].name} right now.`;
        this.setHint(msg);
        floatText(this, 140 + STATION_ORDER.indexOf(st) * 256, 400, 'Nothing to cook here', '#ffb4a0', 14);
        return;
      }
      this.select(h);
    }
    this.openMinigame(h, st);
  }

  private openMinigame(h: Hunter, st: StationId): void {
    const t = h.ticket as Ticket;
    sfx.click();
    const o = this.add.container(0, 0).setDepth(500);
    o.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());
    o.add(panel(this, W / 2 - 290, 108, 580, 400));
    const root = this.add.container(W / 2, 300);
    o.add(root);
    o.add(txt(this, W / 2, 492, `Table ${h.table + 1}: ${t.recipe.icon} ${t.recipe.name} for ${h.name}`, 13, '#6b4a30').setOrigin(0.5));
    this.overlay = o;

    const done = (q: Quality) => this.closeMinigame(h, q);
    if (st === 'spit') this.minigame = new SpitGame(this, root, done, spitWindow(hasUpgrade(session.state, 'spit')));
    else if (st === 'grill') this.minigame = new GrillGame(this, root, done);
    else this.minigame = new BoardGame(this, root, done, Object.keys(t.recipe.ingredients).map((id) => INGREDIENTS[id].icon));
  }

  private closeMinigame(h: Hunter, q: Quality): void {
    this.minigame?.destroy();
    this.minigame = null;
    this.overlay?.destroy();
    this.overlay = null;
    const t = h.ticket;
    if (!t || h.state !== 'waiting') {
      this.setHint(`${h.name} already left... the dish goes to the Palicos.`);
      return;
    }
    t.grades.push(q);
    t.step++;
    if (t.step >= t.recipe.stations.length) {
      t.quality = combineQuality(t.grades);
      this.setHint(`${t.recipe.name} is ready! Tap the ticket or ${h.name} to serve.`);
    } else {
      this.setHint(`Now take it to the ${STATIONS[this.nextStation(t) as StationId].name}.`);
    }
    this.drawTicket(h);
    this.refreshStations();
  }

  // ---------------------------------------------------------------- pause

  private togglePause(): void {
    if (this.ended) return;
    if (this.pauseLayer) {
      this.pauseLayer.destroy();
      this.pauseLayer = null;
      this.tweens.resumeAll();
      this.time.paused = false;
      return;
    }
    this.tweens.pauseAll();
    this.time.paused = true;
    const p = this.add.container(0, 0).setDepth(900);
    const dim = this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
    p.add(dim);
    p.add(txt(this, W / 2, H / 2 - 40, 'Paused', 48, '#f2c94c', { fontStyle: 'bold' }).setOrigin(0.5));
    p.add(new Button(this, W / 2, H / 2 + 30, 200, 46, 'Resume', () => this.togglePause(), { fill: COLORS.green, size: 18 }));
    p.add(new Button(this, W / 2, H / 2 + 90, 200, 40, 'Quit to Title', () => this.scene.start('Title'), { size: 14 }));
    this.pauseLayer = p;
  }

  // ---------------------------------------------------------------- loop

  update(_time: number, delta: number): void {
    if (this.pauseLayer || this.ended) return;
    const dt = Math.min(delta, 100);
    this.minigame?.update(dt);

    this.elapsed += dt;
    if (this.arrivalsOpen && this.elapsed >= SHIFT_MS) {
      this.arrivalsOpen = false;
      sfx.gong();
      this.banner('Last orders! 🔔');
      this.setHint('No new hunters. Finish serving everyone inside!');
    }

    if (this.arrivalsOpen) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        if (this.queue.length < QUEUE_SLOTS.length) {
          this.spawnHunter();
          const s = session.state;
          const speed = (hasUpgrade(s, 'bell') ? 0.8 : 1) * Math.max(0.75, 1 - (s.day - 1) * 0.05);
          this.spawnTimer = Phaser.Math.Between(7000, 11500) * speed;
        } else {
          this.spawnTimer = 3000;
        }
      }
    }

    for (const h of [...this.hunters]) {
      if (h.state === 'eating') {
        h.timer -= dt;
        if (h.timer <= 0) this.leave(h, false);
        continue;
      }
      if (h.state === 'deciding') {
        h.timer -= dt;
        if (h.timer <= 0) this.placeOrder(h);
      }
      const drain = this.queue.includes(h) ? (this.arrivalsOpen ? QUEUE_DRAIN : QUEUE_DRAIN_CLOSING) : 1;
      h.patience -= dt * drain;
      this.drawHearts(h);
      if (h.patience <= 0) {
        floatText(this, h.view.x, h.view.y - 120, `${h.name} stormed out!`, '#ff6b5a', 13);
        this.leave(h, true);
      }
    }

    this.refreshHud();

    if (!this.arrivalsOpen && this.hunters.length === 0 && !this.overlay) {
      this.ended = true;
      sfx.gong();
      this.banner('Shift over!');
      this.time.delayedCall(1800, () => this.scene.start('Report'));
    }
  }
}
