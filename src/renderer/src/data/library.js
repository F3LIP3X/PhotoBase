/* Stand-in library. Everything the UI reports is derived from here, so
   the counts never contradict each other across screens. Replace with
   the real index once the filesystem scanner lands. */

export const LIBRARY = [
  { date: '12 agosto 2026', place: 'Granada', count: 11 },
  { date: '10 agosto 2026', place: 'Casa', count: 17 },
  { date: '3 agosto 2026', place: 'Sierra Nevada', count: 8 },
  { date: '27 julio 2026', place: 'Cádiz', count: 22 },
];

export const FAVORITES = [
  { date: '12 agosto 2026', place: 'Granada', count: 4 },
  { date: '27 julio 2026', place: 'Cádiz', count: 5 },
];

/* Deleted items are held, never purged silently. */
export const TRASH = [
  { name: 'IMG_4471.heic', size: '4,2 MB', daysLeft: 27 },
  { name: 'IMG_4468.heic', size: '3,8 MB', daysLeft: 27 },
  { name: 'VID_0233.mov', size: '112 MB', daysLeft: 19 },
  { name: 'IMG_4390.heic', size: '4,0 MB', daysLeft: 12 },
  { name: 'IMG_4388.heic', size: '3,9 MB', daysLeft: 12 },
  { name: 'IMG_4102.heic', size: '5,1 MB', daysLeft: 3 },
];

/* Facets read off each file's metadata — the basis for Explorar. */
export const FACETS = [
  {
    title: 'Por año',
    entries: [
      { label: '2026', count: 58 },
      { label: '2025', count: 412 },
      { label: '2024', count: 388 },
      { label: '2023', count: 194 },
    ],
  },
  {
    title: 'Por cámara',
    entries: [
      { label: 'iPhone 15 Pro', count: 731 },
      { label: 'Fujifilm X-T30', count: 268 },
      { label: 'Sin metadatos', count: 53 },
    ],
  },
  {
    title: 'Por lugar',
    entries: [
      { label: 'Granada', count: 341 },
      { label: 'Cádiz', count: 226 },
      { label: 'Sierra Nevada', count: 97 },
      { label: 'Casa', count: 388 },
    ],
  },
];

export const DEVICES = [
  {
    id: 'pixel-8',
    name: 'Pixel 8',
    connected: false,
    lastBackup: '10 agosto 2026',
    newItems: 0,
  },
];

export const STORAGE = { usedGB: 67, quotaGB: 100, warnAt: 0.9 };

export const countItems = (groups) =>
  groups.reduce((total, group) => total + group.count, 0);
