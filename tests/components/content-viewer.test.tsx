import React from 'react';
import { render } from '@testing-library/react-native';
import { ContentViewer } from '../../src/features/ContentViewer';
let mockProps: any;
let mockStatus = 'approved';
const mockItems = ['first', 'selected', 'third'].map((id) => ({
  id,
  categoryId: 'leaf',
  status: 'approved',
  title: id,
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'selected', categoryId: 'leaf', metric: 'elo' }),
  Stack: { Screen: () => null },
  router: { setParams: jest.fn() },
}));
jest.mock('../../src/lib/session', () => ({ useSession: () => ({ user: { id: 'viewer' } }) }));
jest.mock('../../src/features/Feed', () => ({
  Feed: (props: any) => {
    mockProps = props;
    return null;
  },
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: any) => ({
    isPending: false,
    error: null,
    data:
      queryKey[0] === 'content'
        ? { ...mockItems[1], status: mockStatus, categories: [{ id: 'leaf', title: 'Foglia' }] }
        : { items: mockItems },
  }),
}));
beforeEach(() => {
  mockStatus = 'approved';
});
test('apre lo scroll dall’immagine toccata senza cambiare l’ordine della classifica', async () => {
  await render(<ContentViewer />);
  expect(mockProps.initialContentId).toBe('selected');
  expect(mockProps.providedItems.map((item: any) => item.id)).toEqual([
    'first',
    'selected',
    'third',
  ]);
  expect(mockProps.categoryId).toBe('leaf');
  expect(mockProps.showBack).toBe(true);
});
test('un contenuto in revisione conserva il dettaglio privato senza mescolarlo alla classifica', async () => {
  mockStatus = 'pending_review';
  await render(<ContentViewer />);
  expect(mockProps.providedItems).toHaveLength(1);
  expect(mockProps.providedItems[0].status).toBe('pending_review');
});
