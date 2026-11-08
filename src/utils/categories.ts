import type { Category } from '../types/domain';

export function normalizeCategory(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f#]/g, '')
    .toLowerCase()
    .trim();
}

function oneEditApart(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (i < a.length || j < b.length ? 1 : 0) <= 1;
}

export function categoryPath(category: Category, categories: Category[]): string[] {
  if (category.path?.length) return category.path;
  const parts: string[] = [];
  const seen = new Set<string>();
  let current: Category | undefined = category;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    parts.unshift(current.title);
    current = categories.find((item) => item.id === current?.parent_id);
  }
  return parts;
}

export function findCategories(query: string, categories: Category[]) {
  const terms = normalizeCategory(query).split(/\s+/).filter(Boolean);
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categories.filter((category) => {
    const aliases: string[] = [];
    const seen = new Set<string>();
    let current: Category | undefined = category;
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      aliases.push(...(current.aliases || []));
      current = current.parent_id ? byId.get(current.parent_id) : undefined;
    }
    const text = normalizeCategory([...categoryPath(category, categories), ...aliases].join(' '));
    return terms.every((term) => text.includes(term));
  });
}

export function suggestCategories(query: string, categories: Category[], limit = 12) {
  const normalized = normalizeCategory(query).replace(/[^\p{L}\p{N}\s-]/gu, ' ');
  const stop = new Set([
    'di',
    'del',
    'della',
    'delle',
    'dei',
    'da',
    'a',
    'al',
    'alla',
    'e',
    'ed',
    'in',
    'con',
    'per',
    'il',
    'lo',
    'la',
    'le',
    'gli',
    'un',
    'una',
    'uno',
    'oggi',
    'mio',
    'mia',
    'che',
    'nel',
    'nella',
    'su',
    'sul',
    'the',
    'and',
    'of',
    'my',
  ]);
  const terms = [
    ...new Set(normalized.split(/\s+/).filter((term) => term.length > 1 && !stop.has(term))),
  ];
  if (!terms.length) return [];
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categories
    .map((category) => {
      const title = normalizeCategory(category.title);
      const direct = [title, ...(category.aliases || []).map(normalizeCategory)];
      const ancestor: string[] = [];
      const seen = new Set<string>();
      let parent = category.parent_id ? byId.get(category.parent_id) : undefined;
      while (parent && !seen.has(parent.id)) {
        seen.add(parent.id);
        ancestor.push(parent.title, ...(parent.aliases || []));
        parent = parent.parent_id ? byId.get(parent.parent_id) : undefined;
      }
      const context = normalizeCategory(ancestor.join(' '));
      let score = direct.some((name) => name === normalized.trim()) ? 1000 : 0;
      for (const term of terms) {
        if (direct.some((name) => name === term)) score += 80;
        else if (direct.some((name) => name.split(/\s+/).includes(term))) score += 30;
        else if (direct.some((name) => name.includes(term))) score += 12;
        else if (context.includes(term)) score += 3;
        else if (
          term.length >= 5 &&
          direct.some((name) =>
            name.split(/\s+/).some((word) => word.length >= 4 && oneEditApart(term, word)),
          )
        )
          score += 6;
      }
      if (category.terminal === false && score < 1000) score *= 0.4;
      return { category, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.category.title.localeCompare(b.category.title, 'it'))
    .slice(0, limit)
    .map((result) => result.category);
}
