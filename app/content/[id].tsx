import React, { useState } from 'react';
import { View, Alert, Share, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Chip, ErrorState, Label, Loading, Screen, Title } from '../../src/components/ui';
import { mediaSource, rpc } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import { useVoting } from '../../src/features/voting';
import { useAction } from '../../src/hooks/useAction';
import { colors as c } from '../../src/theme/tokens';
import type { Category, MediaItem } from '../../src/types/domain';
export default function Content() {
  const { id, categoryId } = useLocalSearchParams<{ id: string; categoryId?: string }>();
  const [selected, setSelected] = useState(categoryId || '');
  const { user } = useSession();
  const vote = useVoting();
  const action = useAction();
  const q = useQuery({
    queryKey: ['content', id, selected, user?.id],
    queryFn: () =>
      rpc<MediaItem & { categories: { id: string; title: string }[] }>('content', {
        contentId: id,
        categoryId: selected || undefined,
      }),
  });
  const cats = useQuery({ queryKey: ['categories'], queryFn: () => rpc<Category[]>('categories') });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const item = q.data;
  const cat = selected || item.categoryId;
  const breadcrumb = [];
  let node = cats.data?.find((x) => x.id === cat);
  while (node) {
    breadcrumb.unshift(node.title);
    node = cats.data?.find((x) => x.id === node?.parent_id);
  }
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Guarda. Poi scegli.' }} />
      <Image
        source={mediaSource(item.mediaUrl)}
        style={{ width: '100%', aspectRatio: 2 / 3, borderRadius: 24 }}
        contentFit="contain"
        cachePolicy="memory"
        accessibilityLabel={item.title}
      />
      <Label style={{ fontSize: 11, color: c.cyan }}>{breadcrumb.join(' › ')}</Label>
      <Title style={{ fontSize: 22 }}>{item.title}</Title>
      <Pressable onPress={() => router.push(`/person/${item.authorId}`)}>
        <Label style={{ color: c.muted }}>@{item.handle}</Label>
      </Pressable>
      <Label>{item.caption}</Label>
      <Label style={{ fontSize: 12, color: c.cyan }}>
        {item.provenance === 'ai_generated'
          ? 'Creato con AI'
          : item.provenance === 'verified_real'
            ? 'Fotografia · provenienza dichiarata'
            : item.provenance === 'unknown'
              ? 'Origine non verificata'
              : 'Illustrazione originale'}{' '}
        ·{' '}
        {item.status === 'approved'
          ? 'Approvato'
          : item.status === 'pending_review'
            ? 'In revisione'
            : item.status === 'rejected'
              ? 'Rifiutato'
              : 'Non pubblico'}
      </Label>
      {!!item.reviewReason && <Label style={{ color: c.muted }}>Motivo: {item.reviewReason}</Label>}
      {item.categories.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {item.categories.map((x) => (
            <Chip
              key={x.id}
              title={x.title}
              selected={x.id === cat}
              onPress={() => setSelected(x.id)}
            />
          ))}
        </View>
      )}
      {item.status === 'approved' && cat && (
        <Button
          title="Mi piace"
          icon="heart"
          busy={vote.busy}
          onPress={() => void vote.vote(cat, item.id)}
        />
      )}
      {item.reference && (
        <Label style={{ fontSize: 12, color: c.cyan }}>
          {item.reference.label}: {item.reference.name}
        </Label>
      )}
      {item.reference?.url && (
        <Button
          title={item.reference.kind === 'website' ? 'Apri il sito' : 'Apri il link ufficiale'}
          secondary
          onPress={() =>
            void Linking.openURL(item.reference!.url!).catch(() =>
              Alert.alert('Link non aperto', 'Controlla la connessione e riprova.'),
            )
          }
        />
      )}
      <Button
        title="Condividi"
        secondary
        onPress={() =>
          void Share.share({
            message: `${item.title}\nvotilt://content/${item.id}?categoryId=${cat || ''}`,
          })
        }
      />
      <Button
        title="Segnala contenuto"
        secondary
        onPress={() => router.push(`/report?contentId=${id}`)}
      />
      {user?.id === item.authorId && (
        <Button
          title="Ritira la tua creazione"
          secondary
          busy={action.busy}
          onPress={() =>
            Alert.alert(
              'Ritirare il contenuto?',
              'I campioni attivi collegati saranno invalidati. Questa azione non elegge sostituti.',
              [
                { text: 'Annulla', style: 'cancel' },
                {
                  text: 'Ritira',
                  style: 'destructive',
                  onPress: () =>
                    void action.run('delete_content', { contentId: id }, () => router.back()),
                },
              ],
            )
          }
        />
      )}
    </Screen>
  );
}
