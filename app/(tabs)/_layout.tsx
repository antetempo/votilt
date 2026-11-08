import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Icon } from '../../src/components/Icon';
import { colors as c, fonts as f } from '../../src/theme/tokens';
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.text,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.bg,
          borderTopColor: c.border,
          height: 76,
          paddingTop: 7,
          paddingBottom: 12,
        },
        tabBarLabelStyle: { fontFamily: f.semibold, fontSize: 9, marginTop: 3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => (
            <Icon name="feed" size={24} color={focused ? c.text : c.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Esplora',
          tabBarIcon: ({ focused }) => (
            <Icon name="search" size={24} color={focused ? c.text : c.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Pubblica',
          tabBarAccessibilityLabel: 'Pubblica la tua immagine',
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 54,
                height: 45,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? c.raised : 'transparent',
                borderRadius: 15,
              }}
            >
              <Icon name="publish" size={34} color={c.purple} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="rankings"
        options={{
          title: 'Classifiche',
          tabBarIcon: ({ focused }) => (
            <Icon name="rankings" size={24} color={focused ? c.text : c.muted} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilo',
          tabBarIcon: ({ focused }) => (
            <Icon name="profile" size={24} color={focused ? c.text : c.muted} />
          ),
        }}
      />
    </Tabs>
  );
}
