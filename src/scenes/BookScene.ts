import Phaser from 'phaser';
import type { Category, Ingredient, SkillGroup } from '../core/types';
import { CATEGORY_STAT } from '../core/platters';
import { DELIVERY_LIST } from '../data/deliveries';
import { FOOD_SKILL_LIST } from '../data/food-skills';
import { CATEGORY_LABELS, GROUP_LABELS, INGREDIENT_LIST, unlockSource } from '../data/ingredients';
import { NEED_LABELS } from '../data/stations';
import { session } from '../session';
import { Button, INK, INK_SOFT, W, badgeIcon, drawWoodBg, fitWidth, iconText, panel, title, txt } from '../ui/theme';
import { sfx } from '../ui/sfx';

type Tab = Category | 'skills';
const TABS: Tab[] = ['meat', 'fish', 'veg', 'field', 'skills'];
const TAB_LABELS: Record<Tab, string> = { ...CATEGORY_LABELS, skills: 'Food skills' } as Record<Tab, string>;
const GROUPS: SkillGroup[] = ['courage', 'resilience', 'vigor', 'acumen', 'artillery'];
const X = 100;
const PANEL_W = W - 200;
const COL = { name: X + 110, group: X + 470, stat: X + 680, source: X + 960, stock: X + PANEL_W - 40 };

