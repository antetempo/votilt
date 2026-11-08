import pg from 'pg';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const env = { ...process.env, VOTILT_DATABASE: 'votilt_bootstrap_test' };
function run(args) {
  const r = spawnSync(process.execPath, args, {
    env,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 180000,
  });
  if (r.status !== 0) throw Error('Bootstrap non riuscito: ' + r.stderr.slice(0, 200));
}
const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8'));
assert.equal(config.host, '127.0.0.1');
assert.equal(config.port, 55432);
const admin = new pg.Client({ ...config, database: 'postgres' });
await admin.connect();
const wasEmpty = !(
  await admin.query("SELECT 1 FROM pg_database WHERE datname='votilt_bootstrap_test'")
).rowCount;
await admin.end();
run(['scripts/migrate.mjs']);
run(['--import', 'tsx', 'scripts/seed.ts']);
const db = new pg.Client({ ...config, database: 'votilt_bootstrap_test' });
await db.connect();
async function snapshot() {
  return (
    await db.query(
      "SELECT (SELECT count(*)::int FROM public.categories WHERE depth=4 AND status='published') leaves,(SELECT count(*)::int FROM public.content_items WHERE moderation_status='approved') approved,(SELECT count(*)::int FROM public.content_items WHERE moderation_status='pending_review') pending,(SELECT count(*)::int FROM public.content_items WHERE moderation_status='rejected') rejected,(SELECT count(*)::int FROM public.content_items WHERE moderation_status='hidden') hidden,(SELECT count(*)::int FROM public.vote_slots WHERE champion_content_id IS NOT NULL) champions,(SELECT count(*)::int FROM public.profiles) users",
    )
  ).rows[0];
}
try {
  const first = await snapshot();
  assert.deepEqual(first, {
    leaves: 41,
    approved: 123,
    pending: 12,
    rejected: 3,
    hidden: 2,
    champions: 192,
    users: 6,
  });
  const passwords = (
    await db.query('SELECT user_id,password_hash FROM private.credentials ORDER BY user_id')
  ).rows;
  run(['scripts/migrate.mjs']);
  run(['--import', 'tsx', 'scripts/seed.ts']);
  assert.deepEqual(await snapshot(), first);
  assert.deepEqual(
    (await db.query('SELECT user_id,password_hash FROM private.credentials ORDER BY user_id')).rows,
    passwords,
  );
  const result = {
    date: new Date().toISOString(),
    status: 'PASS',
    freshDatabase: wasEmpty,
    counts: first,
    idempotent: true,
    passwordsUnchanged: true,
    database: 'votilt_bootstrap_test',
  };
  writeFileSync(
    wasEmpty
      ? 'docs/evidence/bootstrap-results.json'
      : 'docs/evidence/bootstrap-rerun-results.json',
    JSON.stringify(result, null, 2),
  );
  console.log(result);
} finally {
  await db.end();
}
