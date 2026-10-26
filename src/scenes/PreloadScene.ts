import Phaser from 'phaser';
import { CREAM, COLORS, H, W, makeShapeTextures } from '../ui/theme';
import { SFX_KEYS, initAudio } from '../ui/sfx';
import { MUSIC, initMusic } from '../ui/music';

export const ICON_KEYS = [
  'angry', 'anvil', 'attack', 'bean', 'bell', 'board', 'cart', 'celery', 'check', 'chef', 'chicken', 'clock', 'coin',
  'corn', 'defense', 'drumstick', 'eat', 'egg', 'elemRes', 'fish', 'flatfish', 'fresh', 'grill', 'herb', 'lantern',
  'liver', 'meat', 'mushroom', 'mute', 'octopus', 'onion', 'palico', 'pause', 'paw', 'platter', 'play', 'potato',
  'pumpkin', 'rawmeat', 'save', 'scroll', 'shell', 'ship', 'shrimp', 'sick', 'sound', 'spit', 'stamina', 'steak',
  'sushifish', 'table', 'think', 'trophy', 'tuna', 'veg',
];

const UI_KEYS = [
  'panel_brown', 'panel_beige', 'panel_beigeLight', 'panelInset_beige', 'buttonLong_brown', 'buttonLong_beige',
];

/** Loads every asset with a loading bar, then waits for the bundled fonts. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const label = this.add.text(W / 2, H / 2 - 50, 'Loading the Canteen...', {
      fontFamily: 'Georgia, serif', fontSize: '36px', color: CREAM,
    }).setOrigin(0.5);
    this.add.rectangle(W / 2, H / 2 + 20, 600, 22, COLORS.woodDark).setStrokeStyle(3, COLORS.woodLight);
    const bar = this.add.rectangle(W / 2 - 296, H / 2 + 20, 0, 14, COLORS.gold).setOrigin(0, 0.5);
    this.load.on('progress', (p: number) => (bar.width = 592 * p));
    this.load.on('loaderror', (file: Phaser.Loader.File) => label.setText(`Could not load ${file.key}`));

    for (const key of ICON_KEYS) this.load.svg(key, `assets/icons/${key}.svg`, { width: 128, height: 128 });
    for (const key of UI_KEYS) this.load.image(key, `assets/ui/${key}.png`);
    for (const key of SFX_KEYS) this.load.audio(`sfx-${key}`, `assets/sfx/${key}.ogg`);
    this.load.audio(MUSIC.town, 'assets/music/town.ogg');
    this.load.audio(MUSIC.service, 'assets/music/service.ogg');
    this.load.audio(MUSIC.spit, 'assets/music/spit.ogg');
    this.load.audio(MUSIC.fanfare, 'assets/music/fanfare.ogg');
  }

  create(): void {
    makeShapeTextures(this);
    initAudio(this.sound);
    initMusic(this.sound);
    const fonts = ['36px "Alegreya Sans"', 'bold 36px "Alegreya Sans"', 'bold 36px Cinzel'];
    Promise.all(fonts.map((f) => document.fonts.load(f)))
      .catch(() => undefined)
      .then(() => this.scene.start('Title'));
  }
}
