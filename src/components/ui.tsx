import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors as c, fonts as f } from '../theme/tokens';

export function Label({ children, style, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Text {...props} style={[styles.text, style]}>
      {children}
    </Text>
  );
}
export function Title({ children, style, ...props }: React.ComponentProps<typeof Text>) {
  return (
    <Label {...props} accessibilityRole="header" style={[styles.title, style]}>
      {children}
    </Label>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  busy = false,
  icon,
  testID,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
  icon?: React.ComponentProps<typeof Icon>['name'];
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        (pressed || disabled || busy) && { opacity: 0.55 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={c.text} />
      ) : (
        <>
          {icon && <Icon name={icon} size={20} color={c.text} />}
          <Label style={styles.buttonText}>{title}</Label>
        </>
      )}
    </Pressable>
  );
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Label style={styles.label}>{label}</Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        style={[styles.input, props.style]}
        selectionColor={c.purple}
      />
    </View>
  );
}
export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, style]}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Chip({
  title,
  selected,
  onPress,
}: {
  title: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: c.purple, borderColor: c.purple }]}
    >
      <Label style={{ fontFamily: f.semibold, fontSize: 13 }}>{title}</Label>
    </Pressable>
  );
}
export function Empty({
  title,
  body,
  action,
  onPress,
}: {
  title: string;
  body?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <Icon name="sparkles-outline" size={36} color={c.purple} />
      <Title style={{ fontSize: 23, textAlign: 'center' }}>{title}</Title>
      {body && (
        <Label style={{ color: c.muted, textAlign: 'center', lineHeight: 23 }}>{body}</Label>
      )}
      {action && onPress && <Button title={action} onPress={onPress} secondary />}
    </View>
  );
}
export function Loading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={c.purple} size="large" />
      <Label style={{ color: c.muted }}>Prepariamo il tuo universo…</Label>
    </View>
  );
}
export function ErrorState({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Empty
      title="Qualcosa si è fermato"
      body={error instanceof Error ? error.message : 'Riprova tra poco.'}
      action="Riprova"
      onPress={retry}
    />
  );
}
export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
      <Icon name="flash" size={large ? 40 : 26} color={c.purple} />
      <Label style={{ fontFamily: f.display, fontSize: large ? 44 : 26, letterSpacing: -1.5 }}>
        VO
        <Label
          style={{
            color: c.purple,
            fontFamily: f.display,
            fontSize: large ? 44 : 26,
            letterSpacing: -1.5,
          }}
        >
          TILT
        </Label>
      </Label>
    </View>
  );
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.bg },
  content: { padding: 24, gap: 20, paddingBottom: 40 },
  text: { fontFamily: f.body, fontSize: 15, color: c.text },
  title: { fontFamily: f.display, fontSize: 24, letterSpacing: -0.5, lineHeight: 29 },
  label: { fontSize: 13, fontFamily: f.semibold, color: c.muted },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: c.text,
    fontFamily: f.body,
    fontSize: 16,
    backgroundColor: c.surface,
  },
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: c.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondary: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  buttonText: { fontFamily: f.semibold, fontSize: 15, flexShrink: 1, textAlign: 'center' },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  empty: { padding: 28, gap: 18, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
});
