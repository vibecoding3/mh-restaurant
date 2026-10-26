import Phaser from 'phaser';
import type { Quality } from '../../core/types';
import { QUALITY_COLORS, QUALITY_LABELS } from '../../data/stations';
import { INK, TITLE_FONT, txt } from '../../ui/theme';
import { sfx } from '../../ui/sfx';

export interface Minigame {
  update(dt: number): void;
  destroy(): void;
}

/**
 * Shared plumbing for station minigames: drawn into a container centered on the
 * overlay panel, they report a Quality once and then show the grade briefly.
 */
export abstract class BaseMinigame implements Minigame {
  protected finished = false;
  private cleanups: (() => void)[] = [];

  constructor(
    protected scene: Phaser.Scene,
    protected root: Phaser.GameObjects.Container,
    private onDone: (q: Quality) => void,
    title: string,
    hint: string,
  ) {
    root.add(txt(scene, 0, -300, title, 50, INK, { fontFamily: TITLE_FONT, fontStyle: 'bold' }).setOrigin(0.5));
    root.add(txt(scene, 0, -244, hint, 28, '#6b4a30').setOrigin(0.5));
  }

  abstract update(dt: number): void;

  /** Registers an input listener that is removed when the minigame closes. */
  protected listen(emitter: Phaser.Events.EventEmitter, event: string, fn: (...args: any[]) => void): void {
    emitter.on(event, fn);
    this.cleanups.push(() => emitter.off(event, fn));
  }

  protected onSpace(down: () => void, up?: () => void): void {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    this.listen(kb, 'keydown-SPACE', (e: KeyboardEvent) => !e.repeat && down());
    if (up) this.listen(kb, 'keyup-SPACE', up);
  }

  /** Grade label shown when done; the spit names its real outcome instead. */
  protected resultLabel(q: Quality): string {
    return QUALITY_LABELS[q];
  }

  protected finish(q: Quality): void {
    if (this.finished) return;
    this.finished = true;
    [sfx.burnt, sfx.rare, sfx.tasty][q]();
    const label = txt(this.scene, 0, 0, this.resultLabel(q), 104, QUALITY_COLORS[q], {
      fontFamily: TITLE_FONT, fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 14,
    }).setOrigin(0.5).setScale(0.3);
    this.root.add(label);
    this.scene.tweens.add({ targets: label, scale: 1, duration: 260, ease: 'Back.easeOut' });
    this.scene.time.delayedCall(850, () => this.onDone(q));
  }

  destroy(): void {
    this.cleanups.forEach((c) => c());
    this.cleanups = [];
  }
}
