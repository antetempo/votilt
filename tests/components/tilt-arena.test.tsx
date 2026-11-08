import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TiltArena } from '../../src/features/TiltArena';
import type { MediaItem } from '../../src/types/domain';
// Native motion is checked on Android; this test checks the real arena's controls/copy.
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: jest.requireActual<typeof import('react-native')>('react-native').View },
  useSharedValue: (value: number) => ({ value }),
  useAnimatedStyle: () => ({}),
  withTiming: (value: number) => value,
  withSpring: (value: number) => value,
  withRepeat: () => 0,
  cancelAnimation: jest.fn(),
  Easing: { inOut: (value: unknown) => value, sin: jest.fn() },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 24, left: 0, right: 0 }),
}));
const image = (id: string, title: string) => ({ id, title, mediaUrl: '/media/' + id }) as MediaItem;
test('solo TILT visibile; entrambe le immagini restano scelte accessibili anche senza movimento', async () => {
  const onPick = jest.fn(),
    onCancel = jest.fn();
  const view = await render(
    <TiltArena
      incumbent={image('a', 'Prima')}
      challenger={image('b', 'Seconda')}
      selected={null}
      confirmed={false}
      busy={false}
      reducedMotion
      error=""
      onPick={onPick}
      onCancel={onCancel}
    />,
  );
  expect(view.getByText('TILT')).toBeTruthy();
  expect(view.queryByText('Prima')).toBeNull();
  expect(view.queryByText('Seconda')).toBeNull();
  expect(view.queryByText('Quale ti piace di più?')).toBeNull();
  await fireEvent.press(view.getByLabelText('Mantieni Prima'));
  await fireEvent.press(view.getByLabelText('Scegli Seconda'));
  expect(onPick.mock.calls).toEqual([['INCUMBENT'], ['CHALLENGER']]);
  await fireEvent.press(view.getByLabelText('Annulla TILT'));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
