import { useMemo, useState } from 'react';
import { RotateCcw, StepForward } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { LabPageHeader } from './LabPageHeader';
import {
  PERCEPTRON_DATASETS,
  classifyPerceptron,
  trainPerceptronStep,
  type BinarySample,
  type PerceptronStep,
} from './learningMath';

type DatasetName = keyof typeof PERCEPTRON_DATASETS;

function formatNumber(value: number) {
  const normalized = Math.abs(value) < 1e-10 ? 0 : value;
  return normalized.toFixed(2);
}

function DecisionBoundary({
  samples,
  weights,
  bias,
  sampleIndex,
}: {
  samples: BinarySample[];
  weights: [number, number];
  bias: number;
  sampleIndex: number;
}) {
  const mapX = (value: number) => 160 + value * 82;
  const mapY = (value: number) => 130 - value * 82;
  let boundary: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (Math.abs(weights[1]) > 1e-8) {
    const x1 = -1.45;
    const x2 = 1.45;
    boundary = {
      x1: mapX(x1),
      y1: mapY((-weights[0] * x1 - bias) / weights[1]),
      x2: mapX(x2),
      y2: mapY((-weights[0] * x2 - bias) / weights[1]),
    };
  } else if (Math.abs(weights[0]) > 1e-8) {
    const x = mapX(-bias / weights[0]);
    boundary = { x1: x, y1: 10, x2: x, y2: 250 };
  }

  return (
    <svg viewBox="0 0 320 260" className="h-auto w-full" role="img" aria-label="Perceptron decision boundary" data-testid="perceptron-boundary">
      <defs>
        <clipPath id="perceptron-plot-clip"><rect x="20" y="10" width="280" height="240" rx="18" /></clipPath>
      </defs>
      <rect x="20" y="10" width="280" height="240" rx="18" fill="#fafaf9" stroke="#e7e5e4" />
      <g clipPath="url(#perceptron-plot-clip)">
        <line x1="160" y1="10" x2="160" y2="250" stroke="#d6d3d1" strokeDasharray="4 5" />
        <line x1="20" y1="130" x2="300" y2="130" stroke="#d6d3d1" strokeDasharray="4 5" />
        {boundary ? (
          <line {...boundary} stroke="#0284c7" strokeWidth="5" strokeLinecap="round" data-testid="perceptron-boundary-line" />
        ) : null}
        {samples.map((sample, index) => {
          const active = index === sampleIndex;
          return (
            <g key={sample.label} transform={`translate(${mapX(sample.input[0])} ${mapY(sample.input[1])})`}>
              {active ? <circle r="17" fill="none" stroke="#0f172a" strokeWidth="2" /> : null}
              <circle r="10" fill={sample.target === 1 ? '#0284c7' : '#f59e0b'} stroke="white" strokeWidth="3" />
              <text x="0" y="31" textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
                {sample.target === 1 ? '+1' : '−1'}
              </text>
            </g>
          );
        })}
      </g>
      <text x="286" y="122" fontSize="11" fill="#64748b">x₁</text>
      <text x="168" y="24" fontSize="11" fill="#64748b">x₂</text>
    </svg>
  );
}

