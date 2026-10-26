import Phaser from 'phaser';
import type { Ingredient, Quality } from '../../core/types';
import { gradePot, potBand, type PotBand } from '../../core/cooking';
import { COLORS, icon, txt } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

const DURATION = 6000;
/** When each "Add ingredient!" cue opens (ms). */
const CUES = [1200, 2900, 4600];
const RISE = 0.5 / 1000; // heat per ms while stoking
const FALL = 0.32 / 1000; // heat per ms while not
const GAUGE = { x: 330, y: -190, w: 56, h: 400 };

/** Keep the cauldron's heat in the green while stoking the fire, and add the ingredients on cue. */
export class PotGame extends BaseMinigame {
  private band: PotBand;
  private heat = 0.3;
  /** Stoking by mouse and by Space are tracked apart, so clicking the pot doesn't drop a held Space. */
  private stokeMouse = false;
  private stokeKey = false;
  private elapsed = 0;
  private green = 0;
  private hits = 0;
  private cue = -1;
  private cueTaken = false;
  private needle: Phaser.GameObjects.Rectangle;
  private fire: Phaser.GameObjects.Graphics;
  private soup: Phaser.GameObjects.Graphics;
  private prompt: Phaser.GameObjects.Container;
  private timer: Phaser.GameObjects.Rectangle;
  private bubbleT = 0;

