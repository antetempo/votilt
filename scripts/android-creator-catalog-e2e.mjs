import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import {
  command,
  deepLink,
  fill,
  hierarchy,
  pause,
  screenshot,
  scrollTo,
  setHierarchyReader,
  tap,
  waitFor,
} from './android-driver.mjs';
import { prepareLiveHierarchy, liveHierarchyXml } from './android-live-hierarchy.mjs';

const base = 'http://127.0.0.1:4317';
const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'));
const results = [];
const originalSize = command(['shell', 'wm', 'size']).match(/Override size: (\d+x\d+)/)?.[1];
const originalFont = command(['shell', 'settings', 'get', 'system', 'font_scale']).trim();
let token, viewer, category, fixtures;
async function login(index) {
  const res = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials[index]),
  });
  assert.equal(res.status, 200);
  return res.json();
}
async function rpc(action, input = {}, as = token) {
  const res = await fetch(base + '/rpc/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + as },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  assert.equal(res.status, 200, data.code);
  return data;
}
async function check(flow, work) {
  try {
    await work();
    results.push({ flow, status: 'PASS' });
    console.log('PASS ' + flow);
  } catch (error) {
    results.push({ flow, status: 'FAIL', detail: error.message });
    throw error;
  }
}
function bar() {
  for (const label of ['Feed', 'Esplora', 'Pubblica la tua immagine', 'Classifiche', 'Profilo'])
    assert.equal(
      hierarchy().filter((node) => node['content-desc'] === label).length,
      1,
      'Barra unica: ' + label,
    );
}
async function tapSwitch(label) {
  const node = hierarchy().find(
    (node) =>
      (node.class?.includes('Switch') || node.checkable === 'true') &&
      (node['content-desc'] || '').includes(label),
  );
  assert.ok(node, 'Switch disponibile');
  const [l, t, r, b] = node.bounds.match(/\d+/g).map(Number);
  command([
    'shell',
    'input',
    'tap',
    String(Math.round((l + r) / 2)),
    String(Math.round((t + b) / 2)),
  ]);
  await pause(400);
}
async function nativeLogin() {
  await deepLink('login');
  await waitFor('Bentornato');
  await fill('Email', credentials[0].email);
  await fill('Password', credentials[0].password);
  await tap('Accedi');
  await waitFor('Per te');
}
const selected = async () =>
  (await rpc('champions')).find((item) => item.categoryId === category.id);
async function fixtureUpload(as, title) {
  const form = new FormData();
  form.append(
    'metadata',
    JSON.stringify({
      clientOperationId: randomUUID(),
      title,
      caption:
        'Fixture QA: adulto immaginario creato con AI. Fonte nel manifesto originale del progetto.',
      tags: ['ritratto', 'qa'],
      kind: 'ai_art',
      provenance: 'ai_generated',
      categoryIds: [category.id],
      rights: true,
      adultConsent: true,
      metadata: { [category.id]: { name: title } },
    }),
  );
  form.append(
    'image',
    new Blob([readFileSync('.local/qa-creator-source.jpg')], { type: 'image/jpeg' }),
    'creator-qa.jpg',
  );
  const res = await fetch(base + '/uploads', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + as },
    body: form,
  });
  const data = await res.json();
  assert.equal(res.status, 200, data.code);
  return data.id;
}
try {
  prepareLiveHierarchy();
  setHierarchyReader(liveHierarchyXml);
  command(['shell', 'input', 'keyevent', '4']);
  const auth = await login(0);
  token = auth.token;
  viewer = auth.user;
  const categories = await rpc('categories');
  category = categories.find(
    (item) => item.title === 'Ritratto' && item.path?.[0] === 'Ritratti ed espressione personale',
  );
  assert.ok(category && !category.terminal);
  const author = await login(1),
    rival = await login(2),
    mod = await login(5);
  const stored = '.local/android-creator-catalog-fixtures.json';
  if (existsSync(stored)) fixtures = JSON.parse(readFileSync(stored, 'utf8'));
  if (!fixtures || fixtures.categoryId !== category.id) {
    const one = await fixtureUpload(author.token, 'QA Creator Ritratto Uno');
    const two = await fixtureUpload(author.token, 'QA Creator Ritratto Due');
    const three = await fixtureUpload(rival.token, 'QA Creator Ritratto Tre');
    for (const id of [one, two, three])
      await rpc(
        'moderate',
        {
          contentId: id,
          decision: 'approved',
          reason: 'QA Android creator/categoria: asset AI originale dichiarato',
        },
        mod.token,
      );
    fixtures = {
      categoryId: category.id,
      one,
      two,
      three,
      authorId: author.user.id,
      rivalId: rival.user.id,
    };
    writeFileSync(stored, JSON.stringify(fixtures));
  }
  await nativeLogin();
  await check('A01 ricerca testuale e percorso completo senza selettore illustrato', async () => {
    await deepLink('explore');
    await fill('Cerca un argomento', 'bonsai');
    await waitFor('Classifica Bonsai');
    await waitFor('Casa e giardino › Giardinaggio › Bonsai');
    bar();
    screenshot('75-catalog-bonsai-text-search');
    await fill('Cerca un argomento', 'cafferacer');
    await waitFor('Classifica Café racer');
    screenshot('76-catalog-near-search');
  });
  await check('A02 categoria intermedia con classifica diretta e follow persistito', async () => {
    await deepLink('category/' + category.id);
    await waitFor('Preferenze');
    await waitFor('Preferenze dirette ai creator');
    bar();
    const before = (await rpc('categories')).find((item) => item.id === category.id).isFollowing;
    if (before) {
      await tap('Non seguire più la categoria');
      await waitFor('Segui categoria');
    }
    await deepLink('category/' + category.id);
    await tap('Segui categoria');
    await waitFor('Non seguire più la categoria');
    assert.equal(
      (await rpc('categories')).find((item) => item.id === category.id).isFollowing,
      true,
    );
    screenshot('77-intermediate-category-follow');
  });
  await check('A03 cuore elegge il creator e resta selezionato sulle sue altre foto', async () => {
    await deepLink('content/' + fixtures.one + '?categoryId=' + category.id);
    await waitFor('Dettaglio QA Creator Ritratto Uno');
    if (hierarchy().some((node) => node['content-desc'] === 'Mi piace')) {
      await tap('Mi piace');
      await pause(700);
      if (hierarchy().some((node) => node.text === 'TILT')) {
        await tap('Scegli QA Creator Ritratto Uno');
        await pause(700);
      }
      await waitFor('Ti piace');
    }
    assert.equal((await selected()).authorId, fixtures.authorId);
    await deepLink('content/' + fixtures.two + '?categoryId=' + category.id);
    await waitFor('Dettaglio QA Creator Ritratto Due');
    await waitFor('Ti piace');
    assert.ok(!hierarchy().some((node) => node.text === 'TILT'));
    assert.equal((await selected()).authorId, fixtures.authorId);
    bar();
    screenshot('78-same-creator-selected');
  });
  await check(
    'A04 creator diverso apre TILT e cambio tab annulla senza trasferimento',
    async () => {
      await deepLink('content/' + fixtures.three + '?categoryId=' + category.id);
      await waitFor('Dettaglio QA Creator Ritratto Tre');
      await tap('Mi piace');
      await waitFor('TILT');
      await waitFor('Scegli QA Creator Ritratto Tre');
      bar();
      screenshot('79-creator-tilt');
      await tap('Classifiche');
      await waitFor('Cerca una categoria');
      assert.equal((await selected()).authorId, fixtures.authorId);
    },
  );
  await check('A05 scelta nel TILT trasferisce una sola preferenza al creator', async () => {
    await deepLink('content/' + fixtures.three + '?categoryId=' + category.id);
    await waitFor('Dettaglio QA Creator Ritratto Tre');
    await tap('Mi piace');
    await waitFor('TILT');
    await tap('Scegli QA Creator Ritratto Tre');
    await pause(900);
    assert.equal((await selected()).authorId, fixtures.rivalId);
    const rows = (await rpc('ranking', { categoryId: category.id, metric: 'popular' })).items;
    assert.equal(rows.filter((row) => row.authorId === fixtures.authorId).length, 1);
    assert.equal(rows.filter((row) => row.authorId === fixtures.rivalId).length, 1);
  });
  await check('A06 follow libero del creator distinto dalla preferenza', async () => {
    const original = (await rpc('profile', { userId: fixtures.authorId })).isFollowing;
    await deepLink('person/' + fixtures.authorId);
    await waitFor(original ? 'Non seguire più' : 'Segui questo creator');
    const before = await selected();
    await tap(original ? 'Non seguire più' : 'Segui questo creator');
    await waitFor(original ? 'Segui questo creator' : 'Non seguire più');
    assert.equal((await selected()).authorId, before.authorId);
    assert.equal((await rpc('profile', { userId: fixtures.authorId })).isFollowing, !original);
    await tap(original ? 'Segui questo creator' : 'Non seguire più');
    await waitFor(original ? 'Non seguire più' : 'Segui questo creator');
  });
  await check('A07 Seguiti contiene la categoria seguita senza duplicati', async () => {
    const items = [];
    let offset = 0;
    do {
      const page = await rpc('feed', {
        mode: 'following',
        seed: 'android-category-follow',
        offset,
        limit: 15,
      });
      items.push(...page.items);
      offset = page.nextOffset;
    } while (offset !== null);
    assert.equal(new Set(items.map((item) => item.id)).size, items.length);
    for (const id of [fixtures.one, fixtures.two, fixtures.three])
      assert.ok(items.some((item) => item.id === id));
    await tap('Feed');
    await waitFor('Per te');
    await tap('Seguiti');
    bar();
    screenshot('80-following-feed');
  });
  await check(
    'A08 profilo con preferenze vere, percorso e badge di posizione corrente',
    async () => {
      const intent = await rpc(
        'vote_intent',
        { categoryId: category.id, contentId: fixtures.one, clientOperationId: randomUUID() },
        author.token,
      );
      if (intent.kind === 'TILT_REQUIRED')
        await rpc(
          'resolve_tilt',
          { duelId: intent.duelId, winnerSide: 'CHALLENGER', clientOperationId: randomUUID() },
          author.token,
        );
      await deepLink('person/' + fixtures.rivalId);
      await waitFor('preferenze ricevute');
      await scrollTo('Mostra preferenze per categoria');
      await tap('Mostra preferenze per categoria');
      await scrollTo('Filtra le categorie del creator');
      await fill('Filtra le categorie del creator', 'Ritratto');
      await waitFor('Ritratto');
      await waitFor('posizione attuale');
      bar();
      screenshot('81-creator-profile-badge');
      const profile = await rpc('profile', { userId: fixtures.rivalId });
      assert.equal(
        profile.categoryPreferences.reduce((sum, row) => sum + row.preferences, 0),
        profile.preferenceCount,
      );
    },
  );
  await check(
    'A09 upload Android: galleria, descrizione, tag e una categoria intermedia',
    async () => {
      await deepLink('create');
      await waitFor('La tua immagine');
      await tap('AI Art');
      await scrollTo('Scegli dalla galleria');
      await tap('Scegli dalla galleria');
      await pause(500);
      const photo = hierarchy().find((node) =>
        (node['content-desc'] || '').startsWith('Photo taken on Nov 8'),
      );
      assert.ok(photo);
      await tap(photo['content-desc']);
      await tap('Done');
      await waitFor('Crop');
      await tap('Crop');
      await waitFor('Scegli un’altra immagine');
      await scrollTo('Descrizione · facoltativa');
      await fill('Descrizione · facoltativa', 'Ritratto adulto immaginario per la prova Android');
      await scrollTo('Tag liberi · separati da virgole');
      await fill('Tag liberi · separati da virgole', 'ritratto, qaandroid');
      await scrollTo('Categoria unica · 0/1');
      await fill('Categoria unica · 0/1', 'Ritratto');
      const path = category.path.join(' › ');
      await scrollTo(path);
      await tap(path);
      await scrollTo('Nome del contenuto');
      await fill('Nome del contenuto', 'QA Native Ritratto');
      await scrollTo('Ho il diritto di pubblicare questo contenuto.');
      await tapSwitch('Ho il diritto di pubblicare questo contenuto.');
      await scrollTo('Le persone riconoscibili sono adulte');
      await tapSwitch('Le persone riconoscibili sono adulte');
      const submit = await scrollTo('Invia per la revisione');
      assert.notEqual(submit.enabled, 'false');
      bar();
      screenshot('82-native-upload-single-category-tags');
      await tap('Invia per la revisione');
      await waitFor('Proposta inviata');
      await tap('OK');
      await waitFor('Il tuo spazio.');
      const uploads = await rpc('my_uploads');
      const item = uploads.find((row) => row.title === 'QA Native Ritratto');
      assert.ok(item);
      assert.equal(item.categoryId, category.id);
      assert.equal(item.authorId, viewer.id);
      assert.equal(
        item.references.filter((row) => row.status === 'approved' || row.status === 'pending')
          .length,
        1,
      );
      assert.deepEqual([...item.tags].sort(), ['qaandroid', 'ritratto']);
      assert.equal(item.status, 'pending_review');
      assert.equal(item.provenance, 'ai_generated');
    },
  );
  await check(
    'A10 ricerca e categoria intermedia su schermo piccolo con caratteri 130%',
    async () => {
      command(['shell', 'wm', 'size', '840x1496']);
      command(['shell', 'settings', 'put', 'system', 'font_scale', '1.3']);
      await pause(1200);
      await deepLink('explore');
      await fill('Cerca un argomento', 'FPS tattici');
      await waitFor('Classifica FPS tattici');
      bar();
      screenshot('83-small-font130-category-path');
      await deepLink('category/' + category.id);
      await waitFor('Preferenze');
      bar();
      screenshot('84-small-font130-creator-ranking');
    },
  );
  await check('A11 proposte categorie rinviate, senza creazione pubblica automatica', async () => {
    await deepLink('suggest');
    await waitFor('Il catalogo cresce con cura.');
    bar();
    screenshot('85-future-editorial-proposals');
  });
} catch (error) {
  try {
    screenshot('creator-catalog-failure');
  } catch {}
  console.error(error.message);
  process.exitCode = 1;
} finally {
  command(['shell', 'wm', 'size', originalSize || 'reset']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', originalFont || '1.0']);
  await pause(800);
  await deepLink('rankings');
  const build = JSON.parse(readFileSync('output/build-info.json', 'utf8'));
  writeFileSync(
    'docs/evidence/android-creator-catalog-results.json',
    JSON.stringify(
      {
        date: new Date().toISOString(),
        status:
          results.length === 11 && results.every((row) => row.status === 'PASS')
            ? 'PASS'
            : 'PARTIAL',
        apkSha256: build.sha256,
        catalogVersion: '2026-11-v1',
        results,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(results);
}
