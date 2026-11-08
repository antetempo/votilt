import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
import {
  adb,
  command,
  deepLink,
  tap,
  scrollTo,
  waitFor,
  hierarchy,
  screenshot,
  pause,
  setHierarchyReader,
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
  const data = await response.json();
  if (!response.ok) throw Error(data.code);
  return data;
}
async function openTilt(challenger, categoryId) {
  await deepLink('content/' + challenger.id + '?categoryId=' + categoryId);
  await scrollTo('Mi piace');
  await tap('Mi piace');
  await waitFor('TILT');
  await waitFor('Scegli ' + challenger.title);
}
try {
  prepareLiveHierarchy();
  setHierarchyReader(liveHierarchyXml);
  command(['install', '-r', 'output/VOTILT-local-demo.apk']);
  command(['reverse', 'tcp:4317', 'tcp:4317']);
  command(['shell', 'am', 'force-stop', 'com.antetempo.votilt']);
  command(['shell', 'am', 'start', '-W', '-n', 'com.antetempo.votilt/.MainActivity']);
  await waitFor('Per te');
  const response = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const login = await response.json();
  assert.ok(response.ok && login.token);
  assert.equal(
    login.user.settings.reduce_motion,
    false,
    'La prova movimento richiede movimento attivo sull’account demo',
  );
  token = login.token;
  const champions = await rpc('champions');
  let incumbent, challenger;
  for (const item of champions.filter((x) => x.kind === 'ai_art')) {
    const feed = await rpc('feed', { categoryId: item.categoryId, seed: 'tilt-motion-qa' });
    const other = feed.items.find((x) => x.id !== item.id);
    if (other) {
      incumbent = item;
      challenger = other;
      break;
    }
  }
  assert.ok(incumbent && challenger);
  const categoryId = incumbent.categoryId;
  writeFileSync(
    '.local/tilt-qa.json',
    JSON.stringify({ categoryId, incumbent, challenger }, null, 2),
  );
  await openTilt(challenger, categoryId);
  const text = hierarchy()
    .map((n) => n.text || '')
    .filter(Boolean);
  assert.ok(text.includes('TILT'));
  assert.ok(
    !text.some((x) =>
      /Quale ti piace|NUOVA SCELTA|IL TUO LIKE|Tocca un|Preferisco questa|Confronto/.test(x),
    ),
  );
  screenshot('40-tilt-arena');
  results.push({
    flow: 'TILT a schermo intero, due immagini accessibili e sola scritta TILT',
    status: 'PASS',
  });
  await pause(400);
  const first = command(['exec-out', 'screencap', '-p'], true);
  await pause(1100);
  const second = command(['exec-out', 'screencap', '-p'], true);
  const meta = await sharp(first).metadata();
  const area = {
    left: 0,
    top: Math.floor(meta.height * 0.28),
    width: meta.width,
    height: Math.floor(meta.height * 0.45),
  };
  const pixels = await Promise.all(
    [first, second].map((b) => sharp(b).extract(area).raw().toBuffer()),
  );
  let changed = 0;
  for (let i = 0; i < pixels[0].length; i++)
    if (Math.abs(pixels[0][i] - pixels[1][i]) > 12) changed++;
  assert.ok(changed > 1000, 'La scena non mostra movimento tra i due fotogrammi');
  results.push({
    flow: 'Animazione nativa attiva: fotogrammi della zona carte differenti',
    status: 'PASS',
    changedChannels: changed,
  });
  await tap('Annulla TILT');
  await pause(600);
  assert.equal((await rpc('champions')).find((x) => x.categoryId === categoryId)?.id, incumbent.id);
  results.push({ flow: 'X annulla e preserva il like originale', status: 'PASS' });

  const record = spawn(
    adb,
    ['shell', 'screenrecord', '--time-limit', '14', '/sdcard/votilt-tilt.mp4'],
    { windowsHide: true, stdio: 'ignore' },
  );
  const recording = new Promise((resolve) => record.on('close', resolve));
  await openTilt(challenger, categoryId);
  screenshot('41-tilt-choice');
  await tap('Scegli ' + challenger.title);
  await pause(900);
  assert.equal(
    (await rpc('champions')).find((x) => x.categoryId === categoryId)?.id,
    challenger.id,
  );
  assert.ok(!hierarchy().some((n) => n.text === 'TILT'));
  await recording;
  command(['pull', '/sdcard/votilt-tilt.mp4', 'docs/evidence/android/tilt-motion.mp4']);
  results.push({
    flow: 'Tocco immagine, animazione di conferma e trasferimento reale del like; registrazione MP4',
    status: 'PASS',
  });

  await openTilt(incumbent, categoryId);
  command(['shell', 'input', 'keyevent', '4']);
  await pause(900);
  assert.equal(
    (await rpc('champions')).find((x) => x.categoryId === categoryId)?.id,
    challenger.id,
  );
  results.push({ flow: 'Indietro Android annulla senza trasferire la preferenza', status: 'PASS' });
  await deepLink('');
  await waitFor('Per te');
} catch (error) {
  results.push({ flow: 'TILT Android', status: 'FAIL', detail: error.message });
  try {
    screenshot('tilt-failure');
  } catch {}
  process.exitCode = 1;
}
writeFileSync(
  'docs/evidence/android-tilt-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
console.log(results);
