import React, { useState, useEffect } from 'react';
import { View, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Input, Chip, Loading, ErrorState, Empty } from '../../src/components/ui';
import { MediaGrid } from '../../src/components/MediaGrid';
import { Feed } from '../../src/features/Feed';
import { CategoryRanking } from '../../src/features/CategoryRanking';
import { rpc } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import type { Category, MediaItem } from '../../src/types/domain';
import { colors as c } from '../../src/theme/tokens';
export default function CategoryPage() {
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const { user } = useSession();
  const [tab, setTab] = useState(view === 'ranking' ? 'ranking' : 'images');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => rpc<Category[]>('categories'),
  });
  const category = categories.data?.find((x) => x.id === id);
  const found = useQuery({
    queryKey: ['content-search', id, term, user?.id],
    queryFn: () => rpc<MediaItem[]>('search', { categoryId: id, query: term }),
    enabled: tab === 'images' && !!term,
  });
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: category?.title || 'Categoria' }} />
      <View style={{ padding: 16, gap: 10 }}>
        <Input
          label="Cerca in questa categoria"
          placeholder="Nome o riferimento"
          value={search}
          onChangeText={setSearch}
          maxLength={80}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Chip title="Immagini" selected={tab === 'images'} onPress={() => setTab('images')} />
          <Chip title="Classifica" selected={tab === 'ranking'} onPress={() => setTab('ranking')} />
        </View>
      </View>
      {tab === 'ranking' ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        >
          <CategoryRanking categoryId={id} query={term} />
        </ScrollView>
      ) : term ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {found.isPending ? (
            <Loading />
          ) : found.error ? (
            <ErrorState error={found.error} retry={() => void found.refetch()} />
          ) : found.data.length ? (
            <MediaGrid items={found.data} />
          ) : (
            <Empty title="Nessuna immagine trovata." />
          )}
        </ScrollView>
      ) : (
        <Feed categoryId={id} />
      )}
    </View>
  );
}
