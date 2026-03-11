import { z } from "zod";

export const engineConfigSchema = z.object({
  seed: z.number(),
  speed: z.number().min(0.1).max(5),
  maxCurve: z.number().min(0).max(0.5),
  minCurve: z.number().min(0).max(0.5),
  density: z.number().min(10).max(500),
  resetInterval: z.number().min(30).max(1800),
  palette: z.enum([
    "pollock",
    "faded",
    "summerpool",
    "suburban",
    "monochrome",
  ] as const),
  isStraight: z.boolean(),
  canvasSize: z.enum([
    "viewport",
    "1000x1000",
    "2000x2000",
    "4000x4000",
  ] as const),
});

export const uiConfigSchema = z.object({
  showClock: z.boolean(),
});

export const substrateConfigSchema = z.object({
  engine: engineConfigSchema,
  ui: uiConfigSchema,
});

export type SubstrateEngineConfig = z.infer<typeof engineConfigSchema>;
export type SubstrateUIConfig = z.infer<typeof uiConfigSchema>;
export type SubstrateConfig = z.infer<typeof substrateConfigSchema>;

export interface DrawingBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EngineAPI {
  init(canvas: HTMLCanvasElement): Promise<void>;
  updateConfig(config: Partial<SubstrateEngineConfig>): void;
  reset(): void;
  destroy(): void;
  exportImage(): Promise<string>;
}
