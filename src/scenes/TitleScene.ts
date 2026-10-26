import Phaser from 'phaser';
import { GAME_VERSION, TRIAL_DAY, TRIAL_REPUTATION, newGame } from '../core/state';
import { loadGame, saveGame } from '../core/save';
import { session } from '../session';
import { Button, COLORS, CREAM, H, INK, W, drawPalico, drawWoodBg, panel, title, txt } from '../ui/theme';
import { isMuted, musicVolume, sfx, toggleMute } from '../ui/sfx';
import { MUSIC, cycleMusicVolume, playMusic } from '../ui/music';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    drawWoodBg(this, COLORS.woodDark);
    playMusic(MUSIC.town);
    title(this, W / 2, 130, "Hunter's Canteen", 112).setOrigin(0.5);
    txt(this, W / 2, 236, 'Cook for the Research Commission in Astera as the Meowscular Chef', 38, CREAM).setOrigin(0.5);

    const chef = drawPalico(this, W / 2, 640).setScale(1.25);
    this.tweens.add({ targets: chef, y: 630, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    const loaded = loadGame();
    if (loaded.reset) session.saveReset = true;
    const saved = loaded.state;
    let confirming = false;
    const newBtn = new Button(this, W / 2 - 250, 700, 440, 92, 'New Game', () => {
      sfx.click();
      if (saved && !confirming) {
        confirming = true;
        newBtn.setText('Overwrite save?');
        return;
      }
      session.state = newGame();
      session.saveReset = false;
      saveGame(session.state);
      this.scene.start('Prep');
    }, { style: 'go', size: 38, icon: 'play' });

    new Button(this, W / 2 + 250, 700, 440, 92, saved ? `Continue (Day ${saved.day})` : 'Continue', () => {
      if (!saved) return;
      sfx.click();
      session.state = saved;
      this.scene.start('Prep');
    }, { size: 38, icon: 'save' }).setEnabled(!!saved);

    if (session.saveReset) {
      txt(this, W / 2, 772, 'New version: your old save was reset.', 28, '#ffb4a0', { fontStyle: 'bold' }).setOrigin(0.5);
    }

    panel(this, 300, 800, W - 600, 170, 'paper');
    txt(this, W / 2, 885, [
      'Morning: buy ingredients from the Argosy and set your platters.',
      'Service: click hunters to seat them, click a station to cook, then click the ticket to serve.',
      `Evening: the Handler reports on their hunts. Reach ${TRIAL_REPUTATION} reputation by Day ${TRIAL_DAY} for the Commander's Rank Trial.`,
    ].join('\n'), 28, INK, { align: 'center', lineSpacing: 8 }).setOrigin(0.5);

    // Footer: audio, credits and version.
    const muteBtn: Button = new Button(this, 110, 1020, 160, 64, '', () => {
      muteBtn.setIcon(toggleMute() ? 'mute' : 'sound');
    }, { icon: isMuted() ? 'mute' : 'sound', size: 30 });
    const volLabel = () => `Music ${Math.round(musicVolume() * 100)}%`;
    const volBtn: Button = new Button(this, 330, 1020, 250, 64, volLabel(), () => {
      cycleMusicVolume();
      volBtn.setText(volLabel());
    }, { size: 26 });
    new Button(this, W - 150, 1020, 220, 64, 'Credits', () => {
      sfx.click();
      this.scene.start('Credits');
    }, { size: 28, icon: 'scroll' });
    txt(this, W - 280, 1020, `v${GAME_VERSION}`, 26, '#c9b08a').setOrigin(1, 0.5);
    txt(this, W / 2, H - 50, 'Unofficial non-commercial fan game. Monster Hunter is a trademark of Capcom.', 22, '#c9b08a')
      .setOrigin(0.5);
  }
}
