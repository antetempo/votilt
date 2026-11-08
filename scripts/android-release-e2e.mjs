import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import {
  adb,
  command,
  deepLink,
  waitFor,
  tap,
  fill,
  pause,
  hierarchy,
  screenshot,
} from './android-driver.mjs';
const results = [];
const settings = {
  wifi: command(['shell', 'settings', 'get', 'global', 'wifi_on']).trim(),
  data: command(['shell', 'settings', 'get', 'global', 'mobile_data']).trim(),
  font: command(['shell', 'settings', 'get', 'system', 'font_scale']).trim(),
};
const oldSize = command(['shell', 'wm', 'size']).match(/Override size: (\d+x\d+)/)?.[1];
const oldDensity = command(['shell', 'wm', 'density']).match(/Override density: (\d+)/)?.[1];
try {
  command(['install', '-r', 'output/VOTILT-local-demo.apk']);
  command(['reverse', 'tcp:4317', 'tcp:4317']);
  command(['shell', 'am', 'force-stop', 'com.antetempo.votilt']);
  command(['shell', 'am', 'start', '-W', '-n', 'com.antetempo.votilt/.MainActivity']);
  await pause(2000);
  if (
    hierarchy().some((n) => (n['content-desc'] || n.text || '').includes('Entra nel tuo universo'))
  ) {
    await tap('Entra nel tuo universo');
    const credentials = JSON.parse(readFileSync('.local/demo-credentials.json', 'utf8'))[1];
    await fill('Email', credentials.email);
    await fill('Password', credentials.password);
    await tap('Accedi');
  }
  await waitFor('Per te', 30000);
  screenshot('24-standalone-feed');
  results.push({ flow: 'APK autonomo installato e avviato senza Metro', status: 'PASS' });
  command(['shell', 'svc', 'wifi', 'disable']);
  command(['shell', 'svc', 'data', 'disable']);
  await pause(2500);
  const route = spawnSync(adb, ['shell', 'ip', 'route', 'get', '1.1.1.1'], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 10000,
  });
  assert.notEqual(route.status, 0, 'Internet pubblico ancora instradabile');
  await deepLink('explore');
  await waitFor('Trova il tuo');
  screenshot('25-no-public-internet');
  results.push({
    flow: 'Navigazione Android senza Internet pubblico, backend via USB locale',
    status: 'PASS',
    externalRoute: 'unreachable',
  });
  command(['shell', 'svc', 'wifi', settings.wifi === '1' ? 'enable' : 'disable']);
  command(['shell', 'svc', 'data', settings.data === '1' ? 'enable' : 'disable']);
  command(['shell', 'wm', 'size', '720x1280']);
  command(['shell', 'wm', 'density', '360']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', '1.3']);
  await pause(1500);
  await deepLink('');
  await waitFor('Per te');
  screenshot('26-small-large-font');
  const buttons = hierarchy().filter(
    (n) => n.clickable === 'true' && /^(Mi piace|Ti piace)$/.test(n['content-desc'] || ''),
  );
  assert.ok(buttons.length);
  assert.ok(buttons.every((n) => Number(n.bounds.match(/\d+/g)[3]) <= 1280));
  results.push({ flow: 'Formato 320x569 dp, font 130%, voto raggiungibile', status: 'PASS' });
  command(['shell', 'wm', 'size', '1080x2400']);
  command(['shell', 'wm', 'density', '420']);
  command(['shell', 'settings', 'put', 'system', 'font_scale', '1.0']);
  await pause(1000);
  await deepLink('explore');
  await waitFor('Trova il tuo');
  screenshot('27-large-explore');
  results.push({ flow: 'Formato 411x914 dp e navigazione Esplora', status: 'PASS' });
} catch (e) {
  results.push({ flow: 'Collaudo APK autonomo', status: 'FAIL', detail: e.message });
  try {
    screenshot('release-failure');
  } catch {}
  process.exitCode = 1;
} finally {
  command(['shell', 'svc', 'wifi', settings.wifi === '1' ? 'enable' : 'disable']);
  command(['shell', 'svc', 'data', settings.data === '1' ? 'enable' : 'disable']);
  command([
    'shell',
    'settings',
    'put',
    'system',
    'font_scale',
    settings.font === 'null' ? '1.0' : settings.font,
  ]);
  command(['shell', 'wm', 'size', oldSize || 'reset']);
  command(['shell', 'wm', 'density', oldDensity || 'reset']);
  writeFileSync(
    'docs/evidence/android-release-results.json',
    JSON.stringify({ date: new Date().toISOString(), results }, null, 2),
  );
  console.log(results);
}
