import * as PIXI from "pixi.js";
import {
  Crack,
  getCgrid,
  getTotalSteps,
  incrementTotalSteps,
  initCgrid,
  updateCurveParams,
} from "./crack.js";
import { loadPaletteFromBase64, setPalette } from "./palette.js";
import { setSandCallback } from "./sandpainter.js";
import { fragmentShader, vertexShader } from "./shaders.js";
import type {
  DrawingBounds,
  EngineAPI,
  SubstrateEngineConfig,
} from "./types.js";
import { random, setSeed } from "./utils.js";

const MAX_PHYSICAL_SIZE = 8192;
const MAX_STEP_PARTICLES = 500000;

export class SubstrateEngine implements EngineAPI {
  private app: PIXI.Application | null = null;
  private world: PIXI.Container;
  private canvasTexture: PIXI.RenderTexture;
  private canvasSprite: PIXI.Sprite;
  private lineGraphics: PIXI.Graphics;
  private particleMesh: PIXI.Mesh<PIXI.Shader>;
  private posBuffer: PIXI.Buffer;
  private colBuffer: PIXI.Buffer;
  private config: SubstrateEngineConfig;
  private cracks: Crack[] = [];
  private pIdx = 0;
  private initialized = false;
  private startTime: number = 0;
  private texSize: number = 4096;
  private resolution: number = 1;
  private drawingBounds: DrawingBounds = {
    x: 0,
    y: 0,
    width: 4096,
    height: 4096,
  };

  constructor(config: SubstrateEngineConfig) {
    this.config = config;
    this.world = new PIXI.Container();

    // Initial placeholder texture
    this.canvasTexture = PIXI.RenderTexture.create({
      width: 4096,
      height: 4096,
    });
    this.canvasSprite = new PIXI.Sprite(this.canvasTexture);
    this.canvasSprite.anchor.set(0);
    this.canvasSprite.x = -2048;
    this.canvasSprite.y = -2048;
    this.lineGraphics = new PIXI.Graphics();

    const geometry = new PIXI.Geometry()
      .addAttribute(
        "aVertexPosition",
        new Float32Array(MAX_STEP_PARTICLES * 2),
        2,
      )
      .addAttribute("aColor", new Float32Array(MAX_STEP_PARTICLES * 4), 4);

    this.posBuffer = geometry.getBuffer("aVertexPosition");
    this.colBuffer = geometry.getBuffer("aColor");

    const shader = PIXI.Shader.from(vertexShader, fragmentShader);
    this.particleMesh = new PIXI.Mesh<PIXI.Shader>(
      geometry,
      shader,
      PIXI.State.for2d(),
      PIXI.DRAW_MODES.POINTS,
    );
    this.particleMesh.state.blend = true;
    this.particleMesh.state.blendMode = PIXI.BLEND_MODES.NORMAL;
  }

