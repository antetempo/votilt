import React from 'react';
import { Image } from 'expo-image';
import { iconAliases } from '../brand/icons';
const sources: Record<string, number> = {
  feed: require('../../assets/icons/ui/feed.png'),
  search: require('../../assets/icons/ui/search.png'),
  publish: require('../../assets/icons/ui/publish.png'),
  rankings: require('../../assets/icons/ui/rankings.png'),
  profile: require('../../assets/icons/ui/profile.png'),
  heart: require('../../assets/icons/ui/heart.png'),
  share: require('../../assets/icons/ui/share.png'),
  more: require('../../assets/icons/ui/more.png'),
  category: require('../../assets/icons/ui/category.png'),
  chevron: require('../../assets/icons/ui/chevron.png'),
  back: require('../../assets/icons/ui/back.png'),
  bolt: require('../../assets/icons/ui/bolt.png'),
  spark: require('../../assets/icons/ui/spark.png'),
  users: require('../../assets/icons/ui/users.png'),
  notification: require('../../assets/icons/ui/notification.png'),
  shield: require('../../assets/icons/ui/shield.png'),
  settings: require('../../assets/icons/ui/settings.png'),
  close: require('../../assets/icons/ui/close.png'),
  check: require('../../assets/icons/ui/check.png'),
  history: require('../../assets/icons/ui/history.png'),
  photo: require('../../assets/icons/ui/photo.png'),
  link: require('../../assets/icons/ui/link.png'),
  planet: require('../../assets/icons/ui/planet.png'),
};
export function Icon({
  name,
  size = 24,
  color = '#F8F6FF',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const key = iconAliases[name] || name;
  return (
    <Image
      source={sources[key] || sources.spark}
      // Android resource IDs can change between APK updates; never reuse disk-cached icons.
      cachePolicy="none"
      style={{ width: size, height: size }}
      contentFit="contain"
      tintColor={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
