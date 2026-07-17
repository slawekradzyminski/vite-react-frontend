import { describe, expect, test } from 'vitest';
import { blankDigit, imageDataToDigit, paintLine, sampleDigit } from './digitCanvas';

describe('digit canvas math', () => {
  test('draws and erases a continuous stroke without mutating the source', () => {
    const source = blankDigit();
    const drawn = paintLine(source, { x: 4, y: 4 }, { x: 20, y: 20 }, 3);
    const erased = paintLine(drawn, { x: 12, y: 12 }, { x: 12, y: 12 }, 5, true);

    expect(source.every((value) => value === 0)).toBe(true);
    expect(drawn.filter((value) => value > 0).length).toBeGreaterThan(30);
    expect(erased[12 * 28 + 12]).toBe(0);
  });

  test('provides deterministic non-empty samples for every class', () => {
    for (let digit = 0; digit < 10; digit += 1) {
      const first = sampleDigit(digit);
      expect(first).toEqual(sampleDigit(digit));
      expect(first.some((value) => value > 0)).toBe(true);
    }
  });

  test('inverts a light image background and centers the active pixels', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(255);
    for (const index of [5, 6, 9, 10]) {
      data[index * 4] = 0;
      data[index * 4 + 1] = 0;
      data[index * 4 + 2] = 0;
    }

    const digit = imageDataToDigit(data, 4, 4);

    expect(digit).toHaveLength(28 * 28);
    expect(digit.some((value) => value > 0.9)).toBe(true);
    expect(digit[14 * 28 + 14]).toBeGreaterThan(0.9);
  });

  test('returns a blank digit for an empty image', () => {
    const data = new Uint8ClampedArray([255, 255, 255, 255]);
    expect(imageDataToDigit(data, 1, 1)).toEqual(blankDigit());
  });

  test('processes a large upload without spreading every active pixel onto the call stack', () => {
    const width = 400;
    const height = 400;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 80; y < 320; y += 1) {
      for (let x = 160; x < 240; x += 1) {
        const offset = (y * width + x) * 4;
        data[offset] = 0;
        data[offset + 1] = 0;
        data[offset + 2] = 0;
      }
    }

    expect(imageDataToDigit(data, width, height).some((value) => value > 0.9)).toBe(true);
  });
});
