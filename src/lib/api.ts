import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import type { User } from '../types/domain';
import { responseContracts, userContract } from './contracts';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4317';
if (!/^https?:\/\//.test(API_URL)) throw new Error('EXPO_PUBLIC_API_URL non valido');
let sessionToken: string | null = null;
let tokenVersion = 0;
let tokenWrites: Promise<void> = Promise.resolve();
export const getToken = () => sessionToken;
export async function setToken(token: string | null) {
  sessionToken = token;
  tokenVersion++;
  tokenWrites = tokenWrites
    .catch(() => {})
    .then(async () => {
      if (token) await SecureStore.setItemAsync('votilt.session', token);
      else await SecureStore.deleteItemAsync('votilt.session');
    });
  await tokenWrites;
}
export async function restoreToken() {
  const version = tokenVersion;
  await tokenWrites;
  const saved = await SecureStore.getItemAsync('votilt.session');
  if (tokenVersion === version) sessionToken = saved;
  return sessionToken;
}
export class ApiError extends Error {
  constructor(
    public code: string,
    public uncertain = false,
  ) {
    super(errorCopy(code));
  }
}
export function errorCopy(code: string) {
  return (
    (
      {
        AUTH_REQUIRED: 'Accedi per scegliere i tuoi campioni.',
        INVALID_CREDENTIALS: 'Email o password non corretti.',
        ALREADY_EXISTS: 'Email o nome utente già registrato.',
        INVALID_INPUT: 'Controlla i dati inseriti.',
        CATEGORY_EXISTS:
          'Questa categoria esiste già o è già in revisione. Scegli quella suggerita.',
        INAPPROPRIATE_CATEGORY:
          'Riformula il testo della categoria: contiene parole o riferimenti non ammessi.',
        FORBIDDEN: 'Questa azione non è disponibile per il tuo account.',
        DUEL_STALE: 'Il tuo campione è cambiato su un altro dispositivo. Ricarichiamo il duello.',
        DUEL_SUPERSEDED: 'Hai aperto una sfida più recente. Torna al feed.',
        DUEL_EXPIRED: 'Questo TILT è scaduto. Puoi aprirne un altro.',
        CONTENT_UNAVAILABLE: 'Questo contenuto non è più disponibile.',
        BLOCKED_CONTENT: 'Questo contenuto non è disponibile.',
        CHAMPIONS_PRIVATE:
          'Il campione del tuo amico è privato. Entrambi dovete consentire il confronto.',
        RATE_LIMITED: 'Troppe richieste. Aspetta un momento e riprova.',
        INVALID_MEDIA: 'Scegli una vera immagine JPEG, PNG o WebP, fino a 8 MB.',
        METADATA_REQUIRED: 'Aggiungi il nome o il riferimento richiesto dalla categoria.',
        INVALID_REFERENCE_URL: 'Inserisci un link valido, ad esempio esempio.it.',
        INVALID_CONTENT_KIND: 'Questo tipo di contenuto non è adatto alla categoria scelta.',
        OFFLINE: 'Il tuo voto non è stato inviato. Riprova quando torni online.',
      } as Record<string, string>
    )[code] || 'Non siamo riusciti a completare l’azione. Riprova.'
  );
}
const errorSchema = z.object({ code: z.string() });
export async function request<T>(route: string, body?: unknown, method = 'POST'): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL + route, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError('OFFLINE', true);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('SERVER_ERROR', response.ok);
  }
  if (!response.ok) {
    const parsed = errorSchema.safeParse(data);
    throw new ApiError(parsed.success ? parsed.data.code : 'SERVER_ERROR', response.status >= 500);
  }
  const contract = route.startsWith('/rpc/')
    ? responseContracts[route.slice(5)]
    : route === '/auth/login' || route === '/auth/signup'
      ? z.object({ token: z.string().min(32), user: userContract })
      : undefined;
  if (contract && !contract.safeParse(data).success) throw new ApiError('SERVER_ERROR', true);
  return data as T;
}
export const rpc = <T>(action: string, input: Record<string, unknown> = {}) =>
  request<T>(`/rpc/${action}`, input);
export async function authenticate(mode: 'login' | 'signup', input: Record<string, unknown>) {
  const result = await request<{ token: string; user: User }>(`/auth/${mode}`, input);
  await setToken(z.string().min(32).parse(result.token));
  return result.user;
}
export const mediaSource = (url: string): { uri: string; headers: Record<string, string> } => ({
  uri: API_URL + url,
  headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
});
