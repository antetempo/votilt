import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CreatorPreferences } from '../../src/components/CreatorPreferences';
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/lib/session', () => ({ useSession: () => ({ user: { id: 'viewer' } }) }));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    isPending: false,
    data: {
      preferenceCount: 3,
      categoryPreferences: [
        { categoryId: 'a', title: 'Bonsai', path: ['Casa', 'Bonsai'], preferences: 1 },
        { categoryId: 'b', title: 'Danza', path: ['Danza'], preferences: 2 },
      ],
    },
  }),
}));
test('il totale resta visibile e il dettaglio espandibile non spinge fuori le azioni del profilo', async () => {
  const view = await render(<CreatorPreferences userId="creator" />);
  expect(view.getByText('3 preferenze ricevute')).toBeTruthy();
  expect(view.queryByText('Bonsai · 1')).toBeNull();
  await fireEvent.press(view.getByLabelText('Mostra preferenze per categoria'));
  expect(view.getByText('Bonsai · 1')).toBeTruthy();
  await fireEvent.changeText(view.getByLabelText('Filtra le categorie del creator'), 'bonsai');
  expect(view.queryByText('Danza · 2')).toBeNull();
  expect(view.getByText('3 preferenze ricevute')).toBeTruthy();
});
