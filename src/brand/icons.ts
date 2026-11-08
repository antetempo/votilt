// Original VOTILT pictograms, drawn for this project. No stock path data.
// A cut corner and a rising diagonal repeat the VOTILT mark across the set.
export const iconPaths: Record<string, string> = {
  feed: '<path d="m8 5 16-2 3 23-17 2zM4 10l2 19 15-1M12 18l4-5 7 8M20 9h.01"/>',
  search: '<path d="m13 3 10 6-2 12-12 3-7-9 4-9zM21 23l8 5M8 9l5-2"/>',
  publish:
    '<path d="M16 5 5 7 3 27l22-2 1-10M7 22l6-7 5 5"/><path d="m19 4 10-2-2 10-5-3z" fill="currentColor"/><path d="m22 9-5 7"/>',
  rankings: '<path d="M4 27h24M7 23V14l5-2v11M16 23V6l5-3v20M25 23v-9l4-2M3 8l5-4 3 2"/>',
  profile: '<path d="m11 5 9-2 5 7-4 9-9 1-6-8zM3 29l3-6 7-1 3 4 5-4 7 4 1 3M11 10l2-2"/>',
  heart: '<path d="M16 28 4 17C-2 9 6 1 13 7l3 4 4-5c7-6 15 2 10 9z"/>',
  share: '<path d="m5 16 20-11-6 22-5-8zM14 19l7-10M3 24l6-2"/>',
  more: '<path d="m3 17 4-4 4 3-4 4zM13 15l4-4 4 3-4 4zM23 13l4-4 4 3-4 4z"/>',
  category: '<path d="m3 10 10-6 14 2 2 14-11 9L3 16zM10 11h.01M15 11l8 1M17 17l6 1"/>',
  chevron: '<path d="m11 5 12 10-10 12M6 8l4 3"/>',
  back: '<path d="m20 4-13 12 12 12M8 16h21"/>',
  bolt: '<path d="m20 2-16 17 10-1-3 12L29 11l-11 2z"/>',
  spark: '<path d="m16 2 4 10 10 3-10 5-5 11-3-11-10-4 10-4zM26 2l2 3 3 1-3 2-2 3-1-4-3-1z"/>',
  users: '<path d="m7 5 7-2 4 6-3 7-8 1-4-7zM2 29l3-8 8-2 7 7M23 6l6 2-1 8-6 2M23 22l5 1 2 6"/>',
  notification: '<path d="m7 22 2-11 6-6 8 4 2 11 4 4-26 2zM12 29h7M16 2v3"/>',
  shield: '<path d="m3 8 13-5 13 4-3 15-10 8L5 22zM10 16l5 6 9-12"/>',
  settings: '<path d="m9 3 7 3 7-2 2 7 5 5-5 6-2 8-8-3-7 1-2-7-4-5 5-5zM11 15l5-5 6 5-5 7z"/>',
  close: '<path d="m7 4 20 23M25 4 5 27M4 6l3-2"/>',
  check: '<path d="m3 16 9 11L29 4M5 13l4 5"/>',
  history: '<path d="M5 10a12 12 0 1 1-1 11M2 3l1 10 9-2M17 8l-1 9 7 4"/>',
  photo: '<path d="m5 5 22-2 2 23-24 3zM8 23l7-10 6 6 3-4 4 9M11 9h.01"/>',
  link: '<path d="m12 9 6-5 8 1 3 7-8 8M20 23l-6 5-8-1-3-7 8-8M10 22l12-13"/>',
  planet: '<path d="M26 15a11 11 0 1 1-7-10M3 23 27 7M2 19l1 4 7 1M23 5l4 2 1 6M18 6l3-4 3 2"/>',
};
export const iconAliases: Record<string, string> = {
  albums: 'feed',
  'podium-outline': 'rankings',
  'person-circle-outline': 'profile',
  'person-add-outline': 'profile',
  'share-social-outline': 'share',
  'ellipsis-horizontal': 'more',
  'sparkles-outline': 'spark',
  sparkles: 'spark',
  flash: 'bolt',
  ribbon: 'heart',
  add: 'publish',
  'people-outline': 'users',
  'notifications-outline': 'notification',
  'shield-checkmark-outline': 'shield',
  'planet-outline': 'planet',
  'chevron-forward': 'chevron',
};
export function iconSvg(name: string, color = '#FFFFFF') {
  const key = iconAliases[name] || name;
  const path = iconPaths[key] || iconPaths.spark;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" color="${color}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}
