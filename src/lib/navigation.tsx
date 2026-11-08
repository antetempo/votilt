import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router, type Href } from 'expo-router';

type Guard = () => Promise<boolean>;
const NavigationContext = createContext<{
  navigate: (href: Href) => Promise<void>;
  busy: boolean;
  register: (guard: Guard) => () => void;
} | null>(null);

export function AppNavigationProvider({ children }: { children: React.ReactNode }) {
  const guard = useRef<Guard | null>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const register = useCallback((next: Guard) => {
    guard.current = next;
    return () => {
      if (guard.current === next) guard.current = null;
    };
  }, []);
  const navigate = useCallback(async (href: Href) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      if (!guard.current || (await guard.current())) router.navigate(href);
    } catch (error) {
      Alert.alert('Navigazione non completata', (error as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return (
    <NavigationContext.Provider value={{ navigate, busy, register }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  return useContext(NavigationContext);
}

export function useAppNavigationGuard(guard: Guard) {
  const register = useAppNavigation()?.register;
  useEffect(() => register?.(guard), [register, guard]);
}
