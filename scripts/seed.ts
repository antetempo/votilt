import pg from 'pg';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { passwordHash } from '../server/auth.ts';
import { pool } from '../server/db.ts';
import { catalog, stableId, generateArt, aiAssets, toolCatalog } from './generate-seed-art.ts';

const config = JSON.parse(readFileSync('.local/runtime.json', 'utf8').replace(/^\uFEFF/, ''));
if (process.env.VOTILT_DATABASE) {
  if (
    !['votilt', 'votilt_test', 'votilt_bootstrap_test', 'votilt_creator_bootstrap_test'].includes(
      process.env.VOTILT_DATABASE,
    )
  )
    throw Error('Database non consentito');
  config.database = process.env.VOTILT_DATABASE;
}
const db = new pg.Client(config);
await db.connect();
const handles = ['nova', 'milo', 'zora', 'elio', 'cleo', 'mod_votilt'];
const names = ['Nova', 'Milo', 'Zora', 'Elio', 'Cleo', 'Team VOTILT'];
const credsFile = '.local/demo-credentials.json';
const creds = existsSync(credsFile)
  ? JSON.parse(readFileSync(credsFile, 'utf8'))
  : handles.map((handle, i) => ({
      email: `${handle}@votilt.test`,
      password: `Tilt!${randomBytes(9).toString('base64url')}`,
      handle,
      displayName: names[i],
      role: i === 5 ? 'moderator' : 'user',
    }));
