import Phaser from 'phaser';
import type { ArmorSet, DishId, HunterType, MealBuffs, Monster, Quality, StationId, Weapon } from '../core/types';
import {
  VIP, chooseOrder, consumeIngredients, dishIngredients, dishPayment, meetsNeed, potOpen, raidSteal, stationsFor, vipMonster,
  vipPayment, type MenuOption,
} from '../core/economy';
import { combineQuality, spitWindow } from '../core/cooking';
import { dishBuffs } from '../core/platters';
import { monsterPool } from '../core/quests';
import { TRIAL_GOAL, addReputation, hasUpgrade, isRushDay, isTrialDay, trialProgress } from '../core/state';
import { FIRST_ARRIVAL_MS, RUSH, SHIFT_MS as DEFAULT_SHIFT_MS, arrivalInterval, raidAt, veteranChance, vipAt } from '../core/shift';
import { STAFF_COOK_MS, staffQuality, stationStaff } from '../core/staff';
import { VIPS, VIP_BY_ID, type VipId } from '../data/cast';
import { ARMOR_BY_ID, ARMOR_SETS, HUNTER_TYPES, WEAPONS, WEAPONS_BY_ID, hunterLabel } from '../data/hunters';
import { INGREDIENTS } from '../data/ingredients';
import { MONSTERS, MONSTER_LIST } from '../data/monsters';
import { DISHES } from '../data/dishes';
import { NEED_LABELS, QUALITY_COLORS, QUALITY_NAMES, STATIONS, STATION_ORDER } from '../data/stations';
import { emptyShift, session, type ShiftSummary } from '../session';
import {
  Button, COLORS, CREAM, GOLD, H, INK, INK_SOFT, TITLE_FONT, W, drawHunter, drawPalico, fitWidth, floatText, icon, iconText,
  panel, txt,
} from '../ui/theme';
import { isMuted, sfx, toggleMute } from '../ui/sfx';
import { MUSIC, endInterlude, playInterlude, playMusic } from '../ui/music';
import { settings } from '../ui/settings';
import { PROPS, T, prop, strip } from '../ui/pixel';
import { HandlerTips } from '../ui/tutorial';
import type { Minigame } from './minigames/base';
import { SpitGame } from './minigames/SpitGame';
import { BoardGame } from './minigames/BoardGame';
import { GrillGame } from './minigames/GrillGame';
import { PotGame } from './minigames/PotGame';
import { JagrasRaid } from './events/JagrasRaid';

// `?shift=<seconds>` shortens the shift for quick playtests.
const SHIFT_MS = Number(new URLSearchParams(location.search).get('shift')) * 1000 || DEFAULT_SHIFT_MS;
const TABLE_X = [500, 780, 1060, 1340, 1620];
const SEAT_Y = 504;
const QUEUE_SLOTS = [{ x: 132, y: 600 }, { x: 256, y: 652 }, { x: 372, y: 600 }];
const DOOR = { x: -60, y: 612 };
const RAIL_Y = 162;
const STATION_W = 372;
const stationX = (i: number) => 20 + i * 388;
const QUEUE_DRAIN = 0.75;
const QUEUE_DRAIN_CLOSING = 2;
/** Low punishment: a walkout only costs 1 reputation. */
const WALKOUT_REP = 1;

type HunterState = 'walking' | 'queue' | 'deciding' | 'waiting' | 'eating';

interface Ticket {
  dish: DishId;
  ingredients: string[];
  step: number;
  grades: Quality[];
  quality: Quality | null;
  /** Stations this dish goes through today (the Soup Pot opens on Day 3). */
  stations: StationId[];
  /** True while a kitchen Palico is cooking it. */
  claimed: boolean;
  view: Phaser.GameObjects.Container;
}

interface Hunter {
  id: number;
  type: HunterType;
  monster: Monster;
  armor: ArmorSet;
  weapon: Weapon;
  patience: number;
  patienceMax: number;
  state: HunterState;
  table: number;
  timer: number;
  view: Phaser.GameObjects.Container;
  hearts: Phaser.GameObjects.Image[];
  bubble: Phaser.GameObjects.Image;
  ticket: Ticket | null;
  vip?: VipId;
  /** A VIP's gold name plate, kept at their feet in front of the tables. */
  plate?: Phaser.GameObjects.Container;
}

interface StationView {
  frame: Phaser.GameObjects.Rectangle;
  count: Phaser.GameObjects.Text;
  /** Progress ring for a kitchen Palico's cook. */
  ring: Phaser.GameObjects.Graphics;
  cx: number;
}

/** A kitchen Palico's cook in progress. */
interface StaffCook {
  hunter: Hunter;
  left: number;
}

const pick = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

