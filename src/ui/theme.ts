import Phaser from 'phaser';
import type { ArmorSet, Weapon } from '../core/types';

export const W = 1920;
export const H = 1080;

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
export const INK_SOFT = '#6b4a30';
export const CREAM = '#f7ead0';
export const GOLD = '#f2c94c';
export const FONT = '"Alegreya Sans", "Segoe UI", system-ui, sans-serif';
export const TITLE_FONT = 'Cinzel, Georgia, serif';

export function txt(
  scene: Phaser.Scene, x: number, y: number, s: string, size = 26, color = INK,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, ...style });
}

export function title(scene: Phaser.Scene, x: number, y: number, s: string, size = 44, color = GOLD): Phaser.GameObjects.Text {
  return txt(scene, x, y, s, size, color, {
    fontFamily: TITLE_FONT, fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: Math.round(size / 6),
  });
}

/** A tinted game-icons.net sprite, `size` pixels square, centered. */
export function icon(scene: Phaser.Scene, x: number, y: number, key: string, size = 40, tint = 0xffffff): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setDisplaySize(size, size).setTint(tint);
}

/** An icon on a dark round badge, for tinted ingredient icons on light panels. */
export function badgeIcon(scene: Phaser.Scene, x: number, y: number, key: string, size = 48, tint = 0xffffff): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  c.add(scene.add.circle(0, 0, size / 2, 0x4a3020).setStrokeStyle(2, 0x2a1a0e));
  c.add(icon(scene, 0, 0, key, size * 0.72, tint));
  c.setSize(size, size);
  return c;
}

/** An icon followed by text, e.g. a coin and "500z". Origin is the icon's left middle. */
export function iconText(
  scene: Phaser.Scene, x: number, y: number, key: string, s: string, size = 26, color = INK, tint = 0xffffff,
  bold = true,
): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const i = icon(scene, size * 0.6, 0, key, size * 1.15, tint);
  const t = txt(scene, size * 1.35, 0, s, size, color, bold ? { fontStyle: 'bold' } : {}).setOrigin(0, 0.5);
  c.add([i, t]);
  c.setSize(t.x + t.width, size * 1.2);
  return c;
}

/** A row of star sprites; half stars are drawn at half alpha. */
export function stars(scene: Phaser.Scene, x: number, y: number, n: number, size = 22, color = COLORS.gold): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  for (let i = 0; i < Math.ceil(n); i++) {
    const half = n - i < 1;
    c.add(scene.add.image(i * size * 1.05 + size / 2, 0, 'star').setDisplaySize(size, size).setTint(color).setAlpha(half ? 0.45 : 1));
  }
  return c;
}

export type PanelKind = 'wood' | 'paper' | 'inset' | 'light';
const PANEL_TEX: Record<PanelKind, string> = {
  wood: 'panel_brown', paper: 'panel_beige', inset: 'panelInset_beige', light: 'panel_beigeLight',
};

/** Kenney nine-slice panel with its top-left corner at x, y. */
export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, kind: PanelKind = 'paper'): Phaser.GameObjects.NineSlice {
  return scene.add.nineslice(x, y, PANEL_TEX[kind], undefined, w, h, 18, 18, 18, 18).setOrigin(0);
}

export type ButtonStyle = 'wood' | 'paper' | 'go';
const BUTTON_TEX: Record<ButtonStyle, { tex: string; color: string; tint: number }> = {
  wood: { tex: 'buttonLong_brown', color: CREAM, tint: 0xffffff },
  paper: { tex: 'buttonLong_beige', color: INK, tint: 0xffffff },
  go: { tex: 'buttonLong_beige', color: '#1f3a12', tint: 0xa8dc84 },
};

