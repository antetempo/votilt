import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Feed } from './Feed';
import { ErrorState, Loading, Screen } from '../components/ui';
import { rpc } from '../lib/api';
import { useSession } from '../lib/session';
import type { MediaItem } from '../types/domain';
import { colors } from '../theme/tokens';

export function ContentViewer() {
  const {
    id,
    categoryId,
    metric: requestedMetric,
  } = useLocalSearchParams<{ id: string; categoryId?: string; metric?: string }>();
  const { user } = useSession();
  const metric =
    requestedMetric === 'elo' || requestedMetric === 'trend' ? requestedMetric : 'popular';
  const content = useQuery({
    queryKey: ['content', id, categoryId, user?.id],
    queryFn: () =>
      rpc<MediaItem & { categories: { id: string; title: string }[] }>('content', {
        contentId: id,
        categoryId,
      }),
  });
  const category = categoryId || content.data?.categoryId;
  const ranked = useQuery({
    queryKey: ['ranking', category, metric, '', user?.id],
    queryFn: () =>
      rpc<{ items: MediaItem[]; insufficientHistory: boolean }>('ranking', {
        categoryId: category,
        metric,
      }),
    enabled: !!category && content.data?.status === 'approved',
  });
  const items = useMemo(() => {
    if (!content.data) return [];
    if (content.data.status !== 'approved') return [content.data];
    const siblings = ranked.data?.items || [];
    return siblings.some((item) => item.id === id)
      ? siblings.map((item) => (item.id === id ? { ...item, ...content.data } : item))
      : [content.data, ...siblings];
  }, [content.data, ranked.data, id]);
  const pending = content.isPending || (content.data?.status === 'approved' && ranked.isPending);
  const error = content.error || (content.data?.status === 'approved' && ranked.error);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ headerShown: false }} />
      {pending ? (
        <Loading />
      ) : error ? (
        <Screen>
          <ErrorState
            error={error}
            retry={() => {
              void content.refetch();
              void ranked.refetch();
            }}
          />
        </Screen>
      ) : (
        <Feed
          key={id + ':' + category + ':' + metric}
          categoryId={category}
          providedItems={items}
          initialContentId={id}
          showBack
          categoryChoices={content.data?.categories}
          onChooseCategory={(next) => router.setParams({ categoryId: next })}
        />
      )}
    </View>
  );
}
