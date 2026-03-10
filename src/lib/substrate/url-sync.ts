import { substrateConfigSchema, type SubstrateConfig } from "./types";

export function encodeConfig(config: SubstrateConfig): string {
  const json = JSON.stringify(config);
  return btoa(json);
}

export function decodeConfig(base64: string): SubstrateConfig | null {
  try {
    const json = atob(base64);
    const parsed = JSON.parse(json);

    // Support legacy flat config by migrating it to nested
    if (parsed && typeof parsed === "object" && !parsed.engine && !parsed.ui) {
      return substrateConfigSchema.parse({
        engine: {
          seed: parsed.seed ?? 123456,
          speed: parsed.speed ?? 0.5,
          maxCurve: parsed.maxCurve ?? 0.01,
          minCurve: parsed.minCurve ?? 0.0,
          density: parsed.density ?? 200,
          resetInterval: parsed.resetInterval ?? 120,
          palette: parsed.palette ?? "pollock",
          isStraight: parsed.isStraight ?? true,
          canvasSize: parsed.canvasSize ?? "viewport",
        },
        ui: {
          showClock: parsed.showClock ?? false,
        },
      });
    }

    return substrateConfigSchema.parse(parsed);
  } catch (e) {
    console.error("Failed to decode config from URL", e);
    return null;
  }
}

export function getShareUrl(config: SubstrateConfig): string {
  const base64 = encodeConfig(config);
  const url = new URL(window.location.href);
  url.searchParams.set("config", base64);
  return url.toString();
}
