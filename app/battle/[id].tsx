import React from 'react';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Label, Button, Loading, ErrorState } from '../../src/components/ui';
import { MediaGrid } from '../../src/components/MediaGrid';
import { rpc } from '../../src/lib/api';
import { useAction } from '../../src/hooks/useAction';
import type { MediaItem } from '../../src/types/domain';
import { useSession } from '../../src/lib/session';
export default function Battle() {
  const { user } = useSession();
  const { id } = useLocalSearchParams<{ id: string }>();
  const a = useAction();
  const q = useQuery({
    queryKey: ['battle', id, user?.id],
    enabled: !!user,
    queryFn: () =>
      rpc<{ categoryId: string; mine: MediaItem | null; friend: MediaItem | null }>('battle', {
        battleId: id,
      }),
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Friends Battle' }} />
      <Title>Due gusti. Un TILT.</Title>
      <Label>Il tuo campione</Label>
      {q.data.mine ? (
        <MediaGrid items={[q.data.mine]} />
      ) : (
        <Label>Non hai ancora scelto qui.</Label>
      )}
      <Label>Il campione del tuo amico</Label>
      {q.data.friend ? (
        <MediaGrid items={[q.data.friend]} />
      ) : (
        <Label>Il tuo amico non ha ancora scelto qui.</Label>
      )}
      <Button
        title="Esplora la categoria"
        onPress={() => router.push(`/category/${q.data.categoryId}`)}
      />
      <Button
        title="Revoca il tuo invito"
        secondary
        busy={a.busy}
        onPress={() => void a.run('revoke_battle', { battleId: id }, () => router.back())}
      />
    </Screen>
  );
}
