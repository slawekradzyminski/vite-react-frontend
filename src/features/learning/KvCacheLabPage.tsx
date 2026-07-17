import { useMemo, useState } from 'react';
import { Database, Layers3 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { LabPageHeader } from './LabPageHeader';
import {
  calculateKvCache,
  formatBytes,
  validateKvCacheConfig,
  type KvCacheConfig,
} from './learningMath';

const PRESETS: Record<string, KvCacheConfig> = {
  'Small transformer': {
    contextLength: 1024,
    layers: 12,
    modelDim: 768,
    queryHeads: 12,
    gqaKvHeads: 4,
    bytesPerElement: 2,
  },
  '8B-style model': {
    contextLength: 8192,
    layers: 32,
    modelDim: 4096,
    queryHeads: 32,
    gqaKvHeads: 8,
    bytesPerElement: 2,
  },
  'Long-context exercise': {
    contextLength: 131072,
    layers: 48,
    modelDim: 6144,
    queryHeads: 48,
    gqaKvHeads: 8,
    bytesPerElement: 2,
  },
};

const VARIANT_COPY = {
  MHA: { title: 'Multi-head attention', description: 'Every query head stores its own K and V.' },
  MQA: { title: 'Multi-query attention', description: 'All query heads share one K/V head.' },
  GQA: { title: 'Grouped-query attention', description: 'Groups of query heads share K/V heads.' },
};

export function KvCacheLabPage() {
  const [preset, setPreset] = useState('8B-style model');
  const [config, setConfig] = useState<KvCacheConfig>(PRESETS['8B-style model']);
  const error = validateKvCacheConfig(config);
  const result = useMemo(() => (error ? null : calculateKvCache(config)), [config, error]);
  const mhaBytes = result?.variants[0].bytes ?? 1;

  const choosePreset = (name: string) => {
    setPreset(name);
    setConfig({ ...PRESETS[name] });
  };

  const update = (field: keyof KvCacheConfig, value: number) => {
    setPreset('Custom');
    setConfig((current) => ({ ...current, [field]: value }));
  };

  return (
    <div data-testid="kv-cache-lab-page">
      <LabPageHeader
        eyebrow="Inference systems"
        title="Measure the cost of context"
        description="Every layer stores keys and values for previous tokens. Change the architecture to see why shared KV heads matter."
        aside="Formula-based calculator"
      />

      <section className="grid overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/84 lg:grid-cols-[minmax(310px,0.72fr)_minmax(0,1.28fr)]">
        <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Configuration</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Model shape</h2>
            </div>
            <Layers3 className="h-6 w-6 text-sky-700" />
          </div>

          <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Exercise preset
            <select
              value={preset}
              onChange={(event) => choosePreset(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950"
              data-testid="kv-cache-preset"
            >
              {Object.keys(PRESETS).map((name) => <option key={name}>{name}</option>)}
              {preset === 'Custom' ? <option>Custom</option> : null}
            </select>
          </label>

          <div className="mt-5 grid grid-cols-2 gap-4">
            {([
              ['contextLength', 'Context tokens'],
              ['layers', 'Layers'],
              ['modelDim', 'Model dimension'],
              ['queryHeads', 'Query heads'],
              ['gqaKvHeads', 'GQA KV heads'],
            ] as const).map(([field, label]) => (
              <label key={field} className={field === 'contextLength' ? 'col-span-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500' : 'text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'}>
                {label}
                <input
                  type="number"
                  min="1"
                  value={config[field]}
                  onChange={(event) => update(field, Number(event.target.value))}
                  className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950"
                  data-testid={`kv-cache-${field}`}
                />
              </label>
            ))}
            <label className="col-span-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Precision
              <select
                value={config.bytesPerElement}
                onChange={(event) => update('bytesPerElement', Number(event.target.value))}
                className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950"
                data-testid="kv-cache-precision"
              >
                <option value="1">8-bit · 1 byte</option>
                <option value="2">16-bit · 2 bytes</option>
                <option value="4">32-bit · 4 bytes</option>
              </select>
            </label>
          </div>

          {error ? <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800" role="alert" data-testid="kv-cache-error">{error}</p> : null}
        </div>

        <div className="p-5 lg:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Memory per sequence</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">Keys + values across all layers</h2>
            </div>
            {result ? <Badge variant="outline">Head dimension: {result.headDim}</Badge> : null}
          </div>

          {result ? (
            <div className="mt-7 space-y-6" data-testid="kv-cache-results">
              {result.variants.map((variant) => {
                const copy = VARIANT_COPY[variant.id];
                return (
                  <div key={variant.id} data-testid={`kv-cache-result-${variant.id.toLowerCase()}`}>
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-950">{variant.id}</span>
                          <span className="text-sm font-medium text-slate-600">{copy.title}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{variant.kvHeads} KV {variant.kvHeads === 1 ? 'head' : 'heads'} · {copy.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold tabular-nums text-slate-950">{formatBytes(variant.bytes)}</p>
                        <p className="text-xs font-medium text-slate-500">{(variant.ratioToMha * 100).toFixed(1)}% of MHA</p>
                      </div>
                    </div>
                    <div className="h-4 overflow-hidden rounded-full bg-stone-100">
                      <div
                        className={`h-full min-w-1.5 rounded-full transition-[width] duration-300 motion-reduce:transition-none ${variant.id === 'MHA' ? 'bg-slate-900' : 'bg-sky-600'}`}
                        style={{ width: `${(variant.bytes / mhaBytes) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-7 flex min-h-72 items-center justify-center rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 text-center text-sm text-slate-500">
              Correct the configuration to calculate memory.
            </div>
          )}
        </div>
      </section>

      <section className="mt-6 grid gap-6 rounded-[2rem] bg-slate-950 p-5 text-white md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:p-7" data-testid="kv-cache-formula">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-300">
          <Database className="h-6 w-6" />
        </span>
        <div>
          <p className="font-mono text-sm leading-7 text-slate-200 md:text-base">
            bytes = 2 × tokens × layers × KV heads × head dimension × bytes per element
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            The factor 2 stores both keys and values. Batch size is 1, cache metadata is excluded, and head dimension equals model dimension ÷ query heads.
          </p>
        </div>
      </section>
    </div>
  );
}
