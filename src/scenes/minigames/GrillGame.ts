import Phaser from 'phaser';
import type { Quality } from '../../core/types';
import { combineQuality, gradeGrill, grillGolden } from '../../core/cooking';
import { COLORS, txt } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

const RAW = Phaser.Display.Color.ValueToColor(0xe8a0a0);
const GOLD = Phaser.Display.Color.ValueToColor(0xc8802f);
const CHAR = Phaser.Display.Color.ValueToColor(0x2b1a12);

interface Cut {
  heat: number;
  rate: number;
  side: number; // 0 = first side, 1 = second side, 2 = done
  grades: Quality[];
  g: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  x: number;
}

/** Three cuts sear at different speeds. Flip each one when it turns golden, twice. */
export class GrillGame extends BaseMinigame {
  private cuts: Cut[] = [];
  private golden: { start: number; end: number };

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void, private assist = false) {
    super(scene, root, done, 'Grill', 'Click a cut when it turns golden to flip it. Space flips the hottest.');

    this.golden = grillGolden(assist);
    const grill = scene.add.graphics();
    grill.fillStyle(0x2a2a2a, 1).fillRoundedRect(-460, -180, 920, 420, 16);
    grill.fillStyle(0xd2522a, 0.35).fillRoundedRect(-440, -160, 880, 380, 12);
    grill.lineStyle(8, 0x777777, 1);
    for (let y = -140; y <= 200; y += 48) grill.lineBetween(-440, y, 440, y);
    root.add(grill);

    [-280, 0, 280].forEach((x) => {
      const g = scene.add.graphics();
      const label = txt(scene, x, 270, 'Side 1', 28, '#f7ead0', { fontStyle: 'bold' }).setOrigin(0.5);
      root.add([g, label]);
      const c: Cut = { heat: 0, rate: this.randRate(), side: 0, grades: [], g, label, x };
      const zone = scene.add.rectangle(x, 30, 220, 420, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.flip(c));
      root.add(zone);
      this.cuts.push(c);
    });
    this.onSpace(() => {
      const hot = this.cuts.filter((c) => c.side < 2).sort((a, b) => b.heat - a.heat)[0];
      if (hot) this.flip(hot);
    });
    this.cuts.forEach((c) => this.draw(c));
  }

  private randRate(): number {
    return 1 / Phaser.Math.FloatBetween(1.8, 3.0) / 1000;
  }

  private flip(c: Cut, forced = false): void {
    if (this.finished || c.side >= 2) return;
    c.grades.push(forced ? 0 : gradeGrill(c.heat, this.assist));
    c.side++;
    c.heat = 0;
    c.rate = this.randRate();
    sfx.flip();
    c.label.setText(c.side === 1 ? 'Side 2' : 'Done');
    this.scene.tweens.add({ targets: c.g, scaleX: -1, duration: 90, yoyo: true });
    this.draw(c);
    if (this.cuts.every((k) => k.side >= 2)) {
      this.finish(combineQuality(this.cuts.flatMap((k) => k.grades)));
    }
  }

  update(dt: number): void {
    if (this.finished) return;
    for (const c of this.cuts) {
      if (c.side >= 2) continue;
      c.heat += c.rate * dt;
      if (c.heat > 1.3) this.flip(c, true);
      else this.draw(c);
    }
  }

  private draw(c: Cut): void {
    const g = c.g.clear();
    g.setPosition(c.x, 0);
    let color: number;
    if (c.side >= 2) {
      const avg = combineQuality(c.grades);
      color = avg === 2 ? 0xb06a2a : avg === 1 ? 0xd8a080 : 0x3a2418;
    } else {
      const h = c.heat;
      const { start, end } = this.golden;
      if (h >= start && h <= end) color = GOLD.color;
      else {
        const k = h < start
          ? Phaser.Display.Color.Interpolate.ColorWithColor(RAW, GOLD, 100, (h / start) * 100)
          : Phaser.Display.Color.Interpolate.ColorWithColor(GOLD, CHAR, 100, Math.min(100, ((h - end) / (1.3 - end)) * 100));
        color = Phaser.Display.Color.GetColor(k.r, k.g, k.b);
      }
    }
    const golden = c.side < 2 && c.heat >= this.golden.start && c.heat <= this.golden.end;
    if (golden) g.fillStyle(COLORS.gold, 0.5).fillRoundedRect(-104, -150, 208, 330, 40);
    // a thick cut with a fat cap and sear marks
    g.fillStyle(color, 1).fillRoundedRect(-84, -130, 168, 290, 46);
    g.fillStyle(0xf2e0c8, 0.85).fillRoundedRect(-84, -130, 26, 290, { tl: 46, bl: 46, tr: 0, br: 0 });
    if (c.side > 0 || c.heat > 0.5) {
      g.lineStyle(8, 0x2b1a12, 0.55);
      for (let y = -90; y <= 120; y += 52) g.lineBetween(-50, y + 20, 60, y - 20);
    }
    if (c.side < 2 && c.heat > 0.3) {
      g.fillStyle(0xffffff, 0.3);
      const t = this.scene.time.now / 200;
      for (let i = 0; i < 3; i++) g.fillCircle(Math.sin(t + i * 2) * 28, -170 - ((t * 20 + i * 24) % 60), 8);
    }
  }
}
