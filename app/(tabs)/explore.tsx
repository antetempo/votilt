import React, { useState, useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../src/components/Icon';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Screen,
  Title,
  Label,
  Input,
  Card,
  Chip,
  Loading,
  ErrorState,
  Button,
} from '../../src/components/ui';
import { rpc } from '../../src/lib/api';
import type { Category, MediaItem } from '../../src/types/domain';
import { colors as c, fonts as f } from '../../src/theme/tokens';
import { MediaGrid } from '../../src/components/MediaGrid';
import { useSession } from '../../src/lib/session';
export default function Explore() {
  const { user } = useSession();
  const [search, setSearch] = useState('');
  const [root, setRoot] = useState<string | null>(null);
  const [term, setTerm] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const q = useQuery({ queryKey: ['categories'], queryFn: () => rpc<Category[]>('categories') });
  const found = useQuery({
    queryKey: ['content-search', term, user?.id],
    queryFn: () => rpc<MediaItem[]>('search', { query: term }),
    enabled: term.length >= 2,
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const inRoot = (cat: Category) => {
    let node: Category | undefined = cat;
    while (node?.parent_id) node = q.data.find((x) => x.id === node?.parent_id);
    return !root || node?.id === root;
  };
  const leaves = q.data.filter(
    (x) => x.depth === 4 && inRoot(x) && normalize(x.title).includes(normalize(search)),
  );
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Label style={{ fontSize: 11, color: c.cyan, letterSpacing: 2 }}>
            SEGUI LA CURIOSITÀ
          </Label>
          <Title>Trova il tuo vibe.</Title>
        </View>
        <Icon name="planet-outline" size={34} color={c.purple} />
      </View>
      <Input
        label="Cerca nomi, siti o categorie"
        placeholder="Una persona, un sito, un mondo…"
        value={search}
        onChangeText={setSearch}
      />
      {term.length >= 2 && (
        <View style={{ gap: 12 }}>
          <Title style={{ fontSize: 22 }}>Immagini e riferimenti</Title>
          {found.isFetching ? (
            <Label style={{ color: c.muted }}>Cerco…</Label>
          ) : found.error ? (
            <Label style={{ color: c.muted }}>Ricerca non disponibile. Riprova tra poco.</Label>
          ) : found.data?.length ? (
            <MediaGrid items={found.data} />
          ) : (
            <Label style={{ color: c.muted }}>
              Nessun riferimento trovato con questo nome o link.
            </Label>
          )}
        </View>
      )}
      <Pressable accessibilityRole="button" onPress={() => router.push('/ai-universe')}>
        <LinearGradient
          colors={['#482268', '#1C2340']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 24, padding: 24, gap: 12, borderWidth: 1, borderColor: '#6A3F99' }}
        >
          <Label style={{ fontFamily: f.semibold, color: c.cyan, fontSize: 11, letterSpacing: 2 }}>
            OLTRE L’IMMAGINAZIONE
          </Label>
          <Title>AI Universe</Title>
          <Label style={{ color: '#D3C4E9' }}>
            Arte impossibile. Tool preferiti. Scelte reali.
          </Label>
        </LinearGradient>
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        <Chip title="Tutti" selected={!root} onPress={() => setRoot(null)} />
        {q.data
          .filter((x) => x.depth === 1)
          .map((x) => (
            <Chip
              key={x.id}
              title={x.title}
              selected={root === x.id}
              onPress={() => setRoot(x.id)}
            />
          ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title style={{ fontSize: 22 }}>Il tuo prossimo TILT</Title>
        <Label style={{ color: c.muted, fontSize: 12 }}>{leaves.length} categorie</Label>
      </View>
      <View style={{ gap: 10 }}>
        {leaves.map((cat, i) => (
          <Pressable
            key={cat.id}
            onPress={() => router.push(`/category/${cat.id}`)}
            accessibilityRole="button"
            accessibilityLabel={cat.title}
          >
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: i % 2 ? '#26354B' : '#352147',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={['sparkles', 'flame', 'diamond', 'planet-outline'][i % 4] as 'sparkles'}
                  color={i % 2 ? c.cyan : c.purple}
                  size={24}
                />
              </View>
              <View style={{ flex: 1, gap: 5 }}>
                <Label style={{ fontFamily: f.semibold }}>{cat.title}</Label>
                <Label style={{ fontSize: 11, color: c.muted }}>
                  {q.data.find((x) => x.id === cat.parent_id)?.title} · Scopri e scegli
                </Label>
              </View>
              <Icon name="chevron-forward" color={c.muted} size={18} />
            </Card>
          </Pressable>
        ))}
      </View>
      {!leaves.length && (
        <Label style={{ color: c.muted }}>
          Nessuna categoria trovata. Prova una ricerca diversa.
        </Label>
      )}
      <Button
        title="Manca la tua categoria? Proponila"
        secondary
        onPress={() => router.push('/suggest')}
      />
    </Screen>
  );
}
