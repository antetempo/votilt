import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { pool } from './db.ts';

const scrypt = promisify(scryptCallback);
export async function passwordHash(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function passwordMatches(password: string, stored: string) {
  const [, salt, expected] = stored.split(':');
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const target = Buffer.from(expected, 'hex');
  return target.length === actual.length && timingSafeEqual(actual, target);
}
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export async function issueSession(userId: string) {
  const token = randomBytes(32).toString('base64url');
  await pool.query(
    "INSERT INTO private.sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 days')",
    [tokenHash(token), userId],
  );
  return token;
}
export async function sessionUser(token: string) {
  if (!token || token.length > 256) return null;
  const result = await pool.query('SELECT api.auth_session($1) user_id', [tokenHash(token)]);
  return (result.rows[0]?.user_id as string | undefined) || null;
}