export class ServiceScene extends Phaser.Scene {
  private hunters: Hunter[] = [];
  private tables: (Hunter | null)[] = [];
  private queue: Hunter[] = [];
  private selected: Hunter | null = null;
  private stations = {} as Record<StationId, StationView>;
  private minigame: Minigame | null = null;
  private overlay: Phaser.GameObjects.Container | null = null;
  private pauseLayer: Phaser.GameObjects.Container | null = null;
  /** True while the pause menu or a Handler tip is up: the shift clock, tweens and timers stop. */
  private paused = false;
  private tips!: HandlerTips;
  private muteBtn!: Button;
  private nextId = 1;
  private elapsed = 0;
  private spawnTimer = 0;
  private arrivalsOpen = true;
  private ended = false;
  private summary!: ShiftSummary;
  private hud!: { clock: Phaser.GameObjects.Text; clockBar: Phaser.GameObjects.Rectangle; money: Phaser.GameObjects.Container; rep: Phaser.GameObjects.Container };
  private hint!: Phaser.GameObjects.Text;
  private goal: Phaser.GameObjects.Text | null = null;
  /** The hunter whose dish is in the open minigame. */
  private cooking: Hunter | null = null;
  private cooks: Partial<Record<StationId, StaffCook>> = {};
  private raid: JagrasRaid | null = null;
  /** Fraction of the shift when today's raid or VIP comes, or null. */
  private raidStart: number | null = null;
  private vipStart: number | null = null;
  private trial = false;
  private rush = false;

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
    this.paused = false;
    this.elapsed = 0;
    this.spawnTimer = FIRST_ARRIVAL_MS;
    this.arrivalsOpen = true;
    this.ended = false;
    this.tables = Array(hasUpgrade(s, 'table') ? 5 : 4).fill(null);
    this.cooking = null;
    this.cooks = {};
    this.raid = null;
    this.goal = null;
    this.trial = isTrialDay(s);
    this.rush = isRushDay(s);
    this.raidStart = this.trial ? null : raidAt(s.day, Math.random);
    this.vipStart = vipAt(s.day, Math.random);
    this.summary = { ...emptyShift(), trial: this.trial, rush: this.rush };
    session.shift = this.summary;

    this.drawRoom();
    this.drawHud();
    this.drawStations();
    playMusic(MUSIC.service);
    this.tips = new HandlerTips(this, () => session.state, { onActive: (on) => this.setPaused(on) });

    const kb = this.input.keyboard;
    (['ONE', 'TWO', 'THREE', 'FOUR'] as const).forEach((key, i) => kb?.on(`keydown-${key}`, () => this.useStation(STATION_ORDER[i])));
    kb?.on('keydown-ESC', () => this.togglePause());
    // Back from Settings: the mute setting may have changed.
    this.events.on('wake', () => this.muteBtn.setIcon(isMuted() ? 'mute' : 'sound'));
    this.events.once('shutdown', () => {
      kb?.removeAllListeners();
      this.events.off('wake');
      this.minigame?.destroy();
      this.raid?.destroy();
    });

