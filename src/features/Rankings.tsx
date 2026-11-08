import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Empty, ErrorState, Input, Label, Loading, Screen, Title } from '../components/ui';
import { Icon } from '../components/Icon';
import { mediaSource, rpc } from '../lib/api';
import { useSession } from '../lib/session';
import type { MediaItem } from '../types/domain';
import { colors as c, fonts as f } from '../theme/tokens';

export type CategoryLeaderboard = {
  id: string;
  title: string;
  path: string[];
  voteCount: number;
  contentCount: number;
  suggested?: boolean;
  leader: (MediaItem & { support: number; position: 1 }) | null;
};

export function Rankings() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const q = useQuery({
    queryKey: ['category-rankings', 'image-leaders', term, user?.id],
    queryFn: () => rpc<CategoryLeaderboard[]>('category_rankings', { query: term }),
  });
  const open = (id: string) =>
    router.push({ pathname: '/category/[id]', params: { id, view: 'ranking' } });
  return (
    <Screen scroll={false}>
      <View style={{ padding: 24, paddingBottom: 16, gap: 16 }}>
        <Title>Classifiche</Title>
        <Input
          label="Cerca una categoria"
          placeholder="Vai alla categoria che cerchi"
          value={search}
          onChangeText={setSearch}
          maxLength={80}
        />
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingTop: 0, paddingBottom: 40, gap: 16 }}
      >
        <Label style={{ fontFamily: f.semibold, fontSize: 18 }}>
          {term
            ? q.data?.some((item) => item.suggested)
              ? 'Categorie suggerite'
              : 'Categorie trovate'
            : 'Al primo posto'}
        </Label>
        {!term && (
          <Label style={{ color: c.muted, fontSize: 13 }}>
            I creator più scelti, attraverso le loro immagini.
          </Label>
        )}
        {q.isPending ? (
          <Loading />
        ) : q.error ? (
          <ErrorState error={q.error} retry={() => void q.refetch()} />
        ) : !q.data.length ? (
          <Empty
            title={term ? 'Nessuna categoria trovata.' : 'I primi posti stanno per arrivare.'}
            body={
              term
                ? 'Prova il nome della categoria o di un ramo.'
                : 'Cerca una categoria e scegli il tuo creator preferito.'
            }
          />
        ) : term ? (
          q.data.map((category) => (
            <Pressable
              key={category.id}
              accessibilityRole="button"
              accessibilityLabel={'Classifica ' + category.title + ', ' + category.path.join(', ')}
              onPress={() => open(category.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 80,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: c.border,
              }}
            >
              {category.leader ? (
                <Image
                  source={mediaSource(category.leader.mediaUrl)}
                  contentFit="cover"
                  style={{ width: 56, height: 72, borderRadius: 12 }}
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    height: 72,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 12,
                    backgroundColor: c.surface,
                  }}
                >
                  <Icon name="category" size={24} color={c.purple} />
                </View>
              )}
              <View style={{ flex: 1, gap: 5 }}>
                <Label style={{ fontFamily: f.semibold }}>{category.title}</Label>
                <Label style={{ color: c.muted, fontSize: 11 }}>
                  {category.path.slice(0, -1).join(' › ')}
                </Label>
                {!category.leader && (
                  <Label style={{ color: c.muted, fontSize: 11 }}>Ancora nessun like</Label>
                )}
              </View>
              <Icon name="chevron" size={18} color={c.muted} />
            </Pressable>
          ))
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {q.data
              .filter((category) => category.leader)
              .map((category) => {
                const leader = category.leader!;
                return (
                  <Pressable
                    key={category.id}
                    accessibilityRole="button"
                    accessibilityLabel={
                      'Primo posto in ' +
                      category.title +
                      ': ' +
                      leader.title +
                      ', ' +
                      leader.support +
                      ' like. Apri classifica.'
                    }
                    onPress={() => open(category.id)}
                    style={{ width: '48%', gap: 7, marginBottom: 12 }}
                  >
                    <View
                      style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: c.surface }}
                    >
                      <Image
                        source={mediaSource(leader.mediaUrl)}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        style={{ width: '100%', aspectRatio: 3 / 4 }}
                      />
                      <View
                        style={{
                          position: 'absolute',
                          top: 9,
                          left: 9,
                          backgroundColor: c.purple,
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 10,
                        }}
                      >
                        <Label style={{ fontFamily: f.semibold, fontSize: 12 }}>1°</Label>
                      </View>
                    </View>
                    <Label style={{ color: c.cyan, fontFamily: f.semibold, fontSize: 12 }}>
                      {category.title}
                    </Label>
                    <Label style={{ color: c.muted, fontSize: 10 }}>
                      {category.path.slice(0, -1).join(' › ')}
                    </Label>
                    <Label numberOfLines={2} style={{ fontFamily: f.semibold, fontSize: 14 }}>
                      {leader.title}
                    </Label>
                    <Label style={{ color: c.muted, fontSize: 11 }}>
                      {leader.support} like ·{' '}
                      {leader.provenance === 'ai_generated' ? 'Creato con AI' : 'Originale'}
                    </Label>
                  </Pressable>
                );
              })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
