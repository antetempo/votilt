import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Input } from '../../src/components/ui';
import { CategoryRanking } from '../../src/features/CategoryRanking';
import { rpc } from '../../src/lib/api';
import type { Category } from '../../src/types/domain';
import { colors } from '../../src/theme/tokens';
export default function CategoryPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const category = categories.data?.find((item) => item.id === id);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: category?.title || 'Categoria' }} />
      <View style={{ padding: 16 }}>
        <Input
          label="Cerca in questa categoria"
          placeholder="Nome o riferimento"
          value={search}
          onChangeText={setSearch}
          maxLength={80}
        />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
      >
        <CategoryRanking categoryId={id} query={term} />
      </ScrollView>
    </View>
  );
}
