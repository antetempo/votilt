import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
let failures = 0;
const check = (name, passed, detail = '') => {
  console.log(`${passed ? 'PASS' : 'BLOCKED'} ${name}${detail ? ' · ' + detail : ''}`);
  if (!passed) failures++;
};
check('Node', Number(process.versions.node.split('.')[0]) >= 22, process.version);
check('PostgreSQL binari', existsSync('C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe'));
check('Configurazione locale VOTILT', existsSync('.local/runtime.json'), 'npm run db:init');
const sdk = process.env.ANDROID_HOME || `${process.env.LOCALAPPDATA}/Android/Sdk`;
const adb = spawnSync(`${sdk}/platform-tools/adb.exe`, ['devices'], {
  encoding: 'utf8',
  timeout: 10000,
  windowsHide: true,
});
check('Android pronto', /\tdevice\b/.test(adb.stdout || ''));
check(
  'JDK',
  existsSync(
    `${process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr'}/bin/java.exe`,
  ),
);
try {
  const r = await fetch('http://127.0.0.1:4317/health', { signal: AbortSignal.timeout(3000) });
  check('API e DB VOTILT', r.ok);
} catch {
  check('API e DB VOTILT', false, 'npm run db:start; npm run db:migrate; npm run api');
}
check(
  'Asset iniziali',
  existsSync('assets/icons/icon.png') && existsSync('assets/art/tilt-crystal.png'),
);
check('Docker', true, 'escluso, non utilizzato');
process.exitCode = failures ? 1 : 0;
