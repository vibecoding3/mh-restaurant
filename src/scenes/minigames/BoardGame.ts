import Phaser from 'phaser';
import type { Ingredient, Quality } from '../../core/types';
import { gradeChop } from '../../core/cooking';
import { COLORS, icon } from '../../ui/theme';
import { sfx } from '../../ui/sfx';
import { BaseMinigame } from './base';

// Play area on the board, in coordinates local to the minigame root.
const AREA = { x: -500, y: -200, w: 1000, h: 520 };
const LAUNCH_Y = AREA.y + AREA.h + 50;
const GRAVITY = 2000; // px/s²
const RADIUS = 56;
/** When each ingredient is tossed (ms); some come in pairs. */
const SCHEDULE = [300, 1100, 1250, 2100, 2800, 2950];
const TRAIL_MS = 140;

/** Distance from point p to the segment a-b. */
function segmentDistance(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / len2, 0, 1) : 0;
  return Phaser.Math.Distance.Between(ax + t * dx, ay + t * dy, px, py);
}

interface Flying {
  view: Phaser.GameObjects.Container;
  ing: Ingredient;
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  launched: boolean;
  done: boolean;
}

interface Half {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  spin: number;
}

/** Ingredients are tossed up over the board: slash through them before they fall, Fruit Ninja style. */
export class BoardGame extends BaseMinigame {
  private items: Flying[] = [];
  private halves: Half[] = [];
  private layer: Phaser.GameObjects.Container;
  private trail: { x: number; y: number; t: number }[] = [];
  private trailG: Phaser.GameObjects.Graphics;
  private maskG: Phaser.GameObjects.Graphics;
  private elapsed = 0;
  private missed = 0;

  constructor(scene: Phaser.Scene, root: Phaser.GameObjects.Container, done: (q: Quality) => void, ingredients: Ingredient[]) {
    super(scene, root, done, 'Chopping Board', 'Hold the mouse button and slash through the ingredients before they fall!');

    root.add(scene.add.rectangle(AREA.x + AREA.w / 2, AREA.y + AREA.h / 2, AREA.w, AREA.h, 0xc89a62).setStrokeStyle(8, COLORS.woodLight));
    const grain = scene.add.graphics().lineStyle(3, 0xb88a52, 0.6);
    for (let y = AREA.y + 40; y < AREA.y + AREA.h; y += 56) grain.lineBetween(AREA.x + 20, y, AREA.x + AREA.w - 20, y + 8);
    root.add(grain);

    // Everything that flies is clipped to the board.
    this.layer = scene.add.container(0, 0);
    root.add(this.layer);
    this.maskG = scene.make.graphics({}, false).fillStyle(0xffffff).fillRect(root.x + AREA.x, root.y + AREA.y, AREA.w, AREA.h);
    this.layer.setMask(this.maskG.createGeometryMask());
    this.trailG = scene.add.graphics();
    root.add(this.trailG);

    this.items = SCHEDULE.map((_, i) => this.makeItem(ingredients[i % ingredients.length]));

    this.listen(scene.input, 'pointerdown', (p: Phaser.Input.Pointer) => this.addTrail(p, true));
    this.listen(scene.input, 'pointermove', (p: Phaser.Input.Pointer) => p.isDown && this.addTrail(p, false));
    this.listen(scene.input, 'pointerup', () => (this.trail = []));
  }

  private makeItem(ing: Ingredient): Flying {
    const view = this.scene.add.container(0, LAUNCH_Y).setVisible(false);
    view.add(this.scene.add.circle(0, 0, RADIUS, 0x4a3020).setStrokeStyle(5, COLORS.woodDark));
    view.add(icon(this.scene, 0, 0, ing.icon, 76, ing.tint));
    this.layer.add(view);
    return { view, ing, x: 0, y: LAUNCH_Y, vx: 0, vy: 0, spin: 0, launched: false, done: false };
  }

