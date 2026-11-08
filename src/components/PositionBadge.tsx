import React from 'react';
import { View } from 'react-native';
import { Label } from './ui';
import { colors as c, fonts as f } from '../theme/tokens';

export function PositionBadge({
  position,
  category,
  support,
  participants,
}: {
  position?: number;
  category: string;
  support?: number;
  participants?: number;
}) {
  if (!position || position > 100 || !support || (participants || 0) < 2) return null;
  const color =
    position === 1 ? '#F5D477' : position === 2 ? '#D5DCEA' : position === 3 ? '#D89E78' : c.cyan;
  const radius = position === 1 ? 24 : position === 2 ? 10 : position === 3 ? 3 : 16;
  return (
    <View
      accessibilityLabel={`Posizione attuale ${position}, ${category}, ${participants} creator con preferenze. Possibili ex aequo.`}
      style={{ alignItems: 'center', maxWidth: 125, gap: 4 }}
    >
      <View
        style={{
          minWidth: 40,
          height: 40,
          paddingHorizontal: 8,
          borderRadius: radius,
          borderWidth: position <= 3 ? 2 : 1,
          borderColor: color,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          transform: position === 3 ? [{ rotate: '45deg' }] : [],
        }}
      >
        <Label
          style={{
            color,
            fontFamily: f.semibold,
            fontSize: 18,
            transform: position === 3 ? [{ rotate: '-45deg' }] : [],
          }}
        >
          {position <= 3 ? position : '#' + position}
        </Label>
      </View>
      <Label numberOfLines={2} style={{ fontSize: 10, color, textAlign: 'center' }}>
        {category}
      </Label>
      <Label style={{ fontSize: 9, color: c.muted }}>posizione attuale</Label>
    </View>
  );
}
