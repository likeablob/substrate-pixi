import { persistentAtom } from "@nanostores/persistent";
import { substrateConfigSchema, type SubstrateConfig } from "./substrate/types";

export { type SubstrateConfig };

export const defaultConfig: SubstrateConfig = {
  engine: {
    seed: Math.floor(Math.random() * 1000000),
    speed: 0.5,
    maxCurve: 0.01,
    minCurve: 0.0,
    density: 200,
    resetInterval: 120,
    palette: "pollock",
    isStraight: true,
    canvasSize: "viewport",
  },
  ui: {
    showClock: false,
  },
};

export const $config = persistentAtom<SubstrateConfig>(
  "substrate-config",
  defaultConfig,
  {
    encode: JSON.stringify,
    decode: (value) => {
      try {
        const parsed = JSON.parse(value);
        return substrateConfigSchema.parse(parsed);
      } catch (e) {
        return defaultConfig;
      }
    },
  },
);
