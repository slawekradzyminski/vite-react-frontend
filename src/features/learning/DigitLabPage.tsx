import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  Eraser,
  Pencil,
  RotateCcw,
  ScanLine,
  Upload,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { DIGIT_MODEL_METADATA, runDigitCnn, type DigitActivation, type DigitPredictionResult } from './digitCnn';
import {
  DIGIT_SIZE,
  blankDigit,
  imageDataToDigit,
  paintLine,
  sampleDigit,
  type DigitPoint,
} from './digitCanvas';
import { LabPageHeader } from './LabPageHeader';

function drawPixels(canvas: HTMLCanvasElement, pixels: number[]) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const cell = canvas.width / DIGIT_SIZE;
  context.fillStyle = '#020617';
  context.fillRect(0, 0, canvas.width, canvas.height);
  pixels.forEach((value, index) => {
    if (value <= 0) return;
    const shade = Math.round(value * 255);
    context.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    context.fillRect((index % DIGIT_SIZE) * cell, Math.floor(index / DIGIT_SIZE) * cell, cell + 0.4, cell + 0.4);
  });
}

function pointerPoint(event: ReactPointerEvent<HTMLCanvasElement>): DigitPoint {
  const bounds = event.currentTarget.getBoundingClientRect();
  const renderedWidth = bounds.width || event.currentTarget.width;
  const renderedHeight = bounds.height || event.currentTarget.height;
  return {
    x: Math.max(0, Math.min(DIGIT_SIZE - 1, ((event.clientX - bounds.left) / renderedWidth) * DIGIT_SIZE)),
    y: Math.max(0, Math.min(DIGIT_SIZE - 1, ((event.clientY - bounds.top) / renderedHeight) * DIGIT_SIZE)),
  };
}

function normalizedHeatmapValues(activation: DigitActivation) {
  const minimum = Math.min(...activation.values);
  const maximum = Math.max(...activation.values);
  const range = maximum - minimum || 1;
  return activation.values.map((value) => (value - minimum) / range);
}

