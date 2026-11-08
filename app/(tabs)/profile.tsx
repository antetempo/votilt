import React from 'react';
import { View, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Card,
  Empty,
  ErrorState,
  Label,
  Loading,
  Screen,
  Title,
} from '../../src/components/ui';
import { MediaGrid } from '../../src/components/MediaGrid';
import { rpc } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import type { MediaItem } from '../../src/types/domain';
import { colors as c, fonts as f } from '../../src/theme/tokens';
import { Icon } from '../../src/components/Icon';
export default function Profile() {
  const { user, logout } = useSession();
  const q = useQuery({
    queryKey: ['uploads', user?.id],
    queryFn: () => rpc<MediaItem[]>('my_uploads'),
    enabled: !!user,
  });
  if (!user)
    return (
      <Screen>
        <Empty
          title="Qui ci sei tu."
          body="Accedi per creare il tuo profilo e pubblicare le tue immagini."
          action="Accedi o registrati"
          onPress={() => router.push('/(auth)/login')}
        />
      </Screen>
    );
  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title>Il tuo spazio.</Title>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Impostazioni"
          onPress={() => router.push('/settings')}
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="settings" />
        </Pressable>
      </View>
      <View style={{ alignItems: 'center', gap: 12, paddingVertical: 8 }}>
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 30,
            backgroundColor: '#39214D',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: c.purple,
          }}
        >
          <Label style={{ fontSize: 36, fontFamily: f.display, color: c.purple }}>
            {user.display_name.slice(0, 1).toUpperCase()}
          </Label>
        </View>
        <Title style={{ fontSize: 27 }}>{user.display_name}</Title>
        <Label style={{ color: c.muted }}>@{user.handle}</Label>
        {!!user.bio && <Label style={{ textAlign: 'center' }}>{user.bio}</Label>}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="Pubblica" icon="add" onPress={() => router.push('/upload')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            title="Amici"
            icon="people-outline"
            secondary
            onPress={() => router.push('/friends')}
          />
        </View>
      </View>
      <Button
        title="Le tue notifiche"
        secondary
        icon="notifications-outline"
        onPress={() => router.push('/notifications')}
      />
      {user.role !== 'user' && (
        <Button
          title="Area moderazione"
          secondary
          icon="shield-checkmark-outline"
          onPress={() => router.push('/moderation')}
        />
      )}
      <Card>
        <Label style={{ fontFamily: f.semibold }}>Il gusto è tuo. La privacy anche.</Label>
        <Label style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
          I tuoi campioni sono{' '}
          {user.settings.show_champions === 'owner'
            ? 'visibili solo a te'
            : user.settings.show_champions === 'friends'
              ? 'condivisibili con gli amici'
              : 'pubblici secondo le tue preferenze'}
          . Il confronto con gli amici richiede un consenso separato.
        </Label>
        <Button title="Gestisci visibilità" secondary onPress={() => router.push('/settings')} />
      </Card>
      <Title style={{ fontSize: 22 }}>Le tue creazioni</Title>
      {q.isPending ? (
        <Loading />
      ) : q.error ? (
        <ErrorState error={q.error} retry={() => void q.refetch()} />
      ) : q.data.length ? (
        <MediaGrid items={q.data} />
      ) : (
        <Empty
          title="La prima creazione sarà tua."
          body="Pubblica un’immagine originale. Il team la controllerà prima di renderla visibile."
          action="Crea una proposta"
          onPress={() => router.push('/upload')}
        />
      )}
      <Button
        title="Esci dall’account"
        secondary
        onPress={() =>
          void logout()
            .then(() => router.replace('/'))
            .catch((e) => Alert.alert('Logout non completato', e.message))
        }
      />
    </Screen>
  );
}
