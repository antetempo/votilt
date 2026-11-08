import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { User } from '../types/domain';
import { request, restoreToken, rpc, setToken, getToken } from './api';
import { cacheScope, loadReadCache, saveReadCache, purgeReadCache } from './readCache';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 20000 }, mutations: { retry: false } },
});
export async function clearPrivateCaches() {
  purgeReadCache();
  await queryClient.cancelQueries();
  queryClient.clear();
  await Image.clearMemoryCache();
  await Image.clearDiskCache();
}
type Context = {
  user: User | null;
  loading: boolean;
  offline: boolean;
  refresh: () => Promise<void>;
  login: (u: User) => Promise<void>;
  logout: () => Promise<void>;
};
const SessionContext = createContext<Context | null>(null);
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const cachedIdentity = useRef<{ token: string; scope: string; user: User } | null>(null);
  const refresh = useCallback(async () => {
    try {
      const savedToken = await restoreToken();
      if (savedToken && !cachedIdentity.current) {
        const scope = await cacheScope(savedToken);
        if (getToken() === savedToken) {
          const cached = await loadReadCache(queryClient, scope);
          if (cached && getToken() === savedToken) {
            setUser(cached);
            cachedIdentity.current = { token: savedToken, scope, user: cached };
          }
        }
      }
      await request('/health', undefined, 'GET');
      setOffline(false);
      const expectedToken = await restoreToken();
      if (expectedToken) {
        try {
          const restored = await rpc<User>('me');
          if (getToken() === expectedToken) {
            setUser(restored);
            const scope = await cacheScope(expectedToken);
            if (getToken() === expectedToken) {
              cachedIdentity.current = { token: expectedToken, scope, user: restored };
              saveReadCache(queryClient, scope, restored);
            }
          }
        } catch (e) {
          if ((e as { code?: string }).code === 'AUTH_REQUIRED' && getToken() === expectedToken) {
            await setToken(null);
            setUser(null);
            cachedIdentity.current = null;
            await clearPrivateCaches();
          } else throw e;
        }
      }
    } catch {
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = queryClient.getQueryCache().subscribe(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const identity = cachedIdentity.current;
        if (identity && getToken() === identity.token)
          saveReadCache(queryClient, identity.scope, identity.user);
      }, 500);
    });
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Bootstrap synchronizes an asynchronous external API, not derived render state.
    void refresh();
    const sub = AppState.addEventListener('change', (s) => {
      focusManager.setFocused(s === 'active');
      if (s === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);
  const logout = async () => {
    const expectedToken = getToken();
    await request('/auth/logout', {});
    if (getToken() !== expectedToken) return;
    await setToken(null);
    cachedIdentity.current = null;
    setUser(null);
    await clearPrivateCaches();
  };
  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        offline,
        refresh,
        login: async (u) => {
          cachedIdentity.current = null;
          await clearPrivateCaches();
          setUser(u);
          const token = getToken();
          if (token) {
            const scope = await cacheScope(token);
            if (getToken() === token) {
              cachedIdentity.current = { token, scope, user: u };
              saveReadCache(queryClient, scope, u);
            }
          }
        },
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('SessionProvider missing');
  return ctx;
}
