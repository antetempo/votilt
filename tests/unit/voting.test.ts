import * as SecureStore from 'expo-secure-store';
import { votingOperation } from '../../src/features/voting';
import { ApiError, rpc, getToken } from '../../src/lib/api';
jest.mock('../../src/lib/api', () => ({
  ...jest.requireActual('../../src/lib/api'),
  rpc: jest.fn(),
  getToken: jest.fn(() => 'session-A'),
}));
jest.mock('../../src/lib/session', () => ({
  queryClient: { invalidateQueries: jest.fn() },
  useSession: jest.fn(),
}));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'new-operation' }));
const mockedRpc = jest.mocked(rpc);
const saved = jest.mocked(SecureStore.getItemAsync);
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getToken).mockReturnValue('session-A');
});
test('un vecchio duello scaduto non blocca una nuova risoluzione', async () => {
  saved.mockResolvedValueOnce(
    JSON.stringify({ id: 'old-op', input: { duelId: 'old', winnerSide: 'CHALLENGER' } }),
  );
  mockedRpc
    .mockRejectedValueOnce(new ApiError('DUEL_EXPIRED'))
    .mockResolvedValueOnce({ kind: 'TILT_RESOLVED' });
  const result = await votingOperation('user', 'resolve_tilt', {
    duelId: 'new',
    winnerSide: 'CHALLENGER',
  });
  expect(result.kind).toBe('TILT_RESOLVED');
  expect(mockedRpc).toHaveBeenLastCalledWith('resolve_tilt', {
    duelId: 'new',
    winnerSide: 'CHALLENGER',
    clientOperationId: 'new-operation',
  });
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
});
test('risposta incerta mantiene operation ID e non avvia una seconda scelta', async () => {
  saved.mockResolvedValueOnce(
    JSON.stringify({ id: 'old-op', input: { duelId: 'old', winnerSide: 'INCUMBENT' } }),
  );
  mockedRpc.mockRejectedValueOnce(new ApiError('OFFLINE', true));
  await expect(
    votingOperation('user', 'resolve_tilt', { duelId: 'new', winnerSide: 'CHALLENGER' }),
  ).rejects.toThrow();
  expect(mockedRpc).toHaveBeenCalledTimes(1);
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
});
test('retry dello stesso gesto usa la stessa chiave dopo risposta persa', async () => {
  const input = { duelId: 'duel', winnerSide: 'CHALLENGER' };
  saved.mockResolvedValue(JSON.stringify({ id: 'same-op', input }));
  mockedRpc
    .mockRejectedValueOnce(new ApiError('OFFLINE', true))
    .mockResolvedValueOnce({ kind: 'TILT_RESOLVED' });
  await expect(votingOperation('user', 'resolve_tilt', input)).rejects.toThrow();
  await votingOperation('user', 'resolve_tilt', input);
  expect(mockedRpc).toHaveBeenNthCalledWith(1, 'resolve_tilt', {
    ...input,
    clientOperationId: 'same-op',
  });
  expect(mockedRpc).toHaveBeenNthCalledWith(2, 'resolve_tilt', {
    ...input,
    clientOperationId: 'same-op',
  });
});
