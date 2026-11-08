import { File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { dehydrate, hydrate, type QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { userContract } from './contracts';
const queryState = z.object({
  data: z.unknown(),
  dataUpdateCount: z.number(),
  dataUpdatedAt: z.number(),
  error: z.null(),
  errorUpdateCount: z.number(),
  errorUpdatedAt: z.number(),
  fetchFailureCount: z.number(),
  fetchFailureReason: z.null(),
  fetchMeta: z.record(z.string(), z.unknown()).nullable(),
  isInvalidated: z.boolean(),
  status: z.literal('success'),
  fetchStatus: z.enum(['idle', 'fetching', 'paused']),
});
const snapshot = z.object({
  version: z.literal(1),
  scope: z.string(),
  savedAt: z.number(),
  user: userContract,
  state: z.object({
    mutations: z.array(z.never()),
    queries: z
      .array(
        z.object({
          queryKey: z.array(z.unknown()),
          queryHash: z.string(),
          dehydratedAt: z.number(),
          state: queryState,
        }),
      )
      .max(30),
  }),
});
const file = () => new File(Paths.cache, 'votilt-read-cache-v1.json');
export const cacheScope = (token: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, token);
export function parseReadCache(raw: string, scope: string, now = Date.now()) {
  const parsed = snapshot.safeParse(JSON.parse(raw));
  if (
    !parsed.success ||
    parsed.data.scope !== scope ||
    now - parsed.data.savedAt > 86400000 ||
    parsed.data.savedAt > now + 60000
  )
    return null;
  return parsed.data;
}
export async function loadReadCache(client: QueryClient, scope: string) {
  try {
    const f = file();
    if (!f.exists) return null;
    const data = parseReadCache(await f.text(), scope);
    if (!data) return null;
    hydrate(client, data.state);
    return data.user;
  } catch {
    return null;
  }
}
export function saveReadCache(client: QueryClient, scope: string, user: unknown) {
  const state = dehydrate(client, {
    shouldDehydrateMutation: () => false,
    shouldDehydrateQuery: (q) =>
      q.state.status === 'success' &&
      ['categories', 'feed', 'champions', 'ranking', 'content'].includes(String(q.queryKey[0])),
  });
  state.queries = state.queries.slice(-30);
  try {
    const target = file();
    if (!target.exists) target.create({ intermediates: true });
    target.write(JSON.stringify({ version: 1, scope, savedAt: Date.now(), user, state }));
  } catch (error) {
    if (__DEV__)
      console.warn('VOTILT_CACHE_WRITE_FAILED', error instanceof Error ? error.name : 'Error');
    /* Read cache is optional; a failed cache write must not interrupt voting. */
  }
}
export function purgeReadCache() {
  try {
    const f = file();
    if (f.exists) f.delete();
  } catch {
    /* OS cache eviction also clears this private app file. */
  }
}
