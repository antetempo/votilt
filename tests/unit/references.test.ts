import { normalizeReferenceUrl } from '../../src/utils/references';
test('link facile: dominio senza protocollo normalizzato', () => {
  expect(normalizeReferenceUrl('  esempio.it/pagina ')).toBe('https://esempio.it/pagina');
  expect(normalizeReferenceUrl('http://localhost:4317')).toBe('http://localhost:4317/');
});
test('non accetta schemi eseguibili o credenziali nei link', () => {
  for (const value of [
    'javascript:alert(1)',
    'file:///secret',
    'https://user:password@example.com',
    'https://bad url',
  ])
    expect(() => normalizeReferenceUrl(value)).toThrow('INVALID_REFERENCE_URL');
});
