import { CreatorPreferences } from '../../src/components/CreatorPreferences';
import React from 'react';
import { Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Label, Title, Button, ErrorState, Loading } from '../../src/components/ui';
import { rpc } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import { useAction } from '../../src/hooks/useAction';
import { colors as c } from '../../src/theme/tokens';
type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  isFollowing: boolean;
  isFriend: boolean;
  contentCount: number;
  followerCount: number;
};
export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const action = useAction();
  const q = useQuery({
    queryKey: ['profile', id, user?.id],
    queryFn: () => rpc<Profile>('profile', { userId: id }),
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const p = q.data;
  const perform = (name: string) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    void action.run(
      name,
      { userId: id, ...(name === 'follow_toggle' ? { following: !p.isFollowing } : {}) },
      () => {
        if (name === 'friend_request')
          Alert.alert('Richiesta inviata', 'La richiesta è disponibile al tuo amico.');
        void q.refetch();
      },
    );
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: `@${p.handle}` }} />
      <Title>{p.display_name}</Title>
      <Label style={{ color: c.muted }}>@{p.handle}</Label>
      <Label>{p.bio || 'Qui per trovare il prossimo campione.'}</Label>
      <Label>
        {p.contentCount} creazioni approvate · {p.followerCount} follower
      </Label>
      <CreatorPreferences userId={id} />
      {id !== user?.id && (
        <>
          <Button
            title={p.isFollowing ? 'Non seguire più' : 'Segui questo creator'}
            busy={action.busy}
            onPress={() => perform('follow_toggle')}
          />
          <Button
            title={p.isFriend ? 'Siete amici · Vai ai confronti' : 'Chiedi l’amicizia'}
            secondary
            busy={action.busy}
            onPress={() => (p.isFriend ? router.push('/friends') : perform('friend_request'))}
          />
          <Button
            title="Blocca utente"
            secondary
            busy={action.busy}
            onPress={() =>
              Alert.alert(
                'Bloccare questo utente?',
                'Non vedrete più i rispettivi contenuti. Campioni e duelli incompatibili saranno invalidati.',
                [
                  { text: 'Annulla', style: 'cancel' },
                  {
                    text: 'Blocca',
                    style: 'destructive',
                    onPress: () => void action.run('block', { userId: id }, () => router.back()),
                  },
                ],
              )
            }
          />
        </>
      )}
      <Label style={{ color: c.muted, fontSize: 12 }}>
        I campioni personali richiedono consenso. Il follow non rende visibili i gusti privati.
      </Label>
    </Screen>
  );
}
