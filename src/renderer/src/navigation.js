import {
  PiImagesSquareFill,
  PiCompassFill,
  PiStarFill,
  PiTrashFill,
  PiUsbFill,
  PiGearFill,
} from 'react-icons/pi';

/* One source of truth for the rail and the toolbar. `searchable` marks
   the sections where a search field earns its place: you search a
   library, not a device list or a trash can. */
export const SECTIONS = [
  { path: '/fotos', label: 'Fotos', icon: PiImagesSquareFill, searchable: true },
  { path: '/explorar', label: 'Explorar', icon: PiCompassFill, searchable: true },
  { path: '/favoritos', label: 'Favoritos', icon: PiStarFill, searchable: true },
  { path: '/dispositivos', label: 'Dispositivos', icon: PiUsbFill, searchable: false },
  { path: '/papelera', label: 'Papelera', icon: PiTrashFill, searchable: false },
  { path: '/ajustes', label: 'Ajustes', icon: PiGearFill, searchable: false },
];

export const findSection = (pathname) =>
  SECTIONS.find((section) => section.path === pathname);
