import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CategoryBrowser } from '../../src/components/CategoryBrowser';
const mockPush = jest.fn();
const mockCategories = [
  {
    id: 'home',
    parent_id: null,
    title: 'Casa e giardino',
    path: ['Casa e giardino'],
    terminal: false,
  },
  {
    id: 'garden',
    parent_id: 'home',
    title: 'Giardinaggio',
    path: ['Casa e giardino', 'Giardinaggio'],
    terminal: false,
  },
  {
    id: 'bonsai',
    parent_id: 'garden',
    title: 'Bonsai',
    path: ['Casa e giardino', 'Giardinaggio', 'Bonsai'],
    terminal: true,
  },
];
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('../../src/lib/session', () => ({ useSession: () => ({ user: { id: 'viewer' } }) }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: ({ queryKey }: { queryKey: string[] }) => ({
    data: queryKey[0] === 'categories' ? mockCategories : [],
    isPending: false,
  }),
}));
test('navigazione testuale: il ramo apre la sua classifica o le sottocategorie separatamente', async () => {
  const view = await render(<CategoryBrowser />);
  await fireEvent.press(view.getByLabelText('Classifica Casa e giardino'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/category/[id]', params: { id: 'home' } });
  await fireEvent.press(view.getByText('Esplora Casa e giardino'));
  expect(view.getByLabelText('Classifica Giardinaggio')).toBeTruthy();
  expect(view.getByText('Esplora le sottocategorie. Ogni categoria ha voti propri.')).toBeTruthy();
});
test('la ricerca raggiunge direttamente la categoria con percorso completo', async () => {
  const view = await render(<CategoryBrowser />);
  await fireEvent.changeText(view.getByLabelText('Cerca un argomento'), 'bonsai');
  expect(view.getByLabelText('Classifica Bonsai')).toBeTruthy();
  expect(view.getByText('Casa e giardino › Giardinaggio › Bonsai')).toBeTruthy();
});
