import { useState, useRef } from 'react';
import { Alert } from 'react-native';
import { rpc } from '../lib/api';
import { queryClient } from '../lib/session';
export function useAction() {
  const [busy, setBusy] = useState(false);
  const running = useRef(false);
  const run = async <T = unknown>(
    action: string,
    input: Record<string, unknown>,
    done?: (data: T) => void,
  ) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      const data = await rpc<T>(action, input);
      await queryClient.invalidateQueries();
      done?.(data);
      return data;
    } catch (e) {
      Alert.alert('Azione non completata', (e as Error).message);
    } finally {
      running.current = false;
      setBusy(false);
    }
  };
  return { busy, run };
}
