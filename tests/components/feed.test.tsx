import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Feed } from '../../src/features/Feed';
const mockVote = jest.fn();
let mockCaption = '';
jest.mock('../../src/lib/session', () => ({
  useSession: () => ({ user: { id: 'viewer', settings: {} }, offline: false, refresh: jest.fn() }),
  queryClient: { getQueryCache: () => ({ findAll: () => [] }) },
}));
jest.mock('../../src/features/voting', () => ({
  useVoting: () => ({ vote: mockVote, busy: false }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'feed-test' }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [] }),
  useInfiniteQuery: () => ({
    isPending: false,
    data: {
      pages: [
        {
          items: [
            {
              id: 'image',
              categoryId: 'category',
              categoryTitle: 'Ritratti',
              title: 'Nora Vela',
              handle: 'nova',
              mediaUrl: '/media/test',
              provenance: 'ai_generated',
              kind: 'ai_art',
              status: 'approved',
              caption: mockCaption,
            },
          ],
        },
      ],
    },
  }),
}));
async function feed() {
  const view = await render(<Feed />);
  await fireEvent(view.getByTestId('feed-surface'), 'layout', {
    nativeEvent: { layout: { width: 400, height: 780 } },
  });
  return view;
}
beforeEach(() => {
  mockVote.mockClear();
  mockCaption = '';
});
test('immagine con like e categoria: niente wordmark, CTA campione o descrizioni inventate', async () => {
  const view = await feed();
  expect(view.queryByText('VOTILT')).toBeNull();
  expect(view.queryByText('Scegli come campione')).toBeNull();
  expect(view.queryByText('Altro')).toBeNull();
  expect(view.getByLabelText('Categoria Ritratti')).toBeTruthy();
  await fireEvent.press(view.getByLabelText('Mi piace'));
  expect(mockVote).toHaveBeenCalledWith('category', 'image');
});
test('la descrizione dell’autore parte da una riga e si espande solo su richiesta', async () => {
  mockCaption = 'Questa descrizione è stata scritta dall’autore della foto.';
  const view = await feed();
  expect(view.getByText(mockCaption).props.numberOfLines).toBe(1);
  await fireEvent.press(view.getByLabelText('Espandi descrizione'));
  expect(view.getByText(mockCaption).props.numberOfLines).toBeUndefined();
  await fireEvent.press(view.getByLabelText('Riduci descrizione'));
  expect(view.getByText(mockCaption).props.numberOfLines).toBe(1);
});
