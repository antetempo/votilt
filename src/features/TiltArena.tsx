import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { Label } from '../components/ui';
import { mediaSource } from '../lib/api';
import { colors as c, fonts as f } from '../theme/tokens';
import type { MediaItem } from '../types/domain';

export type TiltSide = 'INCUMBENT' | 'CHALLENGER';
type Props = {
  incumbent: MediaItem;
  challenger: MediaItem;
  selected: TiltSide | null;
  confirmed: boolean;
  busy: boolean;
  reducedMotion: boolean;
  error: string;
  onPick: (side: TiltSide) => void;
  onCancel: () => void;
};

export function TiltArena(props: Props) {
  const window = useWindowDimensions();
  const [bounds, setBounds] = useState<{ width: number; height: number } | null>(null);
  const { width, height } = bounds || window;
  const insets = useSafeAreaInsets();
  const enter = useSharedValue(props.reducedMotion ? 1 : 0);
  const drift = useSharedValue(0);
  const burst = useSharedValue(0);
  useEffect(() => {
    enter.value = props.reducedMotion ? 1 : withSpring(1, { damping: 16, stiffness: 100 });
    drift.value = props.reducedMotion
      ? 0
      : withRepeat(withTiming(1, { duration: 3300, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => {
      cancelAnimation(enter);
      cancelAnimation(drift);
    };
  }, [props.reducedMotion, enter, drift]);
  useEffect(() => {
    burst.value = withTiming(props.confirmed ? 1 : 0, { duration: props.reducedMotion ? 0 : 520 });
  }, [props.confirmed, props.reducedMotion, burst]);
  const word = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [
      { perspective: 800 },
      { rotateX: `${(1 - enter.value) * -65}deg` },
      { rotateZ: '-11deg' },
      { scale: 0.65 + enter.value * 0.35 + burst.value * 0.12 },
    ],
  }));
  const orbit = useAnimatedStyle(() => ({
    opacity: 0.3 + enter.value * 0.35,
    transform: [
      { perspective: 900 },
      { rotateX: '66deg' },
      { rotateZ: `${-26 + drift.value * 18}deg` },
      { scale: 0.9 + burst.value * 0.8 },
    ],
  }));
  const impact = useAnimatedStyle(() => ({
    opacity: burst.value * (1 - burst.value) * 2,
    transform: [{ scale: 0.4 + burst.value * 2.5 }, { rotateZ: '18deg' }],
  }));
  const usableHeight = height - insets.top - insets.bottom;
  const cardWidth = Math.min(width * 0.53, 280, usableHeight * 0.4);
  const cardHeight = Math.min(cardWidth * 1.65, usableHeight * 0.57);
  return (
    <View
      style={s.arena}
      testID="tilt-arena"
      onLayout={(event) => setBounds(event.nativeEvent.layout)}
    >
      <LinearGradient
        colors={['#161029', c.bg, '#160C22']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={[s.halo, { left: -width * 0.4, top: height * 0.18 }]} />
      <View
        pointerEvents="none"
        style={[s.halo, s.pinkHalo, { right: -width * 0.4, top: height * 0.48 }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          s.orbit,
          { width: width * 1.5, height: width * 1.5, left: -width * 0.25, top: height * 0.22 },
          orbit,
        ]}
      >
        <View style={s.innerOrbit} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[s.word, { top: insets.top + usableHeight * 0.07 }, word]}
      >
        <Label
          accessibilityRole="header"
          style={[s.tilt, { fontSize: Math.min(width * 0.24, 112) }]}
        >
          TILT
        </Label>
        <View style={s.wordSlash} />
      </Animated.View>
      {([props.incumbent, props.challenger] as const).map((item, index) => (
        <TiltCard
          key={item.id}
          item={item}
          side={index === 0 ? 'INCUMBENT' : 'CHALLENGER'}
          index={index}
          width={cardWidth}
          height={cardHeight}
          left={width * (index === 0 ? 0.26 : 0.74) - cardWidth / 2}
          top={insets.top + usableHeight * (index === 0 ? 0.48 : 0.59) - cardHeight / 2}
          drift={drift}
          enter={enter}
          {...props}
        />
      ))}
      <Animated.View pointerEvents="none" style={[s.impact, impact]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Annulla TILT"
        accessibilityState={{ disabled: props.busy }}
        disabled={props.busy}
        onPress={props.onCancel}
        style={[s.close, { top: insets.top + 8, right: 14 }]}
      >
        <Icon name="close" size={22} color={c.muted} />
      </Pressable>
      {!!props.error && (
        <View style={[s.error, { bottom: insets.bottom + 20 }]}>
          <Label accessibilityRole="alert" style={{ color: c.text, fontSize: 13 }}>
            {props.error}
          </Label>
        </View>
      )}
    </View>
  );
}

function TiltCard({
  item,
  side,
  index,
  width,
  height,
  left,
  top,
  drift,
  enter,
  selected,
  confirmed,
  busy,
  reducedMotion,
  onPick,
}: Props & {
  item: MediaItem;
  side: TiltSide;
  index: number;
  width: number;
  height: number;
  left: number;
  top: number;
  drift: SharedValue<number>;
  enter: SharedValue<number>;
}) {
  const chosen = selected === side;
  const lift = useSharedValue(0);
  const win = useSharedValue(0);
  const sign = index === 0 ? -1 : 1;
  useEffect(() => {
    const target = selected ? (chosen ? 1 : -1) : 0;
    lift.value = reducedMotion ? target : withSpring(target, { damping: 18, stiffness: 180 });
    win.value = withTiming(confirmed ? 1 : 0, { duration: reducedMotion ? 0 : 480 });
  }, [selected, chosen, confirmed, reducedMotion, lift, win]);
  const card = useAnimatedStyle(() => ({
    opacity: selected && !chosen ? 1 - win.value * 0.85 : enter.value,
    transform: [
      { perspective: 850 },
      {
        translateX:
          sign * (1 - enter.value) * 100 - sign * win.value * (chosen ? width * 0.42 : -width),
      },
      {
        translateY: reducedMotion
          ? 0
          : (1 - enter.value) * 85 + (drift.value - 0.5) * sign * 14 - lift.value * 14,
      },
      {
        rotateY: `${reducedMotion ? 0 : sign * (-13 + drift.value * 5) * (1 - Math.max(lift.value, 0)) + sign * (1 - enter.value) * 38}deg`,
      },
      {
        rotateZ: `${reducedMotion ? 0 : sign * (7 - Math.max(lift.value, 0) * 7) + (1 - enter.value) * sign * 12}deg`,
      },
      {
        scale:
          0.85 +
          enter.value * 0.15 +
          Math.max(lift.value, 0) * 0.07 +
          win.value * (chosen ? 0.08 : -0.16),
      },
    ],
  }));
  const shine = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.12 : 0.13 + drift.value * 0.1,
    transform: [{ translateX: (drift.value - 0.5) * width * 1.5 }, { rotateZ: '-22deg' }],
  }));
  const color = index === 0 ? c.cyan : c.pink;
  return (
    <Animated.View
      style={[
        s.card,
        { width, height, left, top, zIndex: chosen ? 4 : index + 1, shadowColor: color },
        card,
      ]}
    >
      <View
        pointerEvents="none"
        style={[s.cardDepth, { borderColor: color, backgroundColor: c.raised }]}
      />
      <Pressable
        testID={`tilt-${side.toLowerCase()}`}
        accessibilityRole="button"
        accessibilityLabel={`${index === 0 ? 'Mantieni' : 'Scegli'} ${item.title}`}
        accessibilityHint="Conferma questa immagine come tuo like nella categoria"
        accessibilityState={{ disabled: busy, selected: chosen, busy: busy && chosen }}
        disabled={busy}
        onPress={() => onPick(side)}
        style={[s.cardFace, { borderColor: color }]}
      >
        <Image
          source={mediaSource(item.mediaUrl)}
          contentFit="cover"
          cachePolicy="memory"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['#FFFFFF12', 'transparent', '#09071188']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Animated.View pointerEvents="none" style={[s.shine, shine]}>
          <LinearGradient
            colors={['transparent', '#FFFFFF', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View pointerEvents="none" style={[s.cardMark, { borderColor: color }]}>
          {busy && chosen && !confirmed ? (
            <ActivityIndicator size="small" color={c.text} />
          ) : (
            <Icon name={confirmed && chosen ? 'check' : 'heart'} size={22} color={c.text} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  arena: { flex: 1, backgroundColor: c.bg, overflow: 'hidden' },
  halo: {
    position: 'absolute',
    width: 390,
    height: 390,
    borderRadius: 220,
    backgroundColor: '#22D3EE09',
    borderWidth: 38,
    borderColor: '#22D3EE05',
  },
  pinkHalo: { backgroundColor: '#FF4DA60A', borderColor: '#A855F707' },
  orbit: { position: 'absolute', borderRadius: 999, borderWidth: 2, borderColor: '#A855F755' },
  innerOrbit: {
    ...StyleSheet.absoluteFill,
    margin: 21,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#22D3EE44',
  },
  word: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 5 },
  tilt: {
    fontFamily: f.display,
    letterSpacing: -5,
    lineHeight: 125,
    color: c.text,
    textShadowColor: c.purple,
    textShadowOffset: { width: 4, height: 5 },
    textShadowRadius: 1,
  },
  wordSlash: {
    width: '78%',
    height: 3,
    backgroundColor: c.cyan,
    transform: [{ skewX: '-35deg' }],
    marginTop: -18,
  },
  card: {
    position: 'absolute',
    borderRadius: 25,
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cardDepth: {
    ...StyleSheet.absoluteFill,
    left: 5,
    top: 7,
    right: -5,
    bottom: -7,
    borderWidth: 1,
    borderRadius: 25,
  },
  cardFace: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: c.surface,
  },
  shine: { position: 'absolute', width: '36%', height: '150%', top: '-25%', left: '25%' },
  cardMark: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09071188',
    borderWidth: 1,
    borderRadius: 24,
  },
  close: {
    position: 'absolute',
    zIndex: 10,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  impact: {
    position: 'absolute',
    left: '20%',
    top: '36%',
    width: '60%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: c.cyan,
  },
  error: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.surface,
    borderColor: c.danger,
    borderWidth: 1,
    zIndex: 8,
  },
});
