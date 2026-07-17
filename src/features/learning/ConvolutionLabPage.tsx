import { useMemo, useState } from 'react';
import { ScanLine } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { LabPageHeader } from './LabPageHeader';
import { convolutionTrace, validConvolution, type Matrix } from './learningMath';

const INPUT_PATTERNS: Record<string, Matrix> = {
  Cross: [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  Edge: [
    [0, 0, 0, 1, 1],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 1, 1],
    [0, 0, 0, 1, 1],
  ],
  Diagonal: [
    [1, 0, 0, 0, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 1, 0],
    [0, 0, 0, 0, 1],
  ],
};

const KERNEL_PRESETS: Record<string, Matrix> = {
  'Vertical edge': [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1],
  ],
  'Horizontal edge': [
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1],
  ],
  Sharpen: [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0],
  ],
};

function matrixRange(matrix: Matrix) {
  const values = matrix.flat();
  return { min: Math.min(...values), max: Math.max(...values) };
}

function activationShade(value: number, min: number, max: number) {
  if (max === min) return 0.45;
  return 0.12 + ((value - min) / (max - min)) * 0.78;
}

export function ConvolutionLabPage() {
  const [patternName, setPatternName] = useState('Cross');
  const [kernelName, setKernelName] = useState('Vertical edge');
  const [kernel, setKernel] = useState<Matrix>(() => KERNEL_PRESETS['Vertical edge'].map((row) => [...row]));
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const input = INPUT_PATTERNS[patternName];
  const output = useMemo(() => validConvolution(input, kernel), [input, kernel]);
  const trace = useMemo(
    () => convolutionTrace(input, kernel, selected.row, selected.col),
    [input, kernel, selected],
  );
  const range = matrixRange(output);

  const chooseKernel = (name: string) => {
    setKernelName(name);
    setKernel(KERNEL_PRESETS[name].map((row) => [...row]));
  };

  const updateKernel = (row: number, col: number, value: number) => {
    setKernelName('Custom');
    setKernel((current) => current.map((kernelRow, rowIndex) =>
      kernelRow.map((cell, colIndex) => (rowIndex === row && colIndex === col ? value : cell)),
    ));
  };

  return (
    <div data-testid="convolution-lab-page">
      <LabPageHeader
        eyebrow="Computer vision"
        title="Slide a visual filter"
        description="Select an activation to reveal the exact 3×3 receptive field, shared kernel, nine products, and final sum."
        aside="Valid 2D cross-correlation"
      />

      <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/84">
        <div className="grid gap-5 border-b border-stone-200 p-5 md:grid-cols-2 md:p-7">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Input pattern
            <select
              value={patternName}
              onChange={(event) => {
                setPatternName(event.target.value);
                setSelected({ row: 0, col: 0 });
              }}
              className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950"
              data-testid="convolution-pattern"
            >
              {Object.keys(INPUT_PATTERNS).map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Kernel preset
            <select
              value={kernelName}
              onChange={(event) => chooseKernel(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950"
              data-testid="convolution-kernel-preset"
            >
              {Object.keys(KERNEL_PRESETS).map((name) => <option key={name}>{name}</option>)}
              {kernelName === 'Custom' ? <option>Custom</option> : null}
            </select>
          </label>
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,0.72fr)_auto_minmax(0,0.8fr)] xl:items-center">
          <div className="border-b border-stone-200 p-5 xl:border-b-0 xl:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">5×5 input</p>
            <div className="mx-auto mt-4 grid max-w-sm grid-cols-5 gap-1.5" data-testid="convolution-input-grid">
              {input.flatMap((row, rowIndex) => row.map((value, colIndex) => {
                const highlighted = rowIndex >= selected.row && rowIndex < selected.row + 3
                  && colIndex >= selected.col && colIndex < selected.col + 3;
                return (
                  <span
                    key={`${rowIndex}-${colIndex}`}
                    className={`flex aspect-square items-center justify-center rounded-xl text-sm font-semibold transition ${value === 1 ? 'bg-slate-900 text-white' : 'bg-stone-100 text-slate-500'} ${highlighted ? 'ring-2 ring-sky-500 ring-offset-1' : ''}`}
                  >
                    {value}
                  </span>
                );
              }))}
            </div>
          </div>

          <div className="hidden text-2xl font-light text-stone-400 xl:block">×</div>

          <div className="border-b border-stone-200 p-5 xl:border-b-0 xl:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shared 3×3 kernel</p>
              {kernelName === 'Custom' ? <Badge>Custom</Badge> : null}
            </div>
            <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2" data-testid="convolution-kernel-grid">
              {kernel.flatMap((row, rowIndex) => row.map((value, colIndex) => (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  type="number"
                  step="0.25"
                  value={value}
                  onChange={(event) => updateKernel(rowIndex, colIndex, Number(event.target.value))}
                  className="aspect-square min-w-0 rounded-xl border border-stone-200 bg-stone-50 text-center text-sm font-semibold text-slate-950 focus:bg-white"
                  aria-label={`Kernel row ${rowIndex + 1} column ${colIndex + 1}`}
                />
              )))}
            </div>
          </div>

          <div className="hidden text-2xl font-light text-stone-400 xl:block">→</div>

          <div className="p-5 xl:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">3×3 activation map</p>
              <ScanLine className="h-5 w-5 text-sky-700" />
            </div>
            <div className="mx-auto mt-4 grid max-w-xs grid-cols-3 gap-2" data-testid="convolution-output-grid">
              {output.flatMap((row, rowIndex) => row.map((value, colIndex) => {
                const active = selected.row === rowIndex && selected.col === colIndex;
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => setSelected({ row: rowIndex, col: colIndex })}
                    className={`aspect-square rounded-xl text-sm font-semibold tabular-nums transition hover:-translate-y-0.5 ${active ? 'ring-2 ring-slate-950 ring-offset-2' : ''}`}
                    style={{ backgroundColor: `rgba(14, 165, 233, ${activationShade(value, range.min, range.max)})`, color: activationShade(value, range.min, range.max) > 0.55 ? 'white' : '#0f172a' }}
                    aria-pressed={active}
                    data-testid={`convolution-output-${rowIndex}-${colIndex}`}
                  >
                    {Number.isInteger(value) ? value : value.toFixed(2)}
                  </button>
                );
              }))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-[2rem] bg-slate-950 text-white" data-testid="convolution-trace">
        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Selected activation [{selected.row}, {selected.col}]</p>
            <h2 className="mt-2 text-xl font-semibold">Nine multiplications, one sum</h2>
          </div>
          <p className="font-mono text-2xl font-semibold" data-testid="convolution-trace-sum">Σ = {trace.sum}</p>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/10">
          {trace.products.flatMap((row, rowIndex) => row.map((product, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="bg-slate-950 p-4 text-center md:p-5">
              <p className="font-mono text-sm text-slate-300">
                {trace.patch[rowIndex][colIndex]} × {kernel[rowIndex][colIndex]}
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{product}</p>
            </div>
          )))}
        </div>
        <p className="px-5 py-4 text-sm leading-6 text-slate-400 md:px-7">
          The same nine kernel values are reused at every output position. Only the receptive field moves.
        </p>
      </section>
    </div>
  );
}
