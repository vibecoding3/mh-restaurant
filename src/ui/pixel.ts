import Phaser from 'phaser';

// Kenney's Roguelike Indoors tilesheet (CC0): 16 px tiles with a 1 px gap, drawn 4x with nearest-neighbor filtering.

export const PIXEL_SHEET = 'pixel-indoors';
export const PIXEL_FILE = 'assets/pixel/roguelike-indoors.png';
export const TILE = 16;
export const PIXEL_SCALE = 4;
/** One tile on screen. */
export const T = TILE * PIXEL_SCALE;

/** Frames used by the dining hall and stations, as rows of tiles (sheet index = row * 27 + column). */
export const PROPS = {
  table: [[0, 1, 2]],
  map: [[344, 345]],
  shieldRound: [[238]],
  shieldKite: [[265]],
  torch: [[182]],
  candles: [[178]],
  plant: [[16]],
  pot: [[129]],
  stove: [[392, 393], [419, 420]],
  counterTop: [[413, 414, 415]],
  cabinets: [[351, 352, 353, 354]],
  cabinetsLow: [[432, 433, 434, 435]],
  shelf: [[478, 479, 480]],
} satisfies Record<string, number[][]>;

/** Draws a prop made of tiles with its top-left corner at x, y. */
export function prop(scene: Phaser.Scene, x: number, y: number, frames: number[][], scale = PIXEL_SCALE): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const s = TILE * scale;
  frames.forEach((row, r) => row.forEach((f, i) => c.add(scene.add.image(i * s, r * s, PIXEL_SHEET, f).setOrigin(0).setScale(scale))));
  c.setSize(frames[0].length * s, frames.length * s);
  return c;
}

/** Repeats a row of tiles across a width, e.g. a counter. The first and last frames are the ends. */
export function strip(scene: Phaser.Scene, x: number, y: number, width: number, frames: number[], scale = PIXEL_SCALE): Phaser.GameObjects.Container {
  const s = TILE * scale;
  const n = Math.max(2, Math.round(width / s));
  const row = Array.from({ length: n }, (_, i) => (i === 0 ? frames[0] : i === n - 1 ? frames[frames.length - 1] : frames[1 + ((i - 1) % Math.max(1, frames.length - 2))]));
  return prop(scene, x, y, [row], scale);
}
