import Phaser from 'phaser';
import type { Ingredient, Quality } from '../../core/types';
import { gradeChop } from '../../core/cooking';
import { COLORS, icon, txt } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

const TARGETS = 5;
const TIME_MS = 4800;
const BAR_W = 800;

/** Chop the ingredients in numbered order before the timer runs out. */
export class BoardGame extends BaseMinigame {
  private next = 0;
  private mistakes = 0;
  private timeLeft = TIME_MS;
  private timerBar: Phaser.GameObjects.Rectangle;
  private targets: Phaser.GameObjects.Container[] = [];

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void, ingredients: Ingredient[]) {
    super(scene, root, done, 'Chopping Board', 'Click the ingredients in order: 1, 2, 3...');

    root.add(scene.add.rectangle(0, 40, 1000, 400, 0xc89a62).setStrokeStyle(8, COLORS.woodLight));
    root.add(scene.add.rectangle(0, -190, BAR_W, 20, 0x4a3020));
    this.timerBar = scene.add.rectangle(-BAR_W / 2, -190, BAR_W, 20, COLORS.green).setOrigin(0, 0.5);
    root.add(this.timerBar);

    const spots: { x: number; y: number }[] = [];
    for (let i = 0; i < TARGETS; i++) {
      let p = { x: 0, y: 0 };
      for (let tries = 0; tries < 50; tries++) {
        p = { x: Phaser.Math.Between(-420, 420), y: Phaser.Math.Between(-110, 190) };
        if (spots.every((s) => Phaser.Math.Distance.Between(s.x, s.y, p.x, p.y) > 156)) break;
      }
      spots.push(p);
      this.targets.push(this.makeTarget(i, p.x, p.y, ingredients[i % ingredients.length]));
    }
    this.highlight();
  }

  private makeTarget(i: number, x: number, y: number, ing: Ingredient): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const circle = this.scene.add.circle(0, 0, 60, 0x4a3020).setStrokeStyle(6, COLORS.woodDark);
    c.add(circle);
    c.add(icon(this.scene, 0, 2, ing.icon, 76, ing.tint));
    c.add(this.scene.add.circle(44, -44, 22, COLORS.woodDark));
    c.add(txt(this.scene, 44, -44, String(i + 1), 28, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5));
    circle.setInteractive({ useHandCursor: true });
    circle.on('pointerdown', () => this.hit(i, c));
    this.root.add(c);
    return c;
  }

  private highlight(): void {
    this.targets.forEach((t, i) => {
      const circle = t.list[0] as Phaser.GameObjects.Arc;
      circle.setStrokeStyle(i === this.next ? 10 : 6, i === this.next ? COLORS.gold : COLORS.woodDark);
    });
  }

  private hit(i: number, c: Phaser.GameObjects.Container): void {
    if (this.finished) return;
    if (i !== this.next) {
      this.mistakes++;
      sfx.miss();
      const circle = c.list[0] as Phaser.GameObjects.Arc;
      circle.setFillStyle(0xe06a5a);
      this.scene.time.delayedCall(180, () => circle.setFillStyle(0x4a3020));
      this.scene.tweens.add({ targets: c, x: c.x + 12, duration: 40, yoyo: true, repeat: 2 });
      return;
    }
    sfx.chop();
    this.next++;
    const slash = this.scene.add.rectangle(c.x, c.y, 160, 8, 0xffffff).setRotation(-0.6);
    this.root.add(slash);
    this.scene.tweens.add({ targets: slash, alpha: 0, duration: 250, onComplete: () => slash.destroy() });
    this.scene.tweens.add({ targets: c, scale: 0, alpha: 0, duration: 180 });
    if (this.next >= TARGETS) this.finish(gradeChop(this.mistakes, false));
    else this.highlight();
  }

  update(dt: number): void {
    if (this.finished) return;
    this.timeLeft -= dt;
    const frac = Math.max(0, this.timeLeft / TIME_MS);
    this.timerBar.width = BAR_W * frac;
    this.timerBar.setFillStyle(frac > 0.3 ? COLORS.green : COLORS.red);
    if (this.timeLeft <= 0) this.finish(gradeChop(this.mistakes, true));
  }
}
