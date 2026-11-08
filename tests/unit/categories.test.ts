import { findCategories, suggestCategories, categoryPath } from '../../src/utils/categories';
import type { Category } from '../../src/types/domain';
const categories = [
  { id: 'gaming', title: 'Videogiochi', parent_id: null, aliases: ['gaming'], depth: 1 },
  {
    id: 'fps',
    title: 'FPS',
    parent_id: 'gaming',
    aliases: ['sparatutto in prima persona'],
    depth: 2,
  },
  { id: 'tactical', title: 'FPS tattici', parent_id: 'fps', depth: 3 },
  { id: 'moto', title: 'Café racer', parent_id: null, aliases: ['caferacer'], depth: 1 },
] as Category[];
test('percorso e alias degli antenati trovano la specializzazione senza duplicare i nodi', () => {
  expect(categoryPath(categories[2], categories)).toEqual(['Videogiochi', 'FPS', 'FPS tattici']);
  expect(findCategories('#gaming sparatutto tattici', categories).map((item) => item.id)).toEqual([
    'tactical',
  ]);
  expect(new Set(findCategories('gaming', categories).map((item) => item.id)).size).toBe(3);
});
test('match esatti prima dei suggerimenti da testo libero, senza fingere un motore semantico', () => {
  expect(suggestCategories('FPS', categories)[0].id).toBe('fps');
  expect(suggestCategories('Oggi con la mia #caferacer', categories)[0].id).toBe('moto');
  expect(suggestCategories('cafe racer', categories)[0].id).toBe('moto');
  expect(suggestCategories('cafferacer', categories)[0].id).toBe('moto');
  expect(suggestCategories('zzzzzzzz', categories)).toEqual([]);
});
