import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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
const creds = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'));
const results = [];
let token;
async function hostLogin(i) {
  const res = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds[i]),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  token = data.token;
  return data.user;
}
async function call(action, p = {}) {
  const res = await fetch(`http://127.0.0.1:4317/rpc/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(p),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.code);
  return data;
}
async function nativeLogin(i) {
  if (hierarchy().some((n) => (n.text || '').includes('Proposta inviata'))) await tap('OK');
  await deepLink('login');
  await waitFor('Bentornato');
  await fill('Email', creds[i].email);
  await fill('Password', creds[i].password);
  await tap('Accedi');
  await waitFor('Per te', 30000);
}
try {
  await hostLogin(5);
  const queue = await call('moderation');
  const pending = queue.contents.find((x) => x.title === 'VotiltQAMetadati');
  const previous = existsSync('.local/android-qa.json')
    ? JSON.parse(readFileSync('.local/android-qa.json', 'utf8'))
    : null;
  const content = pending || previous;
  assert.ok(content, 'Caricare prima VotiltQAMetadati dalla UI Android');
  writeFileSync('.local/android-qa.json', JSON.stringify(content));
  await nativeLogin(5);
  await deepLink('moderation');
  await waitFor('Prendiamocene cura.');
  if (pending) {
    await fill('Cerca nella coda', 'VotiltQAMetadati');
    await fill('Motivazione della decisione', 'VerificaQA');
    await scrollTo('Approva');
    screenshot('14-moderation-metadata');
    await tap('Approva');
    await pause(1000);
  }
  const approved = await call('content', { contentId: content.id });
  assert.equal(approved.status, 'approved');
  assert.equal(approved.reference.name, 'VotiltQAMetadati');
  results.push({ flow: 'Moderatore approva dalla UI con metadati visibili', status: 'PASS' });
  await nativeLogin(1);
  await hostLogin(1);
  await deepLink(`content/${content.id}?categoryId=${approved.categoryId}`);
  await waitFor('VotiltQAMetadati');
  await scrollTo('Scegli o sfida');
  screenshot('15-upload-approved-other-user');
  await tap('Scegli o sfida');
  try {
    await waitFor('Uno solo resta', 4000);
    await tap('Scelgo lui');
    await waitFor('Nuovo campione incoronato');
    screenshot('16-upload-champion');
    await tap('OK');
  } catch (error) {
    if (!String(error.message).includes('did not show')) throw error;
    await waitFor('campione', 4000);
    await tap('OK');
  }
  const champions = await call('champions');
  assert.equal(champions.find((x) => x.categoryId === approved.categoryId)?.id, content.id);
  results.push({
    flow: 'Secondo utente vede e vota contenuto approvato da Android',
    status: 'PASS',
  });
} catch (error) {
  results.push({ flow: 'Creator/moderazione Android', status: 'FAIL', detail: error.message });
  try {
    screenshot('creator-failure');
  } catch {}
  process.exitCode = 1;
}
writeFileSync(
  'docs/evidence/android-creator-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
console.log(
  results.map((x) => `${x.status} ${x.flow}${x.detail ? ' · ' + x.detail : ''}`).join('\n'),
);
