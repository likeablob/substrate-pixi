let _seed = 12345;

export function setSeed(seed: number) {
  _seed = seed;
}

function mulberry32(): number {
  let t = (_seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function random(min: number, max?: number): number {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return mulberry32() * (max - min) + min;
}

export function int(val: number): number {
  return Math.floor(val);
}
