import pg from 'pg';
import { runtime } from './config.ts';
import { sampleFeed, type FeedCandidate } from '../src/utils/domain.ts';
import {
  checkCategory,
  type CategoryCandidate,
  type CategoryCheck,
} from '../src/utils/categoryPolicy.ts';
export class CategoryPolicyError extends Error {
  constructor(public result: CategoryCheck) {
    super(result.duplicate ? 'CATEGORY_EXISTS' : 'INAPPROPRIATE_CATEGORY');
  }
}

export const pool = new pg.Pool({
  host: runtime.host,
  port: runtime.port,
  database: runtime.database,
  user: runtime.apiUser,
  password: runtime.apiPassword,
  max: 10,
  statement_timeout: 15000,
});

export async function transaction<T>(
  userId: string | null,
  work: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.user_id', $1, true)", [userId || '']);
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

const feedOrders = new Map<string, { at: number; items: { id: string; categoryId: string }[] }>();
export async function rpc<T = unknown>(
  userId: string | null,
  action: string,
  input: Record<string, unknown> = {},
): Promise<T> {
  return transaction(userId, async (client) => {
    if (
      action === 'category_check' ||
      action === 'suggest_category' ||
      (action === 'moderate_suggestion' && input.decision === 'approved')
    ) {
      if (!userId) throw new Error('AUTH_REQUIRED');
      if (action !== 'category_check') await client.query('SELECT pg_advisory_xact_lock(8815001)');
      if (
        action === 'moderate_suggestion' &&
        !(await client.query('SELECT api.is_mod() allowed')).rows[0].allowed
      )
        throw new Error('FORBIDDEN');
      const context = (await client.query('SELECT api.category_policy_context() context')).rows[0]
        .context as {
        published: CategoryCandidate[];
        pending: (CategoryCandidate & { description: string; examples: string[] })[];
      };
      const target =
        action === 'moderate_suggestion'
          ? context.pending.find((x) => x.id === input.suggestionId)
          : undefined;
      if (action === 'moderate_suggestion' && !target) throw new Error('REQUEST_UNAVAILABLE');
      const proposed =
        target || (input as { title: string; description?: string; examples?: string[] });
      const result = checkCategory(
        proposed,
        [...context.published, ...context.pending.filter((x) => x.id !== target?.id)],
        userId,
      );
      if (action === 'category_check') return result as T;
      if (!result.allowed) throw new CategoryPolicyError(result);
    }
    if (action === 'feed') {
      const key = JSON.stringify([userId, input.mode, input.categoryId, input.seed]);
      let cached = feedOrders.get(key);
      if (!cached || Date.now() - cached.at > 3600000) {
        const candidates = (
          await client.query('SELECT api.feed_candidates($1::jsonb) result', [
            JSON.stringify(input),
          ])
        ).rows[0].result as FeedCandidate[];
        cached = {
          at: Date.now(),
          items: sampleFeed(candidates, String(input.seed || 'votilt')).map((x) => ({
            id: x.id,
            categoryId: x.categoryId,
          })),
        };
        if (feedOrders.size >= 100) feedOrders.delete(feedOrders.keys().next().value!);
        feedOrders.set(key, cached);
      }
      const offset = Number(input.offset) || 0;
      const limit = Math.min(15, Number(input.limit) || 12);
      const page = cached.items.slice(offset, offset + limit);
      const items = (
        await client.query('SELECT api.feed_items($1::jsonb) result', [JSON.stringify(page)])
      ).rows[0].result;
      return {
        items,
        nextOffset: offset + limit < cached.items.length ? offset + limit : null,
      } as T;
    }
    const { rows } = await client.query('SELECT api.dispatch($1, $2::jsonb) AS result', [
      action,
      JSON.stringify(input),
    ]);
    return rows[0].result as T;
  });
}
