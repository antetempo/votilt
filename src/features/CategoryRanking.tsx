import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Label, Chip, Loading, ErrorState, Empty } from '../components/ui';
import { rpc, mediaSource } from '../lib/api';
import { useSession } from '../lib/session';
import type { MediaItem } from '../types/domain';
import { colors as c, fonts as f } from '../theme/tokens';
export function CategoryRanking({
  categoryId,
  query = '',
}: {
  categoryId: string;
  query?: string;
}) {
  const { user } = useSession();
  const [metric, setMetric] = useState('popular');
  const q = useQuery({
    queryKey: ['ranking', categoryId, metric, query, user?.id],
    queryFn: () =>
      rpc<{ items: (MediaItem & { position: number })[]; insufficientHistory: boolean }>(
        'ranking',
        { categoryId, metric, query },
      ),
  });
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[
          ['popular', 'Like'],
          ['elo', 'Duelli'],
          ['trend', 'Trend 7g'],
        ].map(([key, title]) => (
          <Chip key={key} title={title} selected={metric === key} onPress={() => setMetric(key)} />
        ))}
      </View>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.data.insufficientHistory ? (
        <Empty title="Dati in accumulo" body="Il trend apparirà con abbastanza storico." />
      ) : !q.data.items.length ? (
        <Empty title={query ? 'Nessun risultato.' : 'Ancora nessun like.'} />
      ) : (
        q.data.items.map((x) => (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            accessibilityLabel={x.position + '. ' + x.title}
            onPress={() =>
              router.push({ pathname: '/content/[id]', params: { id: x.id, categoryId, metric } })
            }
            style={{
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Label
              style={{
                width: 25,
                fontFamily: f.medium,
                fontSize: 15,
                color: x.position === 1 ? c.purple : c.muted,
              }}
            >
              {x.position}
            </Label>
            <Image
              source={mediaSource(x.mediaUrl)}
              style={{ width: 56, height: 68, borderRadius: 12 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={{ flex: 1, gap: 5 }}>
              <Label numberOfLines={2} style={{ fontSize: 14, fontFamily: f.semibold }}>
                {x.title}
              </Label>
              <Label style={{ fontSize: 11, color: c.muted }}>@{x.handle}</Label>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 3 }}>
              <Label style={{ fontSize: 16, fontFamily: f.semibold }}>
                {metric === 'elo'
                  ? Math.round(x.rating || 1500)
                  : metric === 'trend'
                    ? ((x.trend || 0) > 0 ? '+' : '') + (x.trend || 0)
                    : x.support}
              </Label>
              <Label style={{ fontSize: 10, color: c.muted }}>
                {metric === 'elo' ? 'Elo' : metric === 'trend' ? 'netti' : 'like'}
              </Label>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );
}
