import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label, Screen, Title, Wordmark } from '../../src/components/ui';
import { authenticate } from '../../src/lib/api';
import { useSession } from '../../src/lib/session';
import { colors as c } from '../../src/theme/tokens';
const schema = z.object({
  email: z.email('Inserisci un’email valida'),
  password: z.string().min(8, 'Almeno 8 caratteri'),
  handle: z.string(),
  displayName: z.string(),
});
type Form = z.infer<typeof schema>;
export default function Login() {
  const [signup, setSignup] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const session = useSession();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', handle: '', displayName: '' },
  });
  const submit = handleSubmit(async (data) => {
    if (signup && (!adult || !data.handle || !data.displayName)) {
      setError('Completa il profilo e conferma di avere almeno 18 anni.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const user = await authenticate(signup ? 'signup' : 'login', { ...data, adult });
      await session.login(user);
      router.replace(user.settings.onboarding_complete ? '/(tabs)' : '/(auth)/interests');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  });
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Indietro"
        >
          <Label style={{ color: c.muted }}>← Indietro</Label>
        </Pressable>
        <View style={{ paddingVertical: 28 }}>
          <Wordmark large />
        </View>
        <Title>{signup ? 'Il tuo gusto merita un palco.' : 'Bentornato nel TILT.'}</Title>
        <Label style={{ color: c.muted }}>Un account, tutti i tuoi campioni.</Label>
        {(
          ['email', 'password', ...(signup ? ['handle', 'displayName'] : [])] as (keyof Form)[]
        ).map((name) => (
          <View key={name} style={{ gap: 6 }}>
            <Controller
              control={control}
              name={name}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={
                    {
                      email: 'Email',
                      password: 'Password',
                      handle: 'Nome utente',
                      displayName: 'Come ti chiami?',
                    }[name]
                  }
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize={name === 'displayName' ? 'words' : 'none'}
                  secureTextEntry={name === 'password'}
                  keyboardType={name === 'email' ? 'email-address' : 'default'}
                  autoComplete={
                    name === 'email' ? 'email' : name === 'password' ? 'password' : 'off'
                  }
                />
              )}
            />
            {errors[name] && (
              <Label style={{ color: c.danger, fontSize: 12 }}>{errors[name]?.message}</Label>
            )}
          </View>
        ))}
        {signup && (
          <Pressable
            onPress={() => setAdult(!adult)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: adult }}
            style={{ paddingVertical: 12, flexDirection: 'row', gap: 10 }}
          >
            <Label>{adult ? '☑' : '□'}</Label>
            <Label style={{ flex: 1, fontSize: 13, color: c.muted }}>
              Ho almeno 18 anni e accetto di pubblicare soltanto contenuti di cui ho i diritti. È
              una dichiarazione, non una verifica dell’età.
            </Label>
          </Pressable>
        )}
        {!!error && (
          <Label accessibilityRole="alert" style={{ color: c.danger }}>
            {error}
          </Label>
        )}
        <Button
          title={signup ? 'Crea il tuo account' : 'Accedi'}
          busy={busy}
          onPress={() => void submit()}
        />
        <Button
          title={signup ? 'Hai già un account? Accedi' : 'Prima volta? Crea un account'}
          secondary
          onPress={() => {
            setSignup(!signup);
            setError('');
          }}
        />
        <Pressable
          onPress={() =>
            Alert.alert(
              'Demo locale',
              'Il recupero via email non è disponibile in questa demo. Nessuna email viene inviata.',
            )
          }
          style={{ padding: 12 }}
          accessibilityRole="button"
        >
          <Label style={{ color: c.muted, textAlign: 'center', fontSize: 12 }}>
            Come funziona l’accesso locale?
          </Label>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}
