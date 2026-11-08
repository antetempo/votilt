import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { command, waitFor, screenshot, hierarchy } from './android-driver.mjs';
const results = [];
try {
  const live = await fetch('http://127.0.0.1:4317/health', { signal: AbortSignal.timeout(1000) })
    .then(() => true)
    .catch(() => false);
  assert.equal(live, false, 'Fermare la sola API VOTILT prima del test');
  command(['shell', 'am', 'force-stop', 'com.antetempo.votilt']);
  command([
    'shell',
    "am start -W -a android.intent.action.VIEW -d 'exp+votilt://?__expo_url=http%3A%2F%2F127.0.0.1%3A8081&__expo_disable_fab=1&__expo_disable_auto_launch=1&__expo_disable_onboarding=1' com.antetempo.votilt",
  ]);
  await waitFor('Contenuti recenti', 45000);
  await waitFor('Per te');
  screenshot('22-offline-cold-start');
  const nodes = hierarchy();
  assert.ok(nodes.some((n) => n['content-desc']?.includes('campione') && n.enabled === 'false'));
  results.push({ flow: 'Cold start senza API, cache recente e voto disabilitato', status: 'PASS' });
} catch (e) {
  results.push({ flow: 'Cache offline Android', status: 'FAIL', detail: e.message });
  try {
    screenshot('offline-failure');
  } catch {}
  process.exitCode = 1;
}
writeFileSync(
  'docs/evidence/android-offline-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
console.log(results);
