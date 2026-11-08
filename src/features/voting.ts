import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { ApiError, rpc, getToken } from '../lib/api';
import { queryClient, useSession } from '../lib/session';
import type { VoteResult } from '../types/domain';

let processing = false;
export async function votingOperation(
  userId: string,
  action: string,
  input: Record<string, string>,
) {
  const key = `votilt.op.${userId}.${action}`;
  const originalToken = getToken();
  const assertSameSession = () => {
    if (getToken() !== originalToken) throw new ApiError('AUTH_REQUIRED', true);
  };
  const saved = await SecureStore.getItemAsync(key);
  let pending: { input: Record<string, string>; id: string } | null = saved
    ? JSON.parse(saved)
    : null;
  if (pending && JSON.stringify(pending.input) !== JSON.stringify(input)) {
    // Resolve uncertain previous action before creating an unrelated action in the same channel.
    try {
      assertSameSession();
      await rpc<VoteResult>(action, { ...pending.input, clientOperationId: pending.id });
    } catch (error) {
      if (!(error instanceof ApiError) || error.uncertain) throw error;
    }
    await SecureStore.deleteItemAsync(key);
    pending = null;
  }
  if (!pending) {
    pending = { input, id: Crypto.randomUUID() };
    await SecureStore.setItemAsync(key, JSON.stringify(pending));
  }
  try {
    assertSameSession();
    const result = await rpc<VoteResult>(action, { ...input, clientOperationId: pending.id });
    assertSameSession();
    await SecureStore.deleteItemAsync(key);
    return result;
  } catch (e) {
    if (e instanceof ApiError && !e.uncertain) await SecureStore.deleteItemAsync(key);
    throw e;
  }
}
export async function invalidateVoting() {
  await Promise.all(
    [
      'champions',
      'ranking',
      'category-rankings',
      'history',
      'feed',
      'daily',
      'duel',
      'profile',
    ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
  );
}
export function useVoting() {
  const { user, offline } = useSession();
  const [busy, setBusy] = useState(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const vote = async (categoryId: string, contentId: string) => {
    if (offline) {
      Alert.alert(
        'Connessione necessaria',
        'Il tuo voto non è stato inviato. Riprova quando torni online.',
      );
      return;
    }
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (processing) return;
    processing = true;
    setBusy(true);
    try {
      const result = await votingOperation(user.id, 'vote_intent', { categoryId, contentId });
      await invalidateVoting();
      // A response may outlive the screen (e.g. Android recreates it after a font change).
      if (!active.current) return;
      if (user.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (result.kind === 'TILT_REQUIRED') router.push(`/duel/${result.duelId}`);
    } catch (e) {
      if (active.current) Alert.alert('Voto non completato', (e as Error).message);
    } finally {
      processing = false;
      if (active.current) setBusy(false);
    }
  };
  return { vote, busy };
}
