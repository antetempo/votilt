import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sharp, { type Metadata } from 'sharp';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { randomUUID, createHash } from 'node:crypto';
import path from 'node:path';
import { z } from 'zod';
import { pool, rpc, transaction, CategoryPolicyError } from './db.ts';
import { issueSession, passwordHash, passwordMatches, sessionUser, tokenHash } from './auth.ts';
import { mediaRoot, runtime } from './config.ts';
import { normalizeReferenceUrl } from '../src/utils/references.ts';

const loginSchema = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});
const signupSchema = loginSchema.extend({
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,24}$/),
  displayName: z.string().trim().min(1).max(60),
  adult: z.literal(true),
});
const uuid = z.uuid();
const voteSchema = z.object({ categoryId: uuid, contentId: uuid, clientOperationId: uuid });
const resolveSchema = z.object({
  duelId: uuid,
  winnerSide: z.enum(['INCUMBENT', 'CHALLENGER']),
  clientOperationId: uuid,
});
const actions = new Set([
  'search',
  'categories',
  'category_rankings',
  'category_check',
  'feed',
  'content',
  'ranking',
  'profile',
  'daily',
  'quiz',
  'me',
  'champions',
  'duel',
  'history',
  'notifications',
  'social',
  'taste_match',
  'my_uploads',
  'moderation',
  'suspend_user',
  'my_suggestions',
  'battle',
  'settings',
  'interests',
  'profile_update',
  'follow_toggle',
  'category_follow',
  'friend_request',
  'friend_answer',
  'block',
  'report',
  'moderate',
  'delete_content',
  'dismiss_report',
  'mark_notification',
  'delete_notification',
  'suggest_category',
  'moderate_suggestion',
  'create_battle',
  'revoke_battle',
  'quiz_answer',
  'delete_account',
  'impression',
  'vote_intent',
  'resolve_tilt',
  'cancel_tilt',
]);
const inputSchemas: Record<string, z.ZodType> = {
  categories: z.object({}),
  category_rankings: z.object({ query: z.string().trim().max(80).optional() }),
  category_check: z.object({
    title: z.string().max(60),
    description: z.string().max(250).optional(),
    examples: z.array(z.string().max(100)).max(10).optional(),
  }),
  me: z.object({}),
  quiz: z.object({}),
  daily: z.object({}),
  history: z.object({}),
  notifications: z.object({}),
  my_uploads: z.object({}),
  my_suggestions: z.object({}),
  content: z.object({ contentId: uuid, categoryId: uuid.optional() }),
  ranking: z.object({
    categoryId: uuid,
    metric: z.enum(['popular', 'elo', 'trend']).optional(),
    query: z.string().trim().max(80).optional(),
  }),
  profile: z.object({ userId: uuid }),
  champions: z.object({ userId: uuid.optional() }),
  social: z.object({ search: z.string().max(80).optional() }),
  duel: z.object({ duelId: uuid }),
  taste_match: z.object({ userId: uuid }),
  battle: z.object({ battleId: uuid }),
  delete_content: z.object({ contentId: uuid }),
  dismiss_report: z.object({ reportId: uuid, reason: z.string().trim().min(3).max(500) }),
  mark_notification: z.object({ notificationId: uuid.optional() }),
  delete_notification: z.object({ notificationId: uuid }),
  moderate_suggestion: z.object({
    suggestionId: uuid,
    decision: z.enum(['approved', 'rejected']),
    reason: z.string().trim().min(3).max(500),
  }),
  revoke_battle: z.object({ battleId: uuid }),
  quiz_answer: z.object({ quizId: uuid, answer: z.enum(['REAL', 'AI']) }),
  impression: z.object({ contentId: uuid, categoryId: uuid, sessionId: uuid }),
  moderation: z.object({
    status: z.enum(['pending_review', 'approved', 'hidden', 'rejected']).optional(),
    search: z.string().max(80).optional(),
  }),
  suspend_user: z.object({
    userId: uuid,
    suspended: z.boolean(),
    reason: z.string().trim().min(3).max(500),
  }),
  delete_account: z.object({ confirmation: z.literal('ELIMINA') }),
  search: z.object({ query: z.string().trim().min(1).max(80), categoryId: uuid.optional() }),
  feed: z.object({
    mode: z.enum(['for_you', 'following', 'discover']).optional(),
    categoryId: uuid.optional(),
    offset: z.number().int().min(0).max(100000).optional(),
    limit: z.number().int().min(1).max(15).optional(),
    seed: z.string().max(80).optional(),
  }),
  vote_intent: voteSchema,
  resolve_tilt: resolveSchema,
  cancel_tilt: z.object({ duelId: uuid, clientOperationId: uuid }),
  interests: z.object({ categoryIds: z.array(uuid).max(50) }),
  profile_update: z.object({
    displayName: z.string().trim().min(1).max(60).optional(),
    bio: z.string().max(160).optional(),
    visibility: z.enum(['public', 'friends', 'private']).optional(),
  }),
  settings: z.object({
    showChampions: z.enum(['owner', 'friends', 'public']).optional(),
    allowComparison: z.boolean().optional(),
    haptics: z.boolean().optional(),
    reduceMotion: z.boolean().optional(),
  }),
  follow_toggle: z.object({ userId: uuid, following: z.boolean().optional() }),
  category_follow: z.object({ categoryId: uuid, following: z.boolean() }),
  friend_request: z.object({ userId: uuid }),
  block: z.object({ userId: uuid }),
  friend_answer: z.object({ requestId: uuid, accept: z.boolean() }),
  report: z.object({ contentId: uuid, reason: z.string().trim().min(3).max(500) }),
  moderate: z.object({
    contentId: uuid,
    decision: z.enum(['approved', 'rejected', 'hidden']),
    reason: z.string().trim().min(3).max(500),
  }),
  create_battle: z.object({ userId: uuid, categoryId: uuid }),
  suggest_category: z.object({
    referenceKind: z.enum(['name', 'person', 'website', 'place', 'tool']).default('name'),
    parentId: uuid,
    title: z.string().trim().min(3).max(60),
    description: z.string().trim().min(20).max(250),
    examples: z.array(z.string().min(1).max(100)).max(10).default([]),
  }),
};
const uploadSchema = z.object({
  clientOperationId: uuid,
  title: z.string().trim().min(1).max(80),
  caption: z.string().max(400),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(40)
        .regex(/^[\p{L}\p{N} _-]+$/u)
        .transform((value) => value.normalize('NFKC').toLowerCase()),
    )
    .max(20)
    .default([])
    .transform((values) => [...new Set(values)]),
  kind: z.enum(['photo', 'illustration', 'ai_art', 'ai_tool']),
  provenance: z.enum(['original_illustration', 'ai_generated', 'unknown']),
  categoryIds: z.array(uuid).length(1),
  rights: z.literal(true),
  adultConsent: z.literal(true),
  metadata: z.record(
    uuid,
    z.object({
      name: z.string().trim().min(1).max(120),
      url: z
        .string()
        .max(2048)
        .optional()
        .transform((value) => (value ? normalizeReferenceUrl(value) : undefined)),
    }),
  ),
});
export async function createApp(
  options: { afterUploadCommit?: () => void; globalRateLimitMax?: number } = {},
) {
  const missingAccountHash = await passwordHash(randomUUID());
  const app = Fastify({ logger: false, bodyLimit: 1024 * 1024 });
  await app.register(rateLimit, { max: options.globalRateLimitMax ?? 180, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 2 } });
  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof CategoryPolicyError)
      return reply.code(409).send({ code: error.message, policy: error.result });
    const e = error as Error & { code?: string; statusCode?: number };
    if (e instanceof z.ZodError)
      return reply.code(400).send({ code: 'INVALID_INPUT', message: 'Controlla i dati inseriti.' });
    if (e.statusCode === 429)
      return reply
        .code(429)
        .send({ code: 'RATE_LIMITED', message: 'Troppe richieste. Riprova tra poco.' });
    if (e.code === '23505')
      return reply
        .code(409)
        .send({ code: 'ALREADY_EXISTS', message: 'Email o nome utente già registrato.' });
    if (e.code === '22P02' || e.code === '23514' || e.code === '23503')
      return reply.code(400).send({ code: 'INVALID_INPUT', message: 'Controlla i dati inseriti.' });
    const known =
      /^(AUTH_REQUIRED|FORBIDDEN|EDITORIAL_CATALOG_ONLY|[A-Z_]+(?:UNAVAILABLE|PRIVATE|REQUIRED|EXPIRED|SUPERSEDED|STALE|REUSE|RESERVED|NOT_FOUND)|INVALID_[A-Z_]+|CATEGORY_NOT_LEAF|BLOCKED_CONTENT|RATE_LIMITED)$/;
    if (known.test(e.message))
      return reply
        .code(e.message === 'AUTH_REQUIRED' ? 401 : e.message === 'FORBIDDEN' ? 403 : 409)
        .send({ code: e.message });
    if (e.statusCode && e.statusCode < 500)
      return reply
        .code(e.statusCode)
        .send({ code: 'INVALID_INPUT', message: 'Richiesta non valida.' });
    console.error('API error:', e.code || e.name); // Deliberately omit payloads, SQL and credentials.
    return reply
      .code(500)
      .send({ code: 'SERVER_ERROR', message: 'Il server non riesce a completare la richiesta.' });
  });
  const getToken = (header?: string) => (header?.startsWith('Bearer ') ? header.slice(7) : '');
  app.get('/health', async () => {
    await pool.query('SELECT 1');
    return { ok: true, app: 'VOTILT', database: 'PostgreSQL native', version: 1 };
  });
  app.post(
    '/auth/signup',
    { config: { rateLimit: { max: 10, timeWindow: '1 hour' } } },
    async (req) => {
      const data = signupSchema.parse(req.body);
      const id = randomUUID();
      const hash = await passwordHash(data.password);
      await pool.query('SELECT api.register_user($1,$2,$3,$4,$5)', [
        id,
        data.email,
        hash,
        data.handle,
        data.displayName,
      ]);
      return { token: await issueSession(id), user: await rpc(id, 'me') };
    },
  );
  app.post(
    '/auth/login',
    { config: { rateLimit: { max: 30, timeWindow: '5 minutes' } } },
    async (req, reply) => {
      const data = loginSchema.parse(req.body);
      const { rows } = await pool.query('SELECT * FROM api.auth_lookup($1)', [data.email]);
      // Equal-cost work also for unknown accounts, without revealing which field failed.
      const hash = rows[0]?.password_hash || missingAccountHash;
      if (!(await passwordMatches(data.password, hash)) || !rows.length)
        return reply
          .code(401)
          .send({ code: 'INVALID_CREDENTIALS', message: 'Email o password non corretti.' });
      return { token: await issueSession(rows[0].user_id), user: await rpc(rows[0].user_id, 'me') };
    },
  );
  app.post('/auth/logout', async (req) => {
    await pool.query('SELECT api.revoke_session($1)', [
      tokenHash(getToken(req.headers.authorization)),
    ]);
    return { ok: true };
  });
  app.post<{ Params: { action: string } }>('/rpc/:action', async (req) => {
    const action = req.params.action;
    if (!actions.has(action)) throw new Error('INVALID_ACTION');
    const raw = z.record(z.string(), z.unknown()).parse(req.body || {});
    const input = (inputSchemas[action]?.parse(raw) || raw) as Record<string, unknown>;
    return rpc(await sessionUser(getToken(req.headers.authorization)), action, input);
  });
  app.get<{ Params: { id: string } }>('/media/:id', async (req, reply) => {
    const id = uuid.parse(req.params.id);
    const user = await sessionUser(getToken(req.headers.authorization));
    const item = await transaction(
      user,
      async (db) =>
        (await db.query('SELECT media_path FROM public.content_items WHERE id=$1', [id])).rows[0],
    );
    if (!item) return reply.code(404).send({ code: 'CONTENT_UNAVAILABLE' });
    const location = path.resolve(mediaRoot, item.media_path);
    if (!location.startsWith(path.resolve(mediaRoot) + path.sep))
      return reply.code(404).send({ code: 'CONTENT_UNAVAILABLE' });
    try {
      return reply
        .header('Cache-Control', 'private, no-store')
        .type('image/jpeg')
        .send(await readFile(location));
    } catch {
      return reply.code(404).send({ code: 'MEDIA_UNAVAILABLE' });
    }
  });
  app.get<{ Params: { id: string } }>('/quiz-media/:id', async (req, reply) => {
    const id = uuid.parse(req.params.id);
    const row = (await pool.query('SELECT api.quiz_media_path($1) media_path', [id])).rows[0];
    if (!row?.media_path) return reply.code(404).send({ code: 'QUIZ_UNAVAILABLE' });
    const location = path.resolve(mediaRoot, row.media_path);
    if (!location.startsWith(path.resolve(mediaRoot) + path.sep))
      return reply.code(404).send({ code: 'QUIZ_UNAVAILABLE' });
    try {
      return reply
        .header('Cache-Control', 'private, no-store')
        .type('image/jpeg')
        .send(await readFile(location));
    } catch {
      return reply.code(404).send({ code: 'QUIZ_UNAVAILABLE' });
    }
  });
  app.post(
    '/uploads',
    { config: { rateLimit: { max: 20, timeWindow: '1 hour' } } },
    async (req) => {
      const user = await sessionUser(getToken(req.headers.authorization));
      if (!user) throw new Error('AUTH_REQUIRED');
      let bytes: Buffer | undefined;
      let metadata: unknown;
      for await (const part of req.parts()) {
        if (part.type === 'file') {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(part.mimetype))
            throw new Error('INVALID_MEDIA');
          bytes = await part.toBuffer();
        } else if (part.fieldname === 'metadata') {
          try {
            metadata = JSON.parse(String(part.value));
          } catch {
            throw new Error('INVALID_INPUT');
          }
        }
      }
      const data = uploadSchema.parse(metadata);
      if (!bytes) throw new Error('INVALID_MEDIA');
      let normalized: Buffer;
      let info: Metadata;
      try {
        info = await sharp(bytes, { limitInputPixels: 40_000_000 }).metadata();
        if (!['jpeg', 'png', 'webp'].includes(info.format || '')) throw new Error('format');
        normalized = await sharp(bytes, { limitInputPixels: 40_000_000 })
          .rotate()
          .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 86 })
          .toBuffer();
        info = await sharp(normalized).metadata();
      } catch {
        throw new Error('INVALID_MEDIA');
      }
      const id = randomUUID();
      const filename = `${id}.jpg`;
      await mkdir(mediaRoot, { recursive: true });
      await writeFile(path.join(mediaRoot, filename), normalized);
      try {
        const result = await transaction(user, async (db) => {
          return (
            await db.query('SELECT api.upload_receipt($1::jsonb) result', [
              JSON.stringify({
                ...data,
                mediaHash: createHash('sha256').update(normalized).digest('hex'),
                id,
                filename,
                size: normalized.length,
                width: info.width,
                height: info.height,
              }),
            ])
          ).rows[0].result as { id: string; status: string };
        });
        options.afterUploadCommit?.();
        if (result.id !== id) await unlink(path.join(mediaRoot, filename));
        return result;
      } catch (e) {
        // COMMIT acknowledgement can be lost. Never remove media until a separate DB read proves it is unreferenced.
        try {
          const referenced = (
            await pool.query('SELECT api.media_referenced($1) referenced', [filename])
          ).rows[0].referenced;
          if (!referenced) await unlink(path.join(mediaRoot, filename));
        } catch {
          /* Preserve the file if the DB or cleanup is unavailable; reconcile orphans only after a successful reference check. */
        }
        throw e;
      }
    },
  );
  app.addHook('onClose', async () => {
    await pool.end();
  });
  return app;
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('/server/http.ts')) {
  const app = await createApp();
  await app.listen({ port: runtime.apiPort, host: '127.0.0.1' });
  console.log(
    `VOTILT API: http://127.0.0.1:${runtime.apiPort} (Android: http://10.0.2.2:${runtime.apiPort})`,
  );
}
