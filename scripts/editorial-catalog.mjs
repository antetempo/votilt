import fs from 'node:fs';
import assert from 'node:assert/strict';
const registry = JSON.parse(
  fs.readFileSync('data/editorial-catalog.json', 'utf8').replace(/^\uFEFF/, ''),
);
const entries = registry.entries;
const byId = new Map(entries.map((entry) => [entry.id, entry]));
assert.equal(byId.size, entries.length, 'UUID duplicato');
assert.equal(
  new Set(entries.map((entry) => entry.path.join(' > '))).size,
  entries.length,
  'Percorso duplicato',
);
for (const entry of entries) {
  assert.match(entry.id, /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
  assert.equal(entry.path.length, entry.depth);
  assert.equal(entry.path.at(-1), entry.title);
  if (entry.parent_id) {
    const parent = byId.get(entry.parent_id);
    assert.ok(parent, 'Genitore mancante');
    assert.equal(parent.depth + 1, entry.depth);
    assert.deepEqual(parent.path, entry.path.slice(0, -1));
  } else assert.equal(entry.depth, 1);
  assert.equal(entry.terminal, !entries.some((child) => child.parent_id === entry.id));
}
const quote = (value) => "'" + value.replaceAll("'", "''") + "'";
const sql = [
  '-- Editorial catalog release candidate; stable IDs, all nodes selectable, no votes seeded.',
];
for (const entry of [...entries].sort((a, b) => a.depth - b.depth || a.sort_order - b.sort_order)) {
  const tool = entry.title.startsWith('Tool AI per ');
  sql.push(`INSERT INTO public.categories(id,parent_id,depth,slug,title,description,sort_order,aliases,reference_kind,reference_label,requires_url,allowed_kinds)
VALUES('${entry.id}',${entry.parent_id ? "'" + entry.parent_id + "'" : 'NULL'},${entry.depth},'editorial-${entry.id}',${quote(entry.title)},${quote('Contenuti su ' + entry.title + '. Preferenze dirette al creator in questa categoria; le sottocategorie hanno classifiche proprie.')},${entry.sort_order},ARRAY[${entry.aliases.map(quote).join(',')}]::text[],${quote(tool ? 'tool' : 'name')},${quote(tool ? 'Nome dello strumento' : 'Nome del contenuto')},${tool},${tool ? "ARRAY['ai_tool']" : "ARRAY['photo','illustration','ai_art']"})
ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,aliases=excluded.aliases,sort_order=excluded.sort_order;`);
}
fs.writeFileSync('migrations/migrate_categories_editorial_catalog.sql', sql.join('\n') + '\n');
console.log(
  JSON.stringify({
    status: 'PASS',
    version: registry.version,
    nodes: entries.length,
    leaves: entries.filter((entry) => entry.terminal).length,
    roots: entries.filter((entry) => !entry.parent_id).length,
    maxDepth: Math.max(...entries.map((entry) => entry.depth)),
  }),
);
