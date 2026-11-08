import React, { useState } from 'react';
import { View, Share, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  Title,
  Label,
  Input,
  Card,
  Button,
  Chip,
  Loading,
  ErrorState,
  Empty,
} from '../src/components/ui';
import { rpc } from '../src/lib/api';
import { useSession } from '../src/lib/session';
import { useAction } from '../src/hooks/useAction';
import { colors as c, fonts as f } from '../src/theme/tokens';
import type { MediaItem } from '../src/types/domain';
type Person = {
  id: string;
  handle: string;
  display_name: string;
  is_friend: boolean;
  is_following: boolean;
};
type Social = { people: Person[]; requests: { id: string; handle: string }[]; outgoing: string[] };
export default function Friends() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const action = useAction();
  const q = useQuery({
    queryKey: ['social', user?.id, search],
    queryFn: () => rpc<Social>('social', { search }),
    enabled: !!user,
  });
  const champions = useQuery({
    queryKey: ['champions', user?.id],
    queryFn: () => rpc<MediaItem[]>('champions'),
    enabled: !!user,
  });
  const match = useQuery({
    queryKey: ['match', user?.id, selected],
    queryFn: () =>
      rpc<{ common: number; same: number; percentage: number | null }>('taste_match', {
        userId: selected,
      }),
    enabled: !!user && !!selected,
  });
  if (!user)
    return (
      <Screen>
        <Empty
          title="I gusti si incontrano qui."
          action="Accedi"
          onPress={() => router.push('/(auth)/login')}
        />
      </Screen>
    );
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Amici & Friends Battle' }} />
      <Title>Stesso vibe?</Title>
      <Label style={{ color: c.muted }}>
        Segui chi ti ispira. Confronta i campioni solo quando lo volete entrambi.
      </Label>
      <Input
        label="Cerca un utente"
        placeholder="Nome utente"
        value={search}
        onChangeText={setSearch}
      />
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : (
        <>
          {q.data.requests.length > 0 && <Title style={{ fontSize: 22 }}>Ti cercano</Title>}
          {q.data.requests.map((r) => (
            <Card key={r.id}>
              <Label>@{r.handle} vorrebbe essere tuo amico.</Label>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title="Accetta"
                  busy={action.busy}
                  onPress={() =>
                    void action.run('friend_answer', { requestId: r.id, accept: true })
                  }
                />
                <Button
                  title="Rifiuta"
                  secondary
                  busy={action.busy}
                  onPress={() =>
                    void action.run('friend_answer', { requestId: r.id, accept: false })
                  }
                />
              </View>
            </Card>
          ))}
          {q.data.people.map((p) => (
            <Card key={p.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View>
                  <Label style={{ fontFamily: f.semibold, fontSize: 18 }}>{p.display_name}</Label>
                  <Label style={{ color: c.muted, fontSize: 12 }}>@{p.handle}</Label>
                </View>
                <Button title="Profilo" secondary onPress={() => router.push(`/person/${p.id}`)} />
              </View>
              <Button
                title={
                  p.is_friend
                    ? 'Confronta i gusti'
                    : q.data.outgoing.includes(p.id)
                      ? 'Richiesta inviata'
                      : 'Chiedi l’amicizia'
                }
                secondary
                disabled={q.data.outgoing.includes(p.id)}
                busy={action.busy}
                onPress={() =>
                  p.is_friend
                    ? setSelected(p.id)
                    : void action.run('friend_request', { userId: p.id })
                }
              />
            </Card>
          ))}
          {!q.data.people.length && (
            <Empty title="Nessun utente trovato." body="Prova un altro nome utente." />
          )}
        </>
      )}
      {selected && (
        <Card>
          <Title style={{ fontSize: 22 }}>Taste Match</Title>
          {match.isPending ? (
            <Loading />
          ) : match.error ? (
            <Label style={{ color: c.muted }}>{match.error.message}</Label>
          ) : (
            match.data && (
              <>
                <Label style={{ fontFamily: f.display, fontSize: 38, color: c.purple }}>
                  {match.data.percentage === null
                    ? 'Ancora pochi voti'
                    : `${match.data.percentage}%`}
                </Label>
                <Label>
                  {match.data.same} su {match.data.common} categorie in comune
                </Label>
              </>
            )
          )}
          <Label style={{ fontSize: 12, color: c.muted }}>
            Scegli una categoria e crea un invito valido per 24 ore. Il consenso viene verificato di
            nuovo quando lo aprite.
          </Label>
          <View style={{ gap: 8 }}>
            {champions.data?.slice(0, 8).map((x) => (
              <Chip
                key={x.categoryId}
                title={x.categoryTitle}
                selected={cat === x.categoryId}
                onPress={() => setCat(x.categoryId)}
              />
            ))}
          </View>
          <Button
            title="Crea Friends Battle"
            disabled={!cat || !!match.error}
            busy={action.busy}
            onPress={() =>
              void action.run<{ id: string; url: string }>(
                'create_battle',
                { userId: selected, categoryId: cat },
                (data) => {
                  Alert.alert(
                    'Invito creato',
                    'Apri il confronto o condividi il codice con il tuo amico.',
                    [
                      { text: 'Apri', onPress: () => router.push(`/battle/${data.id}`) },
                      { text: 'Condividi', onPress: () => void Share.share({ message: data.url }) },
                    ],
                  );
                },
              )
            }
          />
          <Button
            title="Gestisci consenso confronto"
            secondary
            onPress={() => router.push('/settings')}
          />
        </Card>
      )}
    </Screen>
  );
}
