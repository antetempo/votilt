import { spawnSync } from 'node:child_process';
import { mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const env = {
  ...process.env,
  JAVA_HOME: process.env.JAVA_HOME || 'C:/Program Files/Android/Android Studio/jbr',
  ANDROID_HOME: process.env.ANDROID_HOME || `${process.env.LOCALAPPDATA}/Android/Sdk`,
  EXPO_PUBLIC_API_URL: 'http://127.0.0.1:4317',
  EXPO_NO_TELEMETRY: '1',
};
function run(cmd, args, cwd = process.cwd()) {
  const r = spawnSync(cmd, args, {
    cwd,
    env,
    stdio: 'inherit',
    windowsHide: true,
    shell: process.platform === 'win32',
    timeout: 1200000,
  });
  if (r.status !== 0) process.exit(r.status || 1);
}
if (!process.argv.includes('--reuse-native'))
  run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install']);
run(
  '.\\gradlew.bat',
  [
    'assembleRelease',
    '-PreactNativeArchitectures=arm64-v8a,x86_64',
    '--console=plain',
    '--no-daemon',
  ],
  `${process.cwd()}/android`,
);
mkdirSync('output', { recursive: true });
const target = 'output/VOTILT-local-demo.apk';
copyFileSync('android/app/build/outputs/apk/release/app-release.apk', target);
const bytes = readFileSync(target);
writeFileSync(
  'output/build-info.json',
  JSON.stringify(
    {
      date: new Date().toISOString(),
      package: 'com.antetempo.votilt',
      version: '0.1.0',
      abis: ['arm64-v8a', 'x86_64'],
      api: 'http://127.0.0.1:4317',
      signing: 'Android debug signing for local demo only',
      size: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    null,
    2,
  ),
);
console.log(
  'PASS APK autonomo pronto in output/VOTILT-local-demo.apk; adb reverse tcp:4317 tcp:4317 per il backend locale.',
);
