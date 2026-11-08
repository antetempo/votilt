import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const local = path.join(root, '.local');
const bin = process.env.VOTILT_PG_BIN || 'C:/Program Files/PostgreSQL/18/bin';
const data = path.join(local, 'postgres');
const runtimePath = path.join(local, 'runtime.json');
const command = process.argv[2] || 'status';
mkdirSync(local, { recursive: true });
function run(name, args, options = {}) {
  const result = spawnSync(path.join(bin, `${name}.exe`), args, {
    encoding: 'utf8',
    timeout: 60000,
    windowsHide: true,
    ...options,
  });
  if (result.error) throw new Error(`PostgreSQL non disponibile: ${result.error.message}`);
  return result;
}
if (command === 'init') {
  if (!existsSync(path.join(bin, 'initdb.exe')))
    throw new Error(`Binari PostgreSQL non trovati: ${bin}`);
  if (!existsSync(runtimePath)) {
    const password = randomBytes(32).toString('base64url');
    const config = {
      host: '127.0.0.1',
      port: 55432,
      database: 'votilt',
      user: 'votilt_owner',
      password,
      apiUser: 'votilt_api',
      apiPassword: randomBytes(32).toString('base64url'),
      apiPort: 4317,
    };
    writeFileSync(runtimePath, JSON.stringify(config, null, 2), { mode: 0o600 });
  }
  const config = JSON.parse(readFileSync(runtimePath, 'utf8').replace(/^\uFEFF/, ''));
  if (!existsSync(path.join(data, 'PG_VERSION'))) {
    const pwfile = path.join(local, 'db-password');
    writeFileSync(pwfile, config.password, { mode: 0o600 });
    const r = run('initdb', [
      '-D',
      data,
      '-U',
      config.user,
      '--pwfile',
      pwfile,
      '--auth',
      'scram-sha-256',
      '--encoding',
      'UTF8',
      '--locale',
      'C',
    ]);
    if (r.status !== 0) throw new Error(r.stderr || r.stdout);
    writeFileSync(
      path.join(data, 'votilt.conf'),
      `listen_addresses = '127.0.0.1'\nport = ${config.port}\nmax_connections = 40\n`,
    );
    const conf = path.join(data, 'postgresql.conf');
    writeFileSync(conf, readFileSync(conf, 'utf8') + "\ninclude = 'votilt.conf'\n");
  }
  console.log('Cluster VOTILT dedicato inizializzato; servizio PostgreSQL esistente invariato.');
} else if (command === 'start') {
  if (!existsSync(path.join(data, 'PG_VERSION')))
    throw new Error('Prima eseguire npm run db:init.');
  const status = run('pg_ctl', ['status', '-D', data]);
  if (status.status === 0) console.log('PostgreSQL VOTILT già avviato su 127.0.0.1:55432.');
  else {
    const r = run(
      'pg_ctl',
      ['start', '-D', data, '-l', path.join(local, 'postgres.log'), '-w', '-t', '40'],
      { stdio: 'ignore' },
    );
    if (r.status !== 0) throw new Error(r.stderr || r.stdout);
    console.log('PostgreSQL VOTILT avviato su 127.0.0.1:55432.');
  }
} else if (command === 'stop') {
  const r = run('pg_ctl', ['stop', '-D', data, '-m', 'fast', '-w', '-t', '30']);
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
  console.log('PostgreSQL VOTILT arrestato. Dati conservati.');
} else {
  const r = run('pg_ctl', ['status', '-D', data]);
  console.log(
    r.status === 0 ? 'PASS: PostgreSQL VOTILT in esecuzione.' : 'PostgreSQL VOTILT non avviato.',
  );
  process.exitCode = r.status === 0 ? 0 : 1;
}
