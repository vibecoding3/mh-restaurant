import Phaser from 'phaser';
import { buyIngredient, buyUpgrade, portions } from '../core/economy';
import { FINAL_DAY, TRIAL_REPUTATION, hasUpgrade, rankFor } from '../core/state';
import { saveGame } from '../core/save';
import { INGREDIENTS, INGREDIENT_LIST } from '../data/ingredients';
import { MAX_MENU, RECIPES, RECIPE_LIST } from '../data/recipes';
import { BUFF_LABELS, STATIONS } from '../data/stations';
import { UPGRADE_LIST } from '../data/upgrades';
import { session } from '../session';
import { Button, COLORS, CREAM, INK, drawWoodBg, floatText, panel, txt } from '../ui/theme';
import { sfx } from '../ui/sfx';

const TIPS = [
  'Each hunter wants a buff (the badge by their hearts). Serve a dish that gives it for bonus tips and better odds on the hunt!',
  'Kulu-Ya-Ku hunters show up from Day 2. They love Stamina, so Kokoto Skewers are a safe bet.',
  'Rathian quests start on Day 3. Without Fire Res, hunters get carted. Spicy Wyvern Steak helps!',
  'Successful hunters bring back monster materials. They unlock the best dishes on the menu.',
  'The Rathian Rib Feast carries Felyne Heroics: a carted hunter limps home instead.',
];

