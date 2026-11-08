import React, { useState, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, Title, Label, Input, Loading, ErrorState, Empty } from '../../src/components/ui';
import { Icon } from '../../src/components/Icon';
import { rpc } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import { colors as c, fonts as f } from '../../src/theme/tokens';
type Row = {
  id: string;
  title: string;
  description: string;
  voteCount: number;
  contentCount: number;
};
export default function Rankings() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const q = useQuery({
    queryKey: ['category-rankings', term, user?.id],
    queryFn: () => rpc<Row[]>('category_rankings', { query: term }),
  });
  return (
    <Screen>
      <Title style={{ fontSize: 24 }}>Classifiche</Title>
      <Input
        label="Cerca una categoria"
        placeholder="Quale categoria vuoi vedere?"
        value={search}
        onChangeText={setSearch}
        maxLength={80}
      />
      <Label style={{ fontSize: 13, color: c.muted }}>
        {term ? 'Risultati' : 'Le categorie più votate'}
      </Label>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : !q.data.length ? (
        <Empty title="Nessuna categoria trovata." />
      ) : (
        q.data.map((x, i) => (
          <Pressable
            key={x.id}
            accessibilityRole="button"
            accessibilityLabel={'Classifica ' + x.title}
            onPress={() =>
              router.push({ pathname: '/category/[id]', params: { id: x.id, view: 'ranking' } })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: c.border,
            }}
          >
            <Label style={{ width: 24, color: c.muted, fontFamily: f.medium, fontSize: 15 }}>
              {i + 1}
            </Label>
            <View style={{ flex: 1, gap: 4 }}>
              <Label style={{ fontFamily: f.semibold, fontSize: 15 }}>{x.title}</Label>
              <Label style={{ fontSize: 11, color: c.muted }}>
                {x.voteCount} like · {x.contentCount} immagini
              </Label>
            </View>
            <Icon name="chevron" size={18} color={c.muted} />
          </Pressable>
        ))
      )}
    </Screen>
  );
}
