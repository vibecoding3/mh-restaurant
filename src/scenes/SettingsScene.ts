import Phaser from 'phaser';
import { loadGame, saveGame } from '../core/save';
import { session } from '../session';
import { Button, COLORS, CREAM, INK, INK_SOFT, W, drawWoodBg, panel, title, txt } from '../ui/theme';
import { isMuted, musicVolume, sfx, toggleMute } from '../ui/sfx';
import { cycleMusicVolume } from '../ui/music';
import { LARGE_TEXT, settings, updateSettings } from '../ui/settings';

/** Where Settings was opened from. From Service it runs over the sleeping shift and wakes it on Back. */
export type SettingsFrom = 'Title' | 'Service';

const ROW_X = 420;
const BTN_X = 1320;

export class SettingsScene extends Phaser.Scene {
  private from: SettingsFrom = 'Title';
  private done!: Phaser.GameObjects.Text;

  constructor() {
    super('Settings');
  }

  init(data: { from?: SettingsFrom }): void {
    this.from = data.from ?? 'Title';
  }

  create(): void {
    drawWoodBg(this, COLORS.woodDark);
    title(this, W / 2, 90, 'Settings', 72).setOrigin(0.5);
    panel(this, 300, 170, W - 600, 740, 'paper');

    let y = 250;
    const row = (label: string, note: string, value: () => string, onClick: () => void, icon?: string): (() => void) => {
      txt(this, ROW_X, y - 16, label, 32, INK, { fontStyle: 'bold' }).setOrigin(0, 0.5);
      txt(this, ROW_X, y + 20, note, 22, INK_SOFT).setOrigin(0, 0.5);
      const b: Button = new Button(this, BTN_X, y, 340, 70, value(), () => {
        sfx.click();
        onClick();
        b.setText(value());
      }, { size: 28, icon });
      y += 110;
      return () => b.setText(value());
    };

    row('Sound', 'Sound effects and music.', () => (isMuted() ? 'Muted' : 'On'), () => toggleMute());
    row('Music volume', 'Background music and the BBQ Spit song.', () => `${Math.round(musicVolume() * 100)}%`, () => cycleMusicVolume());
    row('Text size', 'Large text applies to screens opened from now on.',
      () => (settings().textScale > 1 ? 'Large' : 'Normal'),
      () => updateSettings({ textScale: settings().textScale > 1 ? 1 : LARGE_TEXT }));
    row('Minigame assist', 'Wider gold windows on the Spit and Grill, slower ingredients on the Board.',
      () => (settings().assist ? 'On' : 'Off'), () => updateSettings({ assist: !settings().assist }));
    const fs = row('Fullscreen', 'You can also press F at any time.',
      () => (this.scale.isFullscreen ? 'Exit fullscreen' : 'Go fullscreen'),
      () => this.scale.toggleFullscreen());
    // Fullscreen changes asynchronously, so relabel when it actually happens.
    this.scale.on('enterfullscreen', fs);
    this.scale.on('leavefullscreen', fs);
    this.events.once('shutdown', () => {
      this.scale.off('enterfullscreen', fs);
      this.scale.off('leavefullscreen', fs);
    });
    row("Handler's tutorial", 'Show the tutorial tips again.', () => 'Replay tutorial', () => this.replayTutorial());

    new Button(this, W / 2, 1000, 300, 76, 'Back', () => {
      sfx.click();
      this.back();
    }, { size: 32 });
    this.input.keyboard?.on('keydown-ESC', () => this.back());
    this.done = txt(this, W / 2, 940, '', 26, CREAM, { fontStyle: 'bold' }).setOrigin(0.5);
  }

  private replayTutorial(): void {
    session.state.tutorial = [];
    // From the Title screen, clear it in the save too so it applies when continuing.
    const saved = this.from === 'Title' ? loadGame().state : null;
    if (saved) {
      saved.tutorial = [];
      saveGame(saved);
    }
    this.done.setText('The Handler will show her tips again.');
  }

  private back(): void {
    if (this.from === 'Service') {
      this.scene.wake('Service');
      this.scene.stop();
    } else {
      this.scene.start('Title');
    }
  }
}
