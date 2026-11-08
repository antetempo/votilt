export function eloReference(winner: number, loser: number, k = 32) {
  const delta = k * (1 - 1 / (1 + 10 ** ((loser - winner) / 400)));
  return { winner: winner + delta, loser: loser - delta };
}
export function tasteMatch(a: Record<string, string>, b: Record<string, string>) {
  const common = Object.keys(a).filter((k) => !!a[k] && !!b[k]);
  const same = common.filter((k) => a[k] === b[k]).length;
  return {
    common: common.length,
    same,
    percentage: common.length >= 3 ? Math.round((100 * same) / common.length) : null,
  };
}
export function normalizeSearch(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('it-IT')
    .trim();
}
export function categoryPath<T extends { id: string; parent_id: string | null }>(
  id: string,
  all: T[],
) {
  const path: T[] = [];
  const seen = new Set<string>();
  let current = all.find((x) => x.id === id);
  while (current) {
    if (seen.has(current.id)) throw new Error('CATEGORY_CYCLE');
    seen.add(current.id);
    path.unshift(current);
    current = all.find((x) => x.id === current?.parent_id);
  }
  return path;
}
export type FeedCandidate = {
  id: string;
  categoryId: string;
  interested: boolean;
  fresh: boolean;
  seen: boolean;
};
export function sampleFeed<T extends FeedCandidate>(
  candidates: T[],
  seed: string,
  limit = candidates.length,
) {
  // Stable seeded Fisher-Yates order, then 60/20/20 preference buckets with deduplication.
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++)
    state = Math.imul(state ^ seed.charCodeAt(i), 16777619) >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  shuffled.sort((a, b) => Number(a.seen) - Number(b.seen));
  const buckets = [shuffled.filter((x) => x.interested), shuffled.filter((x) => x.fresh), shuffled];
  const pattern = [0, 0, 0, 1, 2];
  const used = new Set<string>();
  const result: T[] = [];
  const pick = (pool: T[]) =>
    pool.find(
      (x) =>
        !used.has(`${x.id}:${x.categoryId}`) &&
        !(result.length >= 3 && result.slice(-3).every((y) => y.categoryId === x.categoryId)),
    );
  while (result.length < limit) {
    const bucket = buckets[pattern[result.length % 5]];
    let item = pick(bucket) || pick(shuffled);
    // A category-only feed cannot avoid consecutive items from its sole category.
    if (!item) item = shuffled.find((x) => !used.has(`${x.id}:${x.categoryId}`));
    if (!item) break;
    used.add(`${item.id}:${item.categoryId}`);
    result.push(item);
  }
  return result;
}
