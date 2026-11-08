import React from 'react';
import { Redirect, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../src/lib/session';
import { Button, Label, Title, Wordmark, Loading } from '../src/components/ui';
import { colors, fonts } from '../src/theme/tokens';
export default function Welcome() {
  const { user, loading, offline, refresh } = useSession();
  if (loading) return <Loading />;
  if (user)
    return <Redirect href={user.settings.onboarding_complete ? '/(tabs)' : '/(auth)/interests'} />;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Image
        source={require('../assets/art/tilt-crystal.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(9,7,17,.25)', 'transparent', 'rgba(9,7,17,.96)', colors.bg]}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1, padding: 26, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', paddingTop: 12 }}>
          <Wordmark />
          <Label style={{ fontSize: 10, letterSpacing: 3, color: colors.muted, marginTop: 8 }}>
            IL TUO GUSTO. LE TUE REGOLE.
          </Label>
        </View>
        <View style={{ gap: 16 }}>
          <Label
            style={{
              fontFamily: fonts.semibold,
              color: colors.cyan,
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            UN SOLO CAMPIONE. MILLE TENTAZIONI.
          </Label>
          <Title style={{ fontSize: 48, lineHeight: 51 }}>
            Scrolla. Scegli.{'\n'}Vai in{' '}
            <Label style={{ fontFamily: fonts.display, fontSize: 48, color: colors.purple }}>
              TILT.
            </Label>
          </Title>
          <Label style={{ color: colors.muted, lineHeight: 23 }}>
            Trova ciò che ti accende. Incorona i tuoi preferiti. Mettili alla prova.
          </Label>
          {offline && (
            <Button
              title="Server locale non raggiungibile · Riprova"
              secondary
              onPress={() => void refresh()}
            />
          )}
          <Button
            title="Entra nel tuo universo"
            icon="flash"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button title="Dai un’occhiata" secondary onPress={() => router.push('/(tabs)')} />
          <Label style={{ fontSize: 11, textAlign: 'center', color: colors.muted }}>
            18+ · Demo locale · Contenuti originali e dichiarati
          </Label>
        </View>
      </SafeAreaView>
    </View>
  );
}