/** The Ingredient book: every Canteen ingredient and food skill, and where to get them. */
export class BookScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private tab: Tab = 'meat';

  constructor() {
    super('Book');
  }

  create(): void {
    drawWoodBg(this);
    title(this, W / 2, 70, 'Ingredient Book', 64).setOrigin(0.5);
    TABS.forEach((t, i) => {
      new Button(this, W / 2 + (i - 2) * 260, 160, 240, 60, TAB_LABELS[t], () => {
        sfx.click();
        this.tab = t;
        this.render();
      }, { size: 26 });
    });
    new Button(this, W / 2, 1020, 300, 72, 'Back', () => {
      sfx.click();
      this.scene.start('Prep');
    }, { size: 32 });
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('Prep'));
    this.layer = this.add.container();
    this.render();
  }

  private put<T extends Phaser.GameObjects.GameObject>(o: T): T {
    this.layer.add(o);
    return o;
  }

  private render(): void {
    this.layer.removeAll(true);
    this.put(panel(this, X, 210, PANEL_W, 760, 'paper'));
    // Mark the open tab with a gold bar under its button.
    this.put(this.add.rectangle(W / 2 + (TABS.indexOf(this.tab) - 2) * 260, 196, 200, 6, 0xf2c94c));
    if (this.tab === 'skills') this.drawSkills();
    else this.drawIngredients(this.tab);
  }

  private drawIngredients(cat: Category): void {
    const s = session.state;
    const y0 = 250;
    const head = (x: number, label: string, right = false) =>
      this.put(txt(this, x, y0, label, 22, INK_SOFT, { fontStyle: 'bold' }).setOrigin(right ? 1 : 0, 0.5));
    head(COL.name, 'Ingredient');
    head(COL.group, 'Skill group');
    head(COL.stat, cat === 'field' ? 'Used for' : 'Gives');
    head(COL.source, 'Where to get it');
    head(COL.stock, 'In stock', true);

    INGREDIENT_LIST.filter((i) => i.category === cat).forEach((ing, i) => {
      const y = y0 + 52 + i * 66;
      const locked = ing.unlock === 'delivery' && !s.unlocked.includes(ing.id) && !(s.stock[ing.id] ?? 0);
      const alpha = locked ? 0.45 : 1;
      this.put(this.add.rectangle(X + PANEL_W / 2, y, PANEL_W - 40, 60, i % 2 ? 0xe8d6ae : 0xf1e2c0, 0.6));
      this.put(badgeIcon(this, X + 60, y, ing.icon, 50, ing.tint).setAlpha(alpha));
      this.put(txt(this, COL.name, y, ing.name, 26, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5).setAlpha(alpha));
      this.put(txt(this, COL.group, y, ing.group ? GROUP_LABELS[ing.group] : 'None', 24, INK).setOrigin(0, 0.5).setAlpha(alpha));
      if (cat === 'field') {
        this.put(txt(this, COL.stat, y, fieldUse(ing), 22, INK).setOrigin(0, 0.5));
      } else {
        const need = NEED_LABELS[CATEGORY_STAT[cat]];
        this.put(iconText(this, COL.stat, y, need.icon, need.name, 22, INK, need.tint, false).setAlpha(alpha));
      }
      const source = locked ? `Locked. ${unlockSource(ing)}` : unlockSource(ing);
      this.put(txt(this, COL.source, y, source, 22, locked ? '#b03a2e' : INK_SOFT, { fontStyle: locked ? 'bold' : 'normal' }).setOrigin(0, 0.5));
      const n = s.stock[ing.id] ?? 0;
      this.put(txt(this, COL.stock, y, `x${n}`, 26, n > 0 ? '#3e7a2a' : INK_SOFT, { fontStyle: 'bold' }).setOrigin(1, 0.5));
    });

    const notes: Record<Category, string> = {
      meat: 'Meat gives Attack Up: (S) at 2 ingredients, (M) at 4 and (L) at 6. Eggs come back with hunters.',
      fish: 'Fish gives Defense Up: (S) at 2 ingredients, (M) at 4 and (L) at 6. Hunters also bring back Sushifish.',
      veg: 'Vegetables give Elemental Res Up: (S) at 2 ingredients, (M) at 4 and (L) at 6.',
      field: 'Gathered or carved by hunters on their quests. The Argosy never sells these.',
    };
    this.put(txt(this, X + 40, 948, notes[cat], 22, INK_SOFT).setOrigin(0, 0.5));
  }

  private drawSkills(): void {
    const s = session.state;
    const cardW = 490;
    GROUPS.forEach((g, gi) => {
      const y = 236 + gi * 140;
      const members = INGREDIENT_LIST.filter((i) => i.group === g && (s.unlocked.includes(i.id) || i.unlock === 'field')).length;
      this.put(txt(this, X + 30, y + 44, GROUP_LABELS[g], 30, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5));
      this.put(fitWidth(txt(this, X + 30, y + 80, `${members} known`, 19, INK_SOFT).setOrigin(0, 0.5), 150));
      FOOD_SKILL_LIST.filter((k) => k.group === g).sort((a, b) => a.tier - b.tier).forEach((k, i) => {
        const x = X + 190 + i * (cardW + 14);
        this.put(panel(this, x, y, cardW, 128, 'inset'));
        this.put(iconText(this, x + 14, y + 26, 'palico', k.name, 24, '#7a3a8a', 0x9a5aaa));
        this.put(txt(this, x + cardW - 16, y + 26, `${(k.tier + 1) * 2} ${GROUP_LABELS[g]}`, 19, INK_SOFT, { fontStyle: 'bold' }).setOrigin(1, 0.5));
        this.put(txt(this, x + 16, y + 48, k.description, 19, INK, { wordWrap: { width: cardW - 32 } }));
        this.put(fitWidth(txt(this, x + 16, y + 112, `On the hunt: ${k.questEffect}`, 18, INK_SOFT).setOrigin(0, 0.5), cardW - 32));
      });
    });
    this.put(txt(this, X + 40, 945, 'A platter gives the skill of its biggest skill group. Fresh ingredients raise the activation rating.', 22, INK_SOFT)
      .setOrigin(0, 0.5));
  }
}

/** What a field item is good for in the Canteen. */
function fieldUse(ing: Ingredient): string {
  const uses = ing.id === 'rawMeat' ? ['Well-Done Steak'] : [];
  if (DELIVERY_LIST.some((d) => d.item === ing.id)) uses.push('Delivery');
  uses.push(`sells ${ing.sellPrice ?? 0}z`);
  return uses.join(', ');
}
