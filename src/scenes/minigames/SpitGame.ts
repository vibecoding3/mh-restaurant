import Phaser from 'phaser';
import type { Quality } from '../../core/types';
import { gradeSpit, type SpitWindow } from '../../core/cooking';
import { COLORS } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

const FILL_MS = 2600;
const BAR_W = 400;
const RAW = Phaser.Display.Color.ValueToColor(0xe07a7a);
const DONE = Phaser.Display.Color.ValueToColor(0xa0582a);
const CHAR = Phaser.Display.Color.ValueToColor(0x2b1a12);

/** Hold to spin the meat; release while the needle is in the golden window. */
export class SpitGame extends BaseMinigame {
  private meter = 0;
  private holding = false;
  private sizzleTimer = 0;
  private meat: Phaser.GameObjects.Container;
  private meatG: Phaser.GameObjects.Graphics;
  private needle: Phaser.GameObjects.Rectangle;
  private fire: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void, private win: SpitWindow) {
    super(scene, root, done, 'BBQ Spit', 'Hold mouse / touch / Space to spin. Release in the gold!');

    // spit stand
    const stand = scene.add.graphics();
    stand.fillStyle(COLORS.woodDark, 1).fillRect(-150, -40, 10, 110).fillRect(140, -40, 10, 110);
    stand.fillStyle(0x9aa3a8, 1).fillRect(-150, -24, 300, 6);
    root.add(stand);

    this.fire = scene.add.graphics();
    root.add(this.fire);

    this.meat = scene.add.container(0, -21);
    this.meatG = scene.add.graphics();
    this.meat.add(this.meatG);
    root.add(this.meat);

    // meter
    const left = -BAR_W / 2;
    root.add(scene.add.rectangle(0, 105, BAR_W, 22, 0x4a3020).setStrokeStyle(2, COLORS.woodDark));
    root.add(scene.add.rectangle(left + BAR_W * win.start, 105, BAR_W * (win.end - win.start), 22, COLORS.gold).setOrigin(0, 0.5));
    root.add(scene.add.rectangle(left + BAR_W * win.end, 105, BAR_W * (1 - win.end), 22, 0x2b1a12).setOrigin(0, 0.5));
    this.needle = scene.add.rectangle(left, 105, 5, 34, 0xffffff).setStrokeStyle(1, 0x000000);
    root.add(this.needle);

    this.listen(scene.input, 'pointerdown', () => this.press());
    this.listen(scene.input, 'pointerup', () => this.release());
    this.onSpace(() => this.press(), () => this.release());
    this.draw();
  }

  private press(): void {
    if (!this.finished) this.holding = true;
  }

  private release(): void {
    if (!this.holding || this.finished) return;
    this.holding = false;
    if (this.meter < 0.08) return; // a tap, not a real cook
    this.finish(gradeSpit(this.meter, this.win));
  }

  update(dt: number): void {
    if (this.finished || !this.holding) {
      this.drawFire(false);
      return;
    }
    this.meter = Math.min(1, this.meter + dt / FILL_MS);
    this.meat.rotation += dt * 0.012;
    this.sizzleTimer -= dt;
    if (this.sizzleTimer <= 0) {
      sfx.sizzle();
      this.sizzleTimer = 160;
    }
    this.draw();
    if (this.meter >= 1) {
      this.holding = false;
      this.finish(0);
    }
  }

  private draw(): void {
    this.needle.x = -BAR_W / 2 + BAR_W * this.meter;
    const c = this.meter < 0.7
      ? Phaser.Display.Color.Interpolate.ColorWithColor(RAW, DONE, 100, (this.meter / 0.7) * 100)
      : Phaser.Display.Color.Interpolate.ColorWithColor(DONE, CHAR, 100, ((this.meter - 0.7) / 0.3) * 100);
    const color = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    const g = this.meatG.clear();
    g.fillStyle(0xf3ead8, 1).fillRect(-80, -5, 160, 10).fillCircle(-82, -6, 7).fillCircle(-82, 6, 7).fillCircle(82, -6, 7).fillCircle(82, 6, 7);
    g.fillStyle(color, 1).fillEllipse(0, 0, 120, 70);
    g.fillStyle(0xffffff, 0.18).fillEllipse(-18, -14, 50, 18);
    this.drawFire(true);
  }

  private drawFire(lit: boolean): void {
    const g = this.fire.clear();
    const t = this.scene.time.now / 120;
    for (let i = -3; i <= 3; i++) {
      const h = (lit ? 40 : 22) + Math.sin(t + i * 1.7) * 8;
      g.fillStyle(0xe8542a, 1).fillTriangle(i * 22 - 14, 70, i * 22 + 14, 70, i * 22, 70 - h);
      g.fillStyle(0xf6c445, 1).fillTriangle(i * 22 - 7, 70, i * 22 + 7, 70, i * 22, 70 - h * 0.55);
    }
  }
}
