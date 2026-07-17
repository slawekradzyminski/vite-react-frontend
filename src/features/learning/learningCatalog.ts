export type LearningLabId = 'perceptron' | 'next-token' | 'convolution' | 'digits' | 'kv-cache';

export type LearningLab = {
  id: LearningLabId;
  order: number;
  title: string;
  shortTitle: string;
  route: string;
  eyebrow: string;
  description: string;
  takeaway: string;
};

export const LEARNING_LABS: LearningLab[] = [
  {
    id: 'perceptron',
    order: 1,
    title: 'Teach one artificial neuron',
    shortTitle: 'Perceptron',
    route: '/learn/perceptron',
    eyebrow: 'Learning foundations',
    description: 'Move through OR and XOR one example at a time, with every weight update exposed.',
    takeaway: 'See where linear decision boundaries work—and where they cannot.',
  },
  {
    id: 'next-token',
    order: 2,
    title: 'Choose the next token',
    shortTitle: 'Next token',
    route: '/learn/next-token',
    eyebrow: 'Language models',
    description: 'Transform probabilities with temperature, decode a token, and inspect cross-entropy.',
    takeaway: 'Generation is a sequence of probability-driven choices.',
  },
  {
    id: 'convolution',
    order: 3,
    title: 'Slide a visual filter',
    shortTitle: 'Convolution',
    route: '/learn/convolution',
    eyebrow: 'Computer vision',
    description: 'Connect an input patch to a kernel, nine products, and one activation.',
    takeaway: 'A convolution detects the same local pattern everywhere.',
  },
  {
    id: 'digits',
    order: 4,
    title: 'Recognize a handwritten digit',
    shortTitle: 'Digit CNN',
    route: '/learn/digits',
    eyebrow: 'Neural networks',
    description: 'Run a trained 9K-parameter CNN locally and inspect its intermediate activation maps.',
    takeaway: 'Learned filters compose local evidence into a ten-class prediction.',
  },
  {
    id: 'kv-cache',
    order: 5,
    title: 'Measure the cost of context',
    shortTitle: 'KV cache',
    route: '/learn/kv-cache',
    eyebrow: 'Inference systems',
    description: 'Compare MHA, MQA, and GQA memory as context and architecture change.',
    takeaway: 'Long context consumes memory linearly for every layer and KV head.',
  },
];

export function getLearningLab(pathname: string): LearningLab | undefined {
  return LEARNING_LABS.find((lab) => pathname === lab.route);
}
