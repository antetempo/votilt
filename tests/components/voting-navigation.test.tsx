import { act, renderHook, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { rpc } from '../../src/lib/api';
import { useVoting } from '../../src/features/voting';
import type { VoteResult } from '../../src/types/domain';
jest.mock('../../src/lib/api', () => ({
  ...jest.requireActual('../../src/lib/api'),
  rpc: jest.fn(),
  getToken: () => 'session',
}));
jest.mock('../../src/lib/session', () => ({
  useSession: () => ({ user: { id: 'viewer', settings: { haptics: false } }, offline: false }),
  queryClient: { invalidateQueries: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'operation' }));
test('una risposta dopo smontaggio non apre il TILT su un router ricreato da Android', async () => {
  let finish!: (value: VoteResult) => void;
  jest.mocked(rpc).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const hook = await renderHook(() => useVoting());
  let pending!: Promise<void>;
  await act(async () => {
    pending = hook.result.current.vote('category', 'image');
  });
  await waitFor(() => expect(rpc).toHaveBeenCalledTimes(1));
  await hook.unmount();
  finish({ kind: 'TILT_REQUIRED', duelId: 'duel', receiptId: 'receipt' });
  await pending;
  expect(router.push).not.toHaveBeenCalled();
});