export class PrepScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;

  constructor() {
    super('Prep');
  }

  create(): void {
    drawWoodBg(this);
    this.layer = this.add.container();
    this.render();
  }

  private toast(msg: string): void {
    floatText(this, 480, 300, msg, '#ffb4a0', 18);
  }

  private render(): void {
    this.layer.removeAll(true);
    const s = session.state;
    const L = this.layer;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      L.add(o);
      return o;
    };
    const refresh = () => {
      saveGame(s);
      this.render();
    };

    add(txt(this, 20, 14, `Day ${s.day}: Morning Prep`, 26, CREAM, { fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 5 }));
    add(txt(this, 940, 12, `💰 ${s.zenny}z    ⭐ ${s.reputation}  ${rankFor(s.reputation)}`, 18, CREAM, { fontStyle: 'bold' }).setOrigin(1, 0));
    const trial = s.day <= FINAL_DAY
      ? `Rank Trial: reach ⭐${TRIAL_REPUTATION} by the end of Day ${FINAL_DAY}`
      : 'Endless mode: keep the canteen thriving!';
    add(txt(this, 940, 36, trial, 13, '#f2c94c').setOrigin(1, 0));

    // --- Trader -------------------------------------------------------------
    add(panel(this, 14, 62, 300, 402));
    add(txt(this, 28, 72, "🛒 Bartholo's Stall", 18, INK, { fontStyle: 'bold' }));
    add(txt(this, 28, 96, 'Prices change every day.', 12, '#6b4a30'));
    INGREDIENT_LIST.filter((i) => i.basePrice !== undefined).forEach((ing, i) => {
      const y = 132 + i * 42;
      const price = s.prices[ing.id];
      const cheap = price < (ing.basePrice ?? 0);
      add(txt(this, 26, y - 11, `${ing.icon} ${ing.name}`, 14, INK));
      add(txt(this, 26, y + 6, `${price}z${cheap ? ' ▼ deal' : ''}`, 12, cheap ? '#3e7a2a' : '#6b4a30'));
      add(txt(this, 186, y, `×${s.stock[ing.id] ?? 0}`, 14, INK, { fontStyle: 'bold' }).setOrigin(0.5));
      [1, 5].forEach((qty, j) => {
        const b = add(new Button(this, 236 + j * 44, y, 40, 28, `+${qty}`, () => {
          if (buyIngredient(s, ing.id, qty)) {
            sfx.coin();
            refresh();
          } else this.toast('Not enough Zenny!');
        }, { size: 13 }));
        b.setEnabled(s.zenny >= price * qty);
      });
    });
    add(txt(this, 28, 386, 'Monster materials', 14, INK, { fontStyle: 'bold' }));
    const mats = INGREDIENT_LIST.filter((i) => i.basePrice === undefined)
      .map((i) => `${i.icon} ${i.name} ×${s.stock[i.id] ?? 0}`);
    add(txt(this, 28, 406, mats.join('\n'), 12, '#6b4a30', { lineSpacing: 2 }));

    // --- Menu ---------------------------------------------------------------
    add(panel(this, 326, 62, 336, 402));
    add(txt(this, 340, 72, `📜 Today's Menu (${s.menu.length}/${MAX_MENU})`, 18, INK, { fontStyle: 'bold' }));
    add(txt(this, 340, 96, 'Hunters only order dishes on the menu.', 12, '#6b4a30'));
    RECIPE_LIST.forEach((r, i) => {
      const y = 118 + i * 49;
      const on = s.menu.includes(r.id);
      const n = portions(s.stock, r);
      const row = add(this.add.rectangle(334, y, 320, 45, on ? 0xf6d98a : COLORS.parchmentDark, on ? 1 : 0.5)
        .setOrigin(0, 0).setStrokeStyle(on ? 2 : 0, COLORS.woodDark).setInteractive({ useHandCursor: true }));
      row.on('pointerdown', () => {
        if (on) s.menu = s.menu.filter((id) => id !== r.id);
        else if (s.menu.length >= MAX_MENU) return this.toast(`The menu holds ${MAX_MENU} dishes.`);
        else s.menu.push(r.id);
        sfx.click();
        refresh();
      });
      add(txt(this, 344, y + 4, `${on ? '☑' : '☐'} ${r.icon} ${r.name}`, 14, INK, { fontStyle: 'bold' }));
      const ings = Object.keys(r.ingredients).map((id) => INGREDIENTS[id].icon).join('');
      const stations = r.stations.map((st) => STATIONS[st].icon).join('→');
      const buffs = [
        ...Object.entries(r.buffs).map(([b, v]) => `${BUFF_LABELS[b].icon}${v}`),
        ...(r.skills ?? []).map((k) => BUFF_LABELS[k].icon),
      ].join(' ');
      add(txt(this, 366, y + 25, `${ings}  ${stations}   ${buffs}   ${r.price}z`, 12, '#6b4a30'));
      add(txt(this, 646, y + 6, n > 0 ? `×${n}` : 'none', 13, n > 0 ? '#3e7a2a' : '#b03a2e', { fontStyle: 'bold' }).setOrigin(1, 0));
    });

    // --- Upgrades -----------------------------------------------------------
    add(panel(this, 674, 62, 272, 270));
    add(txt(this, 688, 72, '🔨 Canteen Upgrades', 18, INK, { fontStyle: 'bold' }));
    UPGRADE_LIST.forEach((u, i) => {
      const y = 104 + i * 56;
      const owned = hasUpgrade(s, u.id);
      add(txt(this, 688, y, `${u.icon} ${u.name}`, 14, INK, { fontStyle: 'bold' }));
      add(txt(this, 688, y + 20, u.description, 11, '#6b4a30', { wordWrap: { width: 170 } }));
      const b = add(new Button(this, 896, y + 18, 80, 30, owned ? 'Owned' : `${u.cost}z`, () => {
        if (buyUpgrade(s, u.id)) {
          sfx.coin();
          refresh();
        }
      }, { size: 13, fill: owned ? COLORS.green : COLORS.wood }));
      b.setEnabled(!owned && s.zenny >= u.cost);
    });

    add(panel(this, 674, 342, 272, 122, 0xfff3d6));
    add(txt(this, 688, 350, '🐱 Grandmeowster Kiln says:', 13, INK, { fontStyle: 'bold' }));
    add(txt(this, 688, 370, TIPS[(s.day - 1) % TIPS.length], 12, '#4a3020', { wordWrap: { width: 246 }, lineSpacing: 2 }));

    // --- Footer -------------------------------------------------------------
    add(new Button(this, 70, 500, 110, 40, '◀ Title', () => this.scene.start('Title'), { size: 14 }));
    add(txt(this, 140, 492, '💾 Progress saves automatically each night.', 12, CREAM));
    add(new Button(this, 790, 500, 300, 50, 'Open the canteen! ▶', () => {
      const cookable = s.menu.some((id) => portions(s.stock, RECIPES[id]) > 0);
      if (!cookable) return this.toast('Nothing on the menu can be cooked. Buy ingredients!');
      sfx.click();
      saveGame(s);
      this.scene.start('Service');
    }, { fill: COLORS.green, size: 20 }));
  }
}

