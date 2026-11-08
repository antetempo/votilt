import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Input, Label, Button } from '../../src/components/ui';
import { useSession } from '../../src/lib/session';
import { useAction } from '../../src/hooks/useAction';
import { CategoryRanking } from '../../src/features/CategoryRanking';
import { rpc } from '../../src/lib/api';
import type { Category } from '../../src/types/domain';
import { colors } from '../../src/theme/tokens';
export default function CategoryPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useSession();
  const action = useAction();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const categories = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => rpc<Category[]>('categories'),
  });
  const category = categories.data?.find((item) => item.id === id);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: category?.title || 'Categoria' }} />
      <View style={{ padding: 16, gap: 10 }}>
        <Label style={{ color: colors.cyan, fontSize: 12, lineHeight: 17 }}>
          {category?.path?.join(' › ') || category?.title}
        </Label>
        <Label style={{ color: colors.muted, fontSize: 11 }}>
          Preferenze dirette ai creator in questa categoria, senza sommare le sottocategorie.
        </Label>
        <Button
          secondary
          title={category?.isFollowing ? 'Non seguire più la categoria' : 'Segui categoria'}
          busy={action.busy}
          onPress={() => {
            if (!user) {
              router.push('/(auth)/login');
              return;
            }
            void action.run('category_follow', {
              categoryId: id,
              following: !category?.isFollowing,
            });
          }}
        />
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
