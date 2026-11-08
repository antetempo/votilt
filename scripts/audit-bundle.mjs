import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const bytes = readFileSync('android/app/build/generated/assets/react/release/index.android.bundle');
const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8'));
const demo = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'));
const secrets = [config.password, config.apiPassword, ...demo.map((x) => x.password)];
assert.ok(secrets.every((secret) => typeof secret === 'string' && secret.length >= 8));
assert.ok(
  secrets.every((secret) => !bytes.includes(secret)),
  'Segreto locale trovato nel bundle',
);
assert.ok(bytes.includes('http://127.0.0.1:4317'), 'Endpoint locale del pacchetto non corretto');
const result = {
  date: new Date().toISOString(),
  status: 'PASS',
  checkedSecrets: secrets.length,
  endpoint: 'http://127.0.0.1:4317',
  artifact: 'release Hermes bundle',
};
writeFileSync('docs/evidence/bundle-audit.json', JSON.stringify(result, null, 2));
console.log(result);
