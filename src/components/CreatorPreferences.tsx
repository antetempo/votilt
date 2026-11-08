import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Label, Loading, ErrorState, Button, Input } from './ui';
import { rpc } from '../lib/api';
import { useSession } from '../lib/session';
import { colors as c, fonts as f } from '../theme/tokens';
import { PositionBadge } from './PositionBadge';
import { normalizeCategory } from '../utils/categories';

type Summary = {
  preferenceCount: number;
  categoryPreferences: {
    categoryId: string;
    title: string;
    path: string[];
    preferences: number;
    position?: number;
    participants?: number;
  }[];
};
export function CreatorPreferences({ userId }: { userId: string }) {
  const { user } = useSession();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');
  const q = useQuery({
    queryKey: ['profile', userId, user?.id],
    queryFn: () => rpc<Summary>('profile', { userId }),
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  return (
    <View style={{ gap: 12 }}>
      <Label style={{ fontSize: 25, fontFamily: f.semibold }}>
        {q.data.preferenceCount} preferenze ricevute
      </Label>
      <Label style={{ color: c.muted, fontSize: 12 }}>
        Una preferenza per persona e categoria. I follower sono un conteggio distinto.
      </Label>
      {!!q.data.categoryPreferences.length && (
        <Button
          secondary
          title={expanded ? 'Nascondi preferenze per categoria' : 'Mostra preferenze per categoria'}
          onPress={() => setExpanded((value) => !value)}
        />
      )}
      {expanded && (
        <Input
          label="Filtra le categorie del creator"
          value={search}
          onChangeText={setSearch}
          maxLength={80}
          placeholder="Una categoria o un ramo"
        />
      )}
      {expanded &&
        q.data.categoryPreferences
          .filter((category) =>
            normalizeCategory(category.path.join(' ')).includes(normalizeCategory(search)),
          )
          .map((category) => (
            <Pressable
              key={category.categoryId}
              accessibilityRole="button"
              onPress={() =>
                router.push({ pathname: '/category/[id]', params: { id: category.categoryId } })
              }
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border, gap: 4 }}
            >
              <Label style={{ color: c.cyan, fontFamily: f.semibold }}>
                {category.title} · {category.preferences}
              </Label>
              <Label style={{ fontSize: 11, lineHeight: 16, color: c.muted }}>
                {category.path.join(' › ')}
              </Label>
              <PositionBadge
                position={category.position}
                category={category.title}
                support={category.preferences}
                participants={category.participants}
              />
            </Pressable>
          ))}
    </View>
  );
}
