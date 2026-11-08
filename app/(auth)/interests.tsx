import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Chip, Label, Screen, Title, Loading, ErrorState } from '../../src/components/ui';
import { rpc } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import type { Category } from '../../src/types/domain';
import { colors } from '../../src/theme/tokens';
export default function Interests() {
  const session = useSession();
  const [selected, setSelected] = useState<string[]>(session.user?.interests || []);
  const [busy, setBusy] = useState(false);
  const q = useQuery({ queryKey: ['categories'], queryFn: () => rpc<Category[]>('categories') });
  const save = async (skip = false) => {
    setBusy(true);
    try {
      await rpc('interests', { categoryIds: skip ? [] : selected });
      await session.refresh();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Interessi non salvati', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  return (
    <Screen>
      <Label style={{ color: colors.cyan, letterSpacing: 2, fontSize: 12 }}>
        IL TUO UNIVERSO, DA SUBITO
      </Label>
      <Title>Cosa ti accende?</Title>
      <Label style={{ color: colors.muted }}>
        Scegli almeno 3 categorie. Puoi cambiarle quando vuoi.
      </Label>
      {q.data
        .filter((c) => c.depth === 1)
        .map((root) => (
          <View key={root.id} style={{ gap: 14, marginTop: 10 }}>
            <Title style={{ fontSize: 22 }}>{root.title}</Title>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {q.data
                .filter(
                  (c) =>
                    c.depth === 2 &&
                    (() => {
                      let p: Category | undefined = c;
                      while (p?.parent_id) p = q.data.find((x) => x.id === p?.parent_id);
                      return p?.id === root.id;
                    })(),
                )
                .map((c) => (
                  <Chip
                    key={c.id}
                    title={c.title}
                    selected={selected.includes(c.id)}
                    onPress={() =>
                      setSelected((a) =>
                        a.includes(c.id) ? a.filter((x) => x !== c.id) : [...a, c.id],
                      )
                    }
                  />
                ))}
            </View>
          </View>
        ))}
      <Button
        title={`Ci sono · ${selected.length} scelte`}
        disabled={selected.length < 3}
        busy={busy}
        onPress={() => void save()}
      />
      <Button
        title="Salta · Mostra tutti i temi"
        secondary
        busy={busy}
        onPress={() => void save(true)}
      />
    </Screen>
  );
}
