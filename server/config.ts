import { readFileSync } from 'node:fs';
import path from 'node:path';

export const root = process.cwd();
export const runtime = JSON.parse(
  readFileSync(path.join(root, '.local/runtime.json'), 'utf8').replace(/^\uFEFF/, ''),
) as {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  apiUser: string;
  apiPassword: string;
  apiPort: number;
};
export const mediaRoot = path.join(root, '.local/media');
if (process.env.VOTILT_DATABASE) {
  if (!['votilt', 'votilt_test', 'votilt_bootstrap_test'].includes(process.env.VOTILT_DATABASE))
    throw new Error('Database locale non consentito.');
  runtime.database = process.env.VOTILT_DATABASE;
}
