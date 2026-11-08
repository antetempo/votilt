import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import sharp from 'sharp';
import { responseContracts } from '../../src/lib/contracts.ts';

process.env.VOTILT_DATABASE = 'votilt_test';
execFileSync(process.execPath, ['scripts/migrate.mjs'], { env: process.env, stdio: 'pipe' });
const { createApp } = await import('../../server/http.ts');
let failAfterUploadCommit = false;
const app = await createApp({
  globalRateLimitMax: 1000, // Business concurrency tests exceed the production per-IP transport quota; endpoint login/signup quotas remain unchanged.
  afterUploadCommit: () => {
    if (failAfterUploadCommit) {
      failAfterUploadCommit = false;
      throw new Error('Injected lost commit acknowledgement');
    }
  },
});
await app.listen({ host: '127.0.0.1', port: 4318 });
const runtime = JSON.parse(readFileSync('.local/runtime.json', 'utf8'));
const db = new pg.Client({ ...runtime, database: 'votilt_test' });
await db.connect();
const base = 'http://127.0.0.1:4318';
const results: { id: string; status: string; detail?: string }[] = [];
type Account = { token: string; user: { id: string } };
type Vote = {
  kind: string;
  championId: string;
  duelId: string;
  slotVersion: number;
  receiptId: string;
  rated: boolean;
  didChampionChange: boolean;
};
async function http(route: string, body: unknown = {}, token?: string) {
  const res = await fetch(base + route, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}
async function call<T = any>(
  a: Account | null,
  action: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  const r = await http('/rpc/' + action, input, a?.token);
  if (r.status !== 200) throw new Error(r.data.code);
  responseContracts[action]?.parse(r.data);
  return r.data;
}
async function fails(
  a: Account | null,
  action: string,
  input: Record<string, unknown>,
  codes: string[],
) {
  const r = await http('/rpc/' + action, input, a?.token);
  assert.notEqual(r.status, 200);
  assert.ok(codes.includes(r.data.code), `${action}: ${r.data.code}`);
}
async function check(id: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ id, status: 'PASS' });
    console.log(`PASS ${id}`);
  } catch (e) {
    results.push({ id, status: 'FAIL', detail: (e as Error).message });
    console.error(`FAIL ${id}: ${(e as Error).message}`);
    const frame = (e as Error).stack?.split('\n').find((line) => line.includes('api.test.ts:'));
    if (frame) console.error(frame.trim());
  }
}
const password = 'Test-only-' + randomUUID();
async function account() {
  const r = await http('/auth/signup', {
    email: `test-${randomUUID()}@votilt.test`,
    password,
    handle: 't_' + randomUUID().slice(0, 12).replaceAll('-', ''),
    displayName: 'Test isolato',
    adult: true,
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return r.data as Account;
}
const root = randomUUID(),
  theme = randomUUID(),
  sub = randomUUID(),
  cat = randomUUID(),
  otherCat = randomUUID();
let A: Account, B: Account, M: Account, C: Account, D: Account;
let content: string[] = [];
let fixtureAuthors: string[] = [];
let opInitial: string;
let duel: string;
let receipt: Vote;
let resolveInput: Record<string, unknown>;
const input = (id: string) => ({ categoryId: cat, contentId: id, clientOperationId: randomUUID() });
const support = async (id: string) =>
  Number(
    (
      await db.query(
        'SELECT count(*) FROM public.vote_slots WHERE category_id=$1 AND champion_content_id=$2',
        [cat, id],
      )
    ).rows[0].count,
  );
const slot = async (user: string) =>
  (
    await db.query('SELECT * FROM public.vote_slots WHERE user_id=$1 AND category_id=$2', [
      user,
      cat,
    ])
  ).rows[0];
try {
  A = await account();
  B = await account();
  M = await account();
  C = await account();
  D = await account();
  await db.query("UPDATE public.user_roles SET role='moderator' WHERE user_id=$1", [M.user.id]);
  for (const [id, parent, depth] of [
    [root, null, 1],
    [theme, root, 2],
    [sub, theme, 3],
    [cat, sub, 4],
    [otherCat, sub, 4],
  ])
    await db.query(
      'INSERT INTO public.categories(id,parent_id,depth,slug,title) VALUES($1,$2,$3,$4,$5)',
      [id, parent, depth, `test-${id}`, 'Categoria test isolata'],
    );
  fixtureAuthors = [M.user.id, A.user.id, C.user.id, M.user.id, B.user.id];
  content = Array.from({ length: 5 }, () => randomUUID());
  for (const [i, id] of content.entries()) {
    const bytes = await sharp({
      create: { width: 64, height: 64, channels: 3, background: i % 2 ? '#A855F7' : '#22D3EE' },
    })
      .jpeg()
      .toBuffer();
    mkdirSync('.local/media', { recursive: true });
    writeFileSync(`.local/media/${id}.jpg`, bytes);
    await db.query(
      `INSERT INTO public.content_items(id,author_id,kind,title,media_path,moderation_status,rights_attested,adult_consent) VALUES($1,$2,'illustration','Fixture isolata',$3,$4,true,true)`,
      [id, fixtureAuthors[i], `${id}.jpg`, i === 3 ? 'pending_review' : 'approved'],
    );
    await db.query(
      'INSERT INTO public.content_categories(content_id,category_id,status) VALUES($1,$2,$3)',
      [id, cat, i === 3 ? 'pending' : 'approved'],
    );
    await db.query('INSERT INTO public.content_metadata VALUES($1,$2,$3,NULL)', [
      id,
      cat,
      `Soggetto test ${i}`,
    ]);
  }
  await check('AUTH login negativo, sessione persistente e health', async () => {
    const r = await http('/auth/login', { email: 'missing@votilt.test', password });
    assert.equal(r.status, 401);
    assert.equal((await call(A, 'me')).id, A.user.id);
    assert.equal((await fetch(base + '/health')).status, 200);
  });
  await check('T01 primo voto unico', async () => {
    opInitial = randomUUID();
    receipt = await call(A, 'vote_intent', {
      categoryId: cat,
      contentId: content[0],
      clientOperationId: opInitial,
    });
    assert.equal(receipt.kind, 'INITIAL_VOTE');
    assert.equal(await support(content[0]), 1);
    assert.equal((await slot(A.user.id)).version, 1);
  });
  await check('T02 rivoto campione senza incremento', async () => {
    assert.equal((await call<Vote>(A, 'vote_intent', input(content[0]))).kind, 'ALREADY_CHAMPION');
    assert.equal(await support(content[0]), 1);
  });
  await check('T03 sfidante non trasferisce supporto', async () => {
    const r = await call<Vote>(A, 'vote_intent', input(content[1]));
    duel = r.duelId;
    assert.equal(r.kind, 'TILT_REQUIRED');
    assert.equal(await support(content[0]), 1);
    assert.equal(await support(content[1]), 0);
  });
  await check('T04 annullamento senza Elo', async () => {
    await call(A, 'cancel_tilt', { duelId: duel, clientOperationId: randomUUID() });
    assert.equal((await slot(A.user.id)).champion_content_id, content[0]);
    assert.equal(
      (await db.query('SELECT count(*) FROM public.creator_rating_events WHERE duel_id=$1', [duel]))
        .rows[0].count,
      '0',
    );
  });
  await check('T05 conferma campione, Elo una volta', async () => {
    duel = (await call<Vote>(A, 'vote_intent', input(content[1]))).duelId;
    const r = await call<Vote>(A, 'resolve_tilt', {
      duelId: duel,
      winnerSide: 'INCUMBENT',
      clientOperationId: randomUUID(),
    });
    assert.equal(r.didChampionChange, false);
    assert.equal(r.rated, true);
    assert.equal(await support(content[0]), 1);
    assert.equal(
      (
        await db.query(
          'SELECT rating FROM public.creator_duel_ratings WHERE category_id=$1 AND author_id=(SELECT author_id FROM public.content_items WHERE id=$2)',
          [cat, content[0]],
        )
      ).rows[0].rating,
      '1516.00000000000000000000',
    );
  });
  await check('T06 trasferimento campione/versione', async () => {
    duel = (await call<Vote>(A, 'vote_intent', input(content[1]))).duelId;
    resolveInput = { duelId: duel, winnerSide: 'CHALLENGER', clientOperationId: randomUUID() };
    receipt = await call<Vote>(A, 'resolve_tilt', resolveInput);
    assert.equal(receipt.didChampionChange, true);
    assert.equal(receipt.slotVersion, 2);
    assert.equal(await support(content[0]), 0);
    assert.equal(await support(content[1]), 1);
  });
  await check('T07/T19 venti retry concorrenti, stessa ricevuta/Elo unico', async () => {
    const values = await Promise.all(
      Array.from({ length: 20 }, () => call(A, 'resolve_tilt', resolveInput)),
    );
    values.forEach((x) => assert.deepEqual(x, receipt));
    assert.equal(
      (await db.query('SELECT count(*) FROM public.creator_rating_events WHERE duel_id=$1', [duel]))
        .rows[0].count,
      '1',
    );
  });
  await check('T08 ricevuta intent originale e reuse diverso respinto', async () => {
    const p = { categoryId: cat, contentId: content[0], clientOperationId: opInitial };
    const r = await call<Vote>(A, 'vote_intent', p);
    assert.equal(r.kind, 'INITIAL_VOTE');
    await fails(A, 'vote_intent', { ...p, contentId: content[2] }, ['IDEMPOTENCY_KEY_REUSE']);
  });
  await check('T09 due primi voti contemporanei', async () => {
    const r = await Promise.all([
      call<Vote>(B, 'vote_intent', input(content[0])),
      call<Vote>(B, 'vote_intent', input(content[1])),
    ]);
    assert.equal(r.filter((x) => x.kind === 'INITIAL_VOTE').length, 1);
    assert.equal(r.filter((x) => x.kind === 'TILT_REQUIRED').length, 1);
    assert.equal(
      (
        await db.query(
          'SELECT count(*) FROM public.vote_slots WHERE user_id=$1 AND category_id=$2',
          [B.user.id, cat],
        )
      ).rows[0].count,
      '1',
    );
  });
  await check('T10/T27 due dispositivi, vecchio duello superato', async () => {
    const old = (await call<Vote>(A, 'vote_intent', input(content[0]))).duelId;
    await call(A, 'vote_intent', input(content[2]));
    await fails(
      A,
      'resolve_tilt',
      { duelId: old, winnerSide: 'CHALLENGER', clientOperationId: randomUUID() },
      ['DUEL_SUPERSEDED', 'DUEL_STALE'],
    );
  });
  await check('T11 pending respinto', async () => {
    await fails(A, 'vote_intent', input(content[3]), ['CONTENT_UNAVAILABLE']);
  });
  await check('T12 categoria madre non assegnata al contenuto respinta', async () => {
    await fails(A, 'vote_intent', { ...input(content[0]), categoryId: root }, [
      'CONTENT_UNAVAILABLE',
    ]);
  });
  await check('T13 membership diversa respinta', async () => {
    await fails(A, 'vote_intent', { ...input(content[0]), categoryId: otherCat }, [
      'CONTENT_UNAVAILABLE',
    ]);
  });
  await check('T14 duello altrui respinto', async () => {
    const d = (await call<Vote>(A, 'vote_intent', input(content[2]))).duelId;
    await fails(
      B,
      'resolve_tilt',
      { duelId: d, winnerSide: 'CHALLENGER', clientOperationId: randomUUID() },
      ['DUEL_NOT_FOUND'],
    );
  });
  await check('T15 RLS/grants e nessuna escalation', async () => {
    const limited = new pg.Client({
      ...runtime,
      database: 'votilt_test',
      user: runtime.apiUser,
      password: runtime.apiPassword,
    });
    await limited.connect();
    try {
      await assert.rejects(
        limited.query('UPDATE public.vote_slots SET version=version+1'),
        (e: any) => e.code === '42501',
      );
      await assert.rejects(
        limited.query("UPDATE public.user_roles SET role='admin'"),
        (e: any) => e.code === '42501',
      );
      const own = await limited.query('SELECT * FROM public.vote_slots');
      assert.equal(own.rowCount, 0);
      await assert.rejects(
        limited.query('SELECT user_id FROM private.credentials'),
        (e: any) => e.code === '42501',
      );
    } finally {
      await limited.end();
    }
  });
  await check('T16 moderazione invalida campioni e duelli', async () => {
    await call(A, 'report', { contentId: content[1], reason: 'Segnalazione QA controllata' });
    assert.ok((await call(M, 'moderation')).reports.some((x: any) => x.content_id === content[1]));
    await call(M, 'moderate', {
      contentId: content[1],
      decision: 'hidden',
      reason: 'Fixture test di rimozione',
    });
    assert.equal((await slot(A.user.id)).champion_content_id, null);
    assert.equal(await support(content[1]), 0);
    assert.equal(
      (
        await db.query('SELECT status FROM public.reports WHERE reporter_id=$1 AND content_id=$2', [
          A.user.id,
          content[1],
        ])
      ).rows[0].status,
      'reviewed',
    );
    assert.ok(
      (await call(M, 'moderation')).audit.some(
        (x: any) => x.target_id === content[1] && x.action === 'hidden',
      ),
    );
    assert.equal(
      (
        await db.query(
          "SELECT count(*) FROM public.tilt_duels WHERE status='pending' AND (incumbent_id=$1 OR challenger_id=$1)",
          [content[1]],
        )
      ).rows[0].count,
      '0',
    );
    await call(M, 'moderate', {
      contentId: content[1],
      decision: 'approved',
      reason: 'Ripristino fixture test',
    });
  });
  await check('T17 blocco autore e campione incompatibile', async () => {
    await call(C, 'vote_intent', input(content[4]));
    await call(C, 'block', { userId: B.user.id });
    assert.equal((await slot(C.user.id)).champion_content_id, null);
    await fails(C, 'vote_intent', input(content[4]), ['BLOCKED_CONTENT']);
    const feed = await call(C, 'feed', { categoryId: cat });
    assert.ok(!feed.items.some((x: any) => x.id === content[4]));
  });
  await check('T18 pending media protetto guest/altro, accessibile autore/mod', async () => {
    assert.equal((await fetch(base + '/media/' + content[3])).status, 404);
    assert.equal(
      (
        await fetch(base + '/media/' + content[3], {
          headers: { Authorization: `Bearer ${A.token}` },
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await fetch(base + '/media/' + content[3], {
          headers: { Authorization: `Bearer ${M.token}` },
        })
      ).status,
      200,
    );
  });
  await check('T20 cooldown non impedisce preferenza', async () => {
    const rows = await db.query('SELECT rated FROM public.creator_rating_events WHERE duel_id=$1', [
      duel,
    ]);
    assert.equal(rows.rows[0].rated, false);
    assert.equal(receipt.didChampionChange, true);
  });
  await check('T21 truth quiz nascosta e primo tentativo unico', async () => {
    const id = randomUUID();
    const filename = `${randomUUID()}.jpg`;
    mkdirSync('.local/media', { recursive: true });
    writeFileSync(
      `.local/media/${filename}`,
      await sharp({ create: { width: 8, height: 8, channels: 3, background: '#A855F7' } })
        .jpeg()
        .toBuffer(),
    );
    await db.query(
      "INSERT INTO private.quiz_items(id,media_path,ground_truth,evidence_note,enabled,test_only) VALUES($1,$2,'AI','TEST ONLY, fixture in DB isolato',true,false)",
      [id, filename],
    );
    const before = await call(A, 'quiz');
    assert.equal(JSON.stringify(before).includes('groundTruth'), false);
    assert.equal(JSON.stringify(before).includes('TEST ONLY'), false);
    const image = await fetch(base + '/quiz-media/' + id);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type') || '', /image\/jpeg/);
    assert.equal(image.headers.has('ground-truth'), false);
    await db.query('UPDATE private.quiz_items SET test_only=true WHERE id=$1', [id]);
    assert.equal((await fetch(base + '/quiz-media/' + id)).status, 404);
    await db.query('UPDATE private.quiz_items SET test_only=false WHERE id=$1', [id]);
    const answer = await call(A, 'quiz_answer', { quizId: id, answer: 'AI' });
    assert.equal(answer.correct, true);
    const replay = await call(A, 'quiz_answer', { quizId: id, answer: 'REAL' });
    assert.equal(replay.answer, 'AI');
  });
  await check('T22 confronto privato negato', async () => {
    await fails(A, 'taste_match', { userId: B.user.id }, ['CHAMPIONS_PRIVATE']);
    await fails(A, 'champions', { userId: B.user.id }, ['CHAMPIONS_PRIVATE']);
  });
  await check('T23 cancellazione account revoca sessione e supporti', async () => {
    for (const body of [{}, { confirmation: null }, { confirmation: 'NO' }]) {
      await fails(D, 'delete_account', body, ['INVALID_INPUT', 'CONFIRMATION_REQUIRED']);
      assert.equal((await call(D, 'me')).id, D.user.id);
    }
    await call(D, 'vote_intent', input(content[2]));
    await call(D, 'delete_account', { confirmation: 'ELIMINA' });
    assert.equal(
      (await db.query('SELECT count(*) FROM public.vote_slots WHERE user_id=$1', [D.user.id]))
        .rows[0].count,
      '0',
    );
    await fails(D, 'me', {}, ['AUTH_REQUIRED']);
  });
  await check('T24 categoria unica e nessuna propagazione ad altra categoria', async () => {
    await assert.rejects(
      db.query('INSERT INTO public.content_categories(content_id,category_id) VALUES($1,$2)', [
        content[0],
        otherCat,
      ]),
      (e: any) => e.code === '23505',
    );
    await fails(A, 'vote_intent', { ...input(content[0]), categoryId: otherCat }, [
      'CONTENT_UNAVAILABLE',
    ]);
    assert.equal(
      (
        await db.query(
          'SELECT count(*)::int n FROM public.vote_slots WHERE user_id=$1 AND category_id=$2 AND champion_content_id IS NOT NULL',
          [A.user.id, otherCat],
        )
      ).rows[0].n,
      0,
    );
  });
  await check('T26 scadenza respinta', async () => {
    await call(A, 'vote_intent', input(content[0]));
    const d = (await call<Vote>(A, 'vote_intent', input(content[2]))).duelId;
    await db.query(
      "UPDATE public.tilt_duels SET expires_at=now()-interval '1 second' WHERE id=$1",
      [d],
    );
    await fails(
      A,
      'resolve_tilt',
      { duelId: d, winnerSide: 'CHALLENGER', clientOperationId: randomUUID() },
      ['DUEL_EXPIRED'],
    );
  });
  await check('T28 resolve/moderazione simultanei senza campione rimosso', async () => {
    const d = (await call<Vote>(A, 'vote_intent', input(content[1]))).duelId;
    await Promise.allSettled([
      call(A, 'resolve_tilt', {
        duelId: d,
        winnerSide: 'CHALLENGER',
        clientOperationId: randomUUID(),
      }),
      call(M, 'moderate', {
        contentId: content[1],
        decision: 'hidden',
        reason: 'Race fixture isolata',
      }),
    ]);
    assert.notEqual((await slot(A.user.id)).champion_content_id, content[1]);
    assert.equal(await support(content[1]), 0);
    assert.equal((await fetch(base + '/media/' + content[1])).status, 404);
  });
  await check('Auth guest voto, UUID malformato e moderatore falso', async () => {
    await fails(null, 'vote_intent', input(content[0]), ['AUTH_REQUIRED']);
    await fails(A, 'vote_intent', { ...input(content[0]), contentId: 'bad' }, ['INVALID_INPUT']);
    await fails(
      A,
      'moderate',
      { contentId: content[0], decision: 'hidden', reason: 'Tentativo utente' },
      ['FORBIDDEN'],
    );
  });
  await check('Pool non conserva identita tra utenti e rollback', async () => {
    const { transaction } = await import('../../server/db.ts');
    await transaction(A.user.id, async (client) => {
      assert.equal((await client.query('SELECT api.uid() u')).rows[0].u, A.user.id);
    });
    await assert.rejects(
      transaction(B.user.id, async () => {
        throw new Error('forced rollback');
      }),
    );
    await transaction(null, async (client) => {
      assert.equal((await client.query('SELECT api.uid() u')).rows[0].u, null);
    });
    await transaction(B.user.id, async (client) => {
      assert.equal((await client.query('SELECT api.uid() u')).rows[0].u, B.user.id);
    });
  });
  await check('Receipt simultaneo iniziale serializzato per operation ID', async () => {
    const E = await account();
    const p = input(content[0]);
    const before = Number(
      (await db.query('SELECT count(*) FROM public.vote_events WHERE user_id=$1', [E.user.id]))
        .rows[0].count,
    );
    const responses = await Promise.all(
      Array.from({ length: 20 }, () => call<Vote>(E, 'vote_intent', p)),
    );
    responses.forEach((r) => assert.deepEqual(r, responses[0]));
    assert.equal(
      Number(
        (await db.query('SELECT count(*) FROM public.vote_events WHERE user_id=$1', [E.user.id]))
          .rows[0].count,
      ) - before,
      1,
    );
  });
  await check('Social follow idempotente, amicizia reciproca e consenso distinto', async () => {
    await call(A, 'follow_toggle', { userId: B.user.id, following: true });
    await call(A, 'follow_toggle', { userId: B.user.id, following: true });
    assert.equal(
      (
        await db.query(
          'SELECT count(*) FROM public.follows WHERE follower_id=$1 AND followed_id=$2',
          [A.user.id, B.user.id],
        )
      ).rows[0].count,
      '1',
    );
    await call(A, 'friend_request', { userId: B.user.id });
    await call(B, 'friend_request', { userId: A.user.id });
    const social = await call(B, 'social');
    const request = social.requests.find((r: any) => r.requester_id === A.user.id);
    assert.ok(request);
    await call(B, 'friend_answer', { requestId: request.id, accept: true });
    await fails(A, 'taste_match', { userId: B.user.id }, ['CHAMPIONS_PRIVATE']);
    await call(A, 'settings', { showChampions: 'friends', allowComparison: true });
    await call(B, 'settings', { showChampions: 'friends', allowComparison: true });
    const match = await call(A, 'taste_match', { userId: B.user.id });
    assert.ok(match.common >= 0);
    if (match.common < 3) assert.equal(match.percentage, null);
    const battle = await call(A, 'create_battle', { userId: B.user.id, categoryId: cat });
    assert.equal((await call(B, 'battle', { battleId: battle.id })).categoryId, cat);
    await call(A, 'settings', { allowComparison: false });
    await fails(B, 'battle', { battleId: battle.id }, ['CHAMPIONS_PRIVATE']);
  });
  await check('Upload byte reali, pending privato, approvazione, EXIF rimosso', async () => {
    const metadata = {
      clientOperationId: randomUUID(),
      title: 'Upload fixture vero',
      caption: 'Solo collaudo isolato',
      kind: 'illustration',
      provenance: 'original_illustration',
      categoryIds: [cat],
      rights: true,
      adultConsent: true,
      metadata: { [cat]: { name: 'Soggetto test' } },
    };
    const fake = new FormData();
    fake.append('metadata', JSON.stringify(metadata));
    fake.append('image', new Blob(['<html>not a jpg</html>'], { type: 'image/jpeg' }), 'fake.jpg');
    assert.equal(
      (
        await fetch(base + '/uploads', {
          method: 'POST',
          headers: { Authorization: `Bearer ${A.token}` },
          body: fake,
        })
      ).status,
      409,
    );
    const image = await sharp({
      create: { width: 160, height: 120, channels: 3, background: '#AA55FF' },
    })
      .withMetadata({ exif: { IFD0: { Artist: 'TEST-ONLY' } } })
      .jpeg()
      .toBuffer();
    const form = new FormData();
    form.append('metadata', JSON.stringify(metadata));
    form.append('image', new Blob([new Uint8Array(image)], { type: 'image/jpeg' }), 'test.jpg');
    const response = await fetch(base + '/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${A.token}` },
      body: form,
    });
    assert.equal(response.status, 200);
    const uploaded = await response.json();
    const repeatUpload = async (payload = metadata) => {
      const body = new FormData();
      body.append('metadata', JSON.stringify(payload));
      body.append('image', new Blob([new Uint8Array(image)], { type: 'image/jpeg' }), 'retry.jpg');
      const r = await fetch(base + '/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${A.token}` },
        body,
      });
      return { status: r.status, data: await r.json() };
    };
    const retry = await Promise.all(Array.from({ length: 4 }, () => repeatUpload()));
    assert.ok(retry.every((x) => x.status === 200 && x.data.id === uploaded.id));
    const reuse = await repeatUpload({ ...metadata, title: 'Payload diverso' });
    assert.equal(reuse.status, 409);
    assert.equal(reuse.data.code, 'IDEMPOTENCY_KEY_REUSE');
    assert.equal((await fetch(base + '/media/' + uploaded.id)).status, 404);
    assert.equal(
      (
        await fetch(base + '/media/' + uploaded.id, {
          headers: { Authorization: `Bearer ${B.token}` },
        })
      ).status,
      404,
    );
    const own = await fetch(base + '/media/' + uploaded.id, {
      headers: { Authorization: `Bearer ${A.token}` },
    });
    assert.equal(own.status, 200);
    const normalized = await sharp(Buffer.from(await own.arrayBuffer())).metadata();
    assert.equal(normalized.exif, undefined);
    assert.equal(normalized.format, 'jpeg');
    await fails(B, 'vote_intent', input(uploaded.id), ['CONTENT_UNAVAILABLE']);
    await call(M, 'moderate', {
      contentId: uploaded.id,
      decision: 'approved',
      reason: 'Controllo fixture upload',
    });
    assert.equal((await fetch(base + '/media/' + uploaded.id)).status, 200);
    const intent = await call(B, 'vote_intent', input(uploaded.id));
    if (intent.kind === 'TILT_REQUIRED')
      await call(B, 'resolve_tilt', {
        duelId: intent.duelId,
        winnerSide: 'CHALLENGER',
        clientOperationId: randomUUID(),
      });
    assert.equal((await slot(B.user.id)).champion_content_id, uploaded.id);
    await call(M, 'moderate', {
      contentId: uploaded.id,
      decision: 'hidden',
      reason: 'Revoca della fixture upload',
    });
    assert.equal((await slot(B.user.id)).champion_content_id, null);
    assert.equal((await fetch(base + '/media/' + uploaded.id)).status, 404);
  });
  await check('Metadati obbligatori: sito richiede nome e link normalizzato', async () => {
    const websiteCat = randomUUID();
    const siteName = `Sito test verificabile ${websiteCat}`;
    await db.query(
      "INSERT INTO public.categories(id,parent_id,depth,slug,title,reference_kind,reference_label,requires_url) VALUES($1,$2,4,$3,'Siti web test','website','Nome del sito',true)",
      [websiteCat, sub, `site-${websiteCat}`],
    );
    const image = await sharp({
      create: { width: 64, height: 64, channels: 3, background: '#2255FF' },
    })
      .jpeg()
      .toBuffer();
    const baseMeta = {
      clientOperationId: randomUUID(),
      title: 'Sito test',
      caption: 'Fixture metadati',
      kind: 'illustration',
      provenance: 'original_illustration',
      categoryIds: [websiteCat],
      rights: true,
      adultConsent: true,
    };
    const upload = async (metadata: unknown) => {
      const form = new FormData();
      form.append('metadata', JSON.stringify({ ...baseMeta, metadata }));
      form.append('image', new Blob([new Uint8Array(image)], { type: 'image/jpeg' }), 'site.jpg');
      const res = await fetch(base + '/uploads', {
        method: 'POST',
        headers: { Authorization: `Bearer ${A.token}` },
        body: form,
      });
      return { status: res.status, data: await res.json() };
    };
    const empty = await upload({});
    assert.equal(empty.data.code, 'METADATA_REQUIRED');
    const missingLink = await upload({ [websiteCat]: { name: 'Sito test' } });
    assert.equal(missingLink.data.code, 'INVALID_REFERENCE_URL');
    const unsafe = await upload({
      [websiteCat]: { name: 'Sito test', url: 'javascript:alert(1)' },
    });
    assert.notEqual(unsafe.status, 200);
    const good = await upload({
      [websiteCat]: { name: siteName, url: 'example.com/demo' },
    });
    assert.equal(good.status, 200);
    const stored = (
      await db.query(
        'SELECT subject_name,reference_url FROM public.content_metadata WHERE content_id=$1',
        [good.data.id],
      )
    ).rows[0];
    assert.equal(stored.subject_name, siteName);
    assert.equal(stored.reference_url, 'https://example.com/demo');
    await call(M, 'moderate', {
      contentId: good.data.id,
      decision: 'approved',
      reason: 'Fixture metadata validata',
    });
    const detail = await call(A, 'content', { contentId: good.data.id, categoryId: websiteCat });
    assert.equal(detail.title, siteName);
    assert.equal(detail.reference.url, 'https://example.com/demo');
    // Isolate this fixture from previous runs, whose shared name can fill a search page.
    const found = await call(A, 'search', { query: websiteCat });
    assert.ok(found.some((x: any) => x.id === good.data.id));
  });
  await check(
    'Profilo privato non rompe la sessione e resta privato anche agli amici',
    async () => {
      await call(A, 'profile_update', { visibility: 'private' });
      assert.equal((await call(A, 'me')).id, A.user.id);
      await fails(B, 'profile', { userId: A.user.id }, ['PROFILE_UNAVAILABLE']);
      const social = await call(B, 'social');
      assert.ok(!social.people.some((x: any) => x.id === A.user.id));
    },
  );
  await check(
    'Associazione storica rifiutata non perde nome o link via dettaglio, ricerca o RLS',
    async () => {
      const hiddenCat = randomUUID();
      await db.query(
        "INSERT INTO public.categories(id,parent_id,depth,slug,title,reference_kind,requires_url) VALUES($1,$2,4,$3,'Categoria pending test','website',true)",
        [hiddenCat, sub, `pending-${hiddenCat}`],
      );
      await db.query("INSERT INTO public.content_categories VALUES($1,$2,'rejected')", [
        content[2],
        hiddenCat,
      ]);
      await db.query(
        "INSERT INTO public.content_metadata VALUES($1,$2,'UnreleasedSecretName','https://review-only.example')",
        [content[2], hiddenCat],
      );
      await fails(B, 'content', { contentId: content[2], categoryId: hiddenCat }, [
        'CONTENT_UNAVAILABLE',
      ]);
      assert.equal((await call(null, 'search', { query: 'UnreleasedSecretName' })).length, 0);
      const publicDetail = await call(A, 'content', { contentId: content[2], categoryId: cat });
      assert.ok(!JSON.stringify(publicDetail).includes('UnreleasedSecretName'));
      assert.equal(
        (await call(M, 'content', { contentId: content[2], categoryId: hiddenCat })).reference.name,
        'UnreleasedSecretName',
      );
      const { transaction } = await import('../../server/db.ts');
      await transaction(A.user.id, async (limited) => {
        assert.equal(
          (
            await limited.query(
              'SELECT * FROM public.content_metadata WHERE content_id=$1 AND category_id=$2',
              [content[2], hiddenCat],
            )
          ).rowCount,
          0,
        );
      });
      await db.query("INSERT INTO public.content_categories VALUES($1,$2,'rejected')", [
        content[3],
        hiddenCat,
      ]);
      await db.query(
        "INSERT INTO public.content_metadata VALUES($1,$2,'Secondo riferimento QA','https://second-review.example')",
        [content[3], hiddenCat],
      );
      const queue = await call(M, 'moderation');
      const item = queue.contents.find((x: any) => x.id === content[3]);
      assert.equal(item.references.length, 2);
      assert.ok(item.references.some((x: any) => x.url === 'https://second-review.example'));
    },
  );
  await check('Kind incompatibile rifiutato dal voto, tool usa lo stesso motore', async () => {
    await db.query("UPDATE public.content_items SET kind='ai_tool' WHERE id=$1", [content[0]]);
    try {
      await fails(B, 'vote_intent', input(content[0]), ['INVALID_CONTENT_KIND']);
    } finally {
      await db.query("UPDATE public.content_items SET kind='illustration' WHERE id=$1", [
        content[0],
      ]);
    }
    const toolCat = randomUUID();
    await db.query(
      "INSERT INTO public.categories(id,parent_id,depth,slug,title,reference_kind,requires_url,allowed_kinds) VALUES($1,$2,4,$3,'Tool QA','tool',true,ARRAY['ai_tool'])",
      [toolCat, sub, `tool-${toolCat}`],
    );
    const tools = [randomUUID(), randomUUID()];
    for (const [index, id] of tools.entries()) {
      await db.query(
        "INSERT INTO public.content_items(id,author_id,kind,title,media_path,moderation_status) VALUES($1,$2,'ai_tool','Tool fixture',$3,'approved')",
        [id, fixtureAuthors[index], `${id}.jpg`],
      );
      await db.query("INSERT INTO public.content_categories VALUES($1,$2,'approved')", [
        id,
        toolCat,
      ]);
      await db.query('INSERT INTO public.content_metadata VALUES($1,$2,$3,$4)', [
        id,
        toolCat,
        `Tool QA ${index}`,
        'https://example.com/tool',
      ]);
    }
    assert.equal(
      (
        await call(B, 'vote_intent', {
          categoryId: toolCat,
          contentId: tools[0],
          clientOperationId: randomUUID(),
        })
      ).kind,
      'INITIAL_VOTE',
    );
    const intent = await call(B, 'vote_intent', {
      categoryId: toolCat,
      contentId: tools[1],
      clientOperationId: randomUUID(),
    });
    assert.equal(intent.kind, 'TILT_REQUIRED');
    const resolved = await call(B, 'resolve_tilt', {
      duelId: intent.duelId,
      winnerSide: 'CHALLENGER',
      clientOperationId: randomUUID(),
    });
    assert.equal(resolved.championContentId, tools[1]);
    assert.equal(resolved.rated, true);
  });
  await check(
    'Moderazione ripristino idempotente e sospensione atomica con revoca sessioni',
    async () => {
      const E = await account();
      const leaf = randomUUID();
      await db.query(
        "INSERT INTO public.categories(id,parent_id,depth,slug,title) VALUES($1,$2,4,$3,'Sospensione QA')",
        [leaf, sub, `susp-${leaf}`],
      );
      const ids = [randomUUID(), randomUUID()];
      for (const id of ids) {
        await db.query(
          "INSERT INTO public.content_items(id,author_id,kind,title,media_path,moderation_status) VALUES($1,$2,'illustration','Sospensione fixture',$3,'approved')",
          [id, E.user.id, `${id}.jpg`],
        );
        await db.query("INSERT INTO public.content_categories VALUES($1,$2,'approved')", [
          id,
          leaf,
        ]);
        await db.query("INSERT INTO public.content_metadata VALUES($1,$2,'Nome QA',NULL)", [
          id,
          leaf,
        ]);
      }
      await call(B, 'vote_intent', {
        categoryId: leaf,
        contentId: ids[0],
        clientOperationId: randomUUID(),
      });
      await call(B, 'vote_intent', {
        categoryId: leaf,
        contentId: ids[1],
        clientOperationId: randomUUID(),
      });
      await call(E, 'vote_intent', {
        categoryId: cat,
        contentId: content[2],
        clientOperationId: randomUUID(),
      });
      await fails(A, 'suspend_user', { userId: E.user.id, suspended: true, reason: 'QA valido' }, [
        'FORBIDDEN',
      ]);
      await fails(M, 'suspend_user', { userId: M.user.id, suspended: true, reason: 'QA valido' }, [
        'FORBIDDEN',
      ]);
      const suspend = { userId: E.user.id, suspended: true, reason: 'QA sospensione' };
      await call(M, 'suspend_user', suspend);
      await call(M, 'suspend_user', suspend);
      await fails(E, 'me', {}, ['AUTH_REQUIRED']);
      assert.equal(
        (
          await db.query(
            'SELECT count(*)::int n FROM public.vote_slots WHERE (user_id=$1 OR champion_content_id=ANY($2::uuid[])) AND champion_content_id IS NOT NULL',
            [E.user.id, ids],
          )
        ).rows[0].n,
        0,
      );
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int n FROM public.tilt_duels WHERE challenger_id=$1 AND status='pending'",
            [ids[1]],
          )
        ).rows[0].n,
        0,
      );
      await fails(B, 'content', { contentId: ids[0], categoryId: leaf }, ['CONTENT_UNAVAILABLE']);
      await call(M, 'suspend_user', { ...suspend, suspended: false });
      assert.equal((await call(B, 'content', { contentId: ids[0], categoryId: leaf })).id, ids[0]);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int n FROM public.moderation_actions WHERE target_id=$1 AND action='suspend_user'",
            [E.user.id],
          )
        ).rows[0].n,
        1,
      );
      const hide = { contentId: ids[0], decision: 'hidden', reason: 'QA hide' };
      await call(M, 'moderate', hide);
      assert.ok(
        (await call(M, 'moderation', { status: 'hidden' })).contents.some(
          (x: any) => x.id === ids[0],
        ),
      );
      const restore = { ...hide, decision: 'approved' };
      await call(M, 'moderate', restore);
      await call(M, 'moderate', restore);
      assert.equal(
        (
          await db.query(
            "SELECT count(*)::int n FROM public.moderation_actions WHERE target_id=$1 AND action='approved'",
            [ids[0]],
          )
        ).rows[0].n,
        1,
      );
    },
  );
  await check('Daily UTC stabile e pagine feed senza ripetere coppie', async () => {
    const daily = await call(A, 'daily');
    assert.deepEqual(await call(B, 'daily'), daily);
    assert.deepEqual(await call(null, 'daily'), daily);
    assert.equal(daily.dateUtc, new Date().toISOString().slice(0, 10));
    const first = await call(B, 'feed', { seed: 'paging-qa', limit: 12 });
    const second = await call(B, 'feed', {
      seed: 'paging-qa',
      limit: 12,
      offset: first.nextOffset,
    });
    const pairs = [...first.items, ...second.items].map((x: any) => x.id + ':' + x.categoryId);
    assert.equal(new Set(pairs).size, pairs.length);
  });
  await check('Ranking supporti attivi, Elo distinto e trend da snapshot reale', async () => {
    const leaf = randomUUID(),
      ids = [randomUUID(), randomUUID()];
    await db.query(
      "INSERT INTO public.categories(id,parent_id,depth,slug,title) VALUES($1,$2,4,$3,'Ranking QA')",
      [leaf, sub, `rank-${leaf}`],
    );
    for (const [index, id] of ids.entries()) {
      await db.query(
        "INSERT INTO public.content_items(id,author_id,kind,title,media_path,moderation_status) VALUES($1,$2,'illustration','Ranking fixture',$3,'approved')",
        [id, fixtureAuthors[index], `${id}.jpg`],
      );
      await db.query("INSERT INTO public.content_categories VALUES($1,$2,'approved')", [id, leaf]);
      await db.query("INSERT INTO public.content_metadata VALUES($1,$2,'Nome ranking',NULL)", [
        id,
        leaf,
      ]);
    }
    for (const user of [A, B])
      await call(user, 'vote_intent', {
        categoryId: leaf,
        contentId: ids[0],
        clientOperationId: randomUUID(),
      });
    const pending = await call(B, 'vote_intent', {
      categoryId: leaf,
      contentId: ids[1],
      clientOperationId: randomUUID(),
    });
    await call(B, 'resolve_tilt', {
      duelId: pending.duelId,
      winnerSide: 'CHALLENGER',
      clientOperationId: randomUUID(),
    });
    const popular = await call(B, 'ranking', { categoryId: leaf, metric: 'popular' });
    assert.ok(popular.items.every((x: any) => x.support === 1));
    const elo = await call(B, 'ranking', { categoryId: leaf, metric: 'elo' });
    assert.equal(elo.items[0].id, ids[1]);
    assert.ok(elo.items[0].rating > 1500);
    assert.equal(
      (await call(B, 'ranking', { categoryId: leaf, metric: 'trend' })).insufficientHistory,
      true,
    );
    await db.query(
      "INSERT INTO public.creator_ranking_snapshots VALUES((now() AT TIME ZONE 'UTC')::date-7,$1,$2,0),((now() AT TIME ZONE 'UTC')::date-7,$1,$3,2)",
      [leaf, ...fixtureAuthors.slice(0, 2)],
    );
    const trend = await call(B, 'ranking', { categoryId: leaf, metric: 'trend' });
    assert.equal(trend.insufficientHistory, false);
    assert.equal(trend.items[0].id, ids[0]);
    assert.equal(trend.items[0].trend, 1);
    assert.equal(trend.items[1].trend, -1);
  });
  await check(
    'Proposte successive separate: creazione pubblica disattivata anche per moderatore',
    async () => {
      const p = {
        parentId: sub,
        title: 'Nuovo argomento',
        description: 'Una proposta editoriale di test sufficientemente lunga.',
        examples: [],
      };
      await fails(A, 'suggest_category', p, ['EDITORIAL_CATALOG_ONLY']);
      await fails(
        M,
        'moderate_suggestion',
        { suggestionId: randomUUID(), decision: 'approved', reason: 'Test editoriale' },
        ['EDITORIAL_CATALOG_ONLY'],
      );
    },
  );
  await check('Notifiche lette/eliminate solo dal destinatario', async () => {
    const id = randomUUID();
    await db.query(
      "INSERT INTO public.notifications(id,recipient_id,type,title) VALUES($1,$2,'welcome','QA notifiche')",
      [id, A.user.id],
    );
    await call(B, 'mark_notification', { notificationId: id });
    assert.equal(
      (await db.query('SELECT read_at FROM public.notifications WHERE id=$1', [id])).rows[0]
        .read_at,
      null,
    );
    await call(A, 'mark_notification', { notificationId: id });
    assert.ok(
      (await db.query('SELECT read_at FROM public.notifications WHERE id=$1', [id])).rows[0]
        .read_at,
    );
    await call(B, 'delete_notification', { notificationId: id });
    assert.equal(
      (await db.query('SELECT 1 FROM public.notifications WHERE id=$1', [id])).rowCount,
      1,
    );
    await call(A, 'delete_notification', { notificationId: id });
    assert.equal(
      (await db.query('SELECT 1 FROM public.notifications WHERE id=$1', [id])).rowCount,
      0,
    );
  });
  await check('Sospensione vince contro voto e impostazioni gia in attesa del lock', async () => {
    for (const action of ['vote_intent', 'settings']) {
      const user = await account();
      await db.query('BEGIN');
      let pending: ReturnType<typeof http> | undefined;
      try {
        await db.query('SELECT pg_advisory_xact_lock(8815001)');
        await db.query("SELECT set_config('app.user_id',$1,true)", [M.user.id]);
        await db.query("SELECT api.dispatch('suspend_user',$1::jsonb)", [
          JSON.stringify({
            userId: user.user.id,
            suspended: true,
            reason: 'Barriera QA concorrenza',
          }),
        ]);
        pending = http(
          '/rpc/' + action,
          action === 'vote_intent' ? input(content[2]) : { haptics: false },
          user.token,
        );
        let waiting = false;
        for (let i = 0; i < 100 && !waiting; i++) {
          await db.query('SELECT pg_stat_clear_snapshot()');
          waiting =
            Number(
              (
                await db.query(
                  "SELECT count(*) n FROM pg_stat_activity WHERE datname=current_database() AND wait_event='advisory' AND query LIKE '%api.dispatch%'",
                )
              ).rows[0].n,
            ) > 0;
          if (!waiting) await new Promise((r) => setTimeout(r, 10));
        }
        assert.ok(waiting, 'Richiesta HTTP non giunta alla barriera');
        await db.query('COMMIT');
        const response = await pending;
        assert.equal(response.status, 401);
        assert.equal(response.data.code, 'AUTH_REQUIRED');
        assert.equal(
          (
            await db.query(
              'SELECT count(*)::int n FROM public.vote_slots WHERE user_id=$1 AND champion_content_id IS NOT NULL',
              [user.user.id],
            )
          ).rows[0].n,
          0,
        );
        assert.equal(
          (
            await db.query('SELECT haptics FROM public.profile_settings WHERE user_id=$1', [
              user.user.id,
            ])
          ).rows[0].haptics,
          true,
        );
      } finally {
        await db.query('ROLLBACK');
        if (pending) await pending;
      }
    }
  });
  await check(
    'Upload con commit riuscito ma conferma persa conserva media e ricevuta',
    async () => {
      const metadata = {
        clientOperationId: randomUUID(),
        title: 'Commit incerto QA',
        caption: 'Fixture isolata',
        kind: 'illustration',
        provenance: 'original_illustration',
        categoryIds: [cat],
        rights: true,
        adultConsent: true,
        metadata: { [cat]: { name: 'Riferimento QA' } },
      };
      const image = await sharp({
        create: { width: 32, height: 32, channels: 3, background: '#22D3EE' },
      })
        .png()
        .toBuffer();
      const send = async () => {
        const body = new FormData();
        body.append('metadata', JSON.stringify(metadata));
        body.append(
          'image',
          new Blob([new Uint8Array(image)], { type: 'image/png' }),
          'fixture.png',
        );
        const r = await fetch(base + '/uploads', {
          method: 'POST',
          headers: { Authorization: `Bearer ${A.token}` },
          body,
        });
        return { status: r.status, data: await r.json() };
      };
      failAfterUploadCommit = true;
      assert.equal((await send()).status, 500);
      const receipt = (
        await db.query(
          "SELECT result_json FROM public.operation_receipts WHERE user_id=$1 AND operation_id=$2 AND action='upload'",
          [A.user.id, metadata.clientOperationId],
        )
      ).rows[0].result_json;
      const retry = await send();
      assert.equal(retry.status, 200);
      assert.deepEqual(retry.data, receipt);
      const media = await fetch(base + '/media/' + receipt.id, {
        headers: { Authorization: `Bearer ${A.token}` },
      });
      assert.equal(media.status, 200);
      assert.ok((await media.arrayBuffer()).byteLength > 0);
      const cid = randomUUID(),
        filename = `${cid}.jpg`;
      await db.query('BEGIN');
      let checking: Promise<pg.QueryResult<{ referenced: boolean }>> | undefined;
      try {
        await db.query("SELECT set_config('app.user_id',$1,true)", [A.user.id]);
        await db.query('SELECT api.upload_receipt($1::jsonb)', [
          JSON.stringify({
            ...metadata,
            clientOperationId: randomUUID(),
            id: cid,
            filename,
            size: image.length,
            width: 32,
            height: 32,
            mediaHash: 'barrier-fixture',
          }),
        ]);
        const { pool } = await import('../../server/db.ts');
        checking = pool.query('SELECT api.media_referenced($1) referenced', [filename]);
        let waiting = false;
        for (let i = 0; i < 100 && !waiting; i++) {
          await db.query('SELECT pg_stat_clear_snapshot()');
          waiting =
            Number(
              (
                await db.query(
                  "SELECT count(*) n FROM pg_stat_activity WHERE datname=current_database() AND wait_event='advisory' AND query LIKE '%api.media_referenced%'",
                )
              ).rows[0].n,
            ) > 0;
          if (!waiting) await new Promise((r) => setTimeout(r, 10));
        }
        assert.ok(waiting, 'Controllo indipendente deve attendere commit originale');
        await db.query('COMMIT');
        assert.equal((await checking).rows[0].referenced, true);
      } finally {
        await db.query('ROLLBACK');
        if (checking) await checking;
      }
    },
  );
  await check('Rate limit login reale: trentunesimo tentativo respinto', async () => {
    for (let i = 0; i < 31; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/auth/login',
        remoteAddress: '198.18.0.1',
        payload: { email: 'rate-fixture@votilt.test', password: 'FixtureNoAccount' },
      });
      assert.equal(r.statusCode, i < 30 ? 401 : 429);
    }
  });
  await check('Logout reale revoca il solo token corrente e resta idempotente', async () => {
    const email = (
      await db.query('SELECT email FROM private.credentials WHERE user_id=$1', [A.user.id])
    ).rows[0].email;
    const auth = await http('/auth/login', { email, password });
    assert.equal(auth.status, 200);
    const second = auth.data.token;
    assert.equal((await http('/auth/logout', {}, second)).status, 200);
    assert.equal((await http('/rpc/me', {}, second)).status, 401);
    assert.equal((await http('/auth/logout', {}, second)).status, 200);
    assert.equal((await call(A, 'me')).id, A.user.id);
  });
  await check(
    'Anteprime dei primi posti, ricerca foglia/percorso, spareggi e privacy',
    async () => {
      const a = randomUUID(),
        b = randomUUID(),
        ids = [randomUUID(), randomUUID()];
      for (const [id, title] of [
        [a, 'UX categoria votata'],
        [b, 'UX categoria vuota'],
      ])
        await db.query(
          'INSERT INTO public.categories(id,parent_id,depth,slug,title) VALUES($1,$2,4,$3,$4)',
          [id, sub, 'ux-' + id, title],
        );
      for (const [i, id] of ids.entries()) {
        await db.query(
          "INSERT INTO public.content_items(id,author_id,kind,title,media_path,moderation_status) VALUES($1,$2,'illustration','UX immagine',$3,'approved')",
          [id, fixtureAuthors[i], id + '.jpg'],
        );
        await db.query("INSERT INTO public.content_categories VALUES($1,$2,'approved')", [id, a]);
        await db.query('INSERT INTO public.content_metadata VALUES($1,$2,$3,NULL)', [
          id,
          a,
          i ? 'Beta needle' : 'Alpha favorito',
        ]);
      }
      for (const u of [A, B])
        await call(u, 'vote_intent', {
          categoryId: a,
          contentId: ids[0],
          clientOperationId: randomUUID(),
        });
      await call(M, 'vote_intent', {
        categoryId: a,
        contentId: ids[1],
        clientOperationId: randomUUID(),
      });
      const all = await call(B, 'category_rankings', { query: 'UX categoria' });
      const active = all.find((x: any) => x.id === a),
        empty = all.find((x: any) => x.id === b);
      assert.equal(active.voteCount, 3);
      assert.equal(active.contentCount, 2);
      assert.equal(empty.voteCount, 0);
      assert.equal(empty.leader, null);
      assert.equal(active.path.length, 4);
      assert.equal(active.path.at(-1), 'UX categoria votata');
      assert.equal(active.leader.id, ids[0]);
      assert.equal(active.leader.support, 2);
      assert.equal(active.leader.position, 1);
      const canonical = await call(B, 'ranking', { categoryId: a, metric: 'popular' });
      assert.deepEqual(active.leader, canonical.items[0]);
      const byPath = await call(B, 'category_rankings', { query: 'isolata UX' });
      assert.ok(byPath.some((x: any) => x.id === a));
      assert.ok(byPath.some((x: any) => x.id === b));
      assert.ok(byPath.every((x: any) => x.path.length === 4));
      assert.ok(all.indexOf(active) < all.indexOf(empty));
      const scoped = await call(B, 'search', { categoryId: a, query: 'needle' });
      assert.equal(scoped.length, 1);
      assert.equal(scoped[0].id, ids[1]);
      assert.equal((await call(B, 'search', { categoryId: b, query: 'needle' })).length, 0);
      const filtered = await call(B, 'ranking', {
        categoryId: a,
        metric: 'popular',
        query: 'needle',
      });
      assert.equal(filtered.items.length, 1);
      assert.equal(filtered.items[0].position, 2);
      assert.equal(filtered.items[0].support, 1);
      const viewer = await account();
      await call(viewer, 'vote_intent', {
        categoryId: a,
        contentId: ids[1],
        clientOperationId: randomUUID(),
      });
      await db.query(
        'INSERT INTO public.duel_ratings(category_id,content_id,matches,wins) VALUES($1,$2,7,7) ON CONFLICT(category_id,content_id) DO UPDATE SET matches=7,wins=7,losses=0',
        [a, ids[1]],
      );
      const tie = (await call(B, 'category_rankings', { query: 'UX categoria votata' })).find(
        (x: any) => x.id === a,
      );
      assert.ok(ids.includes(tie.leader.id));
      assert.ok(
        (await call(B, 'ranking', { categoryId: a, metric: 'popular' })).items.every(
          (x: any) => x.position === 1,
        ),
      );
      assert.deepEqual(
        tie.leader,
        (await call(B, 'ranking', { categoryId: a, metric: 'popular' })).items[0],
      );
      await db.query(
        "UPDATE public.content_categories SET status='pending' WHERE category_id=$1 AND content_id=$2",
        [a, ids[1]],
      );
      const approvedOnly = (
        await call(B, 'category_rankings', { query: 'UX categoria votata' })
      ).find((x: any) => x.id === a);
      assert.equal(approvedOnly.leader.id, ids[0]);
      assert.equal(approvedOnly.contentCount, 1);
      await db.query(
        "UPDATE public.content_categories SET status='approved' WHERE category_id=$1 AND content_id=$2",
        [a, ids[1]],
      );
      await call(viewer, 'block', { userId: M.user.id });
      await call(viewer, 'block', { userId: A.user.id });
      const blocked = (
        await call(viewer, 'category_rankings', { query: 'UX categoria votata' })
      ).find((x: any) => x.id === a);
      assert.equal(blocked.leader, null);
      assert.equal(blocked.contentCount, 0);
      assert.equal(blocked.voteCount, 0);
    },
  );
  await check('Catalogo pubblicato mantiene percorsi e nodi intermedi selezionabili', async () => {
    const categories = await call(B, 'categories');
    const middle = categories.find((x: any) => x.title === 'Giardinaggio');
    assert.ok(middle && !middle.terminal && middle.path.includes('Casa e giardino'));
    const fps = await call(B, 'category_rankings', { query: 'sparatutto in prima persona' });
    assert.ok(fps.some((x: any) => x.title === 'FPS tattici'));
  });
} finally {
  mkdirSync('docs/evidence', { recursive: true });
  writeFileSync(
    'docs/evidence/integration-results.json',
    JSON.stringify({ date: new Date().toISOString(), database: 'votilt_test', results }, null, 2),
  );
  await db.end();
  await app.close();
}
const failed = results.filter((x) => x.status === 'FAIL');
console.log(`Integration: ${results.length - failed.length} PASS / ${failed.length} FAIL`);
process.exitCode = failed.length ? 1 : 0;
