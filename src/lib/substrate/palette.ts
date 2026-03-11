import pollockShimmeringUrl from "@/assets/pollockShimmering.gif?url";

export const PALETTES = {
  pollock: {
    id: "pollock",
    label: "Original (pollockShimmering)",
  },
  faded: {
    id: "faded",
    label: "Faded",
  },
  summerpool: {
    id: "summerpool",
    label: "Summer Pool",
  },
  suburban: {
    id: "suburban",
    label: "Sub Urban",
  },
  monochrome: {
    id: "monochrome",
    label: "Monochrome Ink",
  },
} as const;

export type PaletteId = keyof typeof PALETTES;

const watercolorPalette: number[] = [
  0x4a5f7a, 0x6b8c9e, 0x8fa3bd, 0xb5c9da, 0xe8f1f5, 0x7a9e7e, 0x9ebf9e,
  0xbdcebd, 0xe0f0e0, 0xf5f8f5, 0x9e8c7a, 0xbdad9e, 0xded3c0, 0xf0e8d8,
  0xf8f5eb, 0x7a6b5a, 0x9e8f7a, 0xbdad9e, 0xdecfc0, 0xf0e8d8, 0x5a6b7a,
  0x7a8c9e, 0x9eb3ce, 0xcfdfef, 0xe8f2fa, 0x8a7a6b, 0xae9e8c, 0xcfc0a9,
  0xe8e0cf, 0xf5f0eb,
];

const deepSeaPalette: number[] = [
  0x003366, 0x006699, 0x3399aa, 0x66cccc, 0x99e6e6, 0x004d4d,
];

const forestPalette: number[] = [
  0x2d3e2d, 0x4a5d4a, 0x6b7c6b, 0xa67c52, 0x5d4a4a, 0x8c9b8c,
];

const monochromePalette: number[] = [
  0x1a1a1a, 0x333333, 0x4d4d4d, 0x666666, 0x808080, 0x999999,
];

let goodcolor: number[] = [];
let numpal = 0;
let pollockPalette: number[] = [];
export function getPalette(): number[] {
  return goodcolor;
}

export function getPaletteSize(): number {
  return numpal;
}

export function setPalette(paletteId: PaletteId): void {
  switch (paletteId) {
    case "pollock":
      goodcolor = pollockPalette;
      break;
    case "faded":
      goodcolor = watercolorPalette;
      break;
    case "summerpool":
      goodcolor = deepSeaPalette;
      break;
    case "suburban":
      goodcolor = forestPalette;
      break;
    case "monochrome":
      goodcolor = monochromePalette;
      break;
    default:
      goodcolor = pollockPalette;
  }
  numpal = goodcolor.length;
}

export async function loadPaletteFromBase64(): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, img.width, 1);
      const data = imageData.data;

      pollockPalette = [];
      const maxpal = 512;

      for (let x = 0; x < img.width; x++) {
        const i = x * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const c = (r << 16) | (g << 8) | b;

        if (!pollockPalette.includes(c) && pollockPalette.length < maxpal) {
          pollockPalette.push(c);
        }
      }

      resolve();
    };
    img.src = pollockShimmeringUrl;
  });
}
