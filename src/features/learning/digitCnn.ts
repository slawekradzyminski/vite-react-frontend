import modelAssetJson from './assets/digit-cnn-weights.json';

export type TensorAsset = { shape: number[]; values: number[] };
type ModelAsset = {
  formatVersion: number;
  modelName: string;
  sourceCheckpoint: string;
  architecture: string;
  parameterCount: number;
  tensors: Record<string, TensorAsset>;
};

export type Volume = {
  channels: number;
  height: number;
  width: number;
  values: Float32Array;
};

export type DigitActivation = {
  id: 'input' | 'conv1' | 'pool1' | 'conv2' | 'pool2';
  label: string;
  channels: number;
  height: number;
  width: number;
  values: number[];
};

export type DigitPredictionResult = {
  prediction: number;
  confidence: number;
  probabilities: number[];
  logits: number[];
  activations: DigitActivation[];
};

const modelAsset = modelAssetJson as ModelAsset;

export const DIGIT_MODEL_METADATA = {
  name: modelAsset.modelName,
  sourceCheckpoint: modelAsset.sourceCheckpoint,
  architecture: modelAsset.architecture,
  parameterCount: modelAsset.parameterCount,
};

function volumeIndex(volume: Pick<Volume, 'height' | 'width'>, channel: number, row: number, col: number) {
  return channel * volume.height * volume.width + row * volume.width + col;
}

function tensor(name: string, expectedShape: number[]): TensorAsset {
  const value = modelAsset.tensors[name];
  if (!value || value.shape.length !== expectedShape.length || value.shape.some((size, index) => size !== expectedShape[index])) {
    throw new Error(`Digit CNN tensor ${name} has an unexpected shape`);
  }
  return value;
}

export function conv2dSame(
  input: Volume,
  weights: TensorAsset,
  bias: TensorAsset,
): Volume {
  const [outputChannels, inputChannels, kernelHeight, kernelWidth] = weights.shape;
  if (inputChannels !== input.channels || bias.shape[0] !== outputChannels) {
    throw new Error('Convolution channel dimensions do not match');
  }
  const paddingRow = Math.floor(kernelHeight / 2);
  const paddingCol = Math.floor(kernelWidth / 2);
  const output: Volume = {
    channels: outputChannels,
    height: input.height,
    width: input.width,
    values: new Float32Array(outputChannels * input.height * input.width),
  };

  for (let outChannel = 0; outChannel < outputChannels; outChannel += 1) {
    for (let row = 0; row < input.height; row += 1) {
      for (let col = 0; col < input.width; col += 1) {
        let sum = bias.values[outChannel];
        for (let inChannel = 0; inChannel < inputChannels; inChannel += 1) {
          for (let kernelRow = 0; kernelRow < kernelHeight; kernelRow += 1) {
            for (let kernelCol = 0; kernelCol < kernelWidth; kernelCol += 1) {
              const inputRow = row + kernelRow - paddingRow;
              const inputCol = col + kernelCol - paddingCol;
              if (inputRow < 0 || inputCol < 0 || inputRow >= input.height || inputCol >= input.width) continue;
              const weightIndex = (((outChannel * inputChannels + inChannel) * kernelHeight + kernelRow) * kernelWidth) + kernelCol;
              sum += input.values[volumeIndex(input, inChannel, inputRow, inputCol)] * weights.values[weightIndex];
            }
          }
        }
        output.values[volumeIndex(output, outChannel, row, col)] = sum;
      }
    }
  }
  return output;
}

export function relu(volume: Volume): Volume {
  return { ...volume, values: Float32Array.from(volume.values, (value) => Math.max(0, value)) };
}