    if (this.trial) {
      this.banner("Commander's Rank Trial!");
      this.setHint(`Rank Trial: serve ${TRIAL_GOAL.served} hunters at Rare or better, ${TRIAL_GOAL.needsMet} with what they need.`);
    } else if (this.rush) {
      this.banner('Rush Hour!');
      this.setHint('Everyone is heading out for Zorah Magdaros. Feed as many hunters as you can!');
    } else {
      this.banner(`Day ${s.day}: doors open!`);
      this.setHint('Hunters gather at the door. Click one to seat them.');
    }
  }

  // ---------------------------------------------------------------- layout

  private drawRoom(): void {
    const g = this.add.graphics();
    // back wall: ship timber, as in Astera
    g.fillStyle(0x7a4e2e, 1).fillRect(0, 0, W, 400);
    g.fillStyle(0x6a4228, 1);
    for (let x = 0; x < W; x += 96) g.fillRect(x, 0, 6, 400);
    g.fillStyle(0x5a3820, 1).fillRect(0, 380, W, 20);
    // floor
    g.fillStyle(COLORS.floor, 1).fillRect(0, 400, W, 280);
    g.fillStyle(0x5e4129, 1);
    for (let y = 428; y < 680; y += 36) g.fillRect(0, y, W, 4);
    // door
    g.fillStyle(0x2a1a0e, 1).fillRoundedRect(8, 428, 68, 220, 12);
    g.fillStyle(COLORS.gold, 1).fillCircle(60, 540, 6);
    // Research Commission banner
    g.fillStyle(0xa83a2a, 1).fillRect(40, 268, 340, 64);
    g.fillStyle(0x7a2a1e, 1).fillTriangle(40, 332, 80, 332, 40, 360).fillTriangle(380, 332, 340, 332, 380, 360);
    txt(this, 210, 300, "Hunter's Canteen", 32, CREAM, { fontFamily: TITLE_FONT, fontStyle: 'bold' }).setOrigin(0.5);
    // Wall decor between the tables: Commission maps, trophies and torches.
    const wallY = 268;
    prop(this, 640 - T, wallY, PROPS.map);
    prop(this, 920 - T / 2, wallY, PROPS.shieldRound);
    prop(this, 1200 - T, wallY, PROPS.map);
    prop(this, 1480 - T / 2, wallY, PROPS.shieldKite);
    prop(this, 1760 - T / 2, wallY, PROPS.torch);
    prop(this, 1790, 560, PROPS.plant);
    prop(this, 1720, 576, PROPS.pot);
    if (hasUpgrade(session.state, 'lanterns')) {
      TABLE_X.forEach((x) => {
        g.fillStyle(0xf6c445, 0.18).fillCircle(x, 300, 64);
        g.fillStyle(0x3e2716, 1).fillRect(x - 2, 248, 4, 24);
        g.fillStyle(0xd9542a, 1).fillRoundedRect(x - 18, 272, 36, 48, 12);
      });
    }
    // tables (drawn above seated hunters via depth)
    this.tables.forEach((_, i) => {
      const x = TABLE_X[i];
      this.add.ellipse(x, 536, 220, 30, 0x000000, 0.25).setDepth(19);
      prop(this, x - T * 1.5, 456, PROPS.table).setDepth(20);
      txt(this, x, 486, `Table ${i + 1}`, 22, CREAM, { stroke: '#3a2414', strokeThickness: 4 }).setOrigin(0.5).setDepth(21);
    });
    // ticket rail
    g.fillStyle(0x3e2716, 1).fillRect(0, 80, W, 164);
    g.fillStyle(0x9aa3a8, 1).fillRect(0, 96, W, 8);
    // kitchen: a long counter in front of the stations
    g.fillStyle(0x3e2716, 1).fillRect(0, 688, W, H - 688);
    strip(this, 0, 644, W, PROPS.counterTop[0]);
  }

  private drawHud(): void {
    const s = session.state;
    this.add.rectangle(0, 0, W, 80, 0x2a1a0e).setOrigin(0);
    txt(this, 24, 40, `Day ${s.day}`, 36, CREAM, { fontFamily: TITLE_FONT, fontStyle: 'bold' }).setOrigin(0, 0.5);
    icon(this, 210, 40, 'clock', 36, 0xf7ead0);
    const clock = txt(this, 236, 40, '08:00', 34, CREAM, { fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.rectangle(340, 40, 320, 20, 0x4a3020).setOrigin(0, 0.5);
    const clockBar = this.add.rectangle(340, 40, 0, 20, COLORS.gold).setOrigin(0, 0.5);
    const money = iconText(this, 720, 40, 'coin', '', 34, CREAM, 0xf2c94c);
    const rep = iconText(this, 960, 40, 'star', '', 34, CREAM, 0xf2c94c);
    this.hud = { clock, clockBar, money, rep };
    this.muteBtn = new Button(this, 1740, 40, 100, 56, '', () => this.muteBtn.setIcon(toggleMute() ? 'mute' : 'sound'),
      { icon: isMuted() ? 'mute' : 'sound', size: 28 });
    new Button(this, 1856, 40, 100, 56, '', () => this.togglePause(), { icon: 'pause', size: 28 });
    if (this.trial || this.rush) {
      this.goal = txt(this, 1660, 40, '', 24, GOLD, { fontStyle: 'bold', align: 'right' }).setOrigin(1, 0.5);
    }
    // rail label
    iconText(this, 24, 140, 'scroll', 'Orders', 28, CREAM, 0xf7ead0);
    txt(this, 28, 176, 'Click a ticket\nto pick it', 22, '#c9b08a');
    this.refreshHud();
  }

  private refreshHud(): void {
    const s = session.state;
    (this.hud.money.list[1] as Phaser.GameObjects.Text).setText(`${s.zenny}z`);
    (this.hud.rep.list[1] as Phaser.GameObjects.Text).setText(`${s.reputation}`);
    const frac = Math.min(1, this.elapsed / SHIFT_MS);
    const minutes = 8 * 60 + Math.floor(frac * 6 * 60);
    this.hud.clock.setText(`${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`);
    this.hud.clockBar.width = 320 * frac;
    if (this.goal && this.trial) {
      const t = trialProgress(this.summary.served);
      this.goal.setText(`Rank Trial: ${t.served}/${TRIAL_GOAL.served} served  ${t.needsMet}/${TRIAL_GOAL.needsMet} needs met`)
        .setColor(t.passed ? '#9be36a' : GOLD);
    } else if (this.goal) {
      this.goal.setText(`Rush Hour: +${RUSH.reputation} reputation per meal`);
    }
  }

  private drawStations(): void {
    const s = session.state;
    STATION_ORDER.forEach((st, i) => {
      const x = stationX(i);
      const cx = x + STATION_W / 2;
      const info = STATIONS[st];
      const frame = this.add.rectangle(x, 708, STATION_W, 340, 0x5b3a24).setOrigin(0).setStrokeStyle(6, 0x2a1a0e)
        .setInteractive({ useHandCursor: true });
      frame.on('pointerdown', () => this.useStation(st));
      const g = this.add.graphics();
      this.drawStationArt(g, st, cx, 900);
      this.add.rectangle(x + 32, 744, 40, 40, 0x2a1a0e).setStrokeStyle(2, 0x9a6a3e);
      txt(this, x + 32, 744, info.key, 28, GOLD, { fontStyle: 'bold' }).setOrigin(0.5);
      fitWidth(iconText(this, x + 62, 744, info.icon, info.name, 30, CREAM, 0xf7ead0), STATION_W - 76);
      const count = txt(this, x + STATION_W - 16, 790, '', 22, GOLD, { fontStyle: 'bold' }).setOrigin(1, 0.5);
      const palico = stationStaff(s, st);
      if (palico) {
        drawPalico(this, x + STATION_W - 46, 1036, false).setScale(0.42);
        txt(this, x + 16, 790, 'Kitchen Palico', 20, '#c9e8a0', { fontStyle: 'bold' }).setOrigin(0, 0.5);
      }
      if (st === 'pot' && !potOpen(s)) {
        this.add.rectangle(x, 708, STATION_W, 340, 0x000000, 0.55).setOrigin(0);
        txt(this, cx, 880, 'Opens on Day 3', 30, CREAM, { fontStyle: 'bold' }).setOrigin(0.5);
      }
      const ring = this.add.graphics().setDepth(5);
      this.stations[st] = { frame, count, ring, cx };
    });
    drawPalico(this, 1760, 1040).setScale(0.95);
    panel(this, 1580, 692, 330, 116, 'light');
    this.hint = txt(this, 1745, 750, '', 22, INK, { wordWrap: { width: 300 }, align: 'center' }).setOrigin(0.5);
  }

  private drawStationArt(g: Phaser.GameObjects.Graphics, st: StationId, cx: number, cy: number): void {
    const base = cy + 80; // top of the cabinets along the bottom of the station
    if (st === 'board') {
      strip(this, cx - T * 2.5, base, T * 5, PROPS.cabinets[0]);
      g.fillStyle(0xc89a62, 1).fillRoundedRect(cx - 150, cy - 30, 300, 100, 16);
      g.fillStyle(0xa87a42, 1).fillRect(cx - 150, cy + 56, 300, 14);
      g.fillStyle(0x9aa3a8, 1).fillRect(cx + 30, cy - 4, 100, 32);
      g.fillStyle(0x3e2716, 1).fillRect(cx - 20, cy + 2, 50, 20);
      icon(this, cx - 90, cy + 16, 'herb', 56, 0x6ab04a);
      icon(this, cx - 30, cy + 32, 'meat', 56, 0xc0563a);
    } else if (st === 'spit') {
      // No pack has a spit: the stand and fire stay drawn in code, over a stone fire pit.
      g.fillStyle(0x4a4a4a, 1).fillRoundedRect(cx - 160, base, 320, T, 10);
      g.fillStyle(0x5e5e5e, 1);
      for (let x = cx - 150; x < cx + 130; x += 54) g.fillRoundedRect(x, base + 8, 46, 22, 6).fillRoundedRect(x + 26, base + 36, 46, 22, 6);
      g.fillStyle(0x2a1a0e, 1).fillRect(cx - 140, cy - 60, 16, 140).fillRect(cx + 124, cy - 60, 16, 140);
      g.fillStyle(0x9aa3a8, 1).fillRect(cx - 140, cy - 44, 280, 8);
      g.fillStyle(0xa0582a, 1).fillEllipse(cx, cy - 40, 140, 80);
      g.fillStyle(0xe8542a, 1).fillTriangle(cx - 80, base, cx - 40, base, cx - 60, cy + 20)
        .fillTriangle(cx - 20, base, cx + 20, base, cx, cy + 10).fillTriangle(cx + 40, base, cx + 80, base, cx + 60, cy + 24);
    } else if (st === 'pot') {
      // The Canteen's cauldron, drawn in code, on a stove between two cabinets.
      prop(this, cx - T * 2, base, [PROPS.cabinets[0].slice(0, 1)]);
      prop(this, cx + T, base, [PROPS.cabinets[0].slice(-1)]);
      prop(this, cx - T, base - T, PROPS.stove);
      const pot = this.add.graphics();
      pot.fillStyle(0x2a2a2a, 1).fillEllipse(cx, cy + 6, 220, 140);
      pot.fillStyle(0x3a3a3a, 1).fillRect(cx - 116, cy - 54, 232, 22);
      pot.fillStyle(0xc8a050, 1).fillEllipse(cx, cy - 46, 210, 30);
      pot.fillStyle(0xffffff, 0.35).fillCircle(cx - 40, cy - 70, 10).fillCircle(cx + 20, cy - 84, 14).fillCircle(cx + 56, cy - 66, 8);
    } else {
      // A stove between two cabinets, with the cuts on its grill plate.
      prop(this, cx - T * 2, base, [PROPS.cabinets[0].slice(0, 1)]);
      prop(this, cx + T, base, [PROPS.cabinets[0].slice(-1)]);
      prop(this, cx - T, base - T, PROPS.stove);
      const plate = this.add.graphics(); // above the stove
      plate.fillStyle(0x2a2a2a, 1).fillRoundedRect(cx - 150, cy - 40, 300, 84, 10);
      plate.lineStyle(5, 0x777777, 1);
      for (let y = cy - 24; y < cy + 40; y += 20) plate.lineBetween(cx - 140, y, cx + 140, y);
      [-80, 0, 80].forEach((dx) => plate.fillStyle(0xb06a3a, 1).fillRoundedRect(cx + dx - 26, cy - 30, 52, 64, 16));
    }
  }

  private refreshStations(): void {
    const next = this.selected?.ticket ? this.nextStation(this.selected.ticket) : null;
    STATION_ORDER.forEach((st) => {
      const n = this.waitingTickets().filter((t) => this.nextStation(t) === st && !t.claimed).length;
      const v = this.stations[st];
      v.count.setText(n > 0 ? `${n} order${n > 1 ? 's' : ''} waiting` : '');
      const lit = next === st;
      v.frame.setStrokeStyle(lit ? 10 : 6, lit ? COLORS.gold : n > 0 ? 0xb07a3a : 0x2a1a0e);
    });
  }

  private setHint(s: string): void {
    this.hint.setText(s);
  }

  private banner(s: string): void {
    const t = txt(this, W / 2, 460, s, 80, GOLD, { fontFamily: TITLE_FONT, fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 14 })
      .setOrigin(0.5).setDepth(800).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 300, ease: 'Back.easeOut', hold: 1100, yoyo: true, onComplete: () => t.destroy() });
  }

  // ---------------------------------------------------------------- hunters

  private spawnHunter(vip?: VipId): void {
    const s = session.state;
    const back = vip ? undefined : s.returning.shift();
    let type: HunterType;
    let monster: Monster;
    let armor: ArmorSet;
    let weapon: Weapon;
    if (back) {
      // A hunter carted yesterday comes back for a better meal.
      type = HUNTER_TYPES[back.typeId];
      monster = MONSTERS[back.monsterId];
      armor = ARMOR_BY_ID[back.armorId];
      weapon = WEAPONS_BY_ID[back.weaponId];
    } else if (vip) {
      type = HUNTER_TYPES.veteran;
      monster = vipMonster(Math.random, monsterPool(MONSTER_LIST, s.day));
      armor = pick(ARMOR_SETS.filter((a) => a.minDay <= s.day));
      weapon = pick(WEAPONS);
    } else {
      type = Math.random() < veteranChance(s.day) ? HUNTER_TYPES.veteran : HUNTER_TYPES.rookie;
      monster = pick(monsterPool(MONSTER_LIST, s.day));
      armor = pick(ARMOR_SETS.filter((a) => a.minDay <= s.day && (type.id === 'veteran' || a.minDay === 1)));
      weapon = pick(WEAPONS);
    }
    const patienceMax = type.patience * 1000 * (hasUpgrade(s, 'lanterns') ? 1.25 : 1) * (vip ? VIP.patience : 1)
      * (this.rush ? RUSH.patience : 1);

    const view = this.add.container(DOOR.x, DOOR.y).setDepth(10);
    const sprite = drawHunter(this, armor, type.id === 'veteran');
    const need = NEED_LABELS[monster.need];
    const badge = this.add.circle(-70, -196, 22, 0x2a1a0e, 0.85);
    const needIcon = icon(this, -70, -196, need.icon, 32, need.tint);
    const hearts = [0, 1, 2, 3, 4].map((i) => this.add.image(-34 + i * 26, -196, 'heart').setDisplaySize(24, 24).setTint(0xe04a5a));
    const bubble = this.add.image(0, -250, 'think').setDisplaySize(52, 52).setVisible(false);
    const hit = this.add.rectangle(0, -84, 110, 180, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    view.add([sprite, badge, needIcon, ...hearts, bubble, hit]);
    let plate: Phaser.GameObjects.Container | undefined;
    if (vip) {
      const name = txt(this, 0, 0, VIP_BY_ID[vip].name, 20, '#3a2414', { fontStyle: 'bold' }).setOrigin(0.5);
      plate = this.add.container(view.x, view.y + 40, [
        this.add.rectangle(0, 0, name.width + 22, 30, COLORS.gold).setStrokeStyle(3, 0x7a5a1a), name,
      ]).setDepth(22);
    }

    const h: Hunter = {
      id: this.nextId++, type, monster, armor, weapon,
      patience: patienceMax, patienceMax, state: 'walking', table: -1, timer: 0, view, hearts, bubble, ticket: null, vip, plate,
    };
    hit.on('pointerdown', () => this.clickHunter(h));
    this.hunters.push(h);
    this.queue.push(h);
    sfx.arrive();
    this.layoutQueue();
    this.drawHearts(h);
    if (back) this.time.delayedCall(600, () => floatText(this, h.view.x, h.view.y - 290, 'Back after a cart!', '#ffd0a0', 26));
    this.tips.show('svc-seat');
    if (vip) this.tips.show('svc-vip');
  }

  private setBubble(h: Hunter, key: string, tint = 0xffffff): void {
    h.bubble.setTexture(key).setDisplaySize(52, 52).setTint(tint).setVisible(true);
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
      floatText(this, h.view.x, h.view.y - 260, 'No free table!', '#ffb4a0', 28);
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
        this.setBubble(h, 'think', 0xf7ead0);
        this.tips.show('svc-need', { x: h.view.x - 110, y: h.view.y - 280, w: 220, h: 290 });
      },
    });
    this.setHint(`The hunter in ${hunterLabel(h.armor.id)} is reading the menu...`);
  }

  /** Every menu dish the kitchen can make right now, with the buffs it would give. */
  private menuOptions(): MenuOption[] {
    const s = session.state;
    const options: (MenuOption & { ingredients: string[] })[] = [];
    for (const dish of s.menu) {
      const ids = dishIngredients(s, dish);
      if (ids) options.push({ dish, ingredients: ids, buffs: dishBuffs(dish, ids, s.fresh, s.canteenLevel) });
    }
    return options;
  }

  private placeOrder(h: Hunter): void {
    const s = session.state;
    const choice = chooseOrder(Math.random, this.menuOptions(), h.monster.need) as (MenuOption & { ingredients: string[] }) | null;
    if (!choice || !consumeIngredients(s.stock, choice.ingredients)) {
      this.setBubble(h, 'angry', 0xe06a5a);
      floatText(this, h.view.x, h.view.y - 280, 'Out of food?!', '#ffb4a0', 28);
      this.leave(h, true);
      return;
    }
    const dish = DISHES[choice.dish];
    h.state = 'waiting';
    this.setBubble(h, dish.icon, dish.tint);
    h.ticket = {
      dish: choice.dish, ingredients: choice.ingredients, step: 0, grades: [], quality: null,
      stations: stationsFor(choice.dish, s), claimed: false, view: this.add.container(TABLE_X[h.table], RAIL_Y),
    };
    this.drawTicket(h);
    if (!this.selected) this.select(h);
    this.setHint(`${dish.name} for Table ${h.table + 1}. Click the glowing station!`);
    this.tips.show('svc-ticket', { x: TABLE_X[h.table] - 130, y: RAIL_Y - 78, w: 260, h: 146 });
  }

  private leave(h: Hunter, angry: boolean): void {
    const s = session.state;
    if (angry) {
      sfx.angry();
      this.setBubble(h, 'angry', 0xe06a5a);
      const lost = addReputation(s, -(h.vip ? VIP.walkoutRep : WALKOUT_REP));
      s.stats.walkouts++;
      this.summary.repDelta += lost;
      this.summary.walkouts++;
      if (lost) floatText(this, h.view.x, h.view.y - 300, `${lost} reputation`, '#ff6b5a', 28);
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
    h.hearts.forEach((i) => i.setVisible(false));
    this.tweens.killTweensOf(h.view);
    this.tweens.add({
      targets: h.view, x: DOOR.x, y: DOOR.y, duration: 900, delay: 300, onComplete: () => {
        h.view.destroy();
        h.plate?.destroy();
      },
    });
    this.refreshHud();
    this.refreshStations();
    if (!this.selected) this.autoSelect();
  }

  private drawHearts(h: Hunter): void {
    const frac = Math.max(0, h.patience / h.patienceMax);
    const full = Math.ceil(frac * 5);
    const blink = frac < 0.3 ? 0.5 + 0.5 * Math.abs(Math.sin(this.time.now / 150)) : 1;
    h.hearts.forEach((img, i) => img.setAlpha(i < full ? blink : 0.2));
  }

  // ---------------------------------------------------------------- tickets

  private nextStation(t: Ticket): StationId | null {
    return t.step < t.stations.length ? t.stations[t.step] : null;
  }

  private waitingTickets(): Ticket[] {
    return this.hunters.filter((h) => h.state === 'waiting' && h.ticket).map((h) => h.ticket as Ticket);
  }

  private drawTicket(h: Hunter): void {
    const t = h.ticket;
    if (!t) return;
    const c = t.view;
    const dish = DISHES[t.dish];
    c.removeAll(true);
    this.tweens.killTweensOf(c);
    c.y = RAIL_Y;
    const ready = t.quality !== null;
    const sel = this.selected === h;
    const bg = this.add.rectangle(0, 0, 260, 136, ready ? 0xfff1b8 : COLORS.parchment)
      .setStrokeStyle(sel ? 8 : 4, sel ? COLORS.gold : COLORS.woodDark)
      .setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => this.clickTicket(h));
    c.add(bg);
    c.add(this.add.rectangle(0, -68, 20, 20, 0x9aa3a8)); // clip on the rail
    c.add(icon(this, -106, -38, dish.icon, 36, dish.tint === 0xf2e6c8 ? 0x8a6a4a : dish.tint));
    c.add(fitWidth(txt(this, -82, -38, dish.name, 22, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5), 170));
    const need = NEED_LABELS[h.monster.need];
    c.add(icon(this, 108, -38, need.icon, 28, need.tint));
    t.stations.forEach((st, i) => {
      const x = -96 + i * 56;
      const done = i < t.step;
      const current = i === t.step && !ready;
      const fill = done ? Phaser.Display.Color.HexStringToColor(QUALITY_COLORS[t.grades[i]]).color : 0xd9c49a;
      c.add(this.add.circle(x, 6, 22, fill).setStrokeStyle(current ? 6 : 2, current ? 0xc0392b : COLORS.woodDark));
      c.add(icon(this, x, 6, STATIONS[st].icon, 28, 0x3a2414));
    });
    const next = this.nextStation(t);
    const status = ready
      ? `READY: ${QUALITY_NAMES[t.quality as number]}. Click to serve`
      : t.claimed
        ? 'A kitchen Palico is on it'
        : `Next: ${STATIONS[next as StationId].name} [${STATIONS[next as StationId].key}]`;
    c.add(fitWidth(txt(this, 0, 48, status, 20, ready ? '#3e7a2a' : INK_SOFT, { fontStyle: 'bold' }).setOrigin(0.5), 244));
    if (ready) this.tweens.add({ targets: c, y: RAIL_Y + 8, duration: 300, yoyo: true, repeat: -1 });
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
    const dish = DISHES[t.dish];
    const buffs: MealBuffs = dishBuffs(t.dish, t.ingredients, s.fresh, s.canteenLevel, t.quality);
    const matched = meetsNeed(buffs, h.monster.need);
    const pay = (h.vip ? vipPayment : dishPayment)(dish, t.quality, h.patience / h.patienceMax, h.type.tipRate, matched);
    s.zenny += pay.total;
    const rep = addReputation(s, pay.reputation + (this.rush ? RUSH.reputation : 0));
    s.stats.served++;
    if (t.quality === 2) s.stats.soTasty++;
    this.summary.earned += pay.total;
    this.summary.repDelta += rep;
    this.summary.served.push({
      typeId: h.type.id, monsterId: h.monster.id, dishId: t.dish, ingredients: t.ingredients,
      quality: t.quality, armorId: h.armor.id, weaponId: h.weapon.id, matched, vip: h.vip,
    });

    // plate flies from the ticket to the table
    const plate = icon(this, t.view.x, t.view.y, dish.icon, 56, dish.tint === 0xf2e6c8 ? 0xe8d8b8 : dish.tint).setDepth(30);
    this.tweens.add({ targets: plate, x: h.view.x, y: SEAT_Y - 36, duration: 350, ease: 'Quad.easeIn', onComplete: () => plate.destroy() });
    t.view.destroy();
    h.ticket = null;
    if (this.selected === h) this.selected = null;

    sfx.coin();
    floatText(this, h.view.x, h.view.y - 280, `+${pay.total}z`);
    if (matched) {
      const need = NEED_LABELS[h.monster.need];
      this.time.delayedCall(250, () => floatText(this, h.view.x, h.view.y - 230, `${need.name}: just what I needed!`, '#9be36a', 24));
    }
    h.state = 'eating';
    h.timer = 1800;
    this.setBubble(h, t.quality === 0 ? 'sick' : 'eat', t.quality === 0 ? 0x9ab06a : 0xf2c94c);
    h.hearts.forEach((i) => i.setVisible(false));
    this.refreshHud();
    this.refreshStations();
    this.autoSelect();
    this.setHint(`Off to hunt ${h.monster.name} in the ${h.monster.locale}. Good luck!`);
  }

  // ---------------------------------------------------------------- stations

  private useStation(st: StationId): void {
    if (this.overlay || this.pauseLayer || this.ended) return;
    // A station key also answers the Handler's tip about the ticket.
    if (this.tips.active) this.tips.next();
    if (st === 'pot' && !potOpen(session.state)) {
      this.setHint('The Soup Pot opens on Day 3.');
      return;
    }
    let h: Hunter | undefined;
    const selTicket = this.selected?.ticket;
    const selNext = selTicket && !selTicket.claimed ? this.nextStation(selTicket) : null;
    if (selNext === st && this.selected) h = this.selected;
    else {
      h = this.hunters.find((x) => x.state === 'waiting' && x.ticket && !x.ticket.claimed && this.nextStation(x.ticket) === st);
      if (!h) {
        const msg = selNext
          ? `That order needs the ${STATIONS[selNext].name} next.`
          : `No order needs the ${STATIONS[st].name} right now.`;
        this.setHint(msg);
        floatText(this, this.stations[st].cx, 800, 'Nothing to cook here', '#ffb4a0', 28);
        return;
      }
      this.select(h);
    }
    this.openMinigame(h, st);
  }

  private openMinigame(h: Hunter, st: StationId): void {
    const t = h.ticket as Ticket;
    const dish = DISHES[t.dish];
    sfx.click();
    const o = this.add.container(0, 0).setDepth(500);
    o.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());
    o.add(panel(this, W / 2 - 580, 150, 1160, 800, 'paper'));
    const root = this.add.container(W / 2, 560);
    o.add(root);
    o.add(txt(this, W / 2, 908, `Table ${h.table + 1}: ${dish.name} for the hunter in ${hunterLabel(h.armor.id)}`, 26, INK_SOFT).setOrigin(0.5));
    this.overlay = o;
    this.cooking = h;

    const done = (q: Quality) => this.closeMinigame(h, q, st);
    const assist = settings().assist;
    if (st === 'spit') {
      playInterlude(MUSIC.spit);
      this.minigame = new SpitGame(this, root, done, spitWindow(hasUpgrade(session.state, 'spit'), assist));
    } else if (st === 'grill') {
      this.minigame = new GrillGame(this, root, done, assist);
    } else if (st === 'pot') {
      this.minigame = new PotGame(this, root, done, t.ingredients.map((id) => INGREDIENTS[id]), assist);
    } else {
      this.minigame = new BoardGame(this, root, done, t.ingredients.map((id) => INGREDIENTS[id]), { assist });
    }
    this.tips.show(`svc-${st}`);
  }

  private closeMinigame(h: Hunter, q: Quality, st: StationId): void {
    this.minigame?.destroy();
    this.minigame = null;
    this.overlay?.destroy();
    this.overlay = null;
    this.cooking = null;
    if (st === 'spit') endInterlude();
    if (!h.ticket || h.state !== 'waiting') {
      this.setHint('That hunter already left... the dish goes to the kitchen Palicoes.');
      return;
    }
    this.applyGrade(h, q);
  }

  /** Records one station's grade on a ticket, from the player or a kitchen Palico. */
  private applyGrade(h: Hunter, q: Quality): void {
    const t = h.ticket as Ticket;
    t.grades.push(q);
    t.step++;
    const dish = DISHES[t.dish];
    if (t.step >= t.stations.length) {
      t.quality = combineQuality(t.grades);
      this.setHint(`${dish.name} is ready! Click the ticket or the hunter to serve.`);
      this.tips.show('svc-serve', { x: t.view.x - 130, y: RAIL_Y - 78, w: 260, h: 146 });
    } else {
      this.setHint(`Now take it to the ${STATIONS[this.nextStation(t) as StationId].name}.`);
    }
    this.drawTicket(h);
    this.refreshStations();
  }

  // ---------------------------------------------------------------- pause

  /** Stops or restarts the shift: clock, hunters' patience, tweens and timers. */
  private setPaused(on: boolean): void {
    if (this.paused === on) return;
    this.paused = on;
    if (on) this.tweens.pauseAll();
    else this.tweens.resumeAll();
    this.time.paused = on;
  }

  private togglePause(): void {
    if (this.ended || this.tips.active) return;
    if (this.pauseLayer) {
      this.pauseLayer.destroy();
      this.pauseLayer = null;
      this.setPaused(false);
      return;
    }
    this.setPaused(true);
    const p = this.add.container(0, 0).setDepth(900);
    p.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive());
    p.add(txt(this, W / 2, H / 2 - 160, 'Paused', 96, GOLD, { fontFamily: TITLE_FONT, fontStyle: 'bold' }).setOrigin(0.5));
    p.add(new Button(this, W / 2, H / 2 - 20, 400, 88, 'Resume', () => this.togglePause(), { style: 'go', size: 36, icon: 'play' }));
    p.add(new Button(this, W / 2, H / 2 + 90, 400, 76, 'Settings', () => {
      sfx.click();
      this.scene.launch('Settings', { from: 'Service' });
      this.scene.sleep();
    }, { size: 30, icon: 'cog' }));
    p.add(new Button(this, W / 2, H / 2 + 190, 400, 76, 'Quit to Title', () => this.scene.start('Title'), { size: 30 }));
    this.pauseLayer = p;
  }

  // ---------------------------------------------------------------- staff and events

  /** Kitchen Palicoes take the longest-waiting order for their station and cook it on their own. */
  private updateStaff(dt: number): void {
    const s = session.state;
    for (const st of STATION_ORDER) {
      const palico = stationStaff(s, st);
      const v = this.stations[st];
      const cook = this.cooks[st];
      if (!palico || (st === 'pot' && !potOpen(s))) continue;
      if (cook) {
        const t = cook.hunter.ticket;
        if (!t || cook.hunter.state !== 'waiting') {
          this.cooks[st] = undefined;
          v.ring.clear();
          continue;
        }
        cook.left -= dt;
        const frac = 1 - Math.max(0, cook.left) / STAFF_COOK_MS;
        v.ring.clear().lineStyle(10, 0x2a1a0e, 0.6).strokeCircle(v.cx, 900, 46)
          .lineStyle(10, 0x9be36a, 1).beginPath().arc(v.cx, 900, 46, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2).strokePath();
        if (cook.left <= 0) {
          const q = staffQuality(palico);
          palico.cooked++;
          this.summary.staffCooked++;
          t.claimed = false;
          this.cooks[st] = undefined;
          v.ring.clear();
          floatText(this, v.cx, 820, `Kitchen Palico: ${QUALITY_NAMES[q]}`, QUALITY_COLORS[q], 24);
          this.applyGrade(cook.hunter, q);
        }
        continue;
      }
      const next = this.hunters
        .filter((h) => h.state === 'waiting' && h.ticket && h.ticket.quality === null && !h.ticket.claimed && h !== this.cooking
          && this.nextStation(h.ticket) === st)
        .sort((a, b) => a.patience / a.patienceMax - b.patience / b.patienceMax)[0];
      if (next?.ticket) {
        next.ticket.claimed = true;
        this.cooks[st] = { hunter: next, left: STAFF_COOK_MS };
        this.drawTicket(next);
        if (this.selected === next) this.autoSelectOther(next);
        this.refreshStations();
      }
    }
  }

  /** Moves the selection off a ticket a kitchen Palico just took. */
  private autoSelectOther(h: Hunter): void {
    const other = this.hunters.find((x) => x !== h && x.state === 'waiting' && x.ticket && x.ticket.quality === null && !x.ticket.claimed);
    this.select(other ?? null);
  }

  private startRaid(): void {
    const s = session.state;
    this.raid = new JagrasRaid(this, Phaser.Math.Between(3, 5), (x, y) => {
      const id = raidSteal(s, Math.random);
      if (id) {
        this.summary.raided.push(id);
        floatText(this, x, y - 100, `A Jagras ate 1 ${INGREDIENTS[id].name}!`, '#ffb4a0', 26);
      }
    });
    this.setHint('Jagras! Click them to shoo them away from the stock!');
    this.tips.show('svc-raid');
  }

  // ---------------------------------------------------------------- loop

  update(_time: number, delta: number): void {
    if (this.paused || this.ended) return;
    const dt = Math.min(delta, 100);
    this.minigame?.update(dt);

    this.elapsed += dt;
    if (this.arrivalsOpen && this.elapsed >= SHIFT_MS) {
      this.arrivalsOpen = false;
      sfx.gong();
      this.banner('Last orders!');
      this.setHint('No new hunters. Finish serving everyone inside!');
    }

    // Today's VIP regular and Jagras raid.
    if (this.arrivalsOpen && this.vipStart !== null && this.elapsed >= this.vipStart * SHIFT_MS && this.queue.length < QUEUE_SLOTS.length) {
      this.vipStart = null;
      this.spawnHunter(pick(VIPS.map((v) => v.id)));
    }
    if (this.arrivalsOpen && this.raidStart !== null && this.elapsed >= this.raidStart * SHIFT_MS) {
      this.raidStart = null;
      this.startRaid();
    }
    this.raid?.update(dt);
    if (this.raid?.over) {
      this.raid.destroy();
      this.raid = null;
    }
    this.updateStaff(dt);

    if (this.arrivalsOpen) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        if (this.queue.length < QUEUE_SLOTS.length) {
          this.spawnHunter();
          const s = session.state;
          this.spawnTimer = arrivalInterval(s.day, hasUpgrade(s, 'bell'), Math.random, this.rush);
        } else {
          this.spawnTimer = 3000;
        }
      }
    }

    for (const h of [...this.hunters]) {
      h.plate?.setPosition(h.view.x, h.view.y + 40);
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
        floatText(this, h.view.x, h.view.y - 260, 'Walked out!', '#ff6b5a', 26);
        this.leave(h, true);
      }
    }

    this.refreshHud();

    if (!this.arrivalsOpen && this.hunters.length === 0 && !this.overlay && !this.raid) {
      this.ended = true;
      sfx.gong();
      this.banner('Shift over!');
      this.time.delayedCall(1800, () => this.scene.start('Report'));
    }
  }
}
