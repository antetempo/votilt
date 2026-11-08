import React from 'react';
import { Pressable, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import {
  AppNavigationProvider,
  useAppNavigation,
  useAppNavigationGuard,
} from '../../src/lib/navigation';
const mockGuard = jest.fn();
let mockFocused = true;
jest.mock('expo-router', () => ({
  router: { navigate: jest.fn() },
  useFocusEffect: (effect: () => void) =>
    jest
      .requireActual<typeof React>('react')
      .useEffect(() => (mockFocused ? effect() : undefined), [effect, mockFocused]),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockFocused = true;
});
function Controls() {
  useAppNavigationGuard(mockGuard);
  const navigation = useAppNavigation();
  return (
    <Pressable onPress={() => void navigation?.navigate('/(tabs)/rankings')}>
      <Text>Cambia sezione</Text>
    </Pressable>
  );
}
test('non cambia sezione se una scelta è in invio; aspetta l’annullamento autorevole del confronto', async () => {
  mockGuard.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const view = await render(
    <AppNavigationProvider>
      <Controls />
    </AppNavigationProvider>,
  );
  await fireEvent.press(view.getByText('Cambia sezione'));
  await waitFor(() => expect(mockGuard).toHaveBeenCalledTimes(1));
  expect(router.navigate).not.toHaveBeenCalled();
  await fireEvent.press(view.getByText('Cambia sezione'));
  await waitFor(() => expect(router.navigate).toHaveBeenCalledWith('/(tabs)/rankings'));
});

test('un TILT ancora montato ma non più visibile non blocca le tab', async () => {
  mockGuard.mockResolvedValue(false);
  const view = await render(
    <AppNavigationProvider>
      <Controls />
    </AppNavigationProvider>,
  );
  await fireEvent.press(view.getByText('Cambia sezione'));
  await waitFor(() => expect(mockGuard).toHaveBeenCalledTimes(1));
  expect(router.navigate).not.toHaveBeenCalled();
  mockFocused = false;
  await view.rerender(
    <AppNavigationProvider>
      <Controls />
    </AppNavigationProvider>,
  );
  await fireEvent.press(view.getByText('Cambia sezione'));
  await waitFor(() => expect(router.navigate).toHaveBeenCalledWith('/(tabs)/rankings'));
  expect(mockGuard).toHaveBeenCalledTimes(1);
});
