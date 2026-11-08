import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Label } from './ui';
import { mediaSource } from '../lib/api';
import { colors as c, fonts as f } from '../theme/tokens';
import type { MediaItem } from '../types/domain';
import { Icon } from './Icon';
export function MediaGrid({
  items,
  champions = false,
}: {
  items: MediaItem[];
  champions?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {items.map((x, i) => (
        <Pressable
          key={`${x.id}:${x.categoryId}:${i}`}
          accessibilityRole="button"
          accessibilityLabel={`${x.categoryTitle || x.title}, ${champions ? 'tuo campione' : x.status}`}
          onPress={() => router.push(`/content/${x.id}?categoryId=${x.categoryId || ''}`)}
          style={{ width: '48%', gap: 9, marginBottom: 10 }}
        >
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: c.surface }}>
            <Image
              source={mediaSource(x.mediaUrl)}
              style={{ width: '100%', aspectRatio: 3 / 4 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {champions && (
              <View
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  backgroundColor: c.purple,
                  padding: 6,
                  borderRadius: 12,
                }}
              >
                <Icon name="heart" size={15} />
              </View>
            )}
          </View>
          <Label numberOfLines={2} style={{ fontFamily: f.semibold, fontSize: 13 }}>
            {champions ? x.categoryTitle : x.title}
          </Label>
          {!champions && (
            <Label style={{ fontSize: 10, color: c.muted }}>
              {{
                approved: 'Approvato',
                pending_review: 'In revisione',
                rejected: 'Rifiutato',
                hidden: 'Nascosto',
                draft: 'Bozza',
              }[x.status] || x.status}
            </Label>
          )}
        </Pressable>
      ))}
    </View>
  );
}
