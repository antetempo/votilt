import React from 'react';
import { Pressable, View } from 'react-native';
import { useRootNavigationState, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Label } from './ui';
import { useAppNavigation } from '../lib/navigation';
import { colors as c, fonts as f } from '../theme/tokens';

const destinations = [
  { name: 'index', title: 'Feed', icon: 'feed', href: '/(tabs)' },
  { name: 'explore', title: 'Esplora', icon: 'search', href: '/(tabs)/explore' },
  { name: 'create', title: 'Pubblica la tua immagine', icon: 'publish', href: '/(tabs)/create' },
  { name: 'rankings', title: 'Classifiche', icon: 'rankings', href: '/(tabs)/rankings' },
  { name: 'profile', title: 'Profilo', icon: 'profile', href: '/(tabs)/profile' },
] as const;

export function BottomNavigation() {
  const segments = useSegments();
  const root = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const navigation = useAppNavigation();
  if (!segments.length || segments[0] === '(auth)') return null;
  const tabs = root?.routes.find((route) => route.name === '(tabs)')?.state;
  const active =
    tabs?.routes[tabs.index ?? 0]?.name ||
    (segments[0] === '(tabs)' ? segments[1] || 'index' : 'rankings');
  return (
    <View
      accessibilityRole="tablist"
      testID="bottom-navigation"
      style={{
        flexDirection: 'row',
        backgroundColor: c.bg,
        borderTopWidth: 1,
        borderTopColor: c.border,
        paddingTop: 7,
        paddingBottom: Math.max(12, insets.bottom),
      }}
    >
      {destinations.map((item) => {
        const selected = active === item.name;
        return (
          <Pressable
            key={item.name}
            accessibilityRole="tab"
            accessibilityLabel={item.title}
            accessibilityState={{ selected, disabled: navigation?.busy }}
            disabled={navigation?.busy}
            onPress={() => void navigation?.navigate(item.href)}
            style={{
              flex: 1,
              minHeight: 54,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            <Icon
              name={item.icon}
              size={item.name === 'create' ? 34 : 24}
              color={item.name === 'create' ? c.purple : selected ? c.text : c.muted}
            />
            {item.name !== 'create' && (
              <Label
                numberOfLines={1}
                style={{ fontFamily: f.semibold, fontSize: 9, color: selected ? c.text : c.muted }}
              >
                {item.title}
              </Label>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
