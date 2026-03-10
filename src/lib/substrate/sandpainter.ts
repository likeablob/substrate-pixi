import { getPalette, getPaletteSize } from "./palette.js";
import { random } from "./utils.js";

export class SandPainter {
  c: number;
  g: number;

  constructor() {
    this.c = this.somecolor();
    this.g = random(0.01, 0.1);
  }

  somecolor(): number {
    const goodcolor = getPalette();
    const numpal = getPaletteSize();
    return goodcolor[Math.floor(random(numpal))];
  }

  render(x: number, y: number, ox: number, oy: number): void {
    this.g += random(-0.05, 0.05);
    this.g = Math.max(0, Math.min(1.0, this.g));
    const grains = 64;
    const w = this.g / (grains - 1);

    for (let i = 0; i < grains; i++) {
      const a = 0.1 - i / (grains * 10.0);
      if (a <= 0) continue;
      const px = ox + (x - ox) * Math.sin(Math.sin(i * w));
      const py = oy + (y - oy) * Math.sin(Math.sin(i * w));
      addSand(px, py, this.c, a * 1.5);
    }
  }
}

let sandCallback:
  | ((x: number, y: number, color: number, alpha: number) => void)
  | null = null;

export function setSandCallback(
  callback: (x: number, y: number, color: number, alpha: number) => void,
): void {
  sandCallback = callback;
}

function addSand(x: number, y: number, color: number, alpha: number): void {
  if (sandCallback) {
    sandCallback(x, y, color, alpha);
  }
}
