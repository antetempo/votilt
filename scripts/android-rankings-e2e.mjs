import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  command,
  deepLink,
  fill,
  hierarchy,
  pause,
  screenshot,
  tap,
  waitFor,
  setHierarchyReader,
} from './android-driver.mjs';
import { liveHierarchyXml, prepareLiveHierarchy } from './android-live-hierarchy.mjs';

const results = [];
const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'))[0];
const auth = await fetch('http://127.0.0.1:4317/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials),
}).then((r) => r.json());
assert.ok(auth.token, 'Demo authentication required');
async function rpc(action, input = {}) {
  const r = await fetch('http://127.0.0.1:4317/rpc/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + auth.token },
    body: JSON.stringify(input),
  });
  assert.ok(r.ok, 'RPC ' + action);
  return r.json();
}
const originalFont = command(['shell', 'settings', 'get', 'system', 'font_scale']).trim();
try {
  prepareLiveHierarchy();
  setHierarchyReader(liveHierarchyXml);
  await deepLink('rankings');
  await waitFor('Al primo posto');
  const cards = hierarchy().filter((n) => n['content-desc']?.startsWith('Primo posto in '));
  assert.ok(cards.length >= 1, 'Visible leader cards');
  assert.ok(!hierarchy().some((n) => n.text === 'Le categorie più votate'));
  const home = await rpc('category_rankings');
  assert.ok(home.length && home.every((x) => x.leader?.position === 1 && x.leader.support > 0));
  for (const category of home) {
    const ranking = await rpc('ranking', { categoryId: category.id, metric: 'popular' });
    assert.equal(category.leader.id, ranking.items[0].id);
  }
  await pause(900);
  screenshot('50-ranking-image-leaders');
  results.push({
    flow: 'Home con immagini realmente prime nelle singole foglie, senza classifica delle categorie',
    status: 'PASS',
    checkedLeaders: home.length,
  });
  await tap(cards[0]['content-desc']);
  await waitFor('Cerca in questa categoria');
  await waitFor('Duelli');
  results.push({
    flow: 'Tocco della carta apre la classifica della categoria con Like, Duelli e Trend',
    status: 'PASS',
  });
  await deepLink('rankings');
  await fill('Cerca una categoria', 'Sguardi');
  await waitFor('Classifica Sguardi dolci');
  await waitFor('Persone & Vibes');
  screenshot('51-ranking-leaf-search');
  await tap('Classifica Sguardi dolci');
  await waitFor('Cerca in questa categoria');
  results.push({
    flow: 'Ricerca diretta della foglia con breadcrumb e apertura senza navigare i rami',
    status: 'PASS',
  });
  await deepLink('rankings');
  await fill('Cerca una categoria', 'zzinesistenteqq');
  await waitFor('Nessuna categoria trovata.');
  results.push({ flow: 'Ricerca senza risultati esplicita', status: 'PASS' });
  command(['shell', 'wm', 'size', '840x1496']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', '1.3']);
  await pause(1300);
  await deepLink('rankings');
  // A recreated screen can retain the query. Clear it before checking the home grid.
  await fill('Cerca una categoria', ' ');
  await waitFor('Al primo posto');
  const smallCards = hierarchy().filter((n) => n['content-desc']?.startsWith('Primo posto in '));
  assert.ok(smallCards.length >= 2, 'Two leader cards fit the small display');
  const centers = smallCards.slice(0, 2).map((n) => {
    const p = n.bounds.match(/\d+/g).map(Number);
    return (p[0] + p[2]) / 2;
  });
  assert.notEqual(centers[0], centers[1], 'Grid stays in two columns on small display');
  screenshot('52-ranking-small-font130');
  results.push({
    flow: 'Due colonne e ricerca accessibile con formato piccolo/font 130%',
    status: 'PASS',
  });
} catch (error) {
  screenshot('ranking-failure');
  results.push({ flow: 'Classifiche immagini e foglie', status: 'FAIL', detail: error.message });
  process.exitCode = 1;
} finally {
  command(['shell', 'wm', 'size', 'reset']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', originalFont || '1.0']);
  await pause(1000);
  await deepLink('rankings');
  await fill('Cerca una categoria', ' ');
  await pause(500);
  writeFileSync(
    'docs/evidence/android-rankings-results.json',
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2) + '\n',
  );
  console.log(results);
}
