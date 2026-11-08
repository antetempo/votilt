import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import DuelScreen from '../../app/duel/[id]';
import { votingOperation, invalidateVoting } from '../../src/features/voting';
let mockOffline = false;
const mockRefetch = jest.fn();
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'duel' }),
  useFocusEffect: (effect: () => void) =>
    jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));
jest.mock('../../src/lib/session', () => ({
  useSession: () => ({
    user: { id: 'viewer', settings: { reduce_motion: true } },
    offline: mockOffline,
  }),
}));
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => false }));
jest.mock('../../src/features/voting', () => ({
  votingOperation: jest.fn(),
  invalidateVoting: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    isPending: false,
    refetch: mockRefetch,
    data: {
      id: 'duel',
      status: 'pending',
      expires_at: '2099-01-01',
      incumbent: { id: 'a', title: 'Prima' },
      challenger: { id: 'b', title: 'Seconda' },
    },
  }),
}));
jest.mock('../../src/features/TiltArena', () => ({
  TiltArena: (props: {
    onPick: (side: string) => void;
    onCancel: () => void;
    busy: boolean;
    confirmed: boolean;
    error: string;
  }) => {
    const { View, Text, Pressable } =
      jest.requireActual<typeof import('react-native')>('react-native');
    return (
      <View>
        <Text>{props.confirmed ? 'confirmed' : 'unconfirmed'}</Text>
        <Text>{props.error}</Text>
        <Pressable
          accessibilityLabel="Scegli Seconda"
          disabled={props.busy}
          onPress={() => props.onPick('CHALLENGER')}
        >
          <Text>Seconda</Text>
        </Pressable>
        <Pressable accessibilityLabel="Annulla TILT" disabled={props.busy} onPress={props.onCancel}>
          <Text>X</Text>
        </Pressable>
      </View>
    );
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockOffline = false;
  jest.mocked(votingOperation).mockResolvedValue({ kind: 'TILT_RESOLVED', receiptId: 'receipt' });
  jest.mocked(invalidateVoting).mockResolvedValue();
});
test('un doppio tocco invia una scelta sola; successo e uscita attendono la ricevuta reale', async () => {
  let complete!: (value: { kind: 'TILT_RESOLVED'; receiptId: string }) => void;
  jest.mocked(votingOperation).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  const view = await render(<DuelScreen />);
  await fireEvent.press(view.getByLabelText('Scegli Seconda'));
  await fireEvent.press(view.getByLabelText('Scegli Seconda'));
  expect(votingOperation).toHaveBeenCalledTimes(1);
  expect(votingOperation).toHaveBeenCalledWith('viewer', 'resolve_tilt', {
    duelId: 'duel',
    winnerSide: 'CHALLENGER',
  });
  expect(view.getByText('unconfirmed')).toBeTruthy();
  expect(router.back).not.toHaveBeenCalled();
  complete({ kind: 'TILT_RESOLVED', receiptId: 'receipt' });
  await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
  expect(invalidateVoting).toHaveBeenCalled();
});
test('risposta fallita non mostra vittoria e consente di riprovare la scelta', async () => {
  jest.mocked(votingOperation).mockRejectedValueOnce(new Error('Riprova la connessione'));
  const view = await render(<DuelScreen />);
  await fireEvent.press(view.getByLabelText('Scegli Seconda'));
  await waitFor(() => expect(view.getByText('Riprova la connessione')).toBeTruthy());
  expect(view.getByText('unconfirmed')).toBeTruthy();
  expect(router.back).not.toHaveBeenCalled();
  await fireEvent.press(view.getByLabelText('Scegli Seconda'));
  await waitFor(() => expect(router.back).toHaveBeenCalled());
  expect(votingOperation).toHaveBeenCalledTimes(2);
});
test('offline non invia il voto; la X annulla attraverso la stessa operazione idempotente', async () => {
  mockOffline = true;
  const view = await render(<DuelScreen />);
  await fireEvent.press(view.getByLabelText('Scegli Seconda'));
  expect(votingOperation).not.toHaveBeenCalled();
  expect(view.getByText(/non è stato inviato/)).toBeTruthy();
  mockOffline = false;
  await fireEvent.press(view.getByLabelText('Annulla TILT'));
  expect(votingOperation).toHaveBeenCalledWith('viewer', 'cancel_tilt', { duelId: 'duel' });
  await waitFor(() => expect(router.back).toHaveBeenCalledTimes(1));
});
