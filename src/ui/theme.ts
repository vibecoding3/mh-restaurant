import Phaser from 'phaser';

export const W = 960;
export const H = 540;

export const COLORS = {
  bg: 0x1d140e,
  wood: 0x5b3a24,
  woodDark: 0x3e2716,
  woodLight: 0x7a5232,
  floor: 0x6b4a30,
  parchment: 0xf1e2c0,
  parchmentDark: 0xd9c49a,
  gold: 0xf2c94c,
  red: 0xc0392b,
  green: 0x5f8f3e,
  blue: 0x3f6e9a,
};

export const INK = '#3a2414';
export const CREAM = '#f7ead0';
export const FONT = '"Trebuchet MS", "Segoe UI", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif';

export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string, size = 16, color = INK,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2, ...style });
}

export function panel(
  scene: Phaser.Scene, x: number, y: number, w: number, h: number,
  fill = COLORS.parchment, stroke = COLORS.woodDark, radius = 10,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 3, y + 4, w, h, radius);
  g.fillStyle(fill, 1).fillRoundedRect(x, y, w, h, radius);
  g.lineStyle(3, stroke, 1).strokeRoundedRect(x, y, w, h, radius);
  return g;
}

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Rectangle;
  private label: Phaser.GameObjects.Text;
  private enabled = true;
  private fill: number;

  constructor(
    scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string,
    onClick: () => void, opts: { fill?: number; size?: number; color?: string } = {},
  ) {
    super(scene, x, y);
    this.fill = opts.fill ?? COLORS.wood;
    this.bg = scene.add.rectangle(0, 0, w, h, this.fill).setStrokeStyle(2, COLORS.woodDark);
    this.label = txt(scene, 0, 0, text, opts.size ?? 16, opts.color ?? CREAM, { fontStyle: 'bold' }).setOrigin(0.5);
    this.add([this.bg, this.label]);
    this.setSize(w, h);
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerover', () => this.enabled && this.bg.setFillStyle(Phaser.Display.Color.ValueToColor(this.fill).lighten(15).color));
    this.bg.on('pointerout', () => this.bg.setFillStyle(this.enabled ? this.fill : 0x8a7a68));
    this.bg.on('pointerdown', () => {
      if (!this.enabled) return;
      this.scene.tweens.add({ targets: this, scale: 0.94, duration: 60, yoyo: true });
      onClick();
    });
    scene.add.existing(this);
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.bg.setFillStyle(on ? this.fill : 0x8a7a68);
    this.label.setAlpha(on ? 1 : 0.6);
    return this;
  }

  setText(s: string): this {
    this.label.setText(s);
    return this;
  }
}

/** Full-screen wooden plank background. */
export function drawWoodBg(scene: Phaser.Scene, color = COLORS.wood): void {
  const g = scene.add.graphics();
  g.fillStyle(color, 1).fillRect(0, 0, W, H);
  const dark = Phaser.Display.Color.ValueToColor(color).darken(12).color;
  for (let y = 0; y < H; y += 36) {
    g.fillStyle(dark, 1).fillRect(0, y + 34, W, 2);
    const offset = (y / 36) % 2 === 0 ? 0 : 120;
    for (let x = offset; x < W; x += 240) g.fillRect(x, y, 2, 34);
  }
}

/** Floating text that rises and fades, e.g. "+120z". */
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = '#f2c94c', size = 20): void {
  const t = txt(scene, x, y, s, size, color, { fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 4 })
    .setOrigin(0.5).setDepth(1000);
  scene.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 1200, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
}

/** Draws a chibi hunter (greybox) into a container at its origin (feet at y=0). */
export function drawHunter(scene: Phaser.Scene, armor: number, weapon: string, veteran: boolean): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  const dark = Phaser.Display.Color.ValueToColor(armor).darken(25).color;
  // weapon on back
  g.fillStyle(0x9aa3a8, 1).fillRect(10, -58, 6, 40);
  g.fillStyle(0x6e5a3c, 1).fillRect(9, -20, 8, 8);
  // body
  g.fillStyle(dark, 1).fillRoundedRect(-14, -30, 28, 30, 6);
  g.fillStyle(armor, 1).fillRoundedRect(-13, -30, 26, 20, 6);
  // head
  g.fillStyle(0xf0c9a0, 1).fillCircle(0, -42, 13);
  // helmet
  g.fillStyle(armor, 1).slice(0, -44, 14, Math.PI, 0, false).fillPath();
  if (veteran) {
    g.fillStyle(COLORS.gold, 1).fillTriangle(-4, -58, 4, -58, 0, -68);
  }
  // eyes
  g.fillStyle(0x2a1a0e, 1).fillCircle(-5, -40, 2).fillCircle(5, -40, 2);
  c.add(g);
  c.add(txt(scene, 0, -15, weapon, 9, '#ffffff', { fontStyle: 'bold' }).setOrigin(0.5));
  return c;
}

/** Draws the Palico chef. */
export function drawPalico(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(0xffffff, 1).fillRoundedRect(-14, -18, 28, 26, 8); // apron body
  g.fillStyle(0xe8a25a, 1).fillCircle(0, -32, 18); // head
  g.fillStyle(0xe8a25a, 1).fillTriangle(-19, -34, -18, -54, -6, -46).fillTriangle(19, -34, 18, -54, 6, -46); // ears
  g.fillStyle(0xffffff, 1).fillRoundedRect(-13, -66, 26, 18, 6).fillRect(-11, -52, 22, 6); // chef hat
  g.fillStyle(0x2a1a0e, 1).fillCircle(-6, -33, 2.5).fillCircle(6, -33, 2.5);
  g.fillStyle(0xd2694a, 1).fillTriangle(-2, -28, 2, -28, 0, -25);
  c.add(g);
  return c;
}
