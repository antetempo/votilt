import React from 'react';
import { render } from '@testing-library/react-native';
import CategoryPage from '../../app/category/[id]';
const mockRanking = jest.fn();
jest.mock('../../src/lib/session', () => ({ useSession: () => ({ user: { id: 'viewer' } }) }));
jest.mock('../../src/hooks/useAction', () => ({
  useAction: () => ({ busy: false, run: jest.fn() }),
}));
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'leaf' }),
  Stack: { Screen: () => null },
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [{ id: 'leaf', title: 'Foglia' }] }),
}));
jest.mock('../../src/features/CategoryRanking', () => ({
  CategoryRanking: (props: any) => {
    mockRanking(props);
    return null;
  },
}));
test('la foglia apre direttamente la classifica senza selettori Immagini/Classifica', async () => {
  const view = await render(<CategoryPage />);
  expect(mockRanking).toHaveBeenCalledWith({ categoryId: 'leaf', query: '' });
  expect(view.queryByText('Immagini')).toBeNull();
  expect(view.queryByText('Classifica')).toBeNull();
  expect(view.getByLabelText('Cerca in questa categoria')).toBeTruthy();
});
