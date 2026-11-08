import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomNavigation } from '../../src/components/BottomNavigation';
const mockNavigate = jest.fn();
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
}));
jest.mock('expo-router', () => ({
  useSegments: () => ['content', '[id]'],
  useRootNavigationState: () => ({
    routes: [
      {
        name: '(tabs)',
        state: {
          index: 3,
          routes: [
            { name: 'index' },
            { name: 'explore' },
            { name: 'create' },
            { name: 'rankings' },
            { name: 'profile' },
          ],
        },
      },
    ],
  }),
}));
jest.mock('../../src/lib/navigation', () => ({
  useAppNavigation: () => ({ navigate: mockNavigate, busy: false }),
}));
test('i cinque comandi restano presenti sul dettaglio esterno alle tab e riportano alla sezione', async () => {
  const view = await render(<BottomNavigation />);
  expect(view.getAllByRole('tab')).toHaveLength(5);
  expect(view.getByLabelText('Classifiche').props.accessibilityState.selected).toBe(true);
  await fireEvent.press(view.getByLabelText('Feed'));
  expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
});
