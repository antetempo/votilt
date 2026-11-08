import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
export const adb = process.env.ANDROID_HOME
  ? `${process.env.ANDROID_HOME}/platform-tools/adb.exe`
  : `${process.env.LOCALAPPDATA}/Android/Sdk/platform-tools/adb.exe`;
export const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function command(args, binary = false) {
  const r = spawnSync(adb, args, {
    encoding: binary ? undefined : 'utf8',
    timeout: 30000,
    windowsHide: true,
    maxBuffer: 12 * 1024 * 1024,
  });
  if (r.status !== 0)
    throw new Error(`Android command failed: ${args.slice(0, 2).join(' ')} (${r.status})`);
  return r.stdout;
}
let hierarchyReader;
export function setHierarchyReader(reader) {
  hierarchyReader = reader;
}
export function hierarchy() {
  let xml;
  if (hierarchyReader) xml = hierarchyReader();
  else {
    const output = command(['shell', 'uiautomator', 'dump', '/sdcard/votilt-ui.xml']);
    if (output.includes('ERROR:'))
      throw Error('Android hierarchy is not idle; use live hierarchy reader');
    xml = command(['shell', 'cat', '/sdcard/votilt-ui.xml']);
  }
  return [...xml.matchAll(/<node\b([^>]+)>/g)].map((match) =>
    Object.fromEntries(
      [...match[1].matchAll(/([\w-]+)="([^"]*)"/g)].map((a) => [
        a[1],
        a[2].replaceAll('&amp;', '&').replaceAll('&apos;', "'").replaceAll('&quot;', '"'),
      ]),
    ),
  );
}
export async function waitFor(text, timeout = 25000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const nodes = hierarchy();
    const node =
      nodes.find((x) =>
        [x['content-desc'], x.text].some(
          (value) => value?.toLocaleLowerCase() === text.toLocaleLowerCase(),
        ),
      ) ||
      nodes.find((x) => (x['content-desc'] || '').includes(text)) ||
      nodes.find((x) => (x.text || '').includes(text));
    if (node) return node;
    await pause(600);
  }
  throw new Error(`Android UI did not show: ${text}`);
}
export async function tap(text) {
  let node = await waitFor(text);
  const deadline = Date.now() + 25000;
  while (node.enabled === 'false' && Date.now() < deadline) {
    await pause(300);
    node = await waitFor(text);
  }
  if (node.enabled === 'false') throw Error('Android control disabled: ' + text);
  const coords = node.bounds?.match(/\d+/g)?.map(Number);
  if (!coords || coords.length !== 4) throw new Error('Missing Android bounds');
  command([
    'shell',
    'input',
    'tap',
    String(Math.round((coords[0] + coords[2]) / 2)),
    String(Math.round((coords[1] + coords[3]) / 2)),
  ]);
  await pause(700);
}
export async function fill(label, value) {
  const node = hierarchy().find(
    (n) => n.class === 'android.widget.EditText' && n['content-desc'] === label,
  );
  if (!node) throw new Error(`Input Android non trovato: ${label}`);
  const p = node.bounds.match(/\d+/g).map(Number);
  command([
    'shell',
    'input',
    'tap',
    String(Math.round((p[0] + p[2]) / 2)),
    String(Math.round((p[1] + p[3]) / 2)),
  ]);
  await pause(300);
  command(['shell', 'input', 'keycombination', '113', '29']);
  command(['shell', 'input', 'keyevent', '67']);
  if (!/^[a-zA-Z0-9_@.!+, -]+$/.test(value))
    throw new Error('Test input not supported by the driver');
  command(['shell', 'input', 'text', value.replaceAll(' ', '%s')]);
  command(['shell', 'input', 'keyevent', '4']);
  await pause(350);
}
export async function scrollTo(text) {
  const display = command(['shell', 'wm', 'size']);
  const dimensions =
    display.match(/Override size: (\d+)x(\d+)/) || display.match(/Physical size: (\d+)x(\d+)/);
  if (!dimensions) throw Error('Missing Android display dimensions');
  const width = Number(dimensions[1]),
    height = Number(dimensions[2]);
  for (let i = 0; i < 5; i++) {
    try {
      return await waitFor(text, 1500);
    } catch {
      command([
        'shell',
        'input',
        'swipe',
        String(Math.round(width / 2)),
        String(Math.round(height * 0.8)),
        String(Math.round(width / 2)),
        String(Math.round(height * 0.35)),
        '350',
      ]);
      await pause(400);
    }
  }
  throw new Error(`Android UI not reachable by scroll: ${text}`);
}
export function screenshot(name) {
  mkdirSync('docs/evidence/android', { recursive: true });
  const target = `docs/evidence/android/${name}.png`;
  writeFileSync(target, command(['exec-out', 'screencap', '-p'], true));
  return target;
}
export async function deepLink(route) {
  command([
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    `votilt://${route}`,
    'com.antetempo.votilt',
  ]);
  await pause(1600);
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/scripts/android-driver.mjs')) {
  screenshot('current');
  console.log(
    hierarchy()
      .filter((x) => x.class !== 'android.widget.EditText')
      .map((x) => x['content-desc'] || x.text)
      .filter(Boolean)
      .filter((x) => !x.includes('@votilt.test'))
      .slice(0, 60)
      .join('\n'),
  );
}
