export const DIGIT_SIZE = 28;

export type DigitPoint = { x: number; y: number };

const SAMPLE_PATHS: Record<number, DigitPoint[][]> = {
  0: [[{ x: 9, y: 5 }, { x: 6, y: 9 }, { x: 6, y: 19 }, { x: 9, y: 23 }, { x: 17, y: 23 }, { x: 21, y: 19 }, { x: 21, y: 9 }, { x: 17, y: 5 }, { x: 9, y: 5 }]],
  1: [[{ x: 10, y: 9 }, { x: 14, y: 5 }, { x: 14, y: 23 }], [{ x: 10, y: 23 }, { x: 19, y: 23 }]],
  2: [[{ x: 7, y: 9 }, { x: 10, y: 5 }, { x: 17, y: 5 }, { x: 21, y: 9 }, { x: 19, y: 13 }, { x: 7, y: 23 }, { x: 21, y: 23 }]],
  3: [[{ x: 7, y: 7 }, { x: 11, y: 5 }, { x: 18, y: 6 }, { x: 20, y: 10 }, { x: 17, y: 14 }, { x: 11, y: 14 }], [{ x: 17, y: 14 }, { x: 21, y: 18 }, { x: 19, y: 22 }, { x: 12, y: 24 }, { x: 7, y: 21 }]],
  4: [[{ x: 18, y: 24 }, { x: 18, y: 5 }, { x: 7, y: 17 }, { x: 22, y: 17 }]],
  5: [[{ x: 20, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 14 }, { x: 17, y: 14 }, { x: 21, y: 18 }, { x: 19, y: 23 }, { x: 11, y: 24 }, { x: 7, y: 21 }]],
  6: [[{ x: 18, y: 5 }, { x: 13, y: 5 }, { x: 9, y: 8 }, { x: 7, y: 13 }, { x: 7, y: 20 }, { x: 10, y: 23 }, { x: 17, y: 23 }, { x: 20, y: 19 }, { x: 18, y: 15 }, { x: 10, y: 15 }, { x: 7, y: 19 }]],
  7: [[{ x: 6, y: 6 }, { x: 21, y: 6 }, { x: 16, y: 13 }, { x: 12, y: 23 }]],
  8: [[{ x: 13, y: 14 }, { x: 8, y: 11 }, { x: 9, y: 6 }, { x: 14, y: 4 }, { x: 19, y: 7 }, { x: 18, y: 11 }, { x: 13, y: 14 }, { x: 8, y: 18 }, { x: 10, y: 23 }, { x: 16, y: 24 }, { x: 21, y: 19 }, { x: 18, y: 15 }, { x: 13, y: 14 }]],
  9: [[{ x: 19, y: 15 }, { x: 11, y: 15 }, { x: 7, y: 11 }, { x: 9, y: 6 }, { x: 16, y: 5 }, { x: 20, y: 9 }, { x: 19, y: 15 }], [{ x: 20, y: 9 }, { x: 20, y: 16 }, { x: 18, y: 21 }, { x: 14, y: 24 }]],
};

export function blankDigit(): number[] {
  return new Array(DIGIT_SIZE * DIGIT_SIZE).fill(0);
}

export function paintBrush(pixels: number[], point: DigitPoint, brushSize: number, erase = false): number[] {
  const result = [...pixels];
  const radius = Math.max(0.5, brushSize / 2);
  for (let row = Math.floor(point.y - radius); row <= Math.ceil(point.y + radius); row += 1) {
    for (let col = Math.floor(point.x - radius); col <= Math.ceil(point.x + radius); col += 1) {
      if (row < 0 || col < 0 || row >= DIGIT_SIZE || col >= DIGIT_SIZE) continue;
      const distance = Math.hypot(col - point.x, row - point.y);
      if (distance <= radius + 0.35) {
        const value = erase ? 0 : Math.max(0.15, 1 - distance / (radius + 0.5));
        const index = row * DIGIT_SIZE + col;
        result[index] = erase ? 0 : Math.max(result[index], value);
      }
    }
  }
  return result;
}

export function paintLine(pixels: number[], from: DigitPoint, to: DigitPoint, brushSize: number, erase = false): number[] {
  const distance = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  let result = [...pixels];
  for (let step = 0; step <= Math.max(1, Math.ceil(distance * 2)); step += 1) {
    const ratio = step / Math.max(1, Math.ceil(distance * 2));
    result = paintBrush(result, {
      x: from.x + (to.x - from.x) * ratio,
      y: from.y + (to.y - from.y) * ratio,
    }, brushSize, erase);
  }
  return result;
}

export function sampleDigit(digit: number): number[] {
  const paths = SAMPLE_PATHS[digit];
  if (!paths) throw new Error(`Unknown digit sample: ${digit}`);
  let pixels = blankDigit();
  paths.forEach((path) => {
    for (let index = 1; index < path.length; index += 1) {
      pixels = paintLine(pixels, path[index - 1], path[index], 3.4);
    }
  });
  return pixels;
}

export function imageDataToDigit(data: Uint8ClampedArray, width: number, height: number): number[] {
  if (data.length !== width * height * 4 || width < 1 || height < 1) throw new Error('Invalid image data');
  const luminances = Array.from({ length: width * height }, (_, index) => {
    const offset = index * 4;
    const alpha = data[offset + 3] / 255;
    return ((0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2]) * alpha) + 255 * (1 - alpha);
  });
  const lightBackground = luminances.reduce((sum, value) => sum + value, 0) / luminances.length > 127;
  const ink = luminances.map((value) => lightBackground ? 1 - value / 255 : value / 255);
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  ink.forEach((value, index) => {
    if (value <= 0.08) return;
    const x = index % width;
    const y = Math.floor(index / width);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  });
  if (maxX < 0 || maxY < 0) return blankDigit();
  const sourceWidth = maxX - minX + 1;
  const sourceHeight = maxY - minY + 1;
  const scale = Math.min(20 / sourceWidth, 20 / sourceHeight);
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  const offsetX = Math.floor((DIGIT_SIZE - targetWidth) / 2);
  const offsetY = Math.floor((DIGIT_SIZE - targetHeight) / 2);
  const result = blankDigit();
  for (let row = 0; row < targetHeight; row += 1) {
    for (let col = 0; col < targetWidth; col += 1) {
      const sourceX = Math.min(maxX, minX + Math.floor((col / targetWidth) * sourceWidth));
      const sourceY = Math.min(maxY, minY + Math.floor((row / targetHeight) * sourceHeight));
      result[(offsetY + row) * DIGIT_SIZE + offsetX + col] = ink[sourceY * width + sourceX];
    }
  }
  return result;
}
