import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import {
  command,
  deepLink,
  tap,
  scrollTo,
  waitFor,
  pause,
  screenshot,
  setHierarchyReader,
} from './android-driver.mjs';
import { prepareLiveHierarchy, liveHierarchyXml } from './android-live-hierarchy.mjs';
const results = [];
const originalSize = command(['shell', 'wm', 'size']).match(/Override size: (\d+x\d+)/)?.[1];
const originalDensity = command(['shell', 'wm', 'density']).match(/Override density: (\d+)/)?.[1];
const font = command(['shell', 'settings', 'get', 'system', 'font_scale']).trim();
let token, originalSettings;
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
async function settings(reduceMotion) {
  await rpc('settings', {
    showChampions: originalSettings.show_champions,
    allowComparison: originalSettings.allow_comparison,
    haptics: originalSettings.haptics,
    reduceMotion,
  });
}
async function restart() {
  command(['shell', 'am', 'force-stop', 'com.antetempo.votilt']);
  command(['shell', 'am', 'start', '-W', '-n', 'com.antetempo.votilt/.MainActivity']);
  await waitFor('Per te');
}
try {
  prepareLiveHierarchy();
  setHierarchyReader(liveHierarchyXml);
  const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'))[0];
  const auth = await fetch('http://127.0.0.1:4317/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  }).then((r) => r.json());
  token = auth.token;
  originalSettings = auth.user.settings;
  const { categoryId, incumbent } = JSON.parse(readFileSync('.local/tilt-qa.json', 'utf8'));
  async function open() {
    await deepLink('content/' + incumbent.id + '?categoryId=' + categoryId);
    await scrollTo('Mi piace');
    await tap('Mi piace');
    await waitFor('Scegli ' + incumbent.title);
  }
  command(['shell', 'wm', 'size', '720x1280']);
  command(['shell', 'wm', 'density', '360']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', '1.3']);
  await restart();
  await open();
  for (const name of ['Annulla TILT', 'Scegli ' + incumbent.title]) {
    const node = await waitFor(name);
    const [x1, y1, x2, y2] = node.bounds.match(/\d+/g).map(Number);
    assert.ok(
      (x1 + x2) / 2 > 0 && (x1 + x2) / 2 < 720 && (y1 + y2) / 2 > 0 && (y1 + y2) / 2 < 1280,
    );
  }
  screenshot('42-tilt-small-font130');
  await tap('Annulla TILT');
  results.push({ flow: 'TILT 320x569 dp, font 130%, immagini e X raggiungibili', status: 'PASS' });
  await settings(true);
  await restart();
  await open();
  await pause(1800);
  const a = command(['exec-out', 'screencap', '-p'], true);
  await pause(1100);
  const b = command(['exec-out', 'screencap', '-p'], true);
  const area = { left: 0, top: 350, width: 720, height: 650 };
  const frames = await Promise.all([a, b].map((x) => sharp(x).extract(area).raw().toBuffer()));
  let changed = 0;
  for (let i = 0; i < frames[0].length; i++)
    if (Math.abs(frames[0][i] - frames[1][i]) > 12) changed++;
  assert.ok(changed < 1000, `Movimento ridotto non statico: ${changed}`);
  screenshot('43-tilt-reduced-motion');
  await tap('Annulla TILT');
  results.push({
    flow: 'Preferenza riduci movimento: carte statiche, scelta e annullamento disponibili',
    status: 'PASS',
    changedChannels: changed,
  });
} catch (error) {
  results.push({ flow: 'TILT accessibilita', status: 'FAIL', detail: error.message });
  try {
    screenshot('tilt-accessibility-failure');
  } catch {}
  process.exitCode = 1;
} finally {
  if (originalSettings) await settings(originalSettings.reduce_motion);
  command(['shell', 'wm', 'size', originalSize || 'reset']);
  command(['shell', 'wm', 'density', originalDensity || 'reset']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', font]);
  await restart();
}
writeFileSync(
  'docs/evidence/android-tilt-accessibility-results.json',
  JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
);
console.log(results);
