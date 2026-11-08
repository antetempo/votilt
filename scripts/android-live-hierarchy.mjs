import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { command } from './android-driver.mjs';

// CLI dump waits for an idle UI and fails on continuous animation. This SDK-only
// reader bypasses that wait; it does not disable motion or alter the app.
export function prepareLiveHierarchy() {
  const sdk = process.env.ANDROID_HOME || `${process.env.LOCALAPPDATA}/Android/Sdk`;
  const java = process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr';
  const dir = '.local/android-tools';
  mkdirSync(`${dir}/classes`, { recursive: true });
  mkdirSync(`${dir}/dex`, { recursive: true });
  const platform = `${sdk}/platforms/android-36`;
  const cp = [
    'android.jar',
    'uiautomator.jar',
    'optional/android.test.runner.jar',
    'optional/android.test.base.jar',
  ]
    .map((p) => `${platform}/${p}`)
    .join(';');
  function run(exe, args) {
    const r = spawnSync(exe, args, {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
      env: { ...process.env, JAVA_HOME: java },
    });
    if (r.status !== 0) throw Error(`Android hierarchy tool: ${r.stderr?.slice(-300)}`);
  }
  run(`${java}/bin/javac.exe`, [
    '--release',
    '8',
    '-cp',
    cp,
    '-d',
    `${dir}/classes`,
    'scripts/android/HierarchyDump.java',
  ]);
  const buildTools = readdirSync(`${sdk}/build-tools`)
    .filter((v) => existsSync(`${sdk}/build-tools/${v}/lib/d8.jar`))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .at(-1);
  run(`${java}/bin/java.exe`, [
    '-cp',
    `${sdk}/build-tools/${buildTools}/lib/d8.jar`,
    'com.android.tools.r8.D8',
    '--lib',
    `${platform}/android.jar`,
    '--lib',
    `${platform}/uiautomator.jar`,
    '--output',
    `${dir}/dex`,
    `${dir}/classes/com/antetempo/votilt/qa/HierarchyDump.class`,
  ]);
  run(`${java}/bin/jar.exe`, ['cf', `${dir}/votilt-qa.jar`, '-C', `${dir}/dex`, 'classes.dex']);
  command(['push', `${dir}/votilt-qa.jar`, '/data/local/tmp/votilt-qa.jar']);
}

export function liveHierarchyXml() {
  const output = command([
    'shell',
    'uiautomator',
    'runtest',
    'votilt-qa.jar',
    '/system/framework/android.test.base.jar',
    '-c',
    'com.antetempo.votilt.qa.HierarchyDump',
  ]);
  if (!output.includes('OK (1 test)') || output.includes('shortMsg='))
    throw Error('Live hierarchy reader failed');
  const xml = command(['shell', 'cat', '/data/local/tmp/local/tmp/votilt-live.xml']);
  if (!xml.startsWith('<?xml')) throw Error('Missing live hierarchy');
  return xml;
}
