import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { isMediaFile, isVideoFile } from '../devices/androidLayout'

/* The library is laid out as YYYY/MM/file, which means the folder tree
   itself carries the dates — no database needed to group by month. */
const YEAR = /^\d{4}$/
const MONTH = /^\d{2}$/

const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

async function listDirs(path, pattern) {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory() && pattern.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .reverse()
  } catch {
    return []
  }
}

/* Capture time is already encoded in Android filenames
   (PXL_20260806_214636611.jpg); fall back to the folder when it is not. */
function timeFromName(name, year, month) {
  const match = /(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})?(\d{2})?(\d{2})?/.exec(name)
  if (match) {
    const [, y, mo, d, h = '00', mi = '00', s = '00'] = match
    const parsed = new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}`)
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
  }
  return new Date(`${year}-${month}-01T00:00:00`).getTime()
}

/* Android names its files by where they came from: PXL_ from the camera,
   Screenshot_ from the screen — the closest thing to a kind without
   opening every file. Video wins over origin, because a camera clip is a
   video first and a PXL_ capture second. Decided here so the grid, the
   facets and the filters cannot disagree about it. */
function categoryOf(name, kind) {
  if (kind === 'video') return 'Vídeos'
  if (/^Screenshot/i.test(name)) return 'Capturas'
  if (/^PXL_/i.test(name)) return 'Cámara'
  return 'Otras'
}

export async function scanLibrary(libraryPath) {
  if (!libraryPath) return { groups: [], total: 0 }

  const groups = []
  let total = 0

  for (const year of await listDirs(libraryPath, YEAR)) {
    for (const month of await listDirs(join(libraryPath, year), MONTH)) {
      const folder = join(libraryPath, year, month)

      let entries = []
      try {
        entries = await readdir(folder, { withFileTypes: true })
      } catch {
        continue
      }

      const photos = []
      for (const entry of entries) {
        if (!entry.isFile() || !isMediaFile(entry.name)) continue

        let size = 0
        try {
          size = (await stat(join(folder, entry.name))).size
        } catch {
          continue
        }

        const kind = isVideoFile(entry.name) ? 'video' : 'image'

        photos.push({
          /* Relative path is the identity used everywhere: the media
             protocol, favourites and the trash all key off it. */
          path: `${year}/${month}/${entry.name}`,
          name: entry.name,
          /* Decided here rather than re-guessed from the filename in
             every component that renders one. */
          kind,
          category: categoryOf(entry.name, kind),
          size,
          takenAt: timeFromName(entry.name, year, month),
        })
      }

      if (!photos.length) continue

      photos.sort((a, b) => b.takenAt - a.takenAt)
      total += photos.length

      groups.push({
        id: `${year}-${month}`,
        year,
        month,
        label: `${MONTH_NAMES[Number(month) - 1]} ${year}`,
        count: photos.length,
        photos,
      })
    }
  }

  return { groups, total }
}

/* Explorar reads the same scan: facets are derived, never stored, so
   they cannot drift from what is actually on disk. */
export function buildFacets(groups) {
  const byYear = new Map()
  const byKind = new Map()
  let bytes = 0

  for (const group of groups) {
    byYear.set(group.year, (byYear.get(group.year) ?? 0) + group.count)

    for (const photo of group.photos) {
      bytes += photo.size
      byKind.set(photo.category, (byKind.get(photo.category) ?? 0) + 1)
    }
  }

  /* Each entry carries what it selects, not just what it says. That is
     what lets Explorar open a facet and show the photos behind it
     without re-deriving the grouping rules on the other side. */
  const toEntries = (map, field) =>
    [...map.entries()]
      .map(([value, count]) => ({ label: value, value, count, field }))
      .sort((a, b) => b.count - a.count)

  return {
    bytes,
    facets: [
      { title: 'Por año', entries: toEntries(byYear, 'year') },
      { title: 'Por tipo', entries: toEntries(byKind, 'category') },
      {
        title: 'Por mes',
        entries: groups.map((group) => ({
          label: group.label,
          value: group.id,
          count: group.count,
          field: 'group',
        })),
      },
    ],
  }
}
