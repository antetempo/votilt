import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
const java = 'C:/Program Files/Android/Android Studio/jbr';
const sdk = process.env.ANDROID_HOME || `${process.env.LOCALAPPDATA}/Android/Sdk`;
if (!existsSync(`${sdk}/platform-tools/adb.exe`))
  throw new Error('Android SDK non trovato. Configura ANDROID_HOME.');
const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const prepare = spawnSync(
  executable,
  ['expo', 'prebuild', '--platform', 'android', '--no-install'],
  {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ANDROID_HOME: sdk,
      JAVA_HOME: process.env.JAVA_HOME || java,
      EXPO_NO_TELEMETRY: '1',
    },
  },
);
if (prepare.status !== 0) process.exit(prepare.status || 1);
const result = spawnSync(executable, ['expo', 'run:android', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    ANDROID_HOME: sdk,
    JAVA_HOME: process.env.JAVA_HOME || java,
    EXPO_NO_TELEMETRY: '1',
  },
});
process.exitCode = result.status || 0;
