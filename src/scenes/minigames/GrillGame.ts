import Phaser from 'phaser';
import type { Quality } from '../../core/types';
import { combineQuality, gradeSkewer } from '../../core/cooking';
import { COLORS, txt } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

const RAW = Phaser.Display.Color.ValueToColor(0xe8a0a0);
const GOLD = Phaser.Display.Color.ValueToColor(0xd9902f);
const CHAR = Phaser.Display.Color.ValueToColor(0x2b1a12);

interface Skewer {
  heat: number;
  rate: number;
  side: number; // 0 = first side, 1 = second side, 2 = done
  grades: Quality[];
  g: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  x: number;
}

/** Several skewers cook at different speeds. Flip each one when it turns golden, twice. */
export class GrillGame extends BaseMinigame {
  private skewers: Skewer[] = [];

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void) {
    super(scene, root, done, 'Skewer Grill', 'Tap a skewer when it turns golden to flip it. Space flips the hottest.');

    const grill = scene.add.graphics();
    grill.fillStyle(0x2a2a2a, 1).fillRoundedRect(-230, -90, 460, 210, 8);
    grill.fillStyle(0xd2522a, 0.35).fillRoundedRect(-220, -80, 440, 190, 6);
    grill.lineStyle(4, 0x777777, 1);
    for (let y = -70; y <= 100; y += 24) grill.lineBetween(-220, y, 220, y);
    root.add(grill);

    [-140, 0, 140].forEach((x) => {
      const g = scene.add.graphics();
      const label = txt(scene, x, 135, 'Side 1', 14, '#f7ead0', { fontStyle: 'bold' }).setOrigin(0.5);
      root.add([g, label]);
      const s: Skewer = { heat: 0, rate: this.randRate(), side: 0, grades: [], g, label, x };
      const zone = scene.add.rectangle(x, 15, 100, 220, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => this.flip(s));
      root.add(zone);
      this.skewers.push(s);
    });
    this.onSpace(() => {
      const hot = this.skewers.filter((s) => s.side < 2).sort((a, b) => b.heat - a.heat)[0];
      if (hot) this.flip(hot);
    });
    this.skewers.forEach((s) => this.draw(s));
  }

  private randRate(): number {
    return 1 / Phaser.Math.FloatBetween(1.8, 3.0) / 1000;
  }

  private flip(s: Skewer, forced = false): void {
    if (this.finished || s.side >= 2) return;
    s.grades.push(forced ? 0 : gradeSkewer(s.heat));
    s.side++;
    s.heat = 0;
    s.rate = this.randRate();
    sfx.flip();
    s.label.setText(s.side === 1 ? 'Side 2' : '✔ Done');
    this.scene.tweens.add({ targets: s.g, scaleX: -1, duration: 90, yoyo: true });
    this.draw(s);
    if (this.skewers.every((k) => k.side >= 2)) {
      this.finish(combineQuality(this.skewers.flatMap((k) => k.grades)));
    }
  }

  update(dt: number): void {
    if (this.finished) return;
    for (const s of this.skewers) {
      if (s.side >= 2) continue;
      s.heat += s.rate * dt;
      if (s.heat > 1.3) this.flip(s, true);
      else this.draw(s);
    }
  }

  private draw(s: Skewer): void {
    const g = s.g.clear();
    g.setPosition(s.x, 0);
    let color: number;
    if (s.side >= 2) {
      const avg = combineQuality(s.grades);
      color = avg === 2 ? 0xc07a2a : avg === 1 ? 0xd8a080 : 0x3a2418;
    } else {
      const h = s.heat;
      if (h >= 0.65 && h <= 0.95) color = GOLD.color;
      else {
        const c = h < 0.65
          ? Phaser.Display.Color.Interpolate.ColorWithColor(RAW, GOLD, 100, (h / 0.65) * 100)
          : Phaser.Display.Color.Interpolate.ColorWithColor(GOLD, CHAR, 100, Math.min(100, ((h - 0.95) / 0.35) * 100));
        color = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
      }
    }
    g.fillStyle(0xd8c49a, 1).fillRect(-3, -95, 6, 210);
    const golden = s.side < 2 && s.heat >= 0.65 && s.heat <= 0.95;
    for (let i = 0; i < 3; i++) {
      const y = -55 + i * 50;
      if (golden) g.fillStyle(COLORS.gold, 0.6).fillCircle(0, y, 30);
      g.fillStyle(color, 1).fillRoundedRect(-22, y - 18, 44, 36, 10);
    }
    if (s.side < 2 && s.heat > 0.3) {
      g.fillStyle(0xffffff, 0.3);
      const t = this.scene.time.now / 200;
      for (let i = 0; i < 3; i++) g.fillCircle(Math.sin(t + i * 2) * 14, -105 - ((t * 10 + i * 12) % 30), 4);
    }
  }
}
