import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Input, Label, Loading, ErrorState, Button } from './ui';
import { Icon } from './Icon';
import { rpc } from '../lib/api';
import { useSession } from '../lib/session';
import { categoryPath, suggestCategories } from '../utils/categories';
import type { Category, MediaItem } from '../types/domain';
import { colors as c, fonts as f } from '../theme/tokens';
import { MediaGrid } from './MediaGrid';

export function CategoryBrowser() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const [parent, setParent] = useState<string | null>(null);
  const q = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => rpc<Category[]>('categories'),
  });
  const categories = useMemo(() => q.data || [], [q.data]);
  const found = useQuery({
    queryKey: ['content-search', term, user?.id],
    queryFn: () => rpc<MediaItem[]>('search', { query: term }),
    enabled: term.length >= 2,
  });
  const selected = categories.find((item) => item.id === parent);
  const items = useMemo(
    () =>
      search.trim()
        ? suggestCategories(search, categories, 80)
        : categories.filter((item) => item.parent_id === parent),
    [categories, parent, search],
  );
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  return (
    <Screen scroll={false}>
      <View style={{ padding: 20, gap: 12 }}>
        <Label style={{ color: c.cyan, letterSpacing: 2, fontSize: 11 }}>
          OGNI PASSIONE HA IL SUO POSTO
        </Label>
        <Title>Esplora</Title>
        <Input
          label="Cerca un argomento"
          placeholder="FPS, bonsai, politica, palestra…"
          value={search}
          onChangeText={setSearch}
          maxLength={120}
        />
        {!search && (
          <Button secondary title="AI Universe" onPress={() => router.push('/ai-universe')} />
        )}
        {selected && !search && (
          <>
            <Button
              secondary
              title="Torna al ramo precedente"
              onPress={() => setParent(selected.parent_id)}
            />
            <Label style={{ color: c.cyan, fontSize: 12 }}>
              {categoryPath(selected, categories).join(' › ')}
            </Label>
            <Button
              title={'Classifica di ' + selected.title}
              onPress={() =>
                router.push({ pathname: '/category/[id]', params: { id: selected.id } })
              }
            />
            <Label style={{ color: c.muted, fontSize: 12 }}>
              Esplora le sottocategorie. Ogni categoria ha voti propri.
            </Label>
          </>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListFooterComponent={
          term.length >= 2 ? (
            <View style={{ gap: 12, paddingVertical: 18 }}>
              <Title style={{ fontSize: 21 }}>Immagini e riferimenti</Title>
              {found.isPending ? (
                <Loading />
              ) : found.error ? (
                <ErrorState error={found.error} retry={() => void found.refetch()} />
              ) : found.data?.length ? (
                <MediaGrid items={found.data} />
              ) : (
                <Label style={{ color: c.muted }}>Nessuna immagine trovata per questo testo.</Label>
              )}
            </View>
          ) : undefined
        }
        ListEmptyComponent={
          <Label style={{ color: c.muted }}>
            Nessuna categoria trovata. Prova un termine più ampio o un sinonimo.
          </Label>
        }
        renderItem={({ item }) => (
          <View
            style={{ borderBottomWidth: 1, borderColor: c.border, paddingVertical: 12, gap: 8 }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={'Classifica ' + item.title}
              onPress={() => router.push({ pathname: '/category/[id]', params: { id: item.id } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 }}
            >
              <Icon name="category" color={c.cyan} size={24} />
              <View style={{ flex: 1, gap: 4 }}>
                <Label style={{ fontFamily: f.semibold }}>{item.title}</Label>
                <Label style={{ color: c.muted, fontSize: 11, lineHeight: 16 }}>
                  {categoryPath(item, categories).join(' › ')}
                </Label>
              </View>
            </Pressable>
            {item.terminal === false && (
              <Button
                secondary
                title={'Esplora ' + item.title}
                onPress={() => {
                  setParent(item.id);
                  setSearch('');
                }}
              />
            )}
          </View>
        )}
      />
    </Screen>
  );
}
