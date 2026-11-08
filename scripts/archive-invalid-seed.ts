import pg from 'pg';
import { readFileSync, writeFileSync } from 'node:fs';
import { stableId } from './generate-seed-art.ts';
const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8'));
const db = new pg.Client(config);
await db.connect();
const parts = [
  'AI Universe',
  'Art Battle, Tools Arena, Real or AI',
  'provenance unknown excluded',
  '',
];
const ids = [1, 2, 3].map((level) => stableId(`category:${parts.slice(0, level + 1).join('/')}`));
const content = [0, 1, 2].map((v) => stableId(`content::${v}`));
const sql = `-- Archive a seed-parser error from the initial development run, preserving all records.\nBEGIN;\nSELECT pg_advisory_xact_lock(8815001);\n${content.map((id) => `SELECT api.invalidate_content('${id}');\nUPDATE public.content_items SET moderation_status='hidden' WHERE id='${id}';`).join('\n')}\nUPDATE public.categories SET status='archived' WHERE id IN (${ids.map((id) => `'${id}'`).join(',')});\nCOMMIT;\n`;
writeFileSync('migrations/migrate_categories_seed_catalog.sql', sql);
try {
  await db.query(sql);
  console.log('PASS: tre nodi spurii del primo seed archiviati, nessun record cancellato.');
} finally {
  await db.end();
}