function ActivationHeatmap({ activation }: { activation: DigitActivation }) {
  const values = normalizedHeatmapValues(activation);
  return (
    <div>
      <div
        className="mx-auto grid aspect-square w-full max-w-[26rem] overflow-hidden rounded-2xl bg-slate-950 shadow-inner"
        style={{ gridTemplateColumns: `repeat(${activation.width}, minmax(0, 1fr))` }}
        data-testid="digit-activation-heatmap"
        aria-label={`${activation.label}, ${activation.width} by ${activation.height}`}
      >
        {values.map((value, index) => (
          <span
            key={index}
            aria-hidden="true"
            style={{ backgroundColor: `rgb(${Math.round(value * 56)}, ${Math.round(value * 189)}, ${Math.round(80 + value * 175)})` }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>Low activation</span>
        <span>{activation.channels} channel{activation.channels === 1 ? '' : 's'} · {activation.height}×{activation.width}</span>
        <span>High activation</span>
      </div>
    </div>
  );
}

const initialPixels = sampleDigit(3);

export function DigitLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<DigitPoint | null>(null);
  const [pixels, setPixels] = useState(initialPixels);
  const [tool, setTool] = useState<'draw' | 'erase'>('draw');
  const [brushSize, setBrushSize] = useState(3);
  const [result, setResult] = useState<DigitPredictionResult>(() => runDigitCnn(initialPixels));
  const [dirty, setDirty] = useState(false);
  const [selectedActivation, setSelectedActivation] = useState<DigitActivation['id']>('conv1');
  const [inputLabel, setInputLabel] = useState('Sample 3');

  useEffect(() => {
    if (canvasRef.current) drawPixels(canvasRef.current, pixels);
  }, [pixels]);

  const recognize = (input = pixels) => {
    const prediction = runDigitCnn(input);
    setResult(prediction);
    setDirty(false);
  };

  const selectSample = (digit: number) => {
    const sample = sampleDigit(digit);
    setPixels(sample);
    setInputLabel(`Sample ${digit}`);
    setResult(runDigitCnn(sample));
    setDirty(false);
  };

  const updateStroke = (point: DigitPoint) => {
    const from = lastPointRef.current ?? point;
    setPixels((current) => paintLine(current, from, point, brushSize, tool === 'erase'));
    lastPointRef.current = point;
    setDirty(true);
    setInputLabel('Your drawing');
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drawingRef.current = true;
    const point = pointerPoint(event);
    lastPointRef.current = point;
    updateStroke(point);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    event.preventDefault();
    updateStroke(pointerPoint(event));
  };

  const stopDrawing = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    setPixels(blankDigit());
    setInputLabel('Blank canvas');
    setDirty(true);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 1024;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const nextPixels = imageDataToDigit(imageData.data, canvas.width, canvas.height);
        setPixels(nextPixels);
        setInputLabel(file.name);
        setResult(runDigitCnn(nextPixels));
        setDirty(false);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const activation = result.activations.find(({ id }) => id === selectedActivation) ?? result.activations[0];

  return (
    <div data-testid="digit-lab-page">
      <LabPageHeader
        eyebrow="Computer vision"
        title="Let a small CNN read your digit"
        description="Draw or upload one digit, run the trained network locally, and inspect how its spatial representation changes layer by layer."
        aside="Browser-local inference"
      />

      <div className="mb-6 flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50/85 p-4 text-amber-950" role="status">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold">A real teaching model, not a perfect recognizer</p>
          <p className="mt-1 text-sm leading-6 text-amber-900/80">The trained 9,098-parameter CNN runs entirely in this page. Uploaded images and drawing pixels never leave your browser.</p>
        </div>
      </div>

      <section className="grid overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/84 lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">28×28 input</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">{inputLabel}</h2>
            </div>
            {dirty ? <Badge variant="warning">Needs inference</Badge> : <Badge variant="success">Analyzed</Badge>}
          </div>

          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="mt-5 aspect-square w-full touch-none rounded-[1.5rem] border-4 border-slate-900 bg-slate-950 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]"
            aria-label="Digit drawing canvas"
            data-testid="digit-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTool('draw')} aria-pressed={tool === 'draw'} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${tool === 'draw' ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 text-slate-700'}`}>
              <Pencil className="h-4 w-4" /> Draw
            </button>
            <button type="button" onClick={() => setTool('erase')} aria-pressed={tool === 'erase'} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold ${tool === 'erase' ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 text-slate-700'}`}>
              <Eraser className="h-4 w-4" /> Erase
            </button>
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Brush size <span className="ml-2 text-sm text-slate-950">{brushSize}</span>
            <input type="range" min="1" max="6" step="1" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} className="mt-2 block w-full accent-sky-600" data-testid="digit-brush-size" />
          </label>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={clear} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 text-sm font-semibold text-slate-700 hover:bg-stone-50" data-testid="digit-clear">
              <RotateCcw className="h-4 w-4" /> Clear
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 text-sm font-semibold text-slate-700 hover:bg-stone-50">
              <Upload className="h-4 w-4" /> Upload
            </button>
            <button type="button" onClick={() => recognize()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 text-sm font-semibold text-white hover:bg-sky-700" data-testid="digit-recognize">
              <ScanLine className="h-4 w-4" /> Recognize
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleUpload} data-testid="digit-upload" />

          <div className="mt-5 border-t border-stone-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deterministic samples</p>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, digit) => (
                <button key={digit} type="button" onClick={() => selectSample(digit)} className="aspect-square rounded-xl border border-stone-200 bg-stone-50 font-mono text-sm font-semibold text-slate-700 transition hover:border-sky-500 hover:bg-sky-50" data-testid={`digit-sample-${digit}`}>{digit}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 lg:p-7">
          <div className="grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)] md:items-center">
            <div className="rounded-[1.75rem] bg-slate-950 p-6 text-center text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Prediction</p>
              <p className="mt-3 text-7xl font-semibold tabular-nums" data-testid="digit-prediction">{result.prediction}</p>
              <p className="mt-2 text-sm text-slate-400" data-testid="digit-confidence">{(result.confidence * 100).toFixed(2)}% confidence</p>
            </div>
            <div className="space-y-2.5" data-testid="digit-probabilities">
              {result.probabilities.map((probability, digit) => (
                <div key={digit} className="grid grid-cols-[1.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-xs">
                  <span className={`font-mono font-semibold ${digit === result.prediction ? 'text-sky-700' : 'text-slate-500'}`}>{digit}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                    <div className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${digit === result.prediction ? 'bg-sky-600' : 'bg-slate-300'}`} style={{ width: `${Math.max(probability * 100, 0.5)}%` }} />
                  </div>
                  <span className="text-right font-semibold tabular-nums text-slate-600">{(probability * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 border-t border-stone-200 pt-6">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-sky-700" />
              <h2 className="text-lg font-semibold text-slate-950">What the network sees</h2>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Activation stage">
              {result.activations.map((item) => (
                <button key={item.id} type="button" onClick={() => setSelectedActivation(item.id)} aria-pressed={selectedActivation === item.id} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${selectedActivation === item.id ? 'border-sky-600 bg-sky-600 text-white' : 'border-stone-200 bg-white text-slate-600'}`}>{item.id}</button>
              ))}
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-900" data-testid="digit-activation-label">{activation.label}</p>
            <div className="mt-4"><ActivationHeatmap activation={activation} /></div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[2rem] border border-stone-200/80 bg-white/84 p-5 md:p-7" data-testid="digit-architecture">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Model architecture</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">Nine thousand learned numbers, five transformations</h2>
          </div>
          <Badge variant="outline">{DIGIT_MODEL_METADATA.parameterCount.toLocaleString()} parameters · {DIGIT_MODEL_METADATA.sourceCheckpoint}</Badge>
        </div>
        <div className="mt-6 grid gap-px overflow-hidden rounded-2xl bg-stone-200 sm:grid-cols-5">
          {[
            ['Input', '1 × 28 × 28'],
            ['Conv1 + ReLU', '8 × 28 × 28'],
            ['MaxPool', '8 × 14 × 14'],
            ['Conv2 + ReLU', '16 × 14 × 14'],
            ['Pool + FC', '784 → 10'],
          ].map(([label, shape]) => (
            <div key={label} className="bg-stone-50 px-4 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
              <p className="mt-2 font-mono text-sm font-semibold text-slate-950">{shape}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
