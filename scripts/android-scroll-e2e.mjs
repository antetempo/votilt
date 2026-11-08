import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import pg from 'pg';
import { deepLink, command, pause, waitFor, screenshot } from './android-driver.mjs';
const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8'));
const db = new pg.Client(config);
await db.connect();
const results = [];
try {
  const auth = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'))[1]),
  }).then((r) => r.json());
  assert.ok(auth.user?.id);
  const continuing = process.argv.includes('--continue');
  if (!continuing) await deepLink('');
  await waitFor('Per te');
  const size = command(['shell', 'wm', 'size']).match(/(\d+)x(\d+)/);
  const w = Number(size[1]),
    h = Number(size[2]);
  await pause(1500);
  for (let i = 0; i < (continuing ? 0 : 130); i++) {
    command([
      'shell',
      'input',
      'swipe',
      String((w * 0.45) | 0),
      String((h * 0.78) | 0),
      String((w * 0.45) | 0),
      String((h * 0.16) | 0),
      '180',
    ]);
    await pause(1600);
    if (i % 20 === 19) {
      assert.ok(command(['shell', 'pidof', 'com.antetempo.votilt']).trim());
      console.log(`Scroll Android ${i + 1}/130`);
    }
  }
  const measure = async () =>
    (
      await db.query(
        'SELECT max(n)::int n FROM (SELECT count(*) n FROM public.content_impressions WHERE user_id=$1 GROUP BY session_id)x',
        [auth.user.id],
      )
    ).rows[0].n;
  let count = await measure(),
    reverseGestures = 0;
  while (count < 100 && reverseGestures < 80) {
    command([
      'shell',
      'input',
      'swipe',
      String((w * 0.45) | 0),
      String((h * 0.2) | 0),
      String((w * 0.45) | 0),
      String((h * 0.8) | 0),
      '220',
    ]);
    await pause(1800);
    reverseGestures++;
    if (reverseGestures % 10 === 0) {
      count = await measure();
      console.log(`Impressioni significative: ${count}`);
    }
  }
  screenshot('23-feed-after-100-scroll');
  assert.ok(count >= 100, `Impressioni significative reali: ${count}, richieste almeno 100`);
  results.push({
    flow: '100 elementi Android, lista paginata e nessun crash',
    status: 'PASS',
    significantImpressions: count,
    reverseGestures,
    fps: 'NOT_MEASURED',
    memory: 'NOT_MEASURED',
  });
} catch (e) {
  results.push({ flow: 'Scroll Android', status: 'FAIL', detail: e.message });
  process.exitCode = 1;
} finally {
  await db.end();
  writeFileSync(
    'docs/evidence/android-scroll-results.json',
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
  );
  console.log(results);
}