export function PerceptronLabPage() {
  const [datasetName, setDatasetName] = useState<DatasetName>('OR');
  const [weights, setWeights] = useState<[number, number]>([0, 0]);
  const [bias, setBias] = useState(0);
  const [learningRate, setLearningRate] = useState(0.5);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [lastStep, setLastStep] = useState<PerceptronStep | null>(null);
  const samples = PERCEPTRON_DATASETS[datasetName];
  const currentSample = samples[sampleIndex];
  const accuracy = useMemo(
    () => samples.filter((sample) => classifyPerceptron(weights, bias, sample.input) === sample.target).length,
    [bias, samples, weights],
  );

  const reset = (nextDataset: DatasetName = datasetName) => {
    setDatasetName(nextDataset);
    setWeights([0, 0]);
    setBias(0);
    setSampleIndex(0);
    setLastStep(null);
  };

  const step = () => {
    const result = trainPerceptronStep(weights, bias, currentSample, learningRate);
    setLastStep(result);
    setWeights(result.weightsAfter);
    setBias(result.biasAfter);
    setSampleIndex((index) => (index + 1) % samples.length);
  };

  return (
    <div data-testid="perceptron-lab-page">
      <LabPageHeader
        eyebrow="Learning foundations"
        title="Teach one artificial neuron"
        description="Follow the exact score and update rule. OR can be separated by one line; XOR keeps exposing the limit of a linear model."
        aside={`${accuracy}/${samples.length} currently correct`}
      />

      <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/84">
        <div className="flex flex-col gap-5 border-b border-stone-200 px-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:px-7">
          <div className="flex flex-wrap items-center gap-2" aria-label="Dataset">
            {(['OR', 'XOR'] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => reset(name)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${datasetName === name ? 'bg-slate-950 text-white' : 'bg-stone-100 text-slate-700 hover:bg-stone-200'}`}
                aria-pressed={datasetName === name}
                data-testid={`perceptron-dataset-${name.toLowerCase()}`}
              >
                {name}
              </button>
            ))}
            {datasetName === 'XOR' ? <Badge variant="warning">Not linearly separable</Badge> : <Badge variant="success">Linearly separable</Badge>}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="min-w-56 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Learning rate <span className="ml-2 text-slate-950">{learningRate.toFixed(1)}</span>
              <input
                className="mt-2 block w-full accent-sky-600"
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={learningRate}
                onChange={(event) => setLearningRate(Number(event.target.value))}
                data-testid="perceptron-learning-rate"
              />
            </label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => reset()} data-testid="perceptron-reset">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button onClick={step} data-testid="perceptron-step">
                <StepForward className="h-4 w-4" /> Step
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(330px,0.95fr)]">
          <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r lg:p-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Decision space</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">w₁x₁ + w₂x₂ + b = 0</h2>
              </div>
              <div className="flex gap-3 text-xs font-medium text-slate-600">
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-sky-600" />+1</span>
                <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />−1</span>
              </div>
            </div>
            <DecisionBoundary samples={samples} weights={weights} bias={bias} sampleIndex={sampleIndex} />
          </div>

          <div className="p-5 lg:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Next training example</p>
            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-5">
              <div className="grid grid-cols-2 gap-2" aria-label={`Input ${currentSample.input.join(', ')}`}>
                {currentSample.input.map((value, index) => (
                  <span key={index} className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-semibold ${value === 1 ? 'bg-sky-600 text-white' : 'bg-stone-200 text-slate-700'}`}>
                    {value === 1 ? '+1' : '−1'}
                  </span>
                ))}
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-950" data-testid="perceptron-current-label">{currentSample.label}</p>
                <p className="mt-1 text-sm text-slate-600">Target: <strong className="text-slate-950">{currentSample.target === 1 ? '+1' : '−1'}</strong></p>
              </div>
            </div>

            <div className="mt-7 border-t border-stone-200 pt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current parameters</p>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                {[
                  ['w₁', weights[0]],
                  ['w₂', weights[1]],
                  ['bias', bias],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-2xl bg-stone-50 p-4 text-center">
                    <dt className="text-xs font-medium text-slate-500">{label}</dt>
                    <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{formatNumber(Number(value))}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] bg-slate-950 p-5 text-white md:p-7" aria-live="polite" data-testid="perceptron-step-trace">
        {lastStep ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">Last calculation</p>
                <Badge variant={lastStep.mistake ? 'warning' : 'success'}>{lastStep.mistake ? 'Update required' : 'No update'}</Badge>
              </div>
              <p className="mt-4 font-mono text-sm leading-7 text-slate-200" data-testid="perceptron-score-formula">
                ({formatNumber(lastStep.weightsBefore[0])} × {lastStep.sample.input[0]}) + ({formatNumber(lastStep.weightsBefore[1])} × {lastStep.sample.input[1]}) + {formatNumber(lastStep.biasBefore)} = <strong className="text-white">{formatNumber(lastStep.score)}</strong>
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Prediction <strong className="text-white">{lastStep.prediction === 1 ? '+1' : '−1'}</strong>, target <strong className="text-white">{lastStep.sample.target === 1 ? '+1' : '−1'}</strong>.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['Δw₁', lastStep.deltaWeights[0]],
                ['Δw₂', lastStep.deltaWeights[1]],
                ['Δb', lastStep.deltaBias],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{formatNumber(Number(value))}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-28 items-center justify-center text-center">
            <div>
              <p className="text-lg font-semibold">Ready for the first example.</p>
              <p className="mt-2 text-sm text-slate-400">Press Step to reveal the score, prediction, and parameter update.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
