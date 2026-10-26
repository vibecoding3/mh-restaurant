import Phaser from 'phaser';
import type { GameState } from '../core/state';
import { TUTORIAL, TUTORIAL_STEPS, type TipRect } from '../data/tutorial';
import { Button, COLORS, H, INK, W, badgeIcon, panel, txt } from './theme';
import { sfx } from './sfx';

const DEPTH = 950;
const DIM = 0.6;
const PANEL_W = 1500;
const PAD = 8;

const inside = (r: TipRect, p: { x: number; y: number }) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

export function tipSeen(state: GameState, id: string): boolean {
  return state.tutorial.includes(id);
}

export function markTip(state: GameState, id: string): void {
  if (!state.tutorial.includes(id)) state.tutorial.push(id);
}

/** Marks every tip as shown. */
export function skipTutorial(state: GameState): void {
  for (const t of TUTORIAL_STEPS) markTip(state, t.id);
}

/**
 * Shows the Handler's tutorial tips in a scene, one at a time. The screen is dimmed except around the
 * highlighted target, which stays clickable; clicking it also moves on to the next tip.
 */
export class HandlerTips {
  private queue: { id: string; rect: TipRect | null }[] = [];
  private layer: Phaser.GameObjects.Container | null = null;
  private hole: TipRect | null = null;
  private box: TipRect | null = null;
  private onDown = (p: Phaser.Input.Pointer) => {
    if (this.hole && inside(this.hole, p) && !(this.box && inside(this.box, p))) this.next();
  };

  /**
   * @param onActive called with true when the first tip opens and false when the last one closes,
   *   so Service can pause the shift.
   * @param onSeen called after a tip is marked as shown, e.g. to save.
   */
  constructor(
    private scene: Phaser.Scene,
    private state: () => GameState,
    private hooks: { onActive?: (on: boolean) => void; onSeen?: () => void } = {},
  ) {
    scene.input.on('pointerdown', this.onDown);
    scene.events.once('shutdown', () => this.destroy());
  }

  get active(): boolean {
    return this.layer !== null;
  }

  /** Queues a tip unless it was already shown. `rect` overrides the step's own target. */
  show(id: string, rect?: TipRect | null): void {
    const step = TUTORIAL[id];
    if (!step || tipSeen(this.state(), id) || this.queue.some((q) => q.id === id)) return;
    this.queue.push({ id, rect: rect ?? step.target ?? null });
    if (!this.layer) {
      this.hooks.onActive?.(true);
      this.open();
    }
  }

  /** Closes the current tip and opens the next queued one. */
  next(): void {
    const cur = this.queue.shift();
    if (!cur) return;
    markTip(this.state(), cur.id);
    this.hooks.onSeen?.();
    this.layer?.destroy();
    this.layer = null;
    this.hole = null;
    if (this.queue.length) this.open();
    else this.hooks.onActive?.(false);
  }

  skip(): void {
    skipTutorial(this.state());
    this.queue = [];
    this.hooks.onSeen?.();
    this.layer?.destroy();
    this.layer = null;
    this.hole = null;
    this.hooks.onActive?.(false);
  }

  private open(): void {
    const { id, rect } = this.queue[0];
    const s = this.scene;
    const layer = s.add.container(0, 0).setDepth(DEPTH);
    this.layer = layer;

    // Four dim blocks around the hole; they swallow clicks so only the target can be used.
    const dim = (x: number, y: number, w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      layer.add(s.add.rectangle(x, y, w, h, 0x000000, DIM).setOrigin(0).setInteractive());
    };
    if (rect) {
      const r = { x: rect.x - PAD, y: rect.y - PAD, w: rect.w + PAD * 2, h: rect.h + PAD * 2 };
      this.hole = r;
      dim(0, 0, W, r.y);
      dim(0, r.y + r.h, W, H - r.y - r.h);
      dim(0, r.y, r.x, r.h);
      dim(r.x + r.w, r.y, W - r.x - r.w, r.h);
      const outline = s.add.rectangle(r.x, r.y, r.w, r.h).setOrigin(0).setStrokeStyle(6, COLORS.gold);
      layer.add(outline);
      s.tweens.add({ targets: outline, alpha: 0.35, duration: 520, yoyo: true, repeat: -1 });
    } else {
      dim(0, 0, W, H);
    }

    // The Handler's panel goes on whichever side of the target has more room.
    const text = txt(s, 0, 0, TUTORIAL[id].text, 26, INK, { wordWrap: { width: PANEL_W - 420 }, lineSpacing: 4 });
    const ph = Math.max(150, text.height + 78);
    const above = rect ? rect.y : 0;
    const below = rect ? H - rect.y - rect.h : H;
    const py = !rect ? (H - ph) / 2 : above > below ? Math.max(12, above - ph - 24) : Math.min(H - ph - 12, rect.y + rect.h + 24);
    const px = (W - PANEL_W) / 2;
    this.box = { x: px, y: py, w: PANEL_W, h: ph };
    const bg = panel(s, px, py, PANEL_W, ph, 'light').setInteractive();
    layer.add(bg);
    layer.add(badgeIcon(s, px + 64, py + ph / 2, 'paw', 76, 0xf2c94c));
    layer.add(txt(s, px + 120, py + 18, 'The Handler', 26, '#8a5a2a', { fontStyle: 'bold' }));
    text.setPosition(px + 120, py + 54);
    layer.add(text);
    const step = TUTORIAL_STEPS.findIndex((t) => t.id === id);
    layer.add(new Button(s, px + PANEL_W - 140, py + ph / 2 - 34, 220, 60, 'Next', () => {
      sfx.click();
      this.next();
    }, { style: 'go', size: 28, icon: 'play' }));
    layer.add(new Button(s, px + PANEL_W - 140, py + ph / 2 + 36, 220, 52, 'Skip tutorial', () => {
      sfx.click();
      this.skip();
    }, { style: 'paper', size: 22 }));
    layer.add(txt(s, px + PANEL_W - 270, py + ph - 26, `Tip ${step + 1} of ${TUTORIAL_STEPS.length}`, 18, '#8a6a4a').setOrigin(1, 0.5));
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onDown);
    this.layer?.destroy();
    this.layer = null;
    this.queue = [];
  }
}
