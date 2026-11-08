export function normalizeReferenceUrl(value: string) {
  const raw = value.trim();
  if (!raw) return '';
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('INVALID_REFERENCE_URL');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    !url.hostname ||
    url.username ||
    url.password ||
    /\s/.test(raw)
  )
    throw new Error('INVALID_REFERENCE_URL');
  return url.toString();
}
