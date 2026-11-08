import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import {
  deepLink,
  tap,
  fill,
  scrollTo,
  waitFor,
  screenshot,
  pause,
  hierarchy,
} from './android-driver.mjs';
const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'));
let token;
const results = [];
async function login(i) {
  const r = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials[i]),
  });
  assert.equal(r.status, 200);
  const data = await r.json();
  token = data.token;
  return data.user;
}
async function call(action, input = {}) {
  const r = await fetch(`http://127.0.0.1:4317/rpc/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.code);
  return data;
}
async function nativeLogin(i) {
  if (hierarchy().some((n) => n.text === 'Invito creato')) await tap('APRI');
  await deepLink('login');
  await waitFor('Bentornato');
  await fill('Email', credentials[i].email);
  await fill('Password', credentials[i].password);
  await tap('Accedi');
  await waitFor('Per te', 30000);
}
try {
  const friend = await login(1);
  await login(0);
  await nativeLogin(0);
  await deepLink('friends');
  await waitFor('Stesso vibe?');
  await fill('Cerca un utente', 'milo');
  await tap('Confronta i gusti');
  await scrollTo('Taste Match');
  const match = await call('taste_match', { userId: friend.id });
  assert.ok(match.common >= 3);
  await scrollTo('categorie in comune');
  screenshot('17-taste-match');
  results.push({
    flow: 'Taste Match Android con denominatore verificato dal server',
    status: 'PASS',
    common: match.common,
    same: match.same,
    percentage: match.percentage,
  });
  const champ = (await call('champions'))[0];
  await scrollTo(champ.categoryTitle);
  await tap(champ.categoryTitle);
  await scrollTo('Crea Friends Battle');
  await tap('Crea Friends Battle');
  await waitFor('Invito creato');
  await tap('Apri');
  await waitFor('Due gusti. Un TILT.');
  screenshot('18-friends-battle-creator');
  await login(1);
  const notes = await call('notifications');
  const invite = notes.find((x) => x.type === 'battle');
  assert.ok(invite);
  const battle = await call('battle', { battleId: invite.entity_id });
  assert.equal(battle.categoryId, champ.categoryId);
  await nativeLogin(1);
  await deepLink(`battle/${invite.entity_id}`);
  await waitFor('Due gusti. Un TILT.');
  screenshot('19-friends-battle-recipient');
  results.push({ flow: 'Friends Battle creata e aperta dai due amici da Android', status: 'PASS' });
  await deepLink('notifications');
  await waitFor('Cosa si muove?');
  await tap('Segna tutte come lette');
  await pause(500);
  assert.ok((await call('notifications')).every((x) => x.read_at));
  screenshot('20-notifications');
  results.push({ flow: 'Notifiche reali, invito ricevuto e lettura persistente', status: 'PASS' });
} catch (e) {
  results.push({ flow: 'Social Android', status: 'FAIL', detail: e.message });
  try {
    screenshot('social-failure');
    console.log(
      hierarchy()
        .map((n) => n['content-desc'] || n.text)
        .filter(Boolean)
        .slice(0, 25)
        .join('\n'),
    );
  } catch {}
  process.exitCode = 1;
}
writeFileSync(
  'docs/evidence/android-social-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
console.log(results);
