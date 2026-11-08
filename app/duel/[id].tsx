import React, { useCallback, useEffect, useState, useRef } from 'react';
import { BackHandler } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSession } from '../../src/lib/session';
import { rpc } from '../../src/lib/api';
import { invalidateVoting, votingOperation } from '../../src/features/voting';
import { TiltArena, type TiltSide } from '../../src/features/TiltArena';
import { Button, ErrorState, Label, Loading, Screen, Title } from '../../src/components/ui';
import type { Duel } from '../../src/types/domain';
import { colors as c } from '../../src/theme/tokens';

export default function DuelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, offline } = useSession();
  const systemReducedMotion = useReducedMotion();
  const reducedMotion = systemReducedMotion || !!user?.settings.reduce_motion;
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<TiltSide | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const mounted = useRef(true);
  const [heldDuel, setHeldDuel] = useState<Duel | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const q = useQuery({
    queryKey: ['duel', id, user?.id],
    queryFn: () => rpc<Duel | null>('duel', { duelId: id }),
    enabled: !!user,
  });
  const cancel = useCallback(async () => {
    if (submitting.current) return;
    if (!user) {
      router.back();
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await votingOperation(user.id, 'cancel_tilt', { duelId: id });
      await invalidateVoting();
      if (mounted.current) router.back();
    } catch (e) {
      if (mounted.current) {
        setError((e as Error).message);
        setBusy(false);
      }
      submitting.current = false;
    }
  }, [user, id]);
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void cancel();
      return true;
    });
    return () => sub.remove();
  }, [cancel]);
  const resolve = async (winnerSide: TiltSide) => {
    if (offline) {
      setError('Il tuo voto non è stato inviato. Riprova quando torni online.');
      return;
    }
    if (!user || submitting.current) return;
    submitting.current = true;
    setHeldDuel(q.data || null);
    setBusy(true);
    setSelected(winnerSide);
    setError('');
    try {
      await votingOperation(user.id, 'resolve_tilt', { duelId: id, winnerSide });
      if (!mounted.current) {
        await invalidateVoting();
        return;
      }
      setConfirmed(true);
      if (user.settings.haptics) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // The success choreography starts only after the authoritative receipt.
      await new Promise((done) => setTimeout(done, reducedMotion ? 0 : 540));
      await invalidateVoting();
      if (mounted.current) router.back();
    } catch (e) {
      if (mounted.current) {
        setError((e as Error).message);
        setBusy(false);
        setSelected(null);
        setConfirmed(false);
        void q.refetch();
      }
      submitting.current = false;
    }
  };
  if (!user)
    return (
      <Screen>
        <Title>Accedi per entrare in TILT.</Title>
        <Button title="Accedi" onPress={() => router.replace('/(auth)/login')} />
      </Screen>
    );
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const duel = busy ? heldDuel || q.data : q.data;
  const valid =
    duel?.status === 'pending' &&
    duel.incumbent &&
    duel.challenger &&
    new Date(duel.expires_at) > new Date();
  if (valid)
    return (
      <TiltArena
        incumbent={duel.incumbent!}
        challenger={duel.challenger!}
        selected={selected}
        confirmed={confirmed}
        busy={busy}
        reducedMotion={reducedMotion}
        error={error}
        onPick={(side) => void resolve(side)}
        onCancel={() => void cancel()}
      />
    );
  return (
    <Screen>
      <Title>TILT</Title>
      <Label>Questo TILT non è più disponibile.</Label>
      {!!error && (
        <Label accessibilityRole="alert" style={{ color: c.danger }}>
          {error}
        </Label>
      )}
      <Button title="Torna al feed" onPress={() => router.back()} />
    </Screen>
  );
}