export class Button extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.NineSlice;
  private label: Phaser.GameObjects.Text;
  private img: Phaser.GameObjects.Image | null = null;
  private enabled = true;
  private tint: number;

  constructor(
    scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string,
    onClick: () => void, opts: { style?: ButtonStyle; size?: number; icon?: string; iconTint?: number } = {},
  ) {
    super(scene, x, y);
    const st = BUTTON_TEX[opts.style ?? 'wood'];
    this.tint = st.tint;
    this.bg = scene.add.nineslice(0, 0, st.tex, undefined, w, h, 14, 14, 14, 18).setTint(st.tint);
    const size = opts.size ?? 26;
    this.label = txt(scene, 0, -2, text, size, st.color, { fontStyle: 'bold' }).setOrigin(0.5);
    this.add([this.bg, this.label]);
    if (opts.icon) {
      this.img = icon(scene, 0, -2, opts.icon, size * 1.2, opts.iconTint ?? (st.color === CREAM ? 0xf7ead0 : 0x3a2414));
      this.add(this.img);
      this.layoutIcon();
    }
    this.setSize(w, h);
    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on('pointerover', () => this.enabled && this.bg.setTint(Phaser.Display.Color.ValueToColor(this.tint).darken(8).color));
    this.bg.on('pointerout', () => this.bg.setTint(this.enabled ? this.tint : 0x9a9a9a));
    this.bg.on('pointerdown', () => {
      if (!this.enabled) return;
      this.scene.tweens.add({ targets: this, scale: 0.95, duration: 60, yoyo: true });
      onClick();
    });
    scene.add.existing(this);
  }

  private layoutIcon(): void {
    if (!this.img) return;
    const gap = this.label.text ? 10 : 0;
    const total = this.img.displayWidth + gap + this.label.width;
    this.img.x = -total / 2 + this.img.displayWidth / 2;
    this.label.x = this.img.x + this.img.displayWidth / 2 + gap + this.label.width / 2;
  }

  setEnabled(on: boolean): this {
    this.enabled = on;
    this.bg.setTint(on ? this.tint : 0x9a9a9a);
    this.label.setAlpha(on ? 1 : 0.55);
    this.img?.setAlpha(on ? 1 : 0.55);
    return this;
  }

  setText(s: string): this {
    this.label.setText(s);
    this.layoutIcon();
    return this;
  }

  setIcon(key: string): this {
    this.img?.setTexture(key);
    return this;
  }
}

/** Full-screen wooden plank background. */
export function drawWoodBg(scene: Phaser.Scene, color = COLORS.wood): void {
  const g = scene.add.graphics();
  g.fillStyle(color, 1).fillRect(0, 0, W, H);
  const dark = Phaser.Display.Color.ValueToColor(color).darken(12).color;
  const light = Phaser.Display.Color.ValueToColor(color).lighten(4).color;
  for (let y = 0; y < H; y += 72) {
    g.fillStyle(light, 1).fillRect(0, y + 4, W, 6);
    g.fillStyle(dark, 1).fillRect(0, y + 68, W, 4);
    const offset = (y / 72) % 2 === 0 ? 0 : 240;
    for (let x = offset; x < W; x += 480) {
      g.fillRect(x, y, 4, 68);
      g.fillStyle(0x2a1a0e, 0.5).fillCircle(x + 14, y + 14, 3).fillCircle(x + 14, y + 54, 3);
      g.fillStyle(dark, 1);
    }
  }
}

/** Floating text that rises and fades, e.g. "+120z". */
export function floatText(scene: Phaser.Scene, x: number, y: number, s: string, color = GOLD, size = 36): void {
  const t = txt(scene, x, y, s, size, color, { fontStyle: 'bold', stroke: '#2a1a0e', strokeThickness: 7 })
    .setOrigin(0.5).setDepth(1000);
  scene.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 1300, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
}

/** Generates the few shapes that are drawn in code: star, heart and a dot. */
export function makeShapeTextures(scene: Phaser.Scene): void {
  const g = scene.make.graphics({}, false);
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 62 : 26;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(new Phaser.Math.Vector2(64 + Math.cos(a) * r, 68 + Math.sin(a) * r));
  }
  g.fillStyle(0xffffff, 1).fillPoints(pts, true).generateTexture('star', 128, 128);
  g.clear();
  g.fillStyle(0xffffff, 1).fillCircle(40, 46, 30).fillCircle(88, 46, 30).fillTriangle(12, 58, 116, 58, 64, 118);
  g.generateTexture('heart', 128, 128);
  g.clear();
  g.fillStyle(0xffffff, 1).fillCircle(32, 32, 32).generateTexture('dot', 64, 64);
  g.destroy();
}

// ---------------------------------------------------------------- characters

function shade(color: number, amount: number): number {
  const c = Phaser.Display.Color.ValueToColor(color);
  return (amount < 0 ? c.darken(-amount) : c.lighten(amount)).color;
}

