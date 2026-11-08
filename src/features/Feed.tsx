import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlatList,
  View,
  StyleSheet,
  Pressable,
  Share,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useReducedMotion } from 'react-native-reanimated';
import { Button, Label, Empty, ErrorState } from '../components/ui';
import { Icon } from '../components/Icon';
import { mediaSource, rpc } from '../lib/api';
import { useSession, queryClient } from '../lib/session';
import { useVoting } from './voting';
import { colors as c, fonts as f } from '../theme/tokens';
import type { MediaItem } from '../types/domain';

export function Feed({ categoryId }: { categoryId?: string }) {
  const { user, offline, refresh } = useSession();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);
  const [mode, setMode] = useState('for_you');
  const [seed] = useState(() => {
    const cached = queryClient
      .getQueryCache()
      .findAll({ queryKey: ['feed', 'for_you'] })
      .find((q) => (q.queryKey[2] ?? null) === (categoryId ?? null) && q.queryKey[4] === user?.id);
    return typeof cached?.queryKey[3] === 'string' ? cached.queryKey[3] : Crypto.randomUUID();
  });
  const voting = useVoting();
  const systemReduceMotion = useReducedMotion();
  const list = useRef<FlatList<MediaItem>>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const q = useInfiniteQuery({
    queryKey: ['feed', mode, categoryId, seed, user?.id],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      rpc<{ items: MediaItem[]; nextOffset: number | null }>('feed', {
        mode,
        categoryId,
        offset: pageParam,
        limit: 12,
        seed,
      }),
    getNextPageParam: (last) => last.nextOffset ?? undefined,
  });
  const champions = useQuery({
    queryKey: ['champions', user?.id],
    queryFn: () => rpc<MediaItem[]>('champions'),
    enabled: !!user,
  });
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) || [], [q.data]);
  const latest = useRef({ items, user });
  useEffect(() => {
    latest.current = { items, user };
  }, [items, user]);
  const onViewable = useCallback(
    ({ viewableItems }: { viewableItems: { item: MediaItem; index?: number | null }[] }) => {
      const item = viewableItems[0]?.item;
      if (item) {
        if (latest.current.user)
          void rpc('impression', {
            contentId: item.id,
            categoryId: item.categoryId,
            sessionId: seed,
          }).catch(() => {});
        const i = latest.current.items.findIndex((x) => x.id === item.id);
        if (latest.current.items[i + 1]) {
          const source = mediaSource(latest.current.items[i + 1].mediaUrl);
          void Image.prefetch(source.uri, { headers: source.headers, cachePolicy: 'memory-disk' });
        }
      }
    },
    [seed],
  );
  return (
    <View
      style={{ flex: 1, backgroundColor: c.bg }}
      testID="feed-surface"
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {q.isPending ? (
        <ActivityIndicator color={c.purple} style={{ flex: 1 }} />
      ) : q.error && !items.length ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !items.length ? (
        <Empty
          title="Ancora nessuna immagine."
          action="Esplora"
          onPress={() => router.push('/(tabs)/explore')}
        />
      ) : (
        height > 0 && (
          <FlatList
            ref={list}
            data={items}
            keyExtractor={(i) => i.id + ':' + i.categoryId}
            pagingEnabled
            snapToInterval={height}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={5}
            getItemLayout={(_, i) => ({ length: height, offset: height * i, index: i })}
            onEndReached={() => {
              if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
            }}
            onEndReachedThreshold={0.7}
            viewabilityConfig={{ itemVisiblePercentThreshold: 60, minimumViewTime: 1000 }}
            onViewableItemsChanged={onViewable}
            renderItem={({ item, index }) => {
              const current =
                champions.data?.some((x) => x.categoryId === item.categoryId && x.id === item.id) ||
                false;
              return (
                <View style={{ height, backgroundColor: c.bg }}>
                  <Image
                    source={mediaSource(item.mediaUrl)}
                    style={StyleSheet.absoluteFill}
                    contentFit={item.kind === 'ai_tool' ? 'contain' : 'cover'}
                    cachePolicy="memory-disk"
                    accessibilityLabel={item.title}
                    transition={systemReduceMotion || user?.settings.reduce_motion ? 0 : 160}
                    onError={() => setMissing((x) => ({ ...x, [item.id]: true }))}
                  />
                  <LinearGradient
                    colors={['rgba(9,7,17,.4)', 'transparent', 'transparent', 'rgba(9,7,17,.8)']}
                    locations={[0, 0.15, 0.7, 1]}
                    style={StyleSheet.absoluteFill}
                  />
                  {missing[item.id] && (
                    <View
                      style={{ position: 'absolute', top: '40%', left: 24, right: 24, gap: 10 }}
                    >
                      <Label>Immagine non disponibile.</Label>
                      {index < items.length - 1 && (
                        <Button
                          title="Prossima immagine"
                          secondary
                          onPress={() =>
                            list.current?.scrollToIndex({
                              index: index + 1,
                              animated: !systemReduceMotion,
                            })
                          }
                        />
                      )}
                    </View>
                  )}
                  <View style={s.actions}>
                    <Pressable
                      testID="feed-like"
                      accessibilityRole="button"
                      accessibilityLabel={current ? 'Ti piace' : 'Mi piace'}
                      accessibilityState={{
                        selected: current,
                        disabled: offline || voting.busy,
                        busy: voting.busy,
                      }}
                      disabled={offline || voting.busy}
                      onPress={() => {
                        if (!current) void voting.vote(item.categoryId, item.id);
                      }}
                      style={s.touch}
                    >
                      {voting.busy ? (
                        <ActivityIndicator color={c.pink} />
                      ) : (
                        <Icon name="heart" size={30} color={current ? c.pink : c.text} />
                      )}
                    </Pressable>
                    <Action
                      name="share"
                      label="Condividi"
                      onPress={() =>
                        void Share.share({
                          message:
                            item.title +
                            ' · VOTILT\n' +
                            'votilt://content/' +
                            item.id +
                            '?categoryId=' +
                            item.categoryId,
                        })
                      }
                    />
                    <Action
                      name="more"
                      label="Altre opzioni"
                      onPress={() => {
                        if (!user) {
                          router.push('/(auth)/login');
                          return;
                        }
                        router.push({ pathname: '/report', params: { contentId: item.id } });
                      }}
                    />
                  </View>
                  <View style={s.caption}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'Dettaglio ' + item.title}
                      onPress={() =>
                        router.push({
                          pathname: '/content/[id]',
                          params: { id: item.id, categoryId: item.categoryId },
                        })
                      }
                    >
                      <Label numberOfLines={2} style={s.name}>
                        {item.title}
                      </Label>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'Profilo di ' + item.handle}
                      onPress={() =>
                        router.push({ pathname: '/person/[id]', params: { id: item.authorId } })
                      }
                    >
                      <Label style={s.byline}>
                        @{item.handle} ·{' '}
                        {item.provenance === 'ai_generated'
                          ? 'Creato con AI'
                          : item.provenance === 'unknown'
                            ? 'Origine non verificata'
                            : 'Originale'}
                      </Label>
                    </Pressable>
                    {!!item.caption?.trim() && (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                        <ScrollView
                          scrollEnabled={!!expanded[item.id]}
                          style={{ flex: 1, maxHeight: expanded[item.id] ? 140 : 22 }}
                        >
                          <Label
                            numberOfLines={expanded[item.id] ? undefined : 1}
                            style={{ fontSize: 12, lineHeight: 18, color: '#E5DFED' }}
                          >
                            {item.caption}
                          </Label>
                        </ScrollView>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            expanded[item.id] ? 'Riduci descrizione' : 'Espandi descrizione'
                          }
                          onPress={() => setExpanded((x) => ({ ...x, [item.id]: !x[item.id] }))}
                          style={{
                            minHeight: 24,
                            justifyContent: 'center',
                            alignSelf: 'flex-start',
                          }}
                        >
                          <Label style={{ fontSize: 11, color: c.muted }}>
                            {expanded[item.id] ? 'Meno' : 'Altro'}
                          </Label>
                        </Pressable>
                      </View>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={'Categoria ' + item.categoryTitle}
                      onPress={() =>
                        router.push({ pathname: '/category/[id]', params: { id: item.categoryId } })
                      }
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 32 }}
                    >
                      <Icon name="category" size={15} color={c.cyan} />
                      <Label numberOfLines={1} style={{ fontSize: 12, fontFamily: f.semibold }}>
                        {item.categoryTitle}
                      </Label>
                      <Icon name="chevron" size={12} />
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        )
      )}
      {!categoryId && (
        <View style={[s.header, { top: insets.top }]}>
          {[
            ['for_you', 'Per te'],
            ['following', 'Seguiti'],
            ['discover', 'Scopri'],
          ].map(([id, title]) => (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === id }}
              onPress={() => setMode(id)}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                borderBottomWidth: mode === id ? 2 : 0,
                borderBottomColor: c.text,
              }}
            >
              <Label
                style={{
                  fontSize: 14,
                  fontFamily: f.semibold,
                  color: mode === id ? c.text : '#C3BDCC',
                  textShadowColor: '#000',
                  textShadowRadius: 5,
                }}
              >
                {title}
              </Label>
            </Pressable>
          ))}
        </View>
      )}
      {offline && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Riprova connessione"
          onPress={() => void refresh()}
          style={{
            position: 'absolute',
            top: categoryId ? 8 : insets.top + 48,
            left: 16,
            right: 16,
            padding: 8,
            borderRadius: 10,
            backgroundColor: c.surface,
          }}
        >
          <Label style={{ fontSize: 11 }}>
            Offline · Contenuti recenti · Like sospesi · Riprova
          </Label>
        </Pressable>
      )}
    </View>
  );
}
function Action({ name, label, onPress }: { name: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={s.touch}
    >
      <Icon name={name} size={25} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  actions: { position: 'absolute', right: 8, bottom: 26, gap: 4 },
  touch: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  caption: { position: 'absolute', left: 16, right: 68, bottom: 14, gap: 5 },
  name: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: f.semibold,
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  byline: {
    fontSize: 11,
    lineHeight: 16,
    color: '#DDD6E9',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
});
