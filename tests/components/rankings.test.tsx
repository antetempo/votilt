import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { Rankings } from '../../src/features/Rankings';

let mockQuery: any;
let mockRows: any[];
jest.mock('@tanstack/react-query', () => ({
  useQuery: (options: any) => {
    mockQuery = options;
    return { data: mockRows, isPending: false, error: null };
  },
}));
jest.mock('../../src/lib/session', () => ({ useSession: () => ({ user: { id: 'viewer' } }) }));
jest.mock('../../src/lib/api', () => ({
  rpc: jest.fn(),
  mediaSource: (url: string) => ({ uri: url }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRows = [
    {
      id: 'leaf',
      title: 'Sguardi dolci',
      path: ['Persone', 'Volti', 'Espressioni', 'Sguardi dolci'],
      voteCount: 5,
      contentCount: 3,
      leader: {
        id: 'image',
        title: 'Nora',
        mediaUrl: '/media/test',
        support: 3,
        position: 1,
        provenance: 'ai_generated',
      },
    },
  ];
});

test('mostra il primo contenuto della foglia e apre la sua classifica, senza graduatoria delle categorie', async () => {
  const view = await render(<Rankings />);
  expect(view.getByText('Al primo posto')).toBeTruthy();
  expect(view.getByText('Nora')).toBeTruthy();
  expect(view.getByText('Persone › Volti › Espressioni')).toBeTruthy();
  expect(view.getByText('3 like · Creato con AI')).toBeTruthy();
  expect(view.queryByText('Le categorie più votate')).toBeNull();
  await fireEvent.press(
    view.getByLabelText('Primo posto in Sguardi dolci: Nora, 3 like. Apri classifica.'),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/category/[id]',
    params: { id: 'leaf', view: 'ranking' },
  });
});

test('ricerca diretta con debounce: percorso completo e foglia senza vincitore comunque raggiungibile', async () => {
  const view = await render(<Rankings />);
  mockRows = [{ ...mockRows[0], leader: null, voteCount: 0 }];
  await fireEvent.changeText(view.getByLabelText('Cerca una categoria'), ' Sguardi ');
  await waitFor(() => expect(mockQuery.queryKey[2]).toBe('Sguardi'));
  expect(view.getByText('Categorie trovate')).toBeTruthy();
  expect(view.getByText('Ancora nessun like')).toBeTruthy();
  expect(view.queryByText('Nora')).toBeNull();
  await fireEvent.press(
    view.getByLabelText('Classifica Sguardi dolci, Persone, Volti, Espressioni, Sguardi dolci'),
  );
  expect(router.push).toHaveBeenCalledWith({
    pathname: '/category/[id]',
    params: { id: 'leaf', view: 'ranking' },
  });
});

test('non inventa primi posti quando il server non ha preferenze', async () => {
  mockRows = [];
  const view = await render(<Rankings />);
  expect(view.getByText('I primi posti stanno per arrivare.')).toBeTruthy();
  expect(view.queryByText('1°')).toBeNull();
});
