import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import pg from 'pg';
import sharp from 'sharp';

process.env.VOTILT_DATABASE = 'votilt_test';
const { createApp } = await import('../../server/http.ts');
const runtime = JSON.parse(readFileSync('.local/runtime.json', 'utf8').replace(/^\uFEFF/, ''));
const db = new pg.Client({ ...runtime, database: 'votilt_test' });
await db.connect();
const app = await createApp({ globalRateLimitMax: 1000 });
await app.listen({ host: '127.0.0.1', port: 4319 });
const results: { id: string; status: string; detail?: string }[] = [];
type Account = { token: string; user: { id: string } };
async function request(route: string, data: unknown, account?: Account) {
  const res = await fetch('http://127.0.0.1:4319' + route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(account ? { Authorization: 'Bearer ' + account.token } : {}),
    },
    body: JSON.stringify(data),
  });
  return { status: res.status, data: await res.json() };
}
async function call(account: Account | undefined, name: string, data: unknown = {}) {
  const res = await request('/rpc/' + name, data, account);
  assert.equal(res.status, 200, res.data.code);
  return res.data;
}
async function account() {
  const nonce = randomUUID();
  const res = await request('/auth/signup', {
    email: nonce + '@creator.votilt.test',
    password: 'Only-test-' + nonce,
    handle: 'c_' + nonce.replaceAll('-', '').slice(0, 12),
    displayName: 'Creator QA',
    adult: true,
  });
  assert.equal(res.status, 200);
  return res.data as Account;
}
async function check(id: string, work: () => Promise<void>) {
  try {
    await work();
    results.push({ id, status: 'PASS' });
    console.log('PASS ' + id);
  } catch (error) {
    results.push({ id, status: 'FAIL', detail: (error as Error).message });
    console.error('FAIL ' + id + ': ' + (error as Error).message);
  }
}
const parent = randomUUID(),
  category = randomUUID(),
  other = randomUUID();
const bytes = await sharp({
  create: { width: 96, height: 128, channels: 3, background: '#482268' },
})
  .jpeg()
  .toBuffer();
