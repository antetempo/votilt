import pg from 'pg';
import { readFileSync } from 'node:fs';
const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8').replace(/^\uFEFF/, ''));
if (config.host !== '127.0.0.1' || config.port !== 55432 || config.database !== 'votilt')
  throw Error('Snapshot consentito solo sul cluster VOTILT dedicato');
const db = new pg.Client(config);
await db.connect();
try {
  await db.query(
    "INSERT INTO public.creator_ranking_snapshots SELECT (now() AT TIME ZONE 'UTC')::date,cc.category_id,c.author_id,api.creator_support(c.author_id,cc.category_id) FROM public.content_categories cc JOIN public.content_items c ON c.id=cc.content_id JOIN public.profiles pr ON pr.id=c.author_id WHERE cc.status='approved' AND c.moderation_status='approved' AND NOT pr.suspended GROUP BY cc.category_id,c.author_id ON CONFLICT DO NOTHING",
  );
  console.log('PASS snapshot giornaliero UTC conservato senza riscrivere lo storico.');
} finally {
  await db.end();
}
