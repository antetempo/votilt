import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
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

const results = [];
const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'))[0];
let token;
async function rpc(action, input = {}) {
  const response = await fetch('http://127.0.0.1:4317/rpc/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(input),
  });
  assert.ok(response.ok, 'RPC ' + action);
  return response.json();
}
function checkBar() {
  const nodes = hierarchy();
  for (const label of ['Feed', 'Esplora', 'Pubblica la tua immagine', 'Classifiche', 'Profilo'])
    assert.equal(
      nodes.filter((node) => node['content-desc'] === label).length,
      1,
      'Exactly one ' + label + ' navigation control',
    );
}
async function openLeaf(category) {
  await deepLink('category/' + category.id);
  await waitFor('Cerca in questa categoria');
  await waitFor('Duelli');
}
try {
  prepareLiveHierarchy();
  setHierarchyReader(liveHierarchyXml);
  await deepLink('login');
  await waitFor('Bentornato');
  await fill('Email', credentials.email);
  await fill('Password', credentials.password);
  await tap('Accedi');
  await waitFor('Per te');
  const auth = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then((r) => r.json());
  assert.ok(auth.token);
  token = auth.token;
  const categories = await rpc('categories');
  const category = categories.find((item) => item.title === 'Sguardi dolci');
  assert.ok(category);
  const ranking = await rpc('ranking', { categoryId: category.id, metric: 'popular' });
  assert.ok(ranking.items.length >= 3);
  await openLeaf(category);
  const texts = hierarchy().map((node) => node.text);
  assert.ok(
    !texts.includes('Immagini') && !texts.includes('Classifica') && !texts.includes('Immagine'),
  );
  checkBar();
  screenshot('60-direct-category-ranking');
  results.push({
    flow: 'Categoria apre direttamente la classifica, senza pulsanti Immagini/Classifica, con barra persistente',
    status: 'PASS',
  });
  const selected = ranking.items[1];
  await tap(selected.position + '. ' + selected.title);
  await waitFor('Dettaglio ' + selected.title);
  checkBar();
  assert.ok(
    !hierarchy().some((node) => ['Mi piace', 'Condividi', 'Segnala contenuto'].includes(node.text)),
  );
  screenshot('61-ranked-image-scroll');
  results.push({
    flow: 'Tocco del secondo risultato apre il feed sulla stessa immagine con soli controlli originali',
    status: 'PASS',
  });
  command(['shell', 'input', 'swipe', '540', '1600', '540', '500', '350']);
  await waitFor('Dettaglio ' + ranking.items[2].title);
  checkBar();
  results.push({
    flow: 'Swipe verticale continua nell’ordine canonico della classifica',
    status: 'PASS',
  });
  await tap('Condividi');
  await pause(700);
  const activities = command(['shell', 'dumpsys', 'activity', 'activities']);
  assert.ok(/ChooserActivity|ResolverActivity/.test(activities), 'Native sharing opens');
  screenshot('62-original-share-control');
  command(['shell', 'input', 'keyevent', '4']);
  await pause(500);
  results.push({
    flow: 'Il simbolo originale di condivisione apre la condivisione nativa',
    status: 'PASS',
  });
  await tap('Altre opzioni');
  if (ranking.items[2].authorId === auth.user.id) await tap('Segnala contenuto');
  await waitFor('Aiutaci a prendercene cura.');
  checkBar();
  screenshot('63-report-with-navigation');
  await tap('Feed');
  await waitFor('Per te');
  checkBar();
  results.push({
    flow: 'Segnalazione raggiungibile dalle opzioni; barra disponibile e ritorno diretto al Feed senza inviare report',
    status: 'PASS',
  });
  await tap('Profilo');
  await scrollTo('Gestisci visibilità');
  await tap('Gestisci visibilità');
  await waitFor('Impostazioni');
  checkBar();
  screenshot('64-settings-with-navigation');
  await tap('Classifiche');
  await waitFor('Cerca una categoria');
  results.push({
    flow: 'Barra persistente anche nelle impostazioni esterne alle tab',
    status: 'PASS',
  });
  const before = (await rpc('champions')).find((item) => item.categoryId === category.id);
  assert.ok(before, 'Existing demo champion required for non-destructive TILT test');
  const challenger = ranking.items.find((item) => item.id !== before.id);
  await deepLink('content/' + challenger.id + '?categoryId=' + category.id);
  await waitFor('Dettaglio ' + challenger.title);
  await tap('Mi piace');
  await waitFor('TILT');
  await waitFor('Scegli ' + challenger.title);
  checkBar();
  screenshot('65-tilt-with-navigation');
  await tap('Classifiche');
  await waitFor('Cerca una categoria');
  assert.equal(
    (await rpc('champions')).find((item) => item.categoryId === category.id).id,
    before.id,
  );
  const history = await rpc('history');
  assert.ok(
    history.some((item) => item.category_id === category.id && item.status === 'cancelled'),
  );
  results.push({
    flow: 'Like sul cuore apre il TILT reale; cambio tab lo annulla senza cambiare il campione',
    status: 'PASS',
  });
  command(['shell', 'wm', 'size', '840x1496']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', '1.3']);
  await pause(1200);
  await openLeaf(category);
  checkBar();
  screenshot('66-category-small-font130');
  await deepLink('content/' + selected.id + '?categoryId=' + category.id);
  await waitFor('Dettaglio ' + selected.title);
  checkBar();
  screenshot('67-scroll-small-font130');
  results.push({
    flow: 'Classifica e scorrimento con barra e controlli accessibili a 320 dp/font 130%',
    status: 'PASS',
  });
} catch (error) {
  screenshot('navigation-failure');
  results.push({ flow: 'Navigazione e scorrimento', status: 'FAIL', detail: error.message });
  process.exitCode = 1;
} finally {
  command(['shell', 'wm', 'size', 'reset']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', '1.0']);
  await pause(900);
  await deepLink('rankings');
  writeFileSync(
    'docs/evidence/android-navigation-results.json',
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2) + '\n',
  );
  console.log(results);
}
