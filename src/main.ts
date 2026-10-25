import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { PrepScene } from './scenes/PrepScene';
import { ServiceScene } from './scenes/ServiceScene';
import { ReportScene } from './scenes/ReportScene';
import { COLORS, H, W } from './ui/theme';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: COLORS.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 },
  disableContextMenu: true,
  scene: [TitleScene, PrepScene, ServiceScene, ReportScene],
});
