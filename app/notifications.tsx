import React from 'react';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  Title,
  Label,
  Card,
  Button,
  Empty,
  Loading,
  ErrorState,
} from '../src/components/ui';
import { rpc } from '../src/lib/api';
import { useSession } from '../src/lib/session';
import { useAction } from '../src/hooks/useAction';
import { colors as c } from '../src/theme/tokens';
type Notification = {
  id: string;
  title: string;
  type: string;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};
export default function Notifications() {
  const { user } = useSession();
  const a = useAction();
  const q = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => rpc<Notification[]>('notifications'),
    enabled: !!user,
  });
  const open = (n: Notification) => {
    void a.run('mark_notification', { notificationId: n.id }, () => {
      if (n.type === 'battle' && n.entity_id) router.push(`/battle/${n.entity_id}`);
      else if (n.type === 'content_review' && n.entity_id) router.push(`/content/${n.entity_id}`);
      else if (n.type.startsWith('friend')) router.push('/friends');
    });
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Le tue notifiche' }} />
      <Title>Cosa si muove?</Title>
      {!user ? (
        <Empty
          title="Accedi per le tue notifiche"
          action="Accedi"
          onPress={() => router.push('/(auth)/login')}
        />
      ) : q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data.length ? (
        <Empty
          title="Qui è tutto tranquillo."
          body="Richieste, sfide e novità delle tue creazioni arriveranno qui."
        />
      ) : (
        <>
          <Button
            title="Segna tutte come lette"
            secondary
            busy={a.busy}
            onPress={() => void a.run('mark_notification', {})}
          />
          {q.data.map((n) => (
            <Card key={n.id} style={{ borderColor: n.read_at ? c.border : c.purple }}>
              <Label>
                {n.read_at ? '' : '● '}
                {n.title}
              </Label>
              <Label style={{ fontSize: 11, color: c.muted }}>
                {new Date(n.created_at).toLocaleString('it-IT')}
              </Label>
              <Button
                title={n.type === 'welcome' ? 'Segna come letta' : 'Apri'}
                secondary
                busy={a.busy}
                onPress={() => open(n)}
              />
              <Button
                title="Rimuovi notifica"
                secondary
                busy={a.busy}
                onPress={() => void a.run('delete_notification', { notificationId: n.id })}
              />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