  constructor(
    scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void, private ingredients: Ingredient[],
    assist = false,
  ) {
    super(scene, root, done, 'Soup Pot', 'Hold the fire (or Space) to keep the heat in the green. Click the pot on cue!');
    this.band = potBand(assist);

    // Cauldron over the fire. Clicking the pot adds an ingredient; holding the fire stokes it.
    this.fire = scene.add.graphics();
    root.add(this.fire);
    const pot = scene.add.graphics();
    pot.fillStyle(0x2a2a2a, 1).fillEllipse(0, 20, 380, 250);
    pot.fillStyle(0x3a3a3a, 1).fillRect(-200, -100, 400, 34);
    pot.fillStyle(0x1a1a1a, 1).fillEllipse(0, -84, 380, 60);
    root.add(pot);
    this.soup = scene.add.graphics();
    root.add(this.soup);
    const potZone = scene.add.ellipse(0, -10, 420, 300, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    potZone.on('pointerdown', () => this.addIngredient());
    root.add(potZone);
    const fireZone = scene.add.rectangle(0, 205, 480, 90, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
    fireZone.on('pointerdown', () => (this.stokeMouse = true));
    root.add(fireZone);
    root.add(txt(scene, 0, 268, 'Hold here to stoke the fire', 24, '#6b4a30', { fontStyle: 'bold' }).setOrigin(0.5));
    this.listen(scene.input, 'pointerup', () => (this.stokeMouse = false));
    this.onSpace(() => (this.stokeKey = true), () => (this.stokeKey = false));

    // Heat gauge with the green band.
    const { x, y, w, h } = GAUGE;
    root.add(scene.add.rectangle(x, y, w, h, 0x4a3020).setOrigin(0.5, 0).setStrokeStyle(4, COLORS.woodDark));
    root.add(scene.add.rectangle(x, y + h * (1 - this.band.high), w, h * (this.band.high - this.band.low), COLORS.green).setOrigin(0.5, 0));
    root.add(scene.add.rectangle(x, y, w, h * (1 - this.band.high), 0xb03a2e, 0.7).setOrigin(0.5, 0));
    this.needle = scene.add.rectangle(x, y + h, w + 26, 10, 0xffffff).setStrokeStyle(2, 0x000000);
    root.add(this.needle);
    root.add(icon(scene, x, y - 30, 'spit', 40, 0xe8542a));

    // "Add ingredient!" prompt with a shrinking timer bar.
    this.prompt = scene.add.container(0, -170).setVisible(false);
    this.prompt.add(scene.add.rectangle(0, 0, 330, 70, 0xfff1b8).setStrokeStyle(4, COLORS.gold));
    this.prompt.add(txt(scene, 30, -6, 'Add ingredient!', 30, '#3a2414', { fontStyle: 'bold' }).setOrigin(0.5));
    this.timer = scene.add.rectangle(-150, 26, 300, 8, COLORS.green).setOrigin(0, 0.5);
    this.prompt.add(this.timer);
    root.add(this.prompt);
    this.draw();
  }

  private addIngredient(): void {
    if (this.finished || this.cue < 0 || this.cueTaken) return;
    this.cueTaken = true;
    this.hits++;
    sfx.chop();
    const ing = this.ingredients[this.cue % this.ingredients.length];
    const drop = icon(this.scene, 0, -260, ing.icon, 70, ing.tint);
    this.root.add(drop);
    this.scene.tweens.add({ targets: drop, y: -80, scale: 0.4, alpha: 0.2, duration: 380, ease: 'Quad.easeIn', onComplete: () => drop.destroy() });
    this.prompt.setVisible(false);
  }

  update(dt: number): void {
    if (this.finished) return;
    this.elapsed += dt;
    const stoking = this.stokeMouse || this.stokeKey;
    this.heat = Phaser.Math.Clamp(this.heat + (stoking ? RISE : -FALL) * dt, 0, 1);
    if (this.heat >= this.band.low && this.heat <= this.band.high) this.green += dt;

    // Open and close the ingredient cues.
    const open = CUES.findIndex((at) => this.elapsed >= at && this.elapsed < at + this.band.cueMs);
    if (open !== this.cue) {
      if (open >= 0) {
        this.cueTaken = false;
        this.prompt.setVisible(true);
        const ing = this.ingredients[open % this.ingredients.length];
        this.prompt.list.filter((o) => o.name === 'cueIcon').forEach((o) => o.destroy());
        this.prompt.add(icon(this.scene, -128, -6, ing.icon, 44, ing.tint).setName('cueIcon'));
        sfx.flip();
      } else {
        if (!this.cueTaken) sfx.miss();
        this.prompt.setVisible(false);
      }
      this.cue = open;
    }
    if (this.cue >= 0) this.timer.width = 300 * (1 - (this.elapsed - CUES[this.cue]) / this.band.cueMs);

    this.draw();
    if (this.elapsed >= DURATION) this.finish(gradePot(this.green / DURATION, this.hits));
  }

  private draw(): void {
    const { y, h } = GAUGE;
    this.needle.y = y + h * (1 - this.heat);
    const inGreen = this.heat >= this.band.low && this.heat <= this.band.high;
    const s = this.soup.clear();
    s.fillStyle(inGreen ? 0xc8a050 : this.heat > this.band.high ? 0x8a4a2a : 0xb8a070, 1).fillEllipse(0, -80, 340, 44);
    // Bubbles speed up with the heat.
    this.bubbleT += this.heat * 0.2;
    s.fillStyle(0xffffff, 0.45);
    for (let i = 0; i < 5; i++) {
      const phase = (this.bubbleT + i * 1.7) % 6;
      if (phase < this.heat * 6) s.fillCircle(-120 + i * 60, -80 - phase * 4, 6 + phase);
    }
    const f = this.fire.clear();
    const t = this.scene.time.now / 120;
    for (let i = -3; i <= 3; i++) {
      const fh = 30 + this.heat * 70 + Math.sin(t + i * 1.7) * 12;
      f.fillStyle(0xe8542a, 1).fillTriangle(i * 52 - 30, 180, i * 52 + 30, 180, i * 52, 180 - fh);
      f.fillStyle(0xf6c445, 1).fillTriangle(i * 52 - 15, 180, i * 52 + 15, 180, i * 52, 180 - fh * 0.55);
    }
    f.fillStyle(0x5e5e5e, 1).fillRoundedRect(-240, 176, 480, 34, 10);
  }
}
