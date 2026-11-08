import {
  eloReference,
  tasteMatch,
  categoryPath,
  normalizeSearch,
  sampleFeed,
} from '../../src/utils/domain';
describe('regole dominio e feed', () => {
  test('Elo trasferisce 16 a parita e conserva somma', () => {
    expect(eloReference(1500, 1500)).toEqual({ winner: 1516, loser: 1484 });
    const x = eloReference(1650, 1420);
    expect(x.winner + x.loser).toBeCloseTo(3070, 10);
  });
  test('Taste Match mostra denominatore e non amplifica pochi dati', () => {
    expect(tasteMatch({ a: '1', b: '2' }, { a: '1' })).toEqual({
      common: 1,
      same: 1,
      percentage: null,
    });
    expect(tasteMatch({ a: '1', b: '2', c: '3' }, { a: '1', b: 'x', c: '3' })).toEqual({
      common: 3,
      same: 2,
      percentage: 67,
    });
  });
  test('ricerca accent/case e breadcrumb', () => {
    expect(normalizeSearch('  CITTÀ ')).toBe('citta');
    expect(
      categoryPath('b', [
        { id: 'a', parent_id: null },
        { id: 'b', parent_id: 'a' },
      ]).map((x) => x.id),
    ).toEqual(['a', 'b']);
    expect(() =>
      categoryPath('a', [
        { id: 'a', parent_id: 'b' },
        { id: 'b', parent_id: 'a' },
      ]),
    ).toThrow('CATEGORY_CYCLE');
  });
  test('feed stabile, deduplicato e senza quattro foglie uguali quando esiste alternativa', () => {
    const candidates = Array.from({ length: 120 }, (_, i) => ({
      id: String(i),
      categoryId: String(i % 6),
      interested: i % 3 === 0,
      fresh: i % 3 === 1,
      seen: i > 80,
    }));
    const a = sampleFeed(candidates, 'seed', 100);
    expect(a).toEqual(sampleFeed(candidates, 'seed', 100));
    expect(a).not.toEqual(sampleFeed(candidates, 'other', 100));
    expect(new Set(a.map((x) => x.id)).size).toBe(100);
    for (let i = 3; i < a.length; i++)
      expect(a.slice(i - 3, i + 1).every((x) => x.categoryId === a[i].categoryId)).toBe(false);
  });
  test('bucket vuoti e sola categoria non bloccano lo scroll', () => {
    const list = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      categoryId: 'a',
      interested: false,
      fresh: false,
      seen: false,
    }));
    expect(sampleFeed(list, 'empty', 20)).toHaveLength(12);
    expect(sampleFeed([], 'empty')).toEqual([]);
  });
});
