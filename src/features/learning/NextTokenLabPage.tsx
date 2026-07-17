import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Dices,
  Gauge,
  Loader2,
  LockKeyhole,
  Radio,
  ServerOff,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { LabPageHeader } from './LabPageHeader';
import { applyTemperature, crossEntropy, decodeToken } from './learningMath';
import { STATIC_NEXT_TOKEN_RESULT } from './nextTokenProviders';
import { useLiveNextToken } from './useLiveNextToken';

function visibleToken(token: string) {
  return token.startsWith(' ') ? `·${token.slice(1)}` : token;
}

export function NextTokenLabPage() {
  const [mode, setMode] = useState<'static' | 'live'>('static');
  const [model, setModel] = useState('llama3.2:1b');
  const [livePrompt, setLivePrompt] = useState('The capital of France is');
  const [topK, setTopK] = useState(10);
  const [temperature, setTemperature] = useState(1);
  const [strategy, setStrategy] = useState<'greedy' | 'sample'>('greedy');
  const [seed, setSeed] = useState(7);
  const [expectedToken, setExpectedToken] = useState(STATIC_NEXT_TOKEN_RESULT.tokens[0].token);
  const live = useLiveNextToken();
  const sourceResult = mode === 'static' ? STATIC_NEXT_TOKEN_RESULT : live.result;
  const distribution = useMemo(
    () => (sourceResult ? applyTemperature(sourceResult.tokens, temperature) : []),
    [sourceResult, temperature],
  );
  const decoded = useMemo(
    () => (distribution.length ? decodeToken(distribution, strategy, seed) : null),
    [distribution, seed, strategy],
  );
  const expectedProbability = distribution.find(({ token }) => token === expectedToken)?.probability ?? 0;
  const loss = crossEntropy(expectedProbability);
  const maxProbability = distribution.length
    ? Math.max(...distribution.map(({ probability }) => probability))
    : 0;

  useEffect(() => {
    if (sourceResult?.tokens.length) {
      setExpectedToken(sourceResult.tokens[0].token);
    }
  }, [sourceResult]);

  const runLive = async (event: FormEvent) => {
    event.preventDefault();
    await live.run({ model, prompt: livePrompt, topK });
  };

  return (
    <div data-testid="next-token-lab-page">
      <LabPageHeader
        eyebrow="Language models"
        title="Choose the next token"
        description="Compare a deterministic lesson distribution with a real one-token Ollama run, then reshape the visible candidates with temperature."
        aside={mode === 'static' ? 'Offline lesson mode' : 'Live model mode'}
      />

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-[1.35rem] border border-stone-200 bg-white/80 p-2" aria-label="Probability source">
        {([
          ['static', 'Offline example', ServerOff],
          ['live', 'Live model', Radio],
        ] as const).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            aria-pressed={mode === value}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
              mode === value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-stone-100'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {mode === 'static' ? (
        <div className="mb-6 flex items-start gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50/85 p-4 text-amber-950" role="status" data-testid="next-token-static-notice">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold">Static teaching dataset—not live model output</p>
            <p className="mt-1 text-sm leading-6 text-amber-900/80">
              These illustrative probabilities stay available without Ollama and remain intentionally separate from live results.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={runLive} className="mb-6 rounded-[1.75rem] border border-sky-200 bg-sky-50/70 p-5 md:p-6" data-testid="next-token-live-form">
          <div className="flex items-start gap-3">
            <Radio className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-slate-950">Run one real model step</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">The server requests one generated token and up to twenty tokenizer candidates. Model support for logprobs varies.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,0.85fr)_7rem]">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Ollama model
                  <input
                    value={model}
                    onChange={(event) => setModel(event.target.value)}
                    required
                    maxLength={200}
                    className="mt-2 h-11 w-full rounded-xl border border-sky-200 bg-white px-3 font-mono text-sm normal-case tracking-normal text-slate-950"
                    data-testid="next-token-live-model"
                  />
                </label>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                  Top k
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={topK}
                    onChange={(event) => setTopK(Math.min(20, Math.max(2, Number(event.target.value) || 2)))}
                    className="mt-2 h-11 w-full rounded-xl border border-sky-200 bg-white px-3 text-sm normal-case tracking-normal text-slate-950"
                    data-testid="next-token-live-top-k"
                  />
                </label>
              </div>
              <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                Prompt
                <textarea
                  value={livePrompt}
                  onChange={(event) => setLivePrompt(event.target.value)}
                  required
                  maxLength={2000}
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-sky-200 bg-white px-3 py-2.5 font-mono text-sm normal-case leading-6 tracking-normal text-slate-950"
                  data-testid="next-token-live-prompt"
                />
              </label>
              <button
                type="submit"
                disabled={live.loading}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-600 px-5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                data-testid="next-token-live-run"
              >
                {live.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
                {live.loading ? 'Waiting for Ollama…' : 'Inspect next token'}
              </button>
            </div>
          </div>
        </form>
      )}

      {mode === 'live' && live.error ? (
        <div className="mb-6 flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-red-950" role="alert" data-testid="next-token-live-error">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold">Live probabilities are unavailable</p>
            <p className="mt-1 text-sm leading-6 text-red-900/80">{live.error}</p>
          </div>
        </div>
      ) : null}

      {!sourceResult ? (
        <section className="rounded-[2rem] border border-dashed border-stone-300 bg-white/65 px-6 py-14 text-center" data-testid="next-token-live-empty">
          <Radio className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-xl font-semibold text-slate-950">No live distribution yet</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Run the prompt above. This space will never substitute the offline fixture for a failed model response.</p>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white/84">
            <div className="border-b border-stone-200 p-5 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prompt</p>
                  <p className="mt-3 max-w-3xl font-mono text-lg leading-8 text-slate-950" data-testid="next-token-prompt">
                    {sourceResult.prompt}<span className="ml-1 inline-block h-6 w-0.5 animate-pulse bg-sky-600 align-middle" aria-hidden="true" />
                  </p>
                </div>
                <div className="shrink-0 text-left md:text-right">
                  <Badge variant={sourceResult.kind === 'live' ? 'success' : 'warning'}>{sourceResult.sourceLabel}</Badge>
                  <p className="mt-2 text-xs text-slate-500">{sourceResult.modelLabel}</p>
                  {sourceResult.kind === 'live' ? (
                    <p className="mt-1 text-xs font-semibold text-slate-700" data-testid="next-token-captured-mass">
                      {(sourceResult.capturedProbabilityMass * 100).toFixed(1)}% captured mass · top-k normalized
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(330px,0.8fr)]">
              <div className="border-b border-stone-200 p-5 lg:border-b-0 lg:border-r lg:p-7">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Candidate distribution</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">Probability after temperature</h2>
                    <p className="mt-1 text-xs text-slate-500">A middle dot marks a leading space.</p>
                  </div>
                  <Gauge className="h-6 w-6 text-sky-700" />
                </div>

                <div className="space-y-4" data-testid="next-token-distribution">
                  {distribution.map(({ token, probability }, index) => {
                    const sourceCandidate = sourceResult.tokens[index];
                    return (
                      <div key={`${token}-${index}`} data-testid={`next-token-row-${index}`}>
                        <div className="mb-1.5 flex items-end justify-between gap-4 text-sm">
                          <div>
                            <span className="font-mono font-semibold text-slate-900">{visibleToken(token)}</span>
                            {sourceResult.kind === 'live' ? (
                              <span className="ml-2 text-[0.68rem] text-slate-500">rank {sourceCandidate.rank} · logp {sourceCandidate.logprob.toFixed(3)} · raw {(sourceCandidate.rawProbability * 100).toFixed(2)}%</span>
                            ) : null}
                          </div>
                          <span className="font-semibold tabular-nums text-slate-600">{(probability * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                          <div
                            className="h-full rounded-full bg-sky-600 transition-[width] duration-300 motion-reduce:transition-none"
                            style={{ width: `${Math.max((probability / maxProbability) * 100, 1)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 lg:p-7">
                <div>
                  <label htmlFor="next-token-temperature" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Temperature <span className="ml-2 text-base font-semibold text-slate-950">{temperature.toFixed(1)}</span>
                  </label>
                  <input
                    id="next-token-temperature"
                    className="mt-3 block w-full accent-sky-600"
                    type="range"
                    min="0.2"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(event) => setTemperature(Number(event.target.value))}
                    data-testid="next-token-temperature"
                  />
                  <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Sharper</span><span>Flatter</span></div>
                </div>

                <fieldset className="mt-7 border-t border-stone-200 pt-5">
                  <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Decoding strategy</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {([
                      ['greedy', 'Greedy'],
                      ['sample', 'Sample'],
                    ] as const).map(([value, label]) => (
                      <label key={value} className={`cursor-pointer rounded-2xl border p-3 text-sm font-semibold transition ${strategy === value ? 'border-slate-950 bg-slate-950 text-white' : 'border-stone-200 bg-stone-50 text-slate-700'}`}>
                        <input type="radio" name="decoding-strategy" value={value} checked={strategy === value} onChange={() => setStrategy(value)} className="sr-only" />
                        {label}
                      </label>
                    ))}
                  </div>
                  {strategy === 'sample' ? (
                    <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Reproducible seed
                      <input type="number" min="1" value={seed} onChange={(event) => setSeed(Number(event.target.value) || 1)} className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-slate-950" data-testid="next-token-seed" />
                    </label>
                  ) : null}
                </fieldset>

                {decoded ? (
                  <div className="mt-7 rounded-[1.5rem] bg-slate-950 p-5 text-white" aria-live="polite" data-testid="next-token-result">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                      {strategy === 'sample' ? <Dices className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                      Selected token
                    </div>
                    <p className="mt-3 font-mono text-3xl font-semibold">{visibleToken(decoded.token)}</p>
                    <p className="mt-2 text-sm text-slate-400">p = {(decoded.probability * 100).toFixed(2)}%</p>
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-5 rounded-[2rem] border border-stone-200/80 bg-white/84 p-5 md:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)] md:p-7" data-testid="next-token-loss-section">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Training signal</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">What if this is the expected token?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Cross-entropy becomes large when the selected distribution assigns little probability to the correct next token.</p>
              {sourceResult.kind === 'live' ? <p className="mt-2 text-xs leading-5 text-amber-800">For this lesson, loss is calculated over the visible top-k candidates after renormalization—not the full vocabulary.</p> : null}
              <label className="mt-5 block max-w-xs text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Expected token
                <select value={expectedToken} onChange={(event) => setExpectedToken(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-950" data-testid="next-token-expected">
                  {distribution.map(({ token }) => <option key={token} value={token}>{visibleToken(token)}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-col justify-center rounded-[1.5rem] bg-stone-100 p-5">
              <p className="font-mono text-sm text-slate-600">loss = −ln({expectedProbability.toFixed(4)})</p>
              <p className="mt-2 text-4xl font-semibold tabular-nums text-slate-950" data-testid="next-token-loss">{loss.toFixed(3)}</p>
              <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">nats</p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