  private updateDrawingBounds(): void {
    const halfSize = this.texSize / 2;
    if (this.config.canvasSize === "viewport") {
      this.drawingBounds = {
        x: halfSize - window.innerWidth / 2,
        y: halfSize - window.innerHeight / 2,
        width: window.innerWidth,
        height: window.innerHeight,
      };
      return;
    }

    let size = 4000;
    if (this.config.canvasSize === "1000x1000") size = 1000;
    else if (this.config.canvasSize === "2000x2000") size = 2000;
    else if (this.config.canvasSize === "4000x4000") size = 4000;

    // Safety: ensure size doesn't exceed texSize
    size = Math.min(size, this.texSize);

    this.drawingBounds = {
      x: halfSize - size / 2,
      y: halfSize - size / 2,
      width: size,
      height: size,
    };
  }

  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.initialized) {
      throw new Error("Engine already initialized");
    }

    // Dynamic sizing strategy:
    // 1. Get window DPI and round to nearest integer.
    // Fractional DPI often causes grid-like seams on mobile tiled GPUs.
    const dpr = window.devicePixelRatio || 1;
    this.resolution = Math.max(1, Math.min(Math.round(dpr), 3));

    // 2. Calculate logical size so that physical size stays within MAX_PHYSICAL_SIZE (4096)
    this.texSize = Math.floor(MAX_PHYSICAL_SIZE / this.resolution);

    this.app = new PIXI.Application({
      view: canvas,
      width: canvas.clientWidth || window.innerWidth,
      height: canvas.clientHeight || window.innerHeight,
      backgroundColor: 0xf8f6f0,
      antialias: false,
      resolution: this.resolution,
      autoDensity: true,
      // @ts-ignore
      roundPixels: true,
    });

    // Recreate texture with optimal resolution and size
    this.canvasTexture.destroy(true);
    this.canvasTexture = PIXI.RenderTexture.create({
      width: this.texSize,
      height: this.texSize,
      resolution: this.resolution,
      scaleMode: PIXI.SCALE_MODES.LINEAR,
    });
    this.canvasSprite.texture = this.canvasTexture;

    // Use floor to ensure integer logical position
    this.canvasSprite.x = -Math.floor(this.texSize / 2);
    this.canvasSprite.y = -Math.floor(this.texSize / 2);

    // Set particle size to match resolution
    this.particleMesh.shader.uniforms.uResolution = this.resolution;

    await loadPaletteFromBase64();
    setPalette(this.config.palette);
    this.updateDrawingBounds();
    initCgrid(this.texSize);
    this.reset();

    this.app.stage.addChild(this.world);
    this.world.addChild(this.canvasSprite);
    this.world.x = Math.floor(this.app.screen.width / 2);
    this.world.y = Math.floor(this.app.screen.height / 2);

    this.setupSandCallback();
    this.setupRenderLoop();

    this.initialized = true;
  }

  reset(): void {
    setSeed(this.config.seed);
    const cgrid = getCgrid();
    cgrid.fill(10001); // Reset existing grid instead of re-allocating if possible

    const min = this.config.isStraight ? 0 : this.config.minCurve;
    const max = this.config.isStraight ? 0 : this.config.maxCurve;
    updateCurveParams(min, max);
    this.cracks = [];
    this.pIdx = 0;
    this.startTime = Date.now();
    this.updateDrawingBounds();

    const bg = new PIXI.Graphics()
      .beginFill(0xf8f6f0)
      .drawRect(0, 0, this.texSize, this.texSize)
      .endFill();

    if (this.app) {
      this.app.renderer.render(bg, {
        renderTexture: this.canvasTexture,
        clear: true,
      });
    }

    for (let k = 0; k < 16; k++) {
      const px = Math.floor(
        random(
          this.drawingBounds.x,
          this.drawingBounds.x + this.drawingBounds.width,
        ),
      );
      const py = Math.floor(
        random(
          this.drawingBounds.y,
          this.drawingBounds.y + this.drawingBounds.height,
        ),
      );
      if (px >= 0 && px < this.texSize && py >= 0 && py < this.texSize) {
        const i = px + py * this.texSize;
        cgrid[i] = Math.floor(random(360));
      }
    }

    for (let k = 0; k < 3; k++) {
      this.makeCrack();
    }
  }

  private makeCrack(): void {
    if (this.cracks.length < this.config.density) {
      this.cracks.push(new Crack(this.drawingBounds));
    }
  }

  private setupSandCallback(): void {
    setSandCallback((x, y, color, alpha) => {
      if (this.pIdx >= MAX_STEP_PARTICLES) return;
      const i2 = this.pIdx * 2;
      const i4 = this.pIdx * 4;

      this.posBuffer.data[i2] = x;
      this.posBuffer.data[i2 + 1] = y;

      this.colBuffer.data[i4] = ((color >> 16) & 0xff) / 255.0;
      this.colBuffer.data[i4 + 1] = ((color >> 8) & 0xff) / 255.0;
      this.colBuffer.data[i4 + 2] = (color & 0xff) / 255.0;
      this.colBuffer.data[i4 + 3] = alpha;

      this.pIdx++;
    });
  }

  private setupRenderLoop(): void {
    if (!this.app) return;

    this.app.ticker.add(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (elapsed >= this.config.resetInterval) {
        window.dispatchEvent(new CustomEvent("substrate:reset"));
        return;
      }

      incrementTotalSteps();
      this.pIdx = 0;
      this.lineGraphics.clear();

      const moveSteps =
        this.config.speed > 1 ? Math.floor(this.config.speed) : 1;

      if (this.config.speed < 1) {
        if (getTotalSteps() % Math.floor(1 / this.config.speed) !== 0) return;
      }

      for (let i = 0; i < moveSteps; i++) {
        this.cracks.forEach((c) =>
          c.move(this.lineGraphics, () => this.makeCrack(), this.drawingBounds),
        );
      }

      this.app!.renderer.render(this.lineGraphics, {
        renderTexture: this.canvasTexture,
        clear: false,
      });

      if (this.pIdx > 0) {
        this.posBuffer.update();
        this.colBuffer.update();
        this.particleMesh.size = this.pIdx;
        this.app!.renderer.render(this.particleMesh, {
          renderTexture: this.canvasTexture,
          clear: false,
        });
      }
    });
  }

  updateConfig(config: Partial<SubstrateEngineConfig>): void {
    const oldPalette = this.config.palette;
    const oldSize = this.config.canvasSize;
    const oldSeed = this.config.seed;
    this.config = { ...this.config, ...config };

    if (config.palette && config.palette !== oldPalette) {
      setPalette(config.palette);
    }

    const min = this.config.isStraight ? 0 : this.config.minCurve;
    const max = this.config.isStraight ? 0 : this.config.maxCurve;
    updateCurveParams(min, max);

    // Real-time update for existing cracks (only if seed hasn't changed)
    if (config.seed === undefined || config.seed === oldSeed) {
      this.cracks.forEach((c) => c.updateCurvature(min, max));
    }

    if (config.seed !== undefined && config.seed !== oldSeed) {
      this.reset();
    } else if (config.canvasSize && config.canvasSize !== oldSize) {
      this.reset();
    }
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }
    this.initialized = false;
    this.cracks = [];
  }

  getWorld(): PIXI.Container {
    return this.world;
  }

  getApp(): PIXI.Application | null {
    return this.app;
  }

  async exportImage(): Promise<string> {
    if (!this.app) throw new Error("App not initialized");

    const region = new PIXI.Rectangle(
      this.drawingBounds.x,
      this.drawingBounds.y,
      this.drawingBounds.width,
      this.drawingBounds.height,
    );

    const canvas = this.app.renderer.extract.canvas(
      this.canvasTexture,
      region,
    ) as HTMLCanvasElement;
    // Exporting as high-quality JPEG to reduce file size significantly (e.g. 20MB -> ~2MB)
    return canvas.toDataURL("image/jpeg", 0.9);
  }
}
