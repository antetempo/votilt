import React, { useState } from 'react';
import { View, Switch, Alert } from 'react-native';
import { router, Stack } from 'expo-router';
import { Screen, Title, Label, Input, Button, Card, Chip, Empty } from '../src/components/ui';
import { useSession } from '../src/lib/session';
import { rpc } from '../src/lib/api';
import { useAction } from '../src/hooks/useAction';
import { colors as c } from '../src/theme/tokens';
export default function Settings() {
  const session = useSession();
  const user = session.user;
  const [name, setName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [visibility, setVisibility] = useState(user?.settings.show_champions || 'owner');
  const [profileVisibility, setProfileVisibility] = useState(user?.visibility || 'public');
  const [comparison, setComparison] = useState(user?.settings.allow_comparison || false);
  const [haptics, setHaptics] = useState(user?.settings.haptics ?? true);
  const [motion, setMotion] = useState(user?.settings.reduce_motion || false);
  const [confirmation, setConfirmation] = useState('');
  const a = useAction();
  const [busy, setBusy] = useState(false);
  if (!user)
    return (
      <Screen>
        <Empty
          title="Accedi per le impostazioni"
          action="Accedi"
          onPress={() => router.replace('/(auth)/login')}
        />
      </Screen>
    );
  const save = async () => {
    setBusy(true);
    try {
      await rpc('profile_update', { displayName: name, bio, visibility: profileVisibility });
      await rpc('settings', {
        showChampions: visibility,
        allowComparison: comparison,
        haptics,
        reduceMotion: motion,
      });
      await session.refresh();
      Alert.alert('Preferenze salvate', 'Il tuo spazio è aggiornato.');
    } catch (e) {
      Alert.alert('Salvataggio non completato', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Il tuo spazio, le tue regole' }} />
      <Title>Impostazioni</Title>
      <Input label="Nome visibile" value={name} onChangeText={setName} maxLength={60} />
      <Input label="Bio" value={bio} onChangeText={setBio} maxLength={160} multiline />
      <Card>
        <Title style={{ fontSize: 22 }}>Chi vede il tuo profilo?</Title>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['public', 'Tutti'],
            ['friends', 'Amici'],
            ['private', 'Solo io'],
          ].map(([value, label]) => (
            <Chip
              key={value}
              title={label}
              selected={profileVisibility === value}
              onPress={() => setProfileVisibility(value)}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Title style={{ fontSize: 22 }}>Chi vede i tuoi campioni?</Title>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[
            ['owner', 'Solo io'],
            ['friends', 'Amici'],
            ['public', 'Pubblici'],
          ].map(([v, title]) => (
            <Chip
              key={v}
              title={title}
              selected={visibility === v}
              onPress={() => setVisibility(v as typeof visibility)}
            />
          ))}
        </View>
        <Label style={{ color: c.muted, fontSize: 12 }}>
          I confronti richiedono amicizia e consenso di entrambi anche se scegli “Pubblici”.
        </Label>
      </Card>
      {[
        { title: 'Consenti confronto con amici', value: comparison, set: setComparison },
        { title: 'Feedback aptico', value: haptics, set: setHaptics },
        { title: 'Riduci movimento', value: motion, set: setMotion },
      ].map((x) => (
        <View
          key={x.title}
          style={{
            flexDirection: 'row',
            gap: 16,
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 52,
          }}
        >
          <Label style={{ flex: 1 }}>{x.title}</Label>
          <Switch
            accessibilityLabel={x.title}
            value={x.value}
            onValueChange={x.set}
            trackColor={{ false: c.border, true: c.purple }}
            thumbColor={c.text}
          />
        </View>
      ))}
      <Button title="Salva preferenze" busy={busy} onPress={() => void save()} />
      <Button
        title="Modifica interessi"
        secondary
        onPress={() => router.push('/(auth)/interests')}
      />
      <Card>
        <Title style={{ fontSize: 22 }}>Controllo del tuo account</Title>
        <Label style={{ fontSize: 12, color: c.muted, lineHeight: 19 }}>
          Eliminando l’account rimuovi accesso, profilo, amicizie e supporti attivi. Le tue
          creazioni vengono ritirate e i campioni collegati invalidati. L’audit di moderazione
          conserva solo riferimenti pseudonimizzati.
        </Label>
        <Input
          label="Scrivi ELIMINA per confermare"
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
        />
        <Button
          title="Esci dall’account"
          secondary
          onPress={() =>
            void session
              .logout()
              .then(() => router.replace('/'))
              .catch((e) => Alert.alert('Logout non completato', e.message))
          }
        />
        <Button
          title="Elimina definitivamente l’account"
          secondary
          disabled={confirmation !== 'ELIMINA'}
          busy={a.busy}
          onPress={() =>
            Alert.alert('Eliminare l’account?', 'Questa azione è definitiva.', [
              { text: 'Annulla', style: 'cancel' },
              {
                text: 'Elimina',
                style: 'destructive',
                onPress: () =>
                  void a.run('delete_account', { confirmation }, () => {
                    void session.logout().then(() => router.replace('/'));
                  }),
              },
            ])
          }
        />
      </Card>
      <Label style={{ color: c.muted, fontSize: 11 }}>
        VOTILT · Demo locale · Nessuna pubblicazione store · Recupero password email non
        disponibile.
      </Label>
    </Screen>
  );
}
