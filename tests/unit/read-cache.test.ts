import { QueryClient, dehydrate } from '@tanstack/react-query';
import { parseReadCache } from '../../src/lib/readCache';
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { cache: 'private-cache' } }));
const user = {
  id: 'a0000000-0000-4000-8000-000000000001',
  handle: 'demo',
  display_name: 'Demo',
  bio: '',
  visibility: 'public',
  role: 'user',
  interests: [],
  settings: {
    show_champions: 'owner',
    allow_comparison: false,
    haptics: true,
    reduce_motion: false,
    onboarding_complete: true,
  },
};
test('cache recente valida solo per la stessa sessione, mai per un account diverso', () => {
  const client = new QueryClient();
  client.setQueryData(['categories'], []);
  const raw = JSON.stringify({
    version: 1,
    scope: 'session-A',
    savedAt: 1000,
    user,
    state: dehydrate(client),
  });
  expect(parseReadCache(raw, 'session-A', 1100)?.user.id).toBe(user.id);
  expect(parseReadCache(raw, 'session-B', 1100)).toBeNull();
  expect(parseReadCache(raw, 'session-A', 1000 + 86400001)).toBeNull();
  client.clear();
});
test('cache corrotta o mutazioni serializzate non vengono ripristinate', () => {
  expect(
    parseReadCache(
      JSON.stringify({
        version: 1,
        scope: 'A',
        savedAt: 1,
        user,
        state: { queries: [], mutations: [{ unsafe: true }] },
      }),
      'A',
      2,
    ),
  ).toBeNull();
  expect(parseReadCache('{}', 'A')).toBeNull();
});
