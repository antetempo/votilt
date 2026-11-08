import { queryClient, clearPrivateCaches } from '../../src/lib/session';
import { Image } from 'expo-image';
jest.mock('../../src/lib/readCache', () => ({
  purgeReadCache: jest.fn(),
  cacheScope: jest.fn(),
  loadReadCache: jest.fn(),
  saveReadCache: jest.fn(),
}));
jest.mock('expo-image', () => ({
  Image: { clearMemoryCache: jest.fn(async () => true), clearDiskCache: jest.fn(async () => true) },
}));
test('logout e invalidazione usano la pulizia di cache e immagini private', async () => {
  queryClient.setQueryData(['ranking', 'friends-only', 'user-A'], [{ private: true }]);
  await clearPrivateCaches();
  expect(queryClient.getQueryData(['ranking', 'friends-only', 'user-A'])).toBeUndefined();
  expect(Image.clearMemoryCache).toHaveBeenCalled();
  expect(Image.clearDiskCache).toHaveBeenCalled();
});
