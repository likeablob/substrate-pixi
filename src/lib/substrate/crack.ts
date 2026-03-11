import * as PIXI from "pixi.js";
import { SandPainter } from "./sandpainter.js";
import type { DrawingBounds } from "./types.js";
import { int, random } from "./utils.js";

let cgrid: Int32Array | null = null;
let minCurve = 0.001;
let maxCurve = 0.01;
let totalSteps = 0;
let currentTexSize = 4096;

export function initCgrid(size: number = 4096): void {
  currentTexSize = size;
  cgrid = new Int32Array(currentTexSize * currentTexSize).fill(10001);
}

export function updateCurveParams(min: number, max: number): void {
  minCurve = min;
  maxCurve = max;
}

export function incrementTotalSteps(): void {
  totalSteps++;
}

export function getTotalSteps(): number {
  return totalSteps;
}

export function getCgrid(): Int32Array {
  if (!cgrid) {
    throw new Error("cgrid not initialized");
  }
  return cgrid;
}

export class Crack {
  sp: SandPainter;
  curvature: number = 0;
  curvatureFactor: number;
  sign: number;
  x: number = 0;
  y: number = 0;
  t: number = 0;
  active: boolean = false;

  constructor(bounds: DrawingBounds) {
    this.sp = new SandPainter();
    this.sign = random(100) < 50 ? 1 : -1;
    this.curvatureFactor = random(0, 1);
    this.updateCurvature(minCurve, maxCurve);
    this.findStart(bounds);
  }

  updateCurvature(min: number, max: number): void {
    const range = max - min;
    const value = min + this.curvatureFactor * range;
    this.curvature = this.sign * value;
  }

  findStart(bounds: DrawingBounds): void {
    let px = 0,
      py = 0,
      found = false,
      timeout = 0;

    const rangeStartX = int(bounds.x);
    const rangeStartY = int(bounds.y);
    const rangeWidth = int(bounds.width);
    const rangeHeight = int(bounds.height);

    while (!found && timeout++ < 1000) {
      px = int(random(rangeStartX, rangeStartX + rangeWidth));
      py = int(random(rangeStartY, rangeStartY + rangeHeight));

      // Boundary check to prevent index out of bounds
      if (px >= 0 && px < currentTexSize && py >= 0 && py < currentTexSize) {
        if (cgrid![px + py * currentTexSize] < 10000) found = true;
      }
    }

    if (found) {
      let a = cgrid![px + py * currentTexSize];
      if (random(100) < 50) a += -90 + int(random(-2, 2.1));
      else a += 90 + int(random(-2, 2.1));
      this.startCrack(px, py, a);
      this.active = true;
    } else {
      this.active = false;
    }
  }

  startCrack(X: number, Y: number, T: number): void {
    this.x = X;
    this.y = Y;
    this.t = T;
    this.x += 0.61 * Math.cos((this.t * Math.PI) / 180);
    this.y += 0.61 * Math.sin((this.t * Math.PI) / 180);
  }

  move(
    lineGraphics: PIXI.Graphics,
    onCreateCrack: () => void,
    bounds: DrawingBounds,
  ): void {
    if (!this.active) {
      this.findStart(bounds);
      return;
    }

    this.t += this.curvature;

    this.x += 0.42 * Math.cos((this.t * Math.PI) / 180);
    this.y += 0.42 * Math.sin((this.t * Math.PI) / 180);

    const z = 0.33;
    const cx = int(this.x + random(-z, z));
    const cy = int(this.y + random(-z, z));

    this.regionColor();

    // Draw the thin, solid black line of the crack itself
    lineGraphics.lineStyle(1, 0x000000, 0.3);
    lineGraphics.moveTo(this.x + random(-z, z), this.y + random(-z, z));
    lineGraphics.lineTo(this.x + random(-z, z), this.y + random(-z, z));

    const boundStartX = bounds.x;
    const boundEndX = bounds.x + bounds.width;
    const boundStartY = bounds.y;
    const boundEndY = bounds.y + bounds.height;

    if (
      cx >= boundStartX &&
      cx < boundEndX &&
      cy >= boundStartY &&
      cy < boundEndY
    ) {
      if (cx >= 0 && cx < currentTexSize && cy >= 0 && cy < currentTexSize) {
        if (
          cgrid![cx + cy * currentTexSize] > 10000 ||
          Math.abs(cgrid![cx + cy * currentTexSize] - this.t) < 5
        ) {
          cgrid![cx + cy * currentTexSize] = int(this.t);
        } else if (Math.abs(cgrid![cx + cy * currentTexSize] - this.t) > 2) {
          this.findStart(bounds);
          onCreateCrack();
        }
      } else {
        this.findStart(bounds);
        onCreateCrack();
      }
    } else {
      this.findStart(bounds);
      onCreateCrack();
    }
  }

  regionColor(): void {
    let rx = this.x,
      ry = this.y;
    let openspace = true;

    while (openspace) {
      rx += 0.81 * Math.sin((this.t * Math.PI) / 180);
      ry -= 0.81 * Math.cos((this.t * Math.PI) / 180);
      const cx = int(rx),
        cy = int(ry);
      if (cx >= 0 && cx < currentTexSize && cy >= 0 && cy < currentTexSize) {
        if (cgrid![cx + cy * currentTexSize] > 10000) {
          // space is open
        } else {
          openspace = false;
        }
      } else {
        openspace = false;
      }
    }
    this.sp.render(rx, ry, this.x, this.y);
  }
}