let viewer: Account, second: Account, creator: Account, rival: Account, mod: Account;
const ids = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
const vote = (contentId: string, categoryId = category) => ({
  contentId,
  categoryId,
  clientOperationId: randomUUID(),
});
async function slot() {
  return (
    await db.query('SELECT * FROM public.vote_slots WHERE user_id=$1 AND category_id=$2', [
      viewer.user.id,
      category,
    ])
  ).rows[0];
}
async function profile() {
  return call(viewer, 'profile', { userId: creator.user.id });
}
async function upload(extra: Record<string, unknown> = {}) {
  const form = new FormData();
  form.append(
    'metadata',
    JSON.stringify({
      clientOperationId: randomUUID(),
      title: 'Bonsai di prova',
      caption: 'Studio di un bonsai',
      tags: ['Bonsai', 'bonsai', 'café'],
      kind: 'illustration',
      provenance: 'original_illustration',
      categoryIds: [parent],
      rights: true,
      adultConsent: true,
      metadata: { [parent]: { name: 'Bonsai di prova' } },
      ...extra,
    }),
  );
  form.append('image', new Blob([bytes], { type: 'image/jpeg' }), 'creator-test.jpg');
  const res = await fetch('http://127.0.0.1:4319/uploads', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + rival.token },
    body: form,
  });
  return { status: res.status, data: await res.json() };
}
try {
  viewer = await account();
  second = await account();
  creator = await account();
  rival = await account();
  mod = await account();
  await db.query("UPDATE public.user_roles SET role='moderator' WHERE user_id=$1", [mod.user.id]);
  await db.query(
    "INSERT INTO public.categories(id,parent_id,depth,slug,title) VALUES($1,NULL,1,($1::uuid)::text,'Creator QA radice'),($2,$1,2,($2::uuid)::text,'Creator QA ramo'),($3,$2,3,($3::uuid)::text,'Creator QA discendente')",
    [parent, category, other],
  );
  for (const [index, id] of ids.entries()) {
    writeFileSync('.local/media/' + id + '.jpg', bytes);
    await db.query(
      "INSERT INTO public.content_items(id,author_id,kind,title,media_path,moderation_status,approved_at) VALUES($1,$2,'illustration',$3,$4,'approved',now())",
      [id, index < 3 ? creator.user.id : rival.user.id, 'Creator fixture ' + index, id + '.jpg'],
    );
    await db.query("INSERT INTO public.content_categories VALUES($1,$2,'approved')", [
      id,
      category,
    ]);
    await db.query('INSERT INTO public.content_metadata VALUES($1,$2,$3,NULL)', [
      id,
      category,
      'Creator fixture ' + index,
    ]);
  }
  await check('C01 ramo intermedio votabile e nessun rollup alla radice', async () => {
    assert.ok(
      (await call(viewer, 'category_rankings', { query: 'vorrei vedere bonsai' })).some(
        (item: any) => item.title === 'Bonsai',
      ),
    );
    assert.ok(
      (await call(viewer, 'category_rankings', { query: 'cafferacer' })).some(
        (item: any) => item.title === 'Café racer',
      ),
    );
    assert.equal((await call(viewer, 'vote_intent', vote(ids[0]))).kind, 'INITIAL_VOTE');
    assert.equal((await profile()).preferenceCount, 1);
    assert.equal(
      (await call(viewer, 'ranking', { categoryId: parent, metric: 'popular' })).items.length,
      0,
    );
    const root = (await call(viewer, 'category_rankings', { query: 'Creator QA radice' })).find(
      (entry: any) => entry.id === parent,
    );
    assert.equal(root.voteCount, 0);
    assert.equal(root.leader, null);
  });
  await check(
    'C02 due foto stesso creator, venti richieste concorrenti, una preferenza e origine stabile',
    async () => {
      const before = await slot();
      const responses = await Promise.all(
        Array.from({ length: 20 }, () => call(viewer, 'vote_intent', vote(ids[1]))),
      );
      assert.ok(responses.every((response) => response.kind === 'ALREADY_CHAMPION'));
      assert.equal((await slot()).version, before.version);
      assert.equal((await slot()).origin_content_id, ids[0]);
      assert.equal((await profile()).preferenceCount, 1);
      assert.equal(
        (await call(viewer, 'content', { contentId: ids[1], categoryId: category })).creatorSupport,
        1,
      );
      assert.equal(
        (await call(viewer, 'content', { contentId: ids[0], categoryId: category })).originSupport,
        1,
      );
      assert.equal(
        (await call(viewer, 'content', { contentId: ids[1], categoryId: category })).originSupport,
        0,
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int n FROM public.tilt_duels WHERE user_id=$1 AND category_id=$2 AND status='pending'",
            [viewer.user.id, category],
          )
        ).rows[0].n,
        0,
      );
    },
  );
  await check(
    'C03 classifiche creator deduplicate e annullamento TILT senza trasferimento',
    async () => {
      const ranking = await call(viewer, 'ranking', { categoryId: category, metric: 'popular' });
      assert.equal(ranking.items.length, 2);
      assert.equal(new Set(ranking.items.map((item: any) => item.authorId)).size, 2);
      const duel = await call(viewer, 'vote_intent', vote(ids[3]));
      await call(viewer, 'cancel_tilt', { duelId: duel.duelId, clientOperationId: randomUUID() });
      assert.equal((await profile()).preferenceCount, 1);
    },
  );
  await check(
    'C04 trasferimento concorrente idempotente ed Elo creator separato dallo storico immagini',
    async () => {
      const oldEvents = (await db.query('SELECT count(*)::int n FROM public.rating_events')).rows[0]
        .n;
      const duel = await call(viewer, 'vote_intent', vote(ids[3]));
      const input = {
        duelId: duel.duelId,
        winnerSide: 'CHALLENGER',
        clientOperationId: randomUUID(),
      };
      const responses = await Promise.all(
        Array.from({ length: 12 }, () => call(viewer, 'resolve_tilt', input)),
      );
      responses.forEach((response) => assert.deepEqual(response, responses[0]));
      assert.equal((await profile()).preferenceCount, 0);
      assert.equal((await call(viewer, 'profile', { userId: rival.user.id })).preferenceCount, 1);
      assert.equal(
        (
          await db.query(
            'SELECT count(*)::int n FROM public.creator_rating_events WHERE duel_id=$1',
            [duel.duelId],
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (await db.query('SELECT count(*)::int n FROM public.rating_events')).rows[0].n,
        oldEvents,
      );
      const reverse = await call(viewer, 'vote_intent', vote(ids[1]));
      const resolved = await call(viewer, 'resolve_tilt', {
        duelId: reverse.duelId,
        winnerSide: 'CHALLENGER',
        clientOperationId: randomUUID(),
      });
      assert.equal(
        resolved.rated,
        false,
        'Cambiare immagine non aggira il cooldown della coppia di creator',
      );
    },
  );
  await check(
    'C05 follow categoria e persona distinti dal voto, Seguiti reale senza duplicati',
    async () => {
      await call(viewer, 'category_follow', { categoryId: category, following: true });
      await call(viewer, 'follow_toggle', { userId: creator.user.id, following: true });
      const feed = await call(viewer, 'feed', {
        mode: 'following',
        seed: 'creator-follow-test',
        limit: 15,
      });
      assert.equal(new Set(feed.items.map((item: any) => item.id)).size, feed.items.length);
      assert.ok(ids.every((id) => feed.items.some((item: any) => item.id === id)));
      await call(viewer, 'category_follow', { categoryId: category, following: false });
      await call(viewer, 'follow_toggle', { userId: creator.user.id, following: false });
      assert.equal((await profile()).preferenceCount, 1, 'Unfollow non ritira la preferenza');
      assert.equal(
        (await call(viewer, 'feed', { mode: 'following', seed: 'creator-follow-test', limit: 15 }))
          .items.length,
        0,
      );
    },
  );
  let uploaded: string;
  await check(
    'C06 upload unico sulla madre, tag liberi validati e persistenti, nessuna classificazione automatica',
    async () => {
      const multi = await upload({ categoryIds: [parent, category] });
      assert.equal(multi.status, 400);
      assert.equal((await upload({ tags: ['<script>'] })).status, 400);
      assert.equal(
        (await upload({ tags: Array.from({ length: 21 }, (_, i) => 'tag' + i) })).status,
        400,
      );
      const accepted = await upload();
      assert.equal(accepted.status, 200, accepted.data.code);
      uploaded = accepted.data.id;
      const pending = await call(rival, 'content', { contentId: uploaded });
      assert.deepEqual([...pending.tags].sort(), ['bonsai', 'café']);
      assert.equal(pending.categoryId, parent);
      await call(mod, 'moderate', {
        contentId: uploaded,
        decision: 'approved',
        reason: 'QA tag e categoria unica',
      });
      await call(viewer, 'vote_intent', vote(uploaded, parent));
      const prefs = await call(viewer, 'profile', { userId: rival.user.id });
      assert.equal(prefs.preferenceCount, 1);
      assert.equal(prefs.categoryPreferences[0].categoryId, parent);
      await call(viewer, 'category_follow', { categoryId: parent, following: true });
      const followed = await call(viewer, 'feed', {
        mode: 'following',
        seed: 'parent-follow',
        limit: 15,
      });
      assert.deepEqual(
        followed.items.map((item: any) => item.id),
        [uploaded],
        'Seguire la madre non include implicitamente i discendenti',
      );
    },
  );
  await check(
    'C07 ritiro origine mantiene autore con immagine eleggibile, senza creare nuova preferenza',
    async () => {
      const origin = (await slot()).origin_content_id;
      const selected = (await slot()).champion_content_id;
      await call(mod, 'moderate', {
        contentId: selected,
        decision: 'hidden',
        reason: 'QA immagine non disponibile',
      });
      assert.notEqual((await slot()).champion_content_id, selected);
      assert.equal((await slot()).origin_content_id, origin);
      assert.equal((await profile()).preferenceCount, 1);
      for (const id of ids.slice(0, 3).filter((id) => id !== selected))
        await call(mod, 'moderate', {
          contentId: id,
          decision: 'hidden',
          reason: 'QA ultima immagine non disponibile',
        });
      assert.equal((await slot()).champion_content_id, null);
      assert.equal((await profile()).preferenceCount, 0);
    },
  );
  await check(
    'C08 stessa persona in due categorie vale due preferenze, non un rollup o doppio voto immagine',
    async () => {
      await call(second, 'vote_intent', vote(ids[3]));
      await call(second, 'vote_intent', vote(uploaded!, parent));
      const summary = await call(second, 'profile', { userId: rival.user.id });
      assert.equal(summary.preferenceCount, 3);
      assert.equal(summary.categoryPreferences.length, 2);
      assert.equal(
        summary.categoryPreferences.reduce((sum: number, item: any) => sum + item.preferences, 0),
        3,
      );
    },
  );
  await check(
    'C09 cancellazione autore revoca preferenze di tutte le immagini e non cambia creator automaticamente',
    async () => {
      await call(rival, 'delete_account', { confirmation: 'ELIMINA' });
      assert.equal(
        (
          await db.query(
            'SELECT count(*)::int n FROM public.vote_slots WHERE champion_content_id=ANY($1::uuid[])',
            [[ids[3], uploaded!]],
          )
        ).rows[0].n,
        0,
      );
      assert.notEqual((await request('/rpc/me', {}, rival)).status, 200);
    },
  );
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(
    'docs/evidence/creator-integration-results.json',
    JSON.stringify({ date: new Date().toISOString(), database: 'votilt_test', results }, null, 2),
  );
  await db.end();
  await app.close();
}
const failed = results.filter((result) => result.status === 'FAIL');
console.log(`Creator integration: ${results.length - failed.length} PASS / ${failed.length} FAIL`);
process.exitCode = failed.length ? 1 : 0;
