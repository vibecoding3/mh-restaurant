import Phaser from 'phaser';
import { floatText } from '../../ui/theme';
import { sfx } from '../../ui/sfx';

const DOOR = { x: -50, y: 600 };
const COUNTER_Y = 650;
/** How long a Jagras takes to reach the counter, in ms. */
const RUN_MS = 4800;
const STAGGER_MS = 700;

interface Runner {
  view: Phaser.GameObjects.Container;
  fromX: number;
  fromY: number;
  toX: number;
  t: number;
  start: number;
  state: 'waiting' | 'running' | 'gone';
}

/** Draws a small Jagras: a dark blue-green lizard with yellow markings (feet at y=0, facing right). */
function drawJagras(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillEllipse(0, 0, 90, 14);
  g.fillStyle(0x2f4a52, 1).fillTriangle(-70, -26, -30, -36, -30, -18); // tail
  g.fillStyle(0x34565e, 1).fillEllipse(0, -28, 74, 34); // body
  g.fillStyle(0xd9b03a, 1).fillEllipse(-8, -40, 12, 8).fillEllipse(10, -42, 12, 8).fillEllipse(-24, -36, 10, 6);
  g.fillStyle(0x34565e, 1).fillEllipse(40, -40, 40, 24); // head
  g.fillStyle(0xd9b03a, 1).fillTriangle(30, -54, 40, -54, 34, -64); // crest
  g.fillStyle(0xffffff, 1).fillCircle(50, -44, 4);
  g.fillStyle(0x1a1a1a, 1).fillCircle(51, -44, 2);
  g.fillStyle(0x2a3e44, 1).fillRect(-20, -14, 8, 14).fillRect(14, -14, 8, 14); // legs
  return g;
}

/**
 * A pack of Jagras runs in after the stock. Click one to shoo it; each that reaches the counter
 * calls `onSteal`, which takes one ingredient. The shift keeps running.
 */
export class JagrasRaid {
  private runners: Runner[] = [];
  private elapsed = 0;

  constructor(private scene: Phaser.Scene, count: number, private onSteal: (x: number, y: number) => void) {
    for (let i = 0; i < count; i++) {
      const fromY = DOOR.y + Phaser.Math.Between(-30, 40);
      const view = scene.add.container(DOOR.x, fromY).setDepth(15).setVisible(false);
      view.add(drawJagras(scene));
      const hit = scene.add.rectangle(0, -30, 130, 80, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
      view.add(hit);
      const r: Runner = { view, fromX: DOOR.x, fromY, toX: Phaser.Math.Between(320, 1500), t: 0, start: i * STAGGER_MS, state: 'waiting' };
      hit.on('pointerdown', () => this.shoo(r));
      this.runners.push(r);
    }
  }

  get over(): boolean {
    return this.runners.every((r) => r.state === 'gone');
  }

  /** Jagras still in the canteen, for playtests. */
  get active(): number {
    return this.runners.filter((r) => r.state === 'running').length;
  }

  private leave(r: Runner, scared: boolean): void {
    r.state = 'gone';
    this.scene.tweens.add({
      targets: r.view, x: DOOR.x, y: r.fromY, scaleX: -1, duration: scared ? 500 : 900,
      onComplete: () => r.view.destroy(),
    });
  }

  private shoo(r: Runner): void {
    if (r.state !== 'running') return;
    sfx.click();
    floatText(this.scene, r.view.x, r.view.y - 90, 'Shoo!', '#9be36a', 28);
    this.leave(r, true);
  }

  update(dt: number): void {
    this.elapsed += dt;
    for (const r of this.runners) {
      if (r.state === 'waiting' && this.elapsed >= r.start) {
        r.state = 'running';
        r.view.setVisible(true);
        sfx.angry();
      }
      if (r.state !== 'running') continue;
      r.t = Math.min(1, r.t + dt / RUN_MS);
      r.view.x = Phaser.Math.Linear(r.fromX, r.toX, r.t);
      r.view.y = Phaser.Math.Linear(r.fromY, COUNTER_Y, r.t) - Math.abs(Math.sin(r.t * 40)) * 6;
      if (r.t >= 1) {
        this.onSteal(r.view.x, r.view.y);
        this.leave(r, false);
      }
    }
  }

  destroy(): void {
    for (const r of this.runners) r.view.destroy();
    this.runners = [];
  }
}
