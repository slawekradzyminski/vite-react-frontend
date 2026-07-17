import { describe, expect, test } from 'vitest';
import {
  PERCEPTRON_DATASETS,
  applyTemperature,
  calculateKvCache,
  convolutionTrace,
  crossEntropy,
  decodeToken,
  trainPerceptronStep,
  validConvolution,
  validateKvCacheConfig,
} from './learningMath';

describe('learning math', () => {
  test('perceptron exposes the complete update for a mistake', () => {
    const result = trainPerceptronStep([0, 0], 0, PERCEPTRON_DATASETS.OR[0], 0.5);

    expect(result).toMatchObject({
      score: 0,
      prediction: 1,
      mistake: true,
      deltaWeights: [0.5, 0.5],
      deltaBias: -0.5,
      weightsAfter: [0.5, 0.5],
      biasAfter: -0.5,
    });
  });

  test('perceptron keeps parameters when the prediction is correct', () => {
    const result = trainPerceptronStep([1, 1], 0, PERCEPTRON_DATASETS.OR[0], 0.5);
    expect(result.mistake).toBe(false);
    expect(result.deltaWeights).toEqual([0, 0]);
    expect(result.weightsAfter).toEqual([1, 1]);
  });

  test('valid convolution and trace agree on an output cell', () => {
    const input = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const kernel = [
      [1, 0],
      [0, -1],
    ];
    const output = validConvolution(input, kernel);
    const trace = convolutionTrace(input, kernel, 1, 1);

    expect(output).toEqual([[-4, -4], [-4, -4]]);
    expect(trace.patch).toEqual([[5, 6], [8, 9]]);
    expect(trace.products.flat().reduce((sum, value) => sum + value, 0)).toBe(trace.sum);
    expect(output[1][1]).toBe(trace.sum);
  });

  test('KV cache scales linearly with context length', () => {
    const config = {
      contextLength: 4096,
      layers: 32,
      modelDim: 4096,
      queryHeads: 32,
      gqaKvHeads: 8,
      bytesPerElement: 2,
    };
    const baseline = calculateKvCache(config);
    const doubled = calculateKvCache({ ...config, contextLength: config.contextLength * 2 });

    expect(doubled.variants[0].bytes).toBe(baseline.variants[0].bytes * 2);
    expect(baseline.variants.find(({ id }) => id === 'GQA')?.ratioToMha).toBe(0.25);
    expect(baseline.variants.find(({ id }) => id === 'MQA')?.ratioToMha).toBe(1 / 32);
  });

  test('KV cache validates head geometry', () => {
    expect(validateKvCacheConfig({
      contextLength: 4096,
      layers: 32,
      modelDim: 4100,
      queryHeads: 32,
      gqaKvHeads: 8,
      bytesPerElement: 2,
    })).toMatch(/divisible/);
  });

  test('temperature keeps a normalized distribution and changes its sharpness', () => {
    const tokens = [
      { token: 'a', probability: 0.6 },
      { token: 'b', probability: 0.3 },
      { token: 'c', probability: 0.1 },
    ];
    const cold = applyTemperature(tokens, 0.5);
    const hot = applyTemperature(tokens, 2);

    expect(cold.reduce((sum, token) => sum + token.probability, 0)).toBeCloseTo(1);
    expect(hot.reduce((sum, token) => sum + token.probability, 0)).toBeCloseTo(1);
    expect(cold[0].probability).toBeGreaterThan(tokens[0].probability);
    expect(hot[0].probability).toBeLessThan(tokens[0].probability);
  });

  test('decoding and token loss are deterministic', () => {
    const tokens = [
      { token: 'a', probability: 0.6 },
      { token: 'b', probability: 0.4 },
    ];
    expect(decodeToken(tokens, 'greedy').token).toBe('a');
    expect(decodeToken(tokens, 'sample', 5)).toEqual(decodeToken(tokens, 'sample', 5));
    expect(crossEntropy(0.5)).toBeCloseTo(Math.log(2));
  });
});
