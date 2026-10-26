import Phaser from 'phaser';
import type { Category, DishId, PlatterId } from '../core/types';
import {
  buyIngredient, buyUpgrade, completeDelivery, dishIngredients, loadFavorite, portions, saveFavorite, sellItem,
  togglePlatterIngredient,
} from '../core/economy';
import { platterBuffs, slotsFor } from '../core/platters';
import { TRIAL_DAY, TRIAL_REPUTATION, hasUpgrade, isTrialDay } from '../core/state';
import { saveGame } from '../core/save';
import { CAST, HANDLER_TIPS } from '../data/cast';
import { DELIVERY_LIST } from '../data/deliveries';
import { DISHES, PLATTER_IDS } from '../data/dishes';
import { FOOD_SKILLS } from '../data/food-skills';
import { CATEGORY_LABELS, GROUP_LABELS, INGREDIENTS, INGREDIENT_LIST } from '../data/ingredients';
import { NEED_LABELS, TIER_LABELS } from '../data/stations';
import { UPGRADE_LIST } from '../data/upgrades';
import { session } from '../session';
import {
  Button, CREAM, GOLD, INK, INK_SOFT, badgeIcon, drawWoodBg, fitWidth, floatText, icon, iconText, panel, stars, title, txt,
} from '../ui/theme';
import { sfx } from '../ui/sfx';
import { MUSIC, playMusic } from '../ui/music';
import { HandlerTips } from '../ui/tutorial';

const TABS: Category[] = ['meat', 'fish', 'veg', 'field'];
const FRESH_TINT = 0x7ac0e8;