  private launch(f: Flying): void {
    f.x = Phaser.Math.Between(-380, 380);
    f.y = LAUNCH_Y;
    // Peak somewhere in the upper half of the board, drifting toward the middle.
    const peak = Phaser.Math.Between(AREA.y + 70, AREA.y + 220);
    f.vy = -Math.sqrt(2 * GRAVITY * (LAUNCH_Y - peak));
    f.vx = -f.x * 0.35 + Phaser.Math.Between(-90, 90);
    f.spin = Phaser.Math.FloatBetween(-4, 4);
    f.launched = true;
    f.view.setVisible(true);
    sfx.flip();
  }

  private addTrail(p: Phaser.Input.Pointer, fresh: boolean): void {
    if (this.finished) return;
    const pt = { x: p.worldX - this.root.x, y: p.worldY - this.root.y, t: this.elapsed };
    const prev = fresh ? null : this.trail[this.trail.length - 1];
    if (fresh) this.trail = [];
    this.trail.push(pt);
    if (!prev) return;
    for (const f of this.items) {
      if (!f.launched || f.done) continue;
      const hit = segmentDistance(prev.x, prev.y, pt.x, pt.y, f.x, f.y) < RADIUS;
      if (hit) this.slice(f, Math.atan2(pt.y - prev.y, pt.x - prev.x));
    }
  }

  private slice(f: Flying, angle: number): void {
    f.done = true;
    f.view.destroy();
    sfx.chop();
    // Two halves of the ingredient fly apart across the cut.
    const nx = -Math.sin(angle);
    const ny = Math.cos(angle);
    [-1, 1].forEach((side) => {
      const img = icon(this.scene, f.x, f.y, f.ing.icon, 76, f.ing.tint);
      img.setCrop(side < 0 ? 0 : 64, 0, 64, 128);
      this.layer.add(img);
      this.halves.push({ img, vx: f.vx * 0.5 + nx * side * 260, vy: Math.min(f.vy, 0) * 0.3 + ny * side * 260, spin: side * 6 });
    });
    // Juice and a flash along the cut.
    for (let i = 0; i < 6; i++) {
      const dot = this.scene.add.image(f.x, f.y, 'dot').setDisplaySize(16, 16).setTint(f.ing.tint);
      this.layer.add(dot);
      this.scene.tweens.add({
        targets: dot, x: f.x + Phaser.Math.Between(-90, 90), y: f.y + Phaser.Math.Between(-60, 90), alpha: 0,
        duration: 380, onComplete: () => dot.destroy(),
      });
    }
    const flash = this.scene.add.rectangle(f.x, f.y, 200, 8, 0xffffff).setRotation(angle);
    this.layer.add(flash);
    this.scene.tweens.add({ targets: flash, alpha: 0, scaleX: 1.4, duration: 220, onComplete: () => flash.destroy() });
    this.checkDone();
  }

  private checkDone(): void {
    if (this.items.every((f) => f.done)) this.finish(gradeChop(this.missed));
  }

  update(dt: number): void {
    this.elapsed += dt;
    const s = dt / 1000;
    if (!this.finished) {
      SCHEDULE.forEach((at, i) => {
        if (!this.items[i].launched && this.elapsed >= at) this.launch(this.items[i]);
      });
      for (const f of this.items) {
        if (!f.launched || f.done) continue;
        f.vy += GRAVITY * s;
        f.x += f.vx * s;
        f.y += f.vy * s;
        f.view.setPosition(f.x, f.y).setRotation(f.view.rotation + f.spin * s);
        if (f.vy > 0 && f.y > LAUNCH_Y) {
          f.done = true;
          f.view.destroy();
          this.missed++;
          sfx.miss();
          this.checkDone();
        }
      }
    }
    for (const h of this.halves) {
      h.vy += GRAVITY * s;
      h.img.x += h.vx * s;
      h.img.y += h.vy * s;
      h.img.rotation += h.spin * s;
    }
    this.drawTrail();
  }

  private drawTrail(): void {
    this.trail = this.trail.filter((p) => this.elapsed - p.t < TRAIL_MS);
    const g = this.trailG.clear();
    for (let i = 1; i < this.trail.length; i++) {
      const a = this.trail[i - 1];
      const b = this.trail[i];
      const life = 1 - (this.elapsed - b.t) / TRAIL_MS;
      g.lineStyle(4 + 10 * life, 0xffffff, 0.85 * life).lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  destroy(): void {
    super.destroy();
    this.maskG.destroy();
  }
}