/** Weapon silhouette on the hunter's back. */
function drawWeapon(g: Phaser.GameObjects.Graphics, weapon: Weapon, id: string): void {
  const steel = 0xb8c0c6;
  const grip = 0x5a4228;
  switch (id) {
    case 'gs':
      g.fillStyle(steel, 1).fillRect(14, -150, 26, 108).fillTriangle(14, -150, 40, -150, 27, -168);
      g.fillStyle(grip, 1).fillRect(6, -46, 42, 8).fillRect(22, -40, 10, 26);
      break;
    case 'ls':
      g.fillStyle(steel, 1).fillRect(26, -170, 8, 128).fillTriangle(26, -170, 34, -170, 30, -182);
      g.fillStyle(grip, 1).fillRect(20, -44, 20, 6).fillRect(26, -40, 8, 30);
      break;
    case 'sns':
      g.fillStyle(steel, 1).fillRect(28, -110, 8, 60);
      g.fillStyle(grip, 1).fillRect(24, -52, 16, 6);
      g.fillStyle(shade(steel, -20), 1).fillCircle(-30, -64, 18);
      break;
    case 'db':
      g.fillStyle(steel, 1).fillRect(18, -112, 7, 56).fillRect(34, -112, 7, 56);
      g.fillStyle(grip, 1).fillRect(16, -58, 11, 14).fillRect(32, -58, 11, 14);
      break;
    case 'hammer':
      g.fillStyle(grip, 1).fillRect(26, -140, 8, 110);
      g.fillStyle(shade(steel, -25), 1).fillRoundedRect(4, -164, 52, 34, 6);
      break;
    case 'hh':
      g.fillStyle(grip, 1).fillRect(26, -120, 8, 92);
      g.fillStyle(0xc8a050, 1).fillEllipse(30, -132, 58, 34).fillCircle(10, -146, 8).fillCircle(50, -146, 8);
      break;
    case 'lance':
      g.fillStyle(steel, 1).fillTriangle(20, -40, 40, -40, 30, -190);
      g.fillStyle(shade(steel, -20), 1).fillRoundedRect(-44, -96, 30, 64, 8);
      break;
    case 'gl':
      g.fillStyle(steel, 1).fillRect(20, -170, 20, 130);
      g.fillStyle(0x3a3a3a, 1).fillCircle(30, -170, 9);
      g.fillStyle(shade(steel, -20), 1).fillRoundedRect(-44, -96, 30, 64, 8);
      break;
    case 'sa':
      g.fillStyle(grip, 1).fillRect(26, -132, 8, 100);
      g.fillStyle(steel, 1).fillTriangle(30, -150, 62, -128, 30, -104);
      break;
    case 'cb':
      g.fillStyle(steel, 1).fillRoundedRect(14, -142, 22, 90, 4);
      g.fillStyle(0xd0b040, 1).fillRect(18, -98, 14, 6);
      g.fillStyle(shade(steel, -20), 1).fillRoundedRect(-44, -96, 30, 60, 8);
      break;
    case 'ig':
      g.fillStyle(grip, 1).fillRect(26, -160, 6, 130);
      g.fillStyle(steel, 1).fillTriangle(22, -160, 36, -160, 29, -186).fillTriangle(22, -30, 36, -30, 29, -6);
      break;
    case 'lbg':
      g.fillStyle(0x4a4a4a, 1).fillRect(14, -112, 12, 64);
      g.fillStyle(grip, 1).fillRoundedRect(10, -60, 22, 26, 4);
      break;
    case 'hbg':
      g.fillStyle(0x4a4a4a, 1).fillRect(8, -138, 22, 92).fillRect(30, -120, 10, 40);
      g.fillStyle(grip, 1).fillRoundedRect(6, -54, 28, 24, 4);
      break;
    case 'bow':
      g.lineStyle(7, 0x8a5a2a, 1).beginPath().arc(4, -90, 62, -1.1, 1.1, false).strokePath();
      g.lineStyle(2, 0xe8e0d0, 1).lineBetween(4 + Math.cos(-1.1) * 62, -90 + Math.sin(-1.1) * 62, 4 + Math.cos(1.1) * 62, -90 + Math.sin(1.1) * 62);
      break;
    default:
      g.fillStyle(steel, 1).fillRect(26, -120, 8, 70);
  }
  void weapon;
}