writeFileSync(credsFile, JSON.stringify(creds, null, 2), { mode: 0o600 });
try {
  await generateArt();
  await db.query('BEGIN');
  await db.query('SELECT pg_advisory_xact_lock(8815001)');
  for (const [i, handle] of handles.entries()) {
    const uid = stableId(`user:${handle}`);
    if (!(await db.query('SELECT 1 FROM public.profiles WHERE id=$1', [uid])).rowCount) {
      await db.query('SELECT api.register_user($1,$2,$3,$4,$5)', [
        uid,
        creds[i].email,
        await passwordHash(creds[i].password),
        handle,
        names[i],
      ]);
      await db.query('UPDATE public.user_roles SET role=$1 WHERE user_id=$2', [
        i === 5 ? 'moderator' : 'user',
        uid,
      ]);
      await db.query(
        "UPDATE public.profile_settings SET onboarding_complete=true,show_champions='friends',allow_comparison=true WHERE user_id=$1",
        [uid],
      );
    }
  }
  for (const [index, parts] of catalog.entries()) {
    for (let level = 0; level < 4; level++) {
      const key = parts.slice(0, level + 1).join('/');
      const id = stableId(`category:${key}`);
      const parent = level ? stableId(`category:${parts.slice(0, level).join('/')}`) : null;
      await db.query(
        `INSERT INTO public.categories(id,parent_id,depth,slug,title,description,sort_order,icon) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO NOTHING`,
        [
          id,
          parent,
          level + 1,
          parts[level]
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-'),
          parts[level],
          `Esplora ${parts[level].toLowerCase()}: contenuti originali, stili e preferenze.`,
          index,
          ['people', 'restaurant', 'game-controller', 'planet', 'color-palette', 'sparkles'][
            Math.floor(index / 8) % 6
          ],
        ],
      );
    }
    const cat = stableId(`category:${parts.join('/')}`);
    const leaf = parts[3];
    const referenceKind =
      parts[1] === 'AI Tools'
        ? 'tool'
        : parts[0] === 'Persone & Vibes' || leaf === 'Personaggi immaginari'
          ? 'person'
          : parts[0] === 'Travel & Places'
            ? 'place'
            : 'name';
    const referenceLabel =
      referenceKind === 'tool'
        ? 'Nome dello strumento'
        : referenceKind === 'person'
          ? 'Nome della persona'
          : referenceKind === 'place'
            ? 'Nome del luogo'
            : 'Nome della creazione';
    await db.query(
      'UPDATE public.categories SET reference_kind=$2,reference_label=$3,requires_url=$4 WHERE id=$1',
      [cat, referenceKind, referenceLabel, referenceKind === 'tool'],
    );
    await db.query('UPDATE public.categories SET allowed_kinds=$2 WHERE id=$1', [
      cat,
      referenceKind === 'tool' ? ['ai_tool'] : ['photo', 'illustration', 'ai_art'],
    ]);
    for (let v = 0; v < 3; v++) {
      const id = stableId(`content:${leaf}:${v}`);
      const kind = parts[1] === 'AI Tools' ? 'ai_tool' : 'illustration';
      const suffix = ['Luce d’altrove', 'Senza confini', 'Un’altra prospettiva'][v];
      await db.query(
        `INSERT INTO public.content_items(id,author_id,kind,title,caption,media_path,provenance,moderation_status,rights_attested,adult_consent,approved_at,width,height,mime_type)
    VALUES($1,$2,$3,$4,$5,$6,'original_illustration','approved',true,true,now(),800,1200,'image/jpeg') ON CONFLICT(id) DO NOTHING`,
        [
          id,
          stableId(`user:${handles[(index + v) % 5]}`),
          kind,
          `${leaf.slice(0, 50)} · ${suffix}`,
          kind === 'ai_tool'
            ? 'Strumento immaginario dimostrativo. Nessun prezzo o prestazione dichiarata.'
            : 'Un’illustrazione originale per scoprire il tuo prossimo campione.',
          `${id}.jpg`,
        ],
      );
      await db.query(
        'INSERT INTO public.content_categories(content_id,category_id) VALUES($1,$2) ON CONFLICT DO NOTHING',
        [id, cat],
      );
      const tool = toolCatalog.find((t) => t.leaf === leaf && t.variant === v);
      const firstNames = [
        'Nora',
        'Amir',
        'Maya',
        'Elisa',
        'Leo',
        'Daria',
        'Ari',
        'Elian',
        'Sole',
        'Noah',
        'Mira',
        'Iris',
        'Lena',
        'Tariq',
        'Alma',
        'Nico',
        'Ada',
        'Evan',
        'Lia',
        'Rayan',
        'Vera',
        'Remi',
        'Zoe',
        'Teo',
      ];
      const subject =
        tool?.name ||
        (referenceKind === 'person'
          ? `${firstNames[(index * 3 + v) % firstNames.length]} ${['Vela', 'Arden', 'Riva', 'Aster', 'Lumi', 'Voss', 'Morel', 'Vale'][index % 8]}`
          : referenceKind === 'place'
            ? `${['Auria', 'Velaria', 'Luminara'][v]} · luogo immaginario`
            : `${leaf} · ${suffix}`);
      await db.query(
        'INSERT INTO public.content_metadata(content_id,category_id,subject_name,reference_url) VALUES($1,$2,$3,$4) ON CONFLICT(content_id,category_id) DO UPDATE SET subject_name=excluded.subject_name,reference_url=excluded.reference_url',
        [id, cat, subject, tool?.url || null],
      );
      if (tool)
        await db.query('UPDATE public.content_items SET title=$2,caption=$3 WHERE id=$1', [
          id,
          tool.name,
          tool.description,
        ]);
      else
        await db.query(
          "UPDATE public.content_items SET caption='' WHERE id=$1 AND caption IN ('Un’illustrazione originale per scoprire il tuo prossimo campione.','Personaggio adulto immaginario. Nome di fantasia, nessuna persona reale raffigurata.')",
          [id],
        );
      if (aiAssets.some((a) => a.leaf === leaf && a.variant === v))
        await db.query(
          "UPDATE public.content_items SET kind='ai_art',provenance='ai_generated' WHERE id=$1",
          [id],
        );
    }
  }
  for (let i = 0; i < 17; i++) {
    const id = stableId(`moderation:${i}`);
    const parts = catalog[i % catalog.length];
    const source = stableId(`content:${parts[3]}:${i % 3}`);
    const status = i < 12 ? 'pending_review' : i < 15 ? 'rejected' : 'hidden';
    await db.query(
      `INSERT INTO public.content_items(id,author_id,kind,title,caption,media_path,provenance,moderation_status,review_reason,rights_attested,adult_consent)
   VALUES($1,$2,'illustration',$3,'Proposta dimostrativa per il flusso di moderazione.',$4,'original_illustration',$5,$6,true,true) ON CONFLICT DO NOTHING`,
      [
        id,
        stableId(`user:${handles[i % 5]}`),
        `Proposta ${parts[3]}`,
        `${id}.jpg`,
        status,
        status === 'rejected' ? 'Esempio demo: categoria da correggere.' : null,
      ],
    );
    await db.query(
      'INSERT INTO public.content_categories(content_id,category_id,status) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
      [
        id,
        stableId(`category:${parts.join('/')}`),
        status === 'pending_review' ? 'pending' : 'approved',
      ],
    );
    writeFileSync(`.local/media/${id}.jpg`, readFileSync(`.local/media/${source}.jpg`));
  }
  await db.query('COMMIT');
  await db.query(
    'INSERT INTO public.content_metadata(content_id,category_id,subject_name) SELECT cc.content_id,cc.category_id,c.title FROM public.content_categories cc JOIN public.content_items c ON c.id=cc.content_id LEFT JOIN public.content_metadata m ON m.content_id=cc.content_id AND m.category_id=cc.category_id WHERE m.content_id IS NULL ON CONFLICT DO NOTHING',
  );
  // Seed through the exact authoritative voting functions, with stable operation IDs.
  for (let user = 0; user < 6; user++) {
    await db.query('BEGIN');
    await db.query("SELECT set_config('app.user_id',$1,true)", [stableId(`user:${handles[user]}`)]);
    for (let k = 0; k < 32; k++) {
      const index = (k + user * 3) % catalog.length;
      const parts = catalog[index];
      const cat = stableId(`category:${parts.join('/')}`);
      if (
        (
          await db.query('SELECT 1 FROM public.vote_slots WHERE user_id=$1 AND category_id=$2', [
            stableId(`user:${handles[user]}`),
            cat,
          ])
        ).rowCount
      )
        continue;
      const v = (user + k) % 3;
      const input = {
        categoryId: cat,
        contentId: stableId(`content:${parts[3]}:${v}`),
        clientOperationId: stableId(`seed-vote:v2:${user}:${cat}`),
      };
      await db.query("SELECT api.vote($1::jsonb,'vote_intent')", [JSON.stringify(input)]);
      if (k < 3) {
        const duelResult = await db.query("SELECT api.vote($1::jsonb,'vote_intent') r", [
          JSON.stringify({
            ...input,
            contentId: stableId(`content:${parts[3]}:${(v + 1) % 3}`),
            clientOperationId: stableId(`seed-intent:v2:${user}:${cat}`),
          }),
        ]);
        const duel = duelResult.rows[0].r;
        await db.query("SELECT api.vote($1::jsonb,'resolve_tilt')", [
          JSON.stringify({
            duelId: duel.duelId,
            winnerSide: k % 2 ? 'INCUMBENT' : 'CHALLENGER',
            clientOperationId: stableId(`seed-resolve:v2:${user}:${cat}`),
          }),
        ]);
      }
    }
    await db.query('COMMIT');
  }
  await db.query('BEGIN');
  const a = stableId('user:nova'),
    b = stableId('user:milo'),
    c = stableId('user:zora');
  await db.query(
    'INSERT INTO public.friendships VALUES(least($1::uuid,$2::uuid),greatest($1::uuid,$2::uuid)) ON CONFLICT DO NOTHING',
    [a, b],
  );
  await db.query('INSERT INTO public.follows VALUES($1,$2),($2,$1) ON CONFLICT DO NOTHING', [a, b]);
  if (
    !(
      await db.query(
        'SELECT 1 FROM public.friend_requests WHERE requester_id=$1 AND recipient_id=$2',
        [c, a],
      )
    ).rowCount
  )
    await db.query('INSERT INTO public.friend_requests(requester_id,recipient_id) VALUES($1,$2)', [
      c,
      a,
    ]);
  for (let i = 0; i < 8; i++)
    await db.query(
      "INSERT INTO public.notifications(id,recipient_id,type,title) VALUES($1,$2,'welcome',$3) ON CONFLICT DO NOTHING",
      [
        stableId(`notification:${i}`),
        stableId(`user:${handles[i % 6]}`),
        i % 2
          ? 'Il tuo universo ti aspetta. Scegli il prossimo campione.'
          : 'Benvenuto su VOTILT. Un solo campione per categoria!',
      ],
    );
  for (let i = 0; i < 2; i++)
    await db.query(
      "INSERT INTO public.reports(id,reporter_id,content_id,reason) VALUES($1,$2,$3,'Esempio fittizio per collaudo moderazione: controllare categoria e diritti dichiarati.') ON CONFLICT DO NOTHING",
      [stableId(`demo-report:${i}`), a, stableId(`content:${catalog[i][3]}:1`)],
    );
  await db.query(
    "INSERT INTO public.daily_challenges SELECT d::date,(SELECT id FROM public.categories WHERE status='published' AND EXISTS(SELECT 1 FROM public.content_categories cc JOIN public.content_items c ON c.id=cc.content_id WHERE cc.category_id=categories.id AND cc.status='approved' AND c.moderation_status='approved' AND c.visibility='public') ORDER BY md5(id::text||d::date::text) LIMIT 1) FROM generate_series(current_date-1,current_date+90,interval '1 day')d ON CONFLICT DO NOTHING",
  );
  await db.query(
    `INSERT INTO public.creator_ranking_snapshots SELECT (now() AT TIME ZONE 'UTC')::date,s.category_id,c.author_id,count(*) FROM public.vote_slots s JOIN public.content_items c ON c.id=s.champion_content_id WHERE s.champion_content_id IS NOT NULL GROUP BY s.category_id,c.author_id ON CONFLICT DO NOTHING`,
  );
  await db.query('COMMIT');
  const counts = (
    await db.query(
      `SELECT (SELECT count(*) FROM public.categories cat WHERE cat.status='published' AND NOT EXISTS(SELECT 1 FROM public.categories child WHERE child.parent_id=cat.id AND child.status='published')) published_leaves,(SELECT count(*) FROM public.content_items WHERE moderation_status='approved') approved,(SELECT count(*) FROM public.vote_slots WHERE champion_content_id IS NOT NULL) champions`,
    )
  ).rows[0];
  console.log(
    'PASS: seed persistente completato.',
    counts,
    'Account demo nel file locale .local/demo-credentials.json (non tracciato).',
  );
} catch (e) {
  await db.query('ROLLBACK');
  throw e;
} finally {
  await db.end();
  await pool.end();
}
