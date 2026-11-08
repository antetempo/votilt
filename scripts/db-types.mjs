import pg from 'pg';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8').replace(/^\uFEFF/, ''));
const client = new pg.Client({ ...config, user: config.apiUser, password: config.apiPassword });
await client.connect();
try {
  const { rows } = await client.query(
    "SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position",
  );
  const tables = new Map();
  for (const r of rows) {
    const fields = tables.get(r.table_name) || [];
    const type = ['integer', 'numeric', 'bigint', 'double precision'].includes(r.data_type)
      ? 'number'
      : r.data_type === 'boolean'
        ? 'boolean'
        : r.data_type === 'jsonb'
          ? 'unknown'
          : 'string';
    fields.push(`  ${r.column_name}: ${type}${r.is_nullable === 'YES' ? ' | null' : ''};`);
    tables.set(r.table_name, fields);
  }
  mkdirSync('src/types', { recursive: true });
  writeFileSync(
    'src/types/database.ts',
    '// Generated from the running native PostgreSQL schema. npm run db:types\n' +
      [...tables]
        .map(
          ([name, fields]) =>
            `export type ${name
              .split('_')
              .map((s) => s[0].toUpperCase() + s.slice(1))
              .join('')}Row = {\n${fields.join('\n')}\n};`,
        )
        .join('\n\n') +
      '\n',
  );
  console.log(`PASS: tipi generati per ${tables.size} tabelle da schema reale.`);
} finally {
  await client.end();
}
