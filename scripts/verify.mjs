import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const steps = [
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['format', ['run', 'format:check']],
  [
    'unit/components',
    ['test', '--', '--silent', '--json', '--outputFile=docs/evidence/unit-results.json'],
  ],
  ['integration', ['run', 'test:integration']],
  ['creator integration', ['exec', 'tsx', 'tests/integration/creator.test.ts']],
];
const results = [];
for (const [name, args] of steps) {
  const started = Date.now();
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    timeout: 300000,
    windowsHide: true,
  });
  results.push({
    name,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    durationMs: Date.now() - started,
  });
  if (result.status !== 0) break;
}
mkdirSync('docs/evidence', { recursive: true });
writeFileSync(
  'docs/evidence/verify-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
process.exitCode =
  results.every((x) => x.status === 'PASS') && results.length === steps.length ? 0 : 1;
