import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = 'src/features/webmcp/webmcp-model.ts';
const focused = ['run', 'src/features/webmcp/webmcp-model.test.ts'];
const source = await readFile(path.join(root, target), 'utf8');
const candidates = [
  {
    id: 'quantity-as-target',
    contract: 'add_to_cart adds the requested number of additional units; quantity is not a desired final total.',
    observable: 'With two units already in the cart, adding two must submit two additional units, not zero.',
    before: 'return reportCart(await services.addToCart(productId, quantity));',
    after: `const current = await services.getCart();
        const existing = current.items.find(item => item.productId === productId)?.quantity ?? 0;
        return reportCart(await services.addToCart(productId, Math.max(0, quantity - existing)));`,
  },
  {
    id: 'rejection-as-success',
    contract: 'Application rejection must be returned with isError true so an agent cannot mistake it for successful execution.',
    observable: 'A rejected stock write produces an error-shaped payload but is incorrectly reported as a successful tool result.',
    before: "result = { ...resultText({ error: error instanceof Error ? error.message : 'Application request failed.' }), isError: true };",
    after: "result = resultText({ error: error instanceof Error ? error.message : 'Application request failed.' });",
  },
];

const run = (executable, args, cwd) => spawnSync(executable, args, { cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
const baseline = run(path.join(root, 'node_modules/.bin/vitest'), focused, root);
if (baseline.status !== 0) throw new Error('Focused original tests must pass before challenging them.\n' + baseline.stdout + baseline.stderr);
const output = path.join(root, 'docs/webmcp/semantic-mutants');
await mkdir(output, { recursive: true });
const results = [];
for (const candidate of candidates) {
  if (source.split(candidate.before).length !== 2) throw new Error('Frozen mutation anchor must occur exactly once: ' + candidate.id);
  const disposable = await mkdtemp(path.join(tmpdir(), 'webmcp-mutant-'));
  try {
    const checkout = path.join(disposable, 'checkout');
    const files = run('git', ['ls-files', '--cached', '--others', '--exclude-standard'], root).stdout.split('\n').filter(Boolean);
    for (const file of files) {
      if (file.startsWith('artifacts/') || file.startsWith('docs/webmcp/semantic-mutants/') || file.startsWith('.env')) continue;
      const destination = path.join(checkout, file);
      await mkdir(path.dirname(destination), { recursive: true });
      await cp(path.join(root, file), destination);
    }
    await symlink(path.join(root, 'node_modules'), path.join(checkout, 'node_modules'), 'dir');
    const mutated = source.replace(candidate.before, candidate.after);
    const originalFile = path.join(disposable, 'original.ts');
    const frozenFile = path.join(disposable, 'mutant.ts');
    await writeFile(originalFile, source);
    await writeFile(frozenFile, mutated);
    const diff = run('diff', ['-u', '--label', 'a/' + target, '--label', 'b/' + target, originalFile, frozenFile], root);
    if (diff.status !== 1) throw new Error('Could not freeze a reviewable patch.');
    await writeFile(path.join(output, candidate.id + '.patch'), diff.stdout);
    await writeFile(path.join(checkout, target), mutated);
    const compilation = run(path.join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.app.json', '--incremental', 'false'], checkout);
    let outcome = 'invalid';
    let evidence = compilation.stdout + compilation.stderr;
    if (compilation.status === 0) {
      const tests = run(path.join(root, 'node_modules/.bin/vitest'), focused, checkout);
      outcome = tests.status === 0 ? 'survived' : 'killed';
      evidence = tests.stdout + tests.stderr;
      if (tests.error || tests.signal) throw new Error('Test runner failed before producing a valid outcome.');
    }
    const summary = { id: candidate.id, contract: candidate.contract, observable: candidate.observable, compiles: compilation.status === 0, outcome };
    results.push(summary);
    // Logs contain only focused local test diagnostics, never authenticated requests.
    await writeFile(path.join(output, candidate.id + '.log'), evidence.replaceAll(checkout, '<disposable checkout>').replaceAll(root, '<frontend>'));
  } finally { await rm(disposable, { recursive: true, force: true }); }
}
const report = {
  testedAt: new Date().toISOString(),
  originalFocusedTestsPassed: true,
  candidates: results,
  counts: Object.fromEntries(['killed', 'survived', 'invalid', 'equivalent'].map(outcome => [outcome, results.filter(value => value.outcome === outcome).length])),
};
await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
if (results.some(value => value.outcome !== 'killed')) process.exitCode = 1;
