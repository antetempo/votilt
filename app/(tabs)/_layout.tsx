import React from 'react';
import { Tabs } from 'expo-router';
export default function TabLayout() {
  return (
    <Tabs tabBar={() => null} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Feed' }} />
      <Tabs.Screen name="explore" options={{ title: 'Esplora' }} />
      <Tabs.Screen name="create" options={{ title: 'Pubblica' }} />
      <Tabs.Screen name="rankings" options={{ title: 'Classifiche' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profilo' }} />
    </Tabs>
  );
}