export function maxPool2x2(volume: Volume): Volume {
  if (volume.height % 2 !== 0 || volume.width % 2 !== 0) {
    throw new Error('2×2 pooling requires even spatial dimensions');
  }
  const output: Volume = {
    channels: volume.channels,
    height: volume.height / 2,
    width: volume.width / 2,
    values: new Float32Array(volume.channels * (volume.height / 2) * (volume.width / 2)),
  };
  for (let channel = 0; channel < volume.channels; channel += 1) {
    for (let row = 0; row < output.height; row += 1) {
      for (let col = 0; col < output.width; col += 1) {
        let maximum = Number.NEGATIVE_INFINITY;
        for (let deltaRow = 0; deltaRow < 2; deltaRow += 1) {
          for (let deltaCol = 0; deltaCol < 2; deltaCol += 1) {
            maximum = Math.max(maximum, volume.values[volumeIndex(volume, channel, row * 2 + deltaRow, col * 2 + deltaCol)]);
          }
        }
        output.values[volumeIndex(output, channel, row, col)] = maximum;
      }
    }
  }
  return output;
}

export function stableSoftmax(logits: ArrayLike<number>): number[] {
  if (!logits.length) throw new Error('Softmax requires at least one logit');
  const maximum = Math.max(...Array.from(logits));
  const exponentials = Array.from(logits, (value) => Math.exp(value - maximum));
  const total = exponentials.reduce((sum, value) => sum + value, 0);
  return exponentials.map((value) => value / total);
}

function fullyConnected(input: Float32Array, weights: TensorAsset, bias: TensorAsset): number[] {
  const [outputs, inputs] = weights.shape;
  if (input.length !== inputs || bias.shape[0] !== outputs) {
    throw new Error('Fully connected dimensions do not match');
  }
  return Array.from({ length: outputs }, (_, output) => {
    let sum = bias.values[output];
    const offset = output * inputs;
    for (let index = 0; index < inputs; index += 1) {
      sum += input[index] * weights.values[offset + index];
    }
    return sum;
  });
}

function meanMap(volume: Volume): number[] {
  const result = new Array<number>(volume.height * volume.width).fill(0);
  for (let channel = 0; channel < volume.channels; channel += 1) {
    const offset = channel * volume.height * volume.width;
    for (let index = 0; index < result.length; index += 1) result[index] += volume.values[offset + index];
  }
  return result.map((value) => value / volume.channels);
}

function activation(id: DigitActivation['id'], label: string, volume: Volume): DigitActivation {
  return {
    id,
    label,
    channels: volume.channels,
    height: volume.height,
    width: volume.width,
    values: meanMap(volume),
  };
}

export function runDigitCnn(inputPixels: ArrayLike<number>): DigitPredictionResult {
  if (inputPixels.length !== 28 * 28) throw new Error('Digit CNN input must contain 28×28 pixels');
  const input: Volume = {
    channels: 1,
    height: 28,
    width: 28,
    values: Float32Array.from(inputPixels, (value) => Math.min(1, Math.max(0, Number(value)))),
  };
  const conv1 = relu(conv2dSame(input, tensor('conv1.weight', [8, 1, 3, 3]), tensor('conv1.bias', [8])));
  const pool1 = maxPool2x2(conv1);
  const conv2 = relu(conv2dSame(pool1, tensor('conv2.weight', [16, 8, 3, 3]), tensor('conv2.bias', [16])));
  const pool2 = maxPool2x2(conv2);
  const logits = fullyConnected(pool2.values, tensor('fc.weight', [10, 784]), tensor('fc.bias', [10]));
  const probabilities = stableSoftmax(logits);
  const prediction = probabilities.reduce((best, probability, index) => probability > probabilities[best] ? index : best, 0);

  return {
    prediction,
    confidence: probabilities[prediction],
    probabilities,
    logits,
    activations: [
      activation('input', 'Input pixels', input),
      activation('conv1', 'Conv1 · mean of 8 learned maps', conv1),
      activation('pool1', 'Pool1 · 8 channels', pool1),
      activation('conv2', 'Conv2 · mean of 16 learned maps', conv2),
      activation('pool2', 'Pool2 · 16 channels', pool2),
    ],
  };
}