/** Draws a chibi Research Commission hunter (feet at y=0) in an armor set's colors. */
export function drawHunter(scene: Phaser.Scene, armor: ArmorSet, weapon: Weapon, veteran: boolean): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  const main = armor.main;
  const trim = armor.trim;
  const dark = shade(main, -25);

  g.fillStyle(0x000000, 0.25).fillEllipse(0, 0, 76, 16);
  drawWeapon(g, weapon, weapon.id);
  // legs and boots
  g.fillStyle(dark, 1).fillRoundedRect(-22, -36, 18, 34, 5).fillRoundedRect(4, -36, 18, 34, 5);
  g.fillStyle(trim, 1).fillRoundedRect(-24, -12, 22, 12, 4).fillRoundedRect(2, -12, 22, 12, 4);
  // torso and belt
  g.fillStyle(main, 1).fillRoundedRect(-28, -82, 56, 50, 12);
  g.fillStyle(trim, 1).fillRect(-28, -42, 56, 8);
  g.fillStyle(0xc8a050, 1).fillRect(-5, -42, 10, 8);
  // pauldrons and arms
  g.fillStyle(trim, 1).fillEllipse(-30, -76, 26, 20).fillEllipse(30, -76, 26, 20);
  g.fillStyle(dark, 1).fillRoundedRect(-38, -72, 12, 34, 5).fillRoundedRect(26, -72, 12, 34, 5);
  // head
  g.fillStyle(0xf0c9a0, 1).fillCircle(0, -104, 24);
  // helmet with a crest in the trim color
  g.fillStyle(main, 1).slice(0, -108, 27, Math.PI, 0, false).fillPath();
  g.fillStyle(trim, 1).fillRect(-27, -110, 54, 6);
  g.fillStyle(trim, 1).fillTriangle(-6, -134, 6, -134, 0, -150);
  if (veteran) {
    g.fillStyle(COLORS.gold, 1).fillTriangle(-24, -126, -14, -132, -30, -146).fillTriangle(24, -126, 14, -132, 30, -146);
  }
  // eyes
  g.fillStyle(0x2a1a0e, 1).fillCircle(-9, -100, 3.5).fillCircle(9, -100, 3.5);
  g.fillStyle(0xd88a70, 1).fillCircle(-15, -92, 4).fillCircle(15, -92, 4);
  c.add(g);
  return c;
}

/** Draws the Meowscular Chef: muscular Palico in a tall chef's hat and scarf, holding a cleaver. */
export function drawPalico(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const fur = 0xe8e0d4;
  const furDark = 0x9a8f84;
  g.fillStyle(0x000000, 0.25).fillEllipse(0, 0, 110, 18);
  // tail
  g.lineStyle(10, furDark, 1).beginPath().arc(46, -40, 26, Math.PI * 0.9, Math.PI * 1.9, false).strokePath();
  // legs
  g.fillStyle(fur, 1).fillRoundedRect(-30, -30, 24, 30, 10).fillRoundedRect(6, -30, 24, 30, 10);
  // muscular body with apron
  g.fillStyle(fur, 1).fillEllipse(0, -60, 92, 76);
  g.fillStyle(0xf8f4ec, 1).fillRoundedRect(-28, -70, 56, 54, 10);
  g.fillStyle(0xd8d0c4, 1).fillRect(-28, -48, 56, 4);
  // arms: one raised with a cleaver
  g.fillStyle(fur, 1).fillEllipse(-48, -62, 32, 44);
  g.fillStyle(fur, 1).fillEllipse(48, -82, 30, 46);
  g.fillStyle(0x5a4228, 1).fillRect(52, -128, 8, 30);
  g.fillStyle(0xc8d0d6, 1).fillRoundedRect(40, -158, 38, 32, 4);
  g.fillStyle(0x8a949a, 1).fillRect(40, -132, 38, 4);
  // red scarf
  g.fillStyle(0xb8342a, 1).fillRoundedRect(-36, -102, 72, 16, 8).fillTriangle(-30, -92, -12, -92, -26, -64);
  // head and ears
  g.fillStyle(fur, 1).fillCircle(0, -128, 34);
  g.fillStyle(fur, 1).fillTriangle(-34, -136, -30, -176, -8, -160).fillTriangle(34, -136, 30, -176, 8, -160);
  g.fillStyle(0xe8a0a0, 1).fillTriangle(-28, -142, -27, -166, -14, -156).fillTriangle(28, -142, 27, -166, 14, -156);
  // tall chef's hat
  g.fillStyle(0xffffff, 1).fillRoundedRect(-30, -232, 60, 66, 18).fillCircle(-20, -228, 18).fillCircle(20, -228, 18).fillCircle(0, -238, 20);
  g.fillStyle(0xe8e4dc, 1).fillRect(-30, -172, 60, 12);
  // face and whiskers
  g.fillStyle(0x2a1a0e, 1).fillCircle(-12, -130, 4.5).fillCircle(12, -130, 4.5);
  g.lineStyle(3, 0x2a1a0e, 1).lineBetween(-20, -140, -6, -137).lineBetween(20, -140, 6, -137);
  g.fillStyle(0xd2694a, 1).fillTriangle(-4, -120, 4, -120, 0, -114);
  g.lineStyle(2, 0x6a5a4a, 1).lineBetween(-10, -116, -34, -120).lineBetween(-10, -112, -34, -110).lineBetween(10, -116, 34, -120).lineBetween(10, -112, 34, -110);
  c.add(g);
  return c;
}
