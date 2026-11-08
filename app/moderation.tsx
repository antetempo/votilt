import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import {
  Screen,
  Title,
  Label,
  Input,
  Button,
  Card,
  Empty,
  Loading,
  ErrorState,
  Chip,
} from '../src/components/ui';
import { rpc, mediaSource } from '../src/lib/api';
import { useSession } from '../src/lib/session';
import { useAction } from '../src/hooks/useAction';
import type { MediaItem } from '../src/types/domain';
import { colors as c } from '../src/theme/tokens';
type Queue = {
  contents: MediaItem[];
  users: { id: string; handle: string; suspended: boolean }[];
  reports: { id: string; content_id: string; reason: string }[];
  suggestions: { id: string; title: string; description: string }[];
  audit: { id: string; action: string; reason: string; created_at: string }[];
};
export default function Moderation() {
  const { user } = useSession();
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending_review');
  const action = useAction();
  const allowed = !!user && user.role !== 'user';
  const q = useQuery({
    queryKey: ['moderation', user?.id, status, search],
    queryFn: () => rpc<Queue>('moderation', { status, search }),
    enabled: allowed,
  });
  if (!allowed)
    return (
      <Screen>
        <Empty
          title="Area riservata al team autorizzato."
          body="Il server verifica i permessi per ogni decisione."
          action="Torna al profilo"
          onPress={() => router.replace('/(tabs)/profile')}
        />
      </Screen>
    );
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const act = (name: string, p: Record<string, unknown>) => {
    if (reason.trim().length < 3) {
      Alert.alert('Serve una motivazione', 'Scrivi almeno 3 caratteri prima di decidere.');
      return;
    }
    void action.run(name, { ...p, reason });
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Moderazione · VOTILT' }} />
      <Title>Prendiamocene cura.</Title>
      <Input
        label="Cerca nella coda"
        value={search}
        onChangeText={setSearch}
        placeholder="Nome, riferimento o categoria"
      />
      <Input
        label="Motivazione della decisione"
        value={reason}
        onChangeText={setReason}
        maxLength={500}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          ['pending_review', 'In attesa'],
          ['approved', 'Pubblicati'],
          ['hidden', 'Nascosti'],
          ['rejected', 'Rifiutati'],
        ].map(([value, label]) => (
          <Chip
            key={value}
            title={label}
            selected={status === value}
            onPress={() => setStatus(value)}
          />
        ))}
      </View>
      <Title style={{ fontSize: 22 }}>Contenuti · {q.data.contents.length}</Title>
      {q.data.contents
        .filter((x) =>
          (
            x.title +
            ' ' +
            (x.references || [])
              .map((r) => r.name + ' ' + r.categoryTitle + ' ' + (r.url || ''))
              .join(' ')
          )
            .toLowerCase()
            .includes(search.toLowerCase()),
        )
        .map((x) => (
          <Card key={x.id}>
            <Image
              source={mediaSource(x.mediaUrl)}
              style={{ width: '100%', height: 250, borderRadius: 18 }}
              contentFit="contain"
              cachePolicy="none"
            />
            <Title style={{ fontSize: 22 }}>{x.title}</Title>
            {x.references?.map((ref) => (
              <View key={ref.categoryId} style={{ gap: 4 }}>
                <Label style={{ fontSize: 12, color: c.cyan }}>{ref.categoryTitle}</Label>
                <Label>
                  {ref.label}: {ref.name}
                </Label>
                {ref.url && <Label style={{ fontSize: 12, color: c.muted }}>{ref.url}</Label>}
              </View>
            ))}
            <Label>
              @{x.handle} · {x.kind}
            </Label>
            <Label style={{ fontSize: 12, color: c.muted }}>{x.caption}</Label>
            <Button
              title={status === 'hidden' || status === 'rejected' ? 'Ripristina' : 'Approva'}
              disabled={status === 'approved'}
              busy={action.busy}
              onPress={() => act('moderate', { contentId: x.id, decision: 'approved' })}
            />
            <Button
              title="Nascondi"
              secondary
              disabled={status === 'hidden'}
              busy={action.busy}
              onPress={() => act('moderate', { contentId: x.id, decision: 'hidden' })}
            />
            <Button
              title="Rifiuta"
              secondary
              busy={action.busy}
              onPress={() => act('moderate', { contentId: x.id, decision: 'rejected' })}
            />
          </Card>
        ))}
      {!q.data.contents.length && (
        <Label style={{ color: c.muted }}>La coda dei contenuti è vuota.</Label>
      )}
      <Title style={{ fontSize: 22 }}>Segnalazioni · {q.data.reports.length}</Title>
      {q.data.reports.map((r) => (
        <Card key={r.id}>
          <Label>{r.reason}</Label>
          <Button
            title="Apri contenuto"
            secondary
            onPress={() => router.push(`/content/${r.content_id}`)}
          />
          <Button
            title="Nascondi contenuto"
            busy={action.busy}
            onPress={() => act('moderate', { contentId: r.content_id, decision: 'hidden' })}
          />
          <Button
            title="Archivia segnalazione"
            secondary
            busy={action.busy}
            onPress={() => act('dismiss_report', { reportId: r.id })}
          />
        </Card>
      ))}
      <Title style={{ fontSize: 22 }}>Proposte categorie</Title>
      {q.data.suggestions.map((s) => (
        <Card key={s.id}>
          <Label>{s.title}</Label>
          <Label style={{ fontSize: 12, color: c.muted }}>{s.description}</Label>
          <Button
            title="Approva categoria"
            busy={action.busy}
            onPress={() => act('moderate_suggestion', { suggestionId: s.id, decision: 'approved' })}
          />
          <Button
            title="Rifiuta proposta"
            secondary
            busy={action.busy}
            onPress={() => act('moderate_suggestion', { suggestionId: s.id, decision: 'rejected' })}
          />
        </Card>
      ))}
      <Title style={{ fontSize: 22 }}>Audit decisioni</Title>
      {q.data.users
        .filter((x) => x.id !== user.id)
        .map((x) => (
          <Card key={x.id}>
            <Label>
              @{x.handle} · {x.suspended ? 'Sospeso' : 'Attivo'}
            </Label>
            <Button
              title={x.suspended ? 'Riattiva utente' : 'Sospendi utente'}
              secondary
              busy={action.busy}
              onPress={() => act('suspend_user', { userId: x.id, suspended: !x.suspended })}
            />
          </Card>
        ))}
      {q.data.audit.map((x) => (
        <Card key={x.id}>
          <Label>{x.action}</Label>
          <Label style={{ fontSize: 12, color: c.muted }}>
            {x.reason} · {new Date(x.created_at).toLocaleString('it-IT')}
          </Label>
        </Card>
      ))}
    </Screen>
  );
}
