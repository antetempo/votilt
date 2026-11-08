import pg from 'pg';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

// Canonical complete schema and upgrade snapshot share exactly the same source.
const schema = [
  'server/schema-core.sql',
  'server/api.sql',
  'server/creator-api.sql',
  'migrations/migrate_categories_editorial_catalog.sql',
]
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n');
function writeSnapshot(file) {
  // Repeated migrations must not reopen unchanged snapshots for writing. Windows
  // readers/indexers can hold these files; the database still runs every time.
  if (!existsSync(file) || readFileSync(file, 'utf8') !== schema) writeFileSync(file, schema);
}
writeSnapshot('schema.sql');
mkdirSync('migrations', { recursive: true });
writeSnapshot('migrations/migrate_votilt_initial.sql');
writeSnapshot('migrations/migrate_content_metadata_required.sql');
writeSnapshot('migrations/migrate_categories_rankings_and_policy.sql');
writeSnapshot('migrations/migrate_categories_leader_previews.sql');
writeSnapshot('migrations/migrate_creators_single_category.sql');

const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8').replace(/^\uFEFF/, ''));
if (process.env.VOTILT_DATABASE) {
  if (
    !['votilt', 'votilt_test', 'votilt_bootstrap_test', 'votilt_creator_bootstrap_test'].includes(
      process.env.VOTILT_DATABASE,
    )
  )
    throw new Error('Target non consentito');
  config.database = process.env.VOTILT_DATABASE;
}
const admin = new pg.Client({ ...config, database: 'postgres' });
await admin.connect();
try {
  if (
    !(await admin.query('SELECT 1 FROM pg_database WHERE datname=$1', [config.database])).rowCount
  )
    await admin.query(`CREATE DATABASE "${config.database}"`);
  if (!(await admin.query('SELECT 1 FROM pg_roles WHERE rolname=$1', [config.apiUser])).rowCount) {
    const { rows } = await admin.query(
      "SELECT format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS', $1::text,$2::text) q",
      [config.apiUser, config.apiPassword],
    );
    await admin.query(rows[0].q);
  }
} finally {
  await admin.end();
}
const db = new pg.Client(config);
await db.connect();
try {
  await db.query('BEGIN');
  await db.query(schema);
  const { rows } = await db.query(
    "SELECT format('GRANT USAGE ON SCHEMA public,api,private TO %1$I; GRANT SELECT ON ALL TABLES IN SCHEMA public TO %1$I; REVOKE ALL ON private.credentials,private.sessions FROM %1$I; GRANT INSERT ON private.sessions TO %1$I; REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA api FROM %1$I; GRANT EXECUTE ON FUNCTION api.dispatch(text,jsonb),api.register_user(uuid,text,text,text,text),api.auth_lookup(text),api.auth_session(text),api.quiz_media_path(uuid),api.upload_receipt(jsonb),api.media_referenced(text),api.revoke_session(text),api.category_policy_context(),api.feed_candidates(jsonb),api.feed_items(jsonb),api.uid(),api.is_mod(),api.blocked(uuid,uuid),api.friends(uuid,uuid),api.can_read(public.content_items) TO %1$I', $1::text) q",
    [config.apiUser],
  );
  await db.query(rows[0].q);
  await db.query('COMMIT');
  console.log('PASS: schema VOTILT e ruoli applicati su PostgreSQL nativo dedicato (55432).');
} catch (e) {
  await db.query('ROLLBACK');
  throw e;
} finally {
  await db.end();
}
