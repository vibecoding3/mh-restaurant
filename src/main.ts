import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { CreditsScene } from './scenes/CreditsScene';
import { PrepScene } from './scenes/PrepScene';
import { ServiceScene } from './scenes/ServiceScene';
import { ReportScene } from './scenes/ReportScene';
import { SettingsScene } from './scenes/SettingsScene';
import { BookScene } from './scenes/BookScene';
import { COLORS, H, W } from './ui/theme';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: COLORS.bg,
  // Cap at 60 steps a second. 61 rather than 60 so that 120/180/240 Hz displays, whose frames add up
  // to just under 1/60 s, still step every 2nd/3rd/4th frame instead of dropping to 40-52.
  fps: { target: 60, limit: 61 },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  disableContextMenu: true,
  scene: [PreloadScene, TitleScene, CreditsScene, SettingsScene, BookScene, PrepScene, ServiceScene, ReportScene],
});

// F toggles fullscreen in every scene. A key press counts as the user gesture browsers require.
window.addEventListener('keydown', (e) => {
  if ((e.key === 'f' || e.key === 'F') && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey) game.scale.toggleFullscreen();
});

// `?debug` exposes the game object for playtests (e.g. game.loop.actualFps).
if (new URLSearchParams(location.search).has('debug')) {
  (globalThis as unknown as { game: Phaser.Game }).game = game;
}