export class PrepScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private tab: Category = 'meat';
  private tips!: HandlerTips;

  constructor() {
    super('Prep');
  }

  create(): void {
    drawWoodBg(this);
    playMusic(MUSIC.town);
    this.layer = this.add.container();
    this.render();
    this.tips = new HandlerTips(this, () => session.state, { onSeen: () => saveGame(session.state) });
    for (const id of ['prep-argosy', 'prep-platter', 'prep-fresh', 'prep-menu', 'prep-open']) this.tips.show(id);
  }

  private toast(msg: string): void {
    floatText(this, 960, 540, msg, '#ffb4a0', 34);
  }

  private put<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.layer.add(o);
    return o;
  }

  private refresh(): void {
    saveGame(session.state);
    this.render();
  }

  private render(): void {
    this.layer.removeAll(true);
    const s = session.state;

    this.put(title(this, 30, 18, `Day ${s.day}: Morning Prep`, 44, CREAM));
    this.put(iconText(this, 1300, 44, 'coin', `${s.zenny}z`, 34, CREAM, 0xf2c94c));
    this.put(iconText(this, 1480, 44, 'star', `${s.reputation}`, 34, CREAM, 0xf2c94c));
    const trial = s.trialPassed
      ? 'Rank Trial passed: Low Rank canteen approved!'
      : isTrialDay(s)
        ? `Rank Trial today: reach ${TRIAL_REPUTATION} reputation`
        : `Rank Trial on Day ${TRIAL_DAY}: ${TRIAL_REPUTATION} reputation`;
    this.put(txt(this, 1890, 44, trial, 24, GOLD, { fontStyle: 'bold', align: 'right', wordWrap: { width: 340 } }).setOrigin(1, 0.5));

    this.drawArgosy();
    this.drawPlatters();
    this.drawSmithy();
    this.drawDeliveries();
    this.drawHandler();

    // Footer
    this.put(new Button(this, 130, 1040, 220, 64, 'Title', () => this.scene.start('Title'), { size: 28, icon: 'save' }));
    this.put(new Button(this, 370, 1040, 220, 64, 'Book', () => {
      sfx.click();
      this.scene.start('Book');
    }, { size: 28, icon: 'book' }));
    this.put(txt(this, 500, 1040, 'Progress saves automatically.', 24, CREAM).setOrigin(0, 0.5));
    this.put(new Button(this, 1660, 1040, 440, 72, 'Open the Canteen!', () => {
      const cookable = s.menu.some((id) => dishIngredients(s, id, () => 0));
      if (!cookable) return this.toast('Nothing on the menu can be cooked. Buy ingredients!');
      sfx.click();
      saveGame(s);
      this.scene.start('Service');
    }, { style: 'go', size: 34, icon: 'play' }));
  }

  // ------------------------------------------------------------- Argosy

  private drawArgosy(): void {
    const s = session.state;
    const X = 24;
    this.put(panel(this, X, 90, 620, 900, 'paper'));
    this.put(iconText(this, X + 24, 132, 'ship', 'The Argosy', 34, INK, 0x6b4a30));
    this.put(txt(this, X + 24, 162, `${CAST.captain[0].toUpperCase()}${CAST.captain.slice(1)}'s prices change every day.`, 22, INK_SOFT));

    TABS.forEach((cat, i) => {
      const on = this.tab === cat;
      this.put(new Button(this, X + 88 + i * 148, 226, 140, 52, CATEGORY_LABELS[cat].replace('Vegetables', 'Veggies').replace('Field items', 'Field'), () => {
        sfx.click();
        this.tab = cat;
        this.render();
      }, { style: on ? 'wood' : 'paper', size: 24 }));
    });

    const rows = INGREDIENT_LIST.filter((ing) => ing.category === this.tab
      && (s.unlocked.includes(ing.id) || ing.unlock === 'field' || (s.stock[ing.id] ?? 0) > 0));
    rows.forEach((ing, i) => {
      const y = 296 + i * 66;
      const fresh = s.fresh.includes(ing.id);
      this.put(this.add.rectangle(X + 310, y, 584, 60, i % 2 ? 0xe8d6ae : 0xf1e2c0, 0.6));
      this.put(badgeIcon(this, X + 46, y, ing.icon, 50, ing.tint));
      this.put(txt(this, X + 80, y - 14, ing.name, 25, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
      this.put(txt(this, X + 80, y + 14, ing.group ? GROUP_LABELS[ing.group] : 'Field item', 19, INK_SOFT).setOrigin(0, 0.5));
      if (fresh) this.put(iconText(this, X + 172, y + 14, 'fresh', 'Fresh today', 19, '#2f6f9a', FRESH_TINT));
      this.put(txt(this, X + 414, y, `x${s.stock[ing.id] ?? 0}`, 26, INK, { fontStyle: 'bold' }).setOrigin(1, 0.5));

      const price = s.prices[ing.id];
      if (ing.basePrice !== undefined && price !== undefined) {
        const cheap = price < ing.basePrice;
        this.put(txt(this, X + 352, y, `${price}z`, 22, cheap ? '#3e7a2a' : INK_SOFT, { fontStyle: cheap ? 'bold' : 'normal' }).setOrigin(1, 0.5));
        [1, 5].forEach((qty, j) => {
          const b = this.put(new Button(this, X + 470 + j * 90, y, 82, 48, `+${qty}`, () => {
            if (buyIngredient(s, ing.id, qty)) {
              sfx.coin();
              this.refresh();
            } else this.toast('Not enough Zenny!');
          }, { size: 24 }));
          b.setEnabled(s.zenny >= price * qty);
        });
      } else if (ing.sellPrice !== undefined) {
        this.put(txt(this, X + 352, y, `sells ${ing.sellPrice}z`, 20, INK_SOFT).setOrigin(1, 0.5));
        const b = this.put(new Button(this, X + 515, y, 172, 48, 'Sell 1', () => {
          if (sellItem(s, ing.id, 1)) {
            sfx.coin();
            this.refresh();
          }
        }, { size: 24, style: 'paper', icon: 'coin', iconTint: 0xb08a2a }));
        b.setEnabled((s.stock[ing.id] ?? 0) > 0);
      }
    });
    if (this.tab !== 'field') {
      this.put(txt(this, X + 24, 950, 'Eggs and Sushifish also come back with hunters.', 21, INK_SOFT));
    } else {
      this.put(txt(this, X + 24, 950, 'Hunters bring these back. Keep some for deliveries!', 21, INK_SOFT));
    }
  }

  // ------------------------------------------------------------- Platters

  private drawPlatters(): void {
    const s = session.state;
    const X = 664;
    const slots = slotsFor(s.canteenLevel);
    this.put(panel(this, X, 90, 640, 900, 'paper'));
    this.put(iconText(this, X + 24, 132, 'platter', 'Set Platters', 34, INK, 0x6b4a30));
    this.put(txt(this, X + 616, 132, `Canteen Lv ${s.canteenLevel}: ${slots} ingredients per platter`, 22, INK_SOFT).setOrigin(1, 0.5));

    PLATTER_IDS.forEach((id, i) => this.drawPlatterCard(id, X + 16, 164 + i * 232, 608, 222));

    (['chefsChoice', 'steak'] as DishId[]).forEach((id, i) => {
      const y = 868 + i * 62;
      const d = DISHES[id];
      this.put(panel(this, X + 16, y - 28, 608, 56, 'inset'));
      this.menuToggle(id, X + 50, y);
      this.put(icon(this, X + 96, y, d.icon, 40, d.tint === 0xf2e6c8 ? 0x8a6a4a : d.tint));
      this.put(txt(this, X + 126, y, d.name, 25, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
      this.put(txt(this, X + 400, y, id === 'steak' ? '+50 Stamina' : 'Fresh first', 20, INK_SOFT).setOrigin(0, 0.5));
      this.portionLabel(id, X + 604, y);
    });
  }

  private menuToggle(id: DishId, x: number, y: number): void {
    const s = session.state;
    const on = s.menu.includes(id);
    const box = this.put(this.add.rectangle(x, y, 38, 38, on ? 0x5f8f3e : 0xf8f0dc).setStrokeStyle(3, 0x3e2716)
      .setInteractive({ useHandCursor: true }));
    if (on) this.put(icon(this, x, y, 'check', 30, 0xffffff));
    box.on('pointerdown', () => {
      s.menu = on ? s.menu.filter((m) => m !== id) : [...s.menu, id];
      sfx.click();
      this.refresh();
    });
  }

  private portionLabel(id: DishId, x: number, y: number): void {
    const n = portions(session.state, id);
    this.put(txt(this, x, y, n > 0 ? `x${n}` : 'none', 25, n > 0 ? '#3e7a2a' : '#b03a2e', { fontStyle: 'bold' }).setOrigin(1, 0.5));
  }

  private drawPlatterCard(id: PlatterId, x: number, y: number, w: number, h: number): void {
    const s = session.state;
    const d = DISHES[id];
    const slots = slotsFor(s.canteenLevel);
    const chosen = s.platters[id];
    this.put(panel(this, x, y, w, h, 'inset'));

    // header
    this.menuToggle(id, x + 34, y + 32);
    this.put(icon(this, x + 80, y + 32, d.icon, 44, d.tint));
    this.put(txt(this, x + 110, y + 32, d.name, 28, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
    this.drawPresets(id, x + 340, y + 32);
    this.portionLabel(id, x + w - 18, y + 32);

    // slots
    for (let i = 0; i < slots; i++) {
      const sx = x + 50 + i * 76;
      const sy = y + 96;
      const ingId = chosen[i];
      const box = this.put(this.add.rectangle(sx, sy, 64, 64, ingId ? 0x4a3020 : 0xd9c49a, 1).setStrokeStyle(3, ingId ? 0x2a1a0e : 0x8a6a4a));
      if (ingId) {
        const ing = INGREDIENTS[ingId];
        this.put(icon(this, sx, sy, ing.icon, 48, ing.tint));
        if (s.fresh.includes(ingId)) this.put(icon(this, sx + 24, sy - 24, 'fresh', 24, FRESH_TINT));
        box.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          togglePlatterIngredient(s, id, ingId);
          sfx.click();
          this.refresh();
        });
      }
    }
    const names = chosen.map((c) => INGREDIENTS[c].name).join(', ');
    this.put(txt(this, x + 40 + slots * 76, y + 96, names || 'Empty: pick ingredients below', 20, INK_SOFT, {
      wordWrap: { width: w - 60 - slots * 76 },
    }).setOrigin(0, 0.5));

    // chips: every ingredient of this category the canteen can stock
    const options = INGREDIENT_LIST.filter((ing) => ing.category === d.category
      && (s.unlocked.includes(ing.id) || (s.stock[ing.id] ?? 0) > 0));
    options.forEach((ing, i) => {
      const cx = x + 36 + i * 56;
      const cy = y + 156;
      const inPlatter = chosen.includes(ing.id);
      const has = (s.stock[ing.id] ?? 0) > 0;
      const chip = this.put(this.add.rectangle(cx, cy, 50, 50, inPlatter ? 0x8a5a2a : 0x4a3020, 1)
        .setStrokeStyle(inPlatter ? 4 : 1, inPlatter ? 0xf2c94c : 0x2a1a0e).setInteractive({ useHandCursor: true }));
      this.put(icon(this, cx, cy, ing.icon, 38, ing.tint).setAlpha(has ? 1 : 0.4));
      if (s.fresh.includes(ing.id)) this.put(icon(this, cx + 19, cy - 19, 'fresh', 20, FRESH_TINT));
      chip.on('pointerdown', () => {
        if (togglePlatterIngredient(s, id, ing.id)) {
          sfx.click();
          this.refresh();
        } else this.toast(`A platter holds ${slots} ingredients. Click one in a slot to remove it.`);
      });
    });

    // resulting buffs
    const b = platterBuffs(chosen, s.fresh, s.canteenLevel);
    const by = y + 198;
    let bx = x + 20;
    const place = (o: Phaser.GameObjects.Container) => {
      this.put(o);
      bx += o.width + 22;
    };
    if (b.stat) {
      const need = NEED_LABELS[b.stat];
      place(iconText(this, bx, by, need.icon, `${need.name} ${TIER_LABELS[b.tier]}`, 21, INK, need.tint));
    } else {
      place(iconText(this, bx, by, 'platter', 'No stat yet (needs 2)', 21, INK_SOFT, 0x8a6a4a, false));
    }
    if (b.health) place(iconText(this, bx, by, 'heart', `+${b.health}`, 21, INK, NEED_LABELS.health.tint));
    if (b.stamina) place(iconText(this, bx, by, 'stamina', `+${b.stamina}`, 21, INK, NEED_LABELS.stamina.tint));
    if (b.skill) {
      place(iconText(this, bx, by, 'palico', FOOD_SKILLS[b.skill].name, 21, '#7a3a8a', 0x9a5aaa));
      this.put(stars(this, bx - 12, by, b.skillStars, 20));
    }
  }

  /** Favorite Platter presets: click an empty one to save, a filled one to load, right-click to overwrite. */
  private drawPresets(id: PlatterId, x: number, y: number): void {
    const s = session.state;
    s.favorites[id].forEach((fav, i) => {
      const bx = x + i * 46;
      const same = !!fav && fav.join() === s.platters[id].join();
      const box = this.put(this.add.rectangle(bx, y, 42, 42, fav ? (same ? 0x8a5a2a : 0x4a3020) : 0xf8f0dc)
        .setStrokeStyle(same ? 4 : 2, same ? 0xf2c94c : 0x3e2716).setInteractive({ useHandCursor: true }));
      this.put(txt(this, bx, y, `${i + 1}`, 24, fav ? CREAM : INK_SOFT, { fontStyle: 'bold' }).setOrigin(0.5));
      box.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (!fav || p.rightButtonDown()) {
          if (!saveFavorite(s, id, i)) return this.toast('Put ingredients on the platter first.');
          sfx.tasty();
          floatText(this, bx, y - 30, `Saved to ${i + 1}`, GOLD, 26);
        } else {
          loadFavorite(s, id, i);
          sfx.click();
        }
        this.refresh();
      });
    });
  }

  // ------------------------------------------------------------- Smithy, deliveries, Handler

  private drawSmithy(): void {
    const s = session.state;
    const X = 1324;
    this.put(panel(this, X, 90, 572, 380, 'paper'));
    this.put(iconText(this, X + 24, 132, 'anvil', 'Smithy Upgrades', 34, INK, 0x6b4a30));
    this.put(txt(this, X + 24, 162, `Built by the ${CAST.smithy}'s team.`, 22, INK_SOFT));
    UPGRADE_LIST.forEach((u, i) => {
      const y = 226 + i * 62;
      const owned = hasUpgrade(s, u.id);
      this.put(icon(this, X + 46, y, u.icon, 44, 0x8a5a2a));
      this.put(txt(this, X + 80, y - 14, u.name, 25, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
      this.put(fitWidth(txt(this, X + 80, y + 14, u.description, 19, INK_SOFT).setOrigin(0, 0.5), 330));
      const b = this.put(new Button(this, X + 490, y, 140, 50, owned ? 'Built' : `${u.cost}z`, () => {
        if (buyUpgrade(s, u.id)) {
          sfx.coin();
          this.refresh();
        }
      }, { size: 24, style: owned ? 'go' : 'wood', icon: owned ? 'check' : undefined }));
      b.setEnabled(!owned && s.zenny >= u.cost);
    });
  }

  private drawDeliveries(): void {
    const s = session.state;
    const X = 1324;
    this.put(panel(this, X, 482, 572, 290, 'paper'));
    this.put(iconText(this, X + 24, 524, 'scroll', 'Delivery Requests', 34, INK, 0x6b4a30));
    this.put(fitWidth(txt(this, X + 24, 552, `The ${CAST.provisions} unlocks new ingredients.`, 20, INK_SOFT), 524));
    DELIVERY_LIST.forEach((d, i) => {
      const y = 604 + i * 58;
      const item = INGREDIENTS[d.item];
      const done = s.deliveries.includes(d.id);
      const have = s.stock[d.item] ?? 0;
      this.put(badgeIcon(this, X + 46, y, item.icon, 44, item.tint));
      this.put(txt(this, X + 76, y - 12, `${d.qty} ${item.name}  (have ${have})`, 23, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
      this.put(fitWidth(txt(this, X + 76, y + 14, d.unlocks.map((u) => INGREDIENTS[u].name).join(', '), 17, INK_SOFT).setOrigin(0, 0.5), 354));
      const b = this.put(new Button(this, X + 500, y, 120, 48, done ? 'Done' : 'Deliver', () => {
        if (completeDelivery(s, d.id)) {
          sfx.tasty();
          this.toast(`New on the Argosy: ${d.unlocks.map((u) => INGREDIENTS[u].name).join(', ')}`);
          this.refresh();
        }
      }, { size: 24, style: done ? 'go' : 'wood', icon: done ? 'check' : undefined }));
      b.setEnabled(!done && have >= d.qty);
    });
  }

  private drawHandler(): void {
    const s = session.state;
    const X = 1324;
    this.put(panel(this, X, 784, 572, 206, 'light'));
    this.put(iconText(this, X + 24, 820, 'paw', "The Handler's tip", 28, INK, 0x8a5a2a));
    this.put(txt(this, X + 24, 846, HANDLER_TIPS[(s.day - 1) % HANDLER_TIPS.length], 22, '#4a3020', {
      wordWrap: { width: 524 }, lineSpacing: 2,
    }));
  }
}
