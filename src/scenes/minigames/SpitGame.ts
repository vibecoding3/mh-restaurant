import Phaser from 'phaser';
import type { Quality } from '../../core/types';
import { gradeSpit, type SpitWindow } from '../../core/cooking';
import { SPIT_RESULTS } from '../../data/dishes';
import { COLORS } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

const FILL_MS = 2600;
const BAR_W = 800;
const RAW = Phaser.Display.Color.ValueToColor(0xe07a7a);
const DONE = Phaser.Display.Color.ValueToColor(0xa0582a);
const CHAR = Phaser.Display.Color.ValueToColor(0x2b1a12);

/** Hold to spin the Raw Meat; release while the needle is in the gold, as in World. */
export class SpitGame extends BaseMinigame {
  private meter = 0;
  private holding = false;
  private sizzleTimer = 0;
  private meat: Phaser.GameObjects.Container;
  private meatG: Phaser.GameObjects.Graphics;
  private needle: Phaser.GameObjects.Rectangle;
  private fire: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void, private win: SpitWindow) {
    super(scene, root, done, 'BBQ Spit', 'Hold the mouse button or Space to spin. Release in the gold!');

    const stand = scene.add.graphics();
    stand.fillStyle(COLORS.woodDark, 1).fillRect(-300, -80, 20, 220).fillRect(280, -80, 20, 220);
    stand.fillStyle(0x9aa3a8, 1).fillRect(-300, -48, 600, 12);
    root.add(stand);

    this.fire = scene.add.graphics();
    root.add(this.fire);

    this.meat = scene.add.container(0, -42);
    this.meatG = scene.add.graphics();
    this.meat.add(this.meatG);
    root.add(this.meat);

    const left = -BAR_W / 2;
    root.add(scene.add.rectangle(0, 210, BAR_W, 44, 0x4a3020).setStrokeStyle(4, COLORS.woodDark));
    root.add(scene.add.rectangle(left + BAR_W * win.start, 210, BAR_W * (win.end - win.start), 44, COLORS.gold).setOrigin(0, 0.5));
    root.add(scene.add.rectangle(left + BAR_W * win.end, 210, BAR_W * (1 - win.end), 44, 0x2b1a12).setOrigin(0, 0.5));
    this.needle = scene.add.rectangle(left, 210, 10, 68, 0xffffff).setStrokeStyle(2, 0x000000);
    root.add(this.needle);

    this.listen(scene.input, 'pointerdown', () => this.press());
    this.listen(scene.input, 'pointerup', () => this.release());
    this.onSpace(() => this.press(), () => this.release());
    this.draw();
  }

  protected resultLabel(q: Quality): string {
    return SPIT_RESULTS[q];
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
      this.sizzleTimer = 520;
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
    g.fillStyle(0xf3ead8, 1).fillRect(-160, -10, 320, 20).fillCircle(-164, -12, 14).fillCircle(-164, 12, 14).fillCircle(164, -12, 14).fillCircle(164, 12, 14);
    g.fillStyle(color, 1).fillEllipse(0, 0, 240, 140);
    g.fillStyle(0xffffff, 0.18).fillEllipse(-36, -28, 100, 36);
    this.drawFire(true);
  }

  private drawFire(lit: boolean): void {
    const g = this.fire.clear();
    const t = this.scene.time.now / 120;
    for (let i = -3; i <= 3; i++) {
      const h = (lit ? 80 : 44) + Math.sin(t + i * 1.7) * 16;
      g.fillStyle(0xe8542a, 1).fillTriangle(i * 44 - 28, 140, i * 44 + 28, 140, i * 44, 140 - h);
      g.fillStyle(0xf6c445, 1).fillTriangle(i * 44 - 14, 140, i * 44 + 14, 140, i * 44, 140 - h * 0.55);
    }
  }
}
