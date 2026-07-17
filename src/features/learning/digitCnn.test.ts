import { describe, expect, test } from 'vitest';
import { sampleDigit } from './digitCanvas';
import {
  DIGIT_MODEL_METADATA,
  conv2dSame,
  maxPool2x2,
  runDigitCnn,
  stableSoftmax,
  type TensorAsset,
  type Volume,
} from './digitCnn';

describe('digit CNN', () => {
  test('loads the trained checkpoint metadata and expected parameter count', () => {
    expect(DIGIT_MODEL_METADATA.sourceCheckpoint).toBe('digit_cnn.pt');
    expect(DIGIT_MODEL_METADATA.parameterCount).toBe(9098);
  });

  test('performs padded cross-correlation in PyTorch weight order', () => {
    const input: Volume = { channels: 1, height: 2, width: 2, values: Float32Array.from([1, 2, 3, 4]) };
    const weights: TensorAsset = { shape: [1, 1, 3, 3], values: [0, 0, 0, 0, 1, 0, 0, 0, 0] };
    const bias: TensorAsset = { shape: [1], values: [0.5] };

    expect(Array.from(conv2dSame(input, weights, bias).values)).toEqual([1.5, 2.5, 3.5, 4.5]);
  });

  test('max-pools each channel independently', () => {
    const volume: Volume = {
      channels: 2,
      height: 2,
      width: 2,
      values: Float32Array.from([1, 4, 3, 2, -1, -2, -3, -4]),
    };

    expect(Array.from(maxPool2x2(volume).values)).toEqual([4, -1]);
  });

  test('uses a numerically stable softmax', () => {
    const probabilities = stableSoftmax([1000, 1001, 1002]);
    expect(probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 12);
    expect(probabilities[2]).toBeGreaterThan(probabilities[1]);
    expect(probabilities.every(Number.isFinite)).toBe(true);
  });

  test.each([0, 1, 3, 7, 8])('runs a finite full forward pass for sample %i', (digit) => {
    const result = runDigitCnn(sampleDigit(digit));

    expect(result.probabilities).toHaveLength(10);
    expect(result.probabilities.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 6);
    expect(result.probabilities.every(Number.isFinite)).toBe(true);
    expect(result.activations.map(({ channels, height, width }) => [channels, height, width])).toEqual([
      [1, 28, 28],
      [8, 28, 28],
      [8, 14, 14],
      [16, 14, 14],
      [16, 7, 7],
    ]);
  });

  test('rejects an incorrectly sized image', () => {
    expect(() => runDigitCnn([0, 1])).toThrow('28×28');
  });
});
