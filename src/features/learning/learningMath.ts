export type BinarySample = {
  input: [number, number];
  target: -1 | 1;
  label: string;
};

export const PERCEPTRON_DATASETS: Record<'OR' | 'XOR', BinarySample[]> = {
  OR: [
    { input: [-1, -1], target: -1, label: 'false OR false' },
    { input: [-1, 1], target: 1, label: 'false OR true' },
    { input: [1, -1], target: 1, label: 'true OR false' },
    { input: [1, 1], target: 1, label: 'true OR true' },
  ],
  XOR: [
    { input: [-1, -1], target: -1, label: 'false XOR false' },
    { input: [-1, 1], target: 1, label: 'false XOR true' },
    { input: [1, -1], target: 1, label: 'true XOR false' },
    { input: [1, 1], target: -1, label: 'true XOR true' },
  ],
};

export type PerceptronStep = {
  sample: BinarySample;
  weightsBefore: [number, number];
  biasBefore: number;
  contributions: [number, number];
  score: number;
  prediction: -1 | 1;
  mistake: boolean;
  deltaWeights: [number, number];
  deltaBias: number;
  weightsAfter: [number, number];
  biasAfter: number;
};

export function classifyPerceptron(
  weights: [number, number],
  bias: number,
  input: [number, number],
): -1 | 1 {
  return weights[0] * input[0] + weights[1] * input[1] + bias >= 0 ? 1 : -1;
}

export function trainPerceptronStep(
  weights: [number, number],
  bias: number,
  sample: BinarySample,
  learningRate: number,
): PerceptronStep {
  const contributions: [number, number] = [
    weights[0] * sample.input[0],
    weights[1] * sample.input[1],
  ];
  const score = contributions[0] + contributions[1] + bias;
  const prediction: -1 | 1 = score >= 0 ? 1 : -1;
  const mistake = prediction !== sample.target;
  const deltaWeights: [number, number] = mistake
    ? [learningRate * sample.target * sample.input[0], learningRate * sample.target * sample.input[1]]
    : [0, 0];
  const deltaBias = mistake ? learningRate * sample.target : 0;

  return {
    sample,
    weightsBefore: [...weights],
    biasBefore: bias,
    contributions,
    score,
    prediction,
    mistake,
    deltaWeights,
    deltaBias,
    weightsAfter: [weights[0] + deltaWeights[0], weights[1] + deltaWeights[1]],
    biasAfter: bias + deltaBias,
  };
}

export type Matrix = number[][];

function assertRectangular(matrix: Matrix, name: string) {
  if (matrix.length === 0 || matrix[0].length === 0) {
    throw new Error(`${name} must not be empty`);
  }
  const width = matrix[0].length;
  if (matrix.some((row) => row.length !== width)) {
    throw new Error(`${name} must be rectangular`);
  }
}

export function convolutionTrace(input: Matrix, kernel: Matrix, outputRow: number, outputCol: number) {
  assertRectangular(input, 'Input');
  assertRectangular(kernel, 'Kernel');
  const kernelHeight = kernel.length;
  const kernelWidth = kernel[0].length;
  const outputHeight = input.length - kernelHeight + 1;
  const outputWidth = input[0].length - kernelWidth + 1;
  if (outputRow < 0 || outputCol < 0 || outputRow >= outputHeight || outputCol >= outputWidth) {
    throw new Error('Output position is outside the valid convolution result');
  }

  const patch = kernel.map((row, rowIndex) =>
    row.map((_, colIndex) => input[outputRow + rowIndex][outputCol + colIndex]),
  );
  const products = kernel.map((row, rowIndex) =>
    row.map((value, colIndex) => value * patch[rowIndex][colIndex]),
  );
  const sum = products.flat().reduce((total, value) => total + value, 0);
  return { patch, products, sum };
}

export function validConvolution(input: Matrix, kernel: Matrix): Matrix {
  assertRectangular(input, 'Input');
  assertRectangular(kernel, 'Kernel');
  const outputHeight = input.length - kernel.length + 1;
  const outputWidth = input[0].length - kernel[0].length + 1;
  if (outputHeight < 1 || outputWidth < 1) {
    throw new Error('Kernel must fit inside the input');
  }
  return Array.from({ length: outputHeight }, (_, row) =>
    Array.from({ length: outputWidth }, (_, col) => convolutionTrace(input, kernel, row, col).sum),
  );
}

