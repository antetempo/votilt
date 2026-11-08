import React from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Share, View } from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { useSession } from '../lib/session';
import { useAction } from '../hooks/useAction';
import type { MediaItem } from '../types/domain';
import { colors as c } from '../theme/tokens';

export function MediaActions({
  item,
  current,
  busy,
  disabled,
  onLike,
}: {
  item: MediaItem;
  current: boolean;
  busy: boolean;
  disabled: boolean;
  onLike: () => void;
}) {
  const { user } = useSession();
  const action = useAction();
  const report = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    router.push({ pathname: '/report', params: { contentId: item.id } });
  };
  const withdraw = () =>
    Alert.alert(
      'Ritirare il contenuto?',
      'I campioni attivi collegati saranno invalidati. Questa azione non elegge sostituti.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Ritira',
          style: 'destructive',
          onPress: () =>
            void action.run('delete_content', { contentId: item.id }, () => router.back()),
        },
      ],
    );
  return (
    <View style={{ position: 'absolute', right: 8, bottom: 26, gap: 4 }}>
      <Pressable
        testID="feed-like"
        accessibilityRole="button"
        accessibilityLabel={current ? 'Ti piace' : 'Mi piace'}
        accessibilityState={{
          selected: current,
          disabled: disabled || busy || item.status !== 'approved',
          busy,
        }}
        disabled={disabled || busy || item.status !== 'approved'}
        onPress={() => {
          if (!current) onLike();
        }}
        style={touch}
      >
        {busy ? (
          <ActivityIndicator color={c.pink} />
        ) : (
          <Icon name="heart" size={30} color={current ? c.pink : c.text} />
        )}
      </Pressable>
      <Action
        name="share"
        label="Condividi"
        onPress={() =>
          void Share.share({
            message: `${item.title} · VOTILT\nvotilt://content/${item.id}?categoryId=${item.categoryId || ''}`,
          }).catch(() => Alert.alert('Condivisione non completata', 'Riprova tra poco.'))
        }
      />
      {item.reference?.url && (
        <Action
          name="link"
          label={item.reference.kind === 'website' ? 'Apri il sito' : 'Apri il link ufficiale'}
          onPress={() =>
            void Linking.openURL(item.reference!.url!).catch(() =>
              Alert.alert('Link non aperto', 'Controlla la connessione e riprova.'),
            )
          }
        />
      )}
      <Action
        name="more"
        label="Altre opzioni"
        onPress={() => {
          if (user?.id !== item.authorId) {
            report();
            return;
          }
          Alert.alert('Altre opzioni', undefined, [
            { text: 'Segnala contenuto', onPress: report },
            { text: 'Ritira la tua creazione', style: 'destructive', onPress: withdraw },
            { text: 'Annulla', style: 'cancel' },
          ]);
        }}
      />
    </View>
  );
}
const touch = { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' } as const;
function Action({ name, label, onPress }: { name: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={touch}
    >
      <Icon name={name} size={25} />
    </Pressable>
  );
}
