import Phaser from 'phaser';
import { newGame } from '../core/state';
import { loadGame, saveGame } from '../core/save';
import { session } from '../session';
import { Button, COLORS, CREAM, H, W, drawPalico, drawWoodBg, panel, txt } from '../ui/theme';
import { sfx } from '../ui/sfx';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    drawWoodBg(this, COLORS.woodDark);
    txt(this, W / 2, 70, "Hunter's Canteen", 58, '#f2c94c', {
      fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 10,
    }).setOrigin(0.5);
    txt(this, W / 2, 122, 'A Palico cooking prototype', 20, CREAM).setOrigin(0.5);

    const chef = drawPalico(this, W / 2, 312).setScale(2.2);
    this.tweens.add({ targets: chef, y: 306, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const saved = loadGame();
    let confirming = false;
    const newBtn = new Button(this, W / 2 - 120, 360, 210, 50, 'New Game', () => {
      sfx.click();
      if (saved && !confirming) {
        confirming = true;
        newBtn.setText('Overwrite save?');
        return;
      }
      session.state = newGame();
      saveGame(session.state);
      this.scene.start('Prep');
    }, { fill: COLORS.green, size: 20 });

    new Button(this, W / 2 + 120, 360, 210, 50, saved ? `Continue (Day ${saved.day})` : 'Continue', () => {
      if (!saved) return;
      sfx.click();
      session.state = saved;
      this.scene.start('Prep');
    }, { size: 20 }).setEnabled(!!saved);

    panel(this, 120, 400, W - 240, 104, COLORS.parchment);
    txt(this, W / 2, 452, [
      'Morning: buy ingredients and pick the menu.   Service: tap hunters to seat them,',
      'tap a station to cook their order, then tap the ticket to serve.',
      'Evening: see how your food helped them on the hunt. Reach ⭐60 by Day 5!',
    ].join('\n'), 15, '#3a2414', { align: 'center', lineSpacing: 6 }).setOrigin(0.5);

    txt(this, W / 2, H - 16, 'Unofficial non-commercial fan prototype. Monster Hunter is © Capcom. All art here is placeholder code-drawn.', 11, '#c9b08a')
      .setOrigin(0.5);
  }
}