export type KvCacheConfig = {
  contextLength: number;
  layers: number;
  modelDim: number;
  queryHeads: number;
  gqaKvHeads: number;
  bytesPerElement: number;
};

export type KvCacheResult = {
  headDim: number;
  variants: Array<{
    id: 'MHA' | 'MQA' | 'GQA';
    kvHeads: number;
    bytes: number;
    ratioToMha: number;
  }>;
};

export function validateKvCacheConfig(config: KvCacheConfig): string | null {
  if (Object.values(config).some((value) => !Number.isFinite(value) || value <= 0)) {
    return 'All values must be positive numbers.';
  }
  if (!Number.isInteger(config.queryHeads) || !Number.isInteger(config.gqaKvHeads)) {
    return 'Head counts must be whole numbers.';
  }
  if (config.modelDim % config.queryHeads !== 0) {
    return 'Model dimension must be divisible by query heads.';
  }
  if (config.gqaKvHeads > config.queryHeads || config.queryHeads % config.gqaKvHeads !== 0) {
    return 'GQA KV heads must divide query heads and cannot exceed them.';
  }
  return null;
}

export function calculateKvCache(config: KvCacheConfig): KvCacheResult {
  const error = validateKvCacheConfig(config);
  if (error) throw new Error(error);
  const headDim = config.modelDim / config.queryHeads;
  const bytesFor = (kvHeads: number) =>
    2 * config.contextLength * config.layers * kvHeads * headDim * config.bytesPerElement;
  const mhaBytes = bytesFor(config.queryHeads);
  const variants: KvCacheResult['variants'] = [
    { id: 'MHA', kvHeads: config.queryHeads, bytes: mhaBytes, ratioToMha: 1 },
    { id: 'MQA', kvHeads: 1, bytes: bytesFor(1), ratioToMha: bytesFor(1) / mhaBytes },
    {
      id: 'GQA',
      kvHeads: config.gqaKvHeads,
      bytes: bytesFor(config.gqaKvHeads),
      ratioToMha: bytesFor(config.gqaKvHeads) / mhaBytes,
    },
  ];
  return { headDim, variants };
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(2)} ${units[unitIndex]}`;
}

export type TokenProbability = { token: string; probability: number };

export const STATIC_NEXT_TOKEN_EXAMPLE = {
  prompt: 'She opened the old wooden door and saw',
  source: 'Static teaching dataset',
  modelLabel: 'Illustrative distribution — not live model output',
  tokens: [
    { token: ' a', probability: 0.34 },
    { token: ' the', probability: 0.22 },
    { token: ' nothing', probability: 0.16 },
    { token: ' her', probability: 0.11 },
    { token: ' sunlight', probability: 0.09 },
    { token: '.', probability: 0.08 },
  ] satisfies TokenProbability[],
};

export function applyTemperature(tokens: TokenProbability[], temperature: number): TokenProbability[] {
  if (!Number.isFinite(temperature) || temperature <= 0) {
    throw new Error('Temperature must be greater than zero');
  }
  const weights = tokens.map(({ probability }) => Math.exp(Math.log(Math.max(probability, 1e-12)) / temperature));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return tokens.map((token, index) => ({ ...token, probability: weights[index] / total }));
}

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 12_989.0 + 78.233) * 43_758.5453;
  return value - Math.floor(value);
}

export function decodeToken(
  tokens: TokenProbability[],
  strategy: 'greedy' | 'sample',
  seed = 1,
): TokenProbability {
  if (tokens.length === 0) throw new Error('At least one token is required');
  if (strategy === 'greedy') {
    return tokens.reduce((best, candidate) =>
      candidate.probability > best.probability ? candidate : best,
    );
  }
  const threshold = seededUnit(seed);
  let cumulative = 0;
  for (const token of tokens) {
    cumulative += token.probability;
    if (threshold <= cumulative) return token;
  }
  return tokens[tokens.length - 1];
}

export function crossEntropy(probability: number): number {
  return -Math.log(Math.max(probability, 1e-12));
}
