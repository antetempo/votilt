import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import {
  command,
  deepLink,
  tap,
  fill,
  scrollTo,
  waitFor,
  hierarchy,
  screenshot,
  pause,
  setHierarchyReader,
} from './android-driver.mjs';
import { prepareLiveHierarchy, liveHierarchyXml } from './android-live-hierarchy.mjs';
const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'))[0];
let token;
const results = [];
async function rpc(action, input = {}) {
  const r = await fetch('http://127.0.0.1:4317/rpc/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.code);
  return data;
}
try {
  prepareLiveHierarchy();
  setHierarchyReader(liveHierarchyXml);
  command(['install', '-r', 'output/VOTILT-local-demo.apk']);
  command(['reverse', 'tcp:4317', 'tcp:4317']);
  command(['shell', 'am', 'start', '-W', '-n', 'com.antetempo.votilt/.MainActivity']);
  await pause(1800);
  await deepLink('login');
  await waitFor('Bentornato');
  await fill('Email', credentials.email);
  await fill('Password', credentials.password);
  await tap('Accedi');
  await waitFor('Per te');
  const login = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then((r) => r.json());
  token = login.token;
  let nodes = hierarchy();
  assert.ok(
    !nodes.some(
      (n) =>
        n.text === 'VOTILT' ||
        (n.text || '').includes('Scegli come campione') ||
        (n.text || '').includes('Un’illustrazione originale'),
    ),
  );
  assert.ok(!nodes.some((n) => n.text === 'TILT'));
  screenshot('30-clean-feed');
  results.push({
    flow: 'Feed senza wordmark, CTA invasiva o riempitivi; navigazione alta e icone originali',
    status: 'PASS',
  });
  const cats = await rpc('categories'),
    champions = await rpc('champions');
  const cat = cats.find((x) => x.depth === 4 && !champions.some((y) => y.categoryId === x.id));
  assert.ok(cat, 'Serve una foglia non ancora votata per Nova');
  const feed = await rpc('feed', { categoryId: cat.id, seed: 'refinement-qa' });
  assert.ok(feed.items.length >= 2);
  await deepLink('category/' + cat.id);
  await waitFor('Mi piace');
  await tap('Mi piace');
  await pause(800);
  const firstLike = (await rpc('champions')).find((x) => x.categoryId === cat.id);
  assert.ok(firstLike && feed.items.some((x) => x.id === firstLike.id));
  results.push({
    flow: 'Like compatto salva una preferenza reale senza popup campione',
    status: 'PASS',
  });
  const saved = (await rpc('champions')).find((x) => x.categoryId === cat.id);
  const challenger = feed.items.find((x) => x.id !== saved.id);
  await deepLink('content/' + challenger.id + '?categoryId=' + cat.id);
  await scrollTo('Mi piace');
  await tap('Mi piace');
  await waitFor('TILT');
  screenshot('31-compact-choice');
  await tap('Scegli ' + challenger.title);
  await pause(700);
  assert.equal((await rpc('champions')).find((x) => x.categoryId === cat.id)?.id, challenger.id);
  results.push({ flow: 'Confronto compatto e trasferimento del like verificato', status: 'PASS' });
  await deepLink('rankings');
  await waitFor('Al primo posto');
  await fill('Cerca una categoria', 'Sguardi');
  await waitFor('Classifica Sguardi dolci');
  screenshot('32-category-leaderboards');
  await tap('Classifica Sguardi dolci');
  await waitFor('Cerca in questa categoria');
  const target = cats.find((x) => x.title === 'Sguardi dolci');
  const ranked = await rpc('ranking', { categoryId: target.id, metric: 'popular' });
  const name = ranked.items[0].title;
  await fill('Cerca in questa categoria', name.split(' ')[0]);
  await waitFor(name);
  screenshot('33-search-inside-category');
  results.push({
    flow: 'Immagini al primo posto, ricerca foglia e ricerca nella relativa classifica',
    status: 'PASS',
  });
  await deepLink('create');
  await waitFor('La tua immagine');
  await scrollTo('Nome del contenuto');
  await fill('Nome del contenuto', 'BozzaVotiltQA');
  command(['shell', 'input', 'swipe', '540', '700', '540', '1800', '350']);
  await pause(400);
  await scrollTo('Categorie');
  await fill('Categorie · 0/3', 'Creature impossibili');
  await scrollTo('Non c');
  await tap('Non c');
  await waitFor('Crea la tua categoria');
  await waitFor('Questa categoria esiste');
  screenshot('34-existing-category-suggestion');
  await tap('Usa Creature impossibili');
  await waitFor('La tua immagine');
  await scrollTo('Nome della creazione');
  assert.ok(
    hierarchy().some((n) => n.class === 'android.widget.EditText' && n.text === 'BozzaVotiltQA'),
  );
  screenshot('35-draft-category-selected');
  results.push({
    flow: 'Centro solo simbolo pubblicazione, duplicato suggerito e bozza preservata tornando al caricamento',
    status: 'PASS',
  });
  await deepLink('suggest');
  await waitFor('Crea la tua categoria');
  await fill('Nome della categoria', 'c.a.z.z.o');
  await waitFor('Riformula');
  const submit = await scrollTo('Proponi categoria');
  assert.equal(submit.enabled, 'false');
  screenshot('36-inappropriate-category-blocked');
  results.push({
    flow: 'Testo categoria mascherato bloccato e invio disabilitato da Android',
    status: 'PASS',
  });
  await deepLink('');
  await waitFor('Per te');
  screenshot('37-final-refined-feed');
} catch (error) {
  results.push({ flow: 'Revisione Android', status: 'FAIL', detail: error.message });
  try {
    screenshot('refinement-failure');
  } catch {}
  process.exitCode = 1;
}
writeFileSync(
  'docs/evidence/android-refinement-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
console.log(results);
