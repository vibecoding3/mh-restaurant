import Phaser from 'phaser';
import { CREDITS } from '../data/credits';
import { Button, COLORS, INK, INK_SOFT, W, drawWoodBg, panel, title, txt } from '../ui/theme';
import { sfx } from '../ui/sfx';

export class CreditsScene extends Phaser.Scene {
  constructor() {
    super('Credits');
  }

  create(): void {
    drawWoodBg(this, COLORS.woodDark);
    title(this, W / 2, 90, 'Credits', 72).setOrigin(0.5);
    panel(this, 240, 170, W - 480, 760, 'paper');
    let y = 220;
    for (const c of CREDITS) {
      txt(this, 300, y, c.what, 30, INK, { fontStyle: 'bold' });
      txt(this, 300, y + 38, `${c.who}  |  ${c.license}`, 26, INK_SOFT);
      y += 92;
    }
    txt(this, W / 2, 890, 'Characters, dishes, ingredients and monsters are from Monster Hunter: World by Capcom. Fan game, not affiliated.', 24, INK_SOFT)
      .setOrigin(0.5);
    new Button(this, W / 2, 1000, 300, 76, 'Back', () => {
      sfx.click();
      this.scene.start('Title');
    }, { size: 32 });
  }
}
