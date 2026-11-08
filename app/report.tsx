import React, { useState } from 'react';
import { View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Screen, Title, Label, Chip, Input, Button } from '../src/components/ui';
import { useAction } from '../src/hooks/useAction';
import { useSession } from '../src/lib/session';
export default function Report() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const a = useAction();
  const { user } = useSession();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Segnala in sicurezza' }} />
      <Title>Aiutaci a prendercene cura.</Title>
      <Label>
        Scegli il motivo. La segnalazione è visibile soltanto a te e al team autorizzato.
      </Label>
      <View style={{ gap: 8 }}>
        {[
          'Contenuto non autorizzato',
          'Immagine di minore',
          'Molestie o offesa',
          'Contenuto esplicito',
          'Deepfake non consensuale',
          'Spam',
          'Copyright',
          'Altro',
        ].map((x) => (
          <Chip key={x} title={x} selected={reason === x} onPress={() => setReason(x)} />
        ))}
      </View>
      <Input
        label="Dettagli facoltativi"
        value={details}
        onChangeText={setDetails}
        maxLength={350}
        multiline
      />
      <Button
        title={user ? 'Invia segnalazione' : 'Accedi per segnalare'}
        disabled={!!user && !reason}
        busy={a.busy}
        onPress={() =>
          user
            ? void a.run(
                'report',
                { contentId, reason: `${reason}${details ? `: ${details}` : ''}` },
                () => router.back(),
              )
            : router.push('/(auth)/login')
        }
      />
    </Screen>
  );
}
