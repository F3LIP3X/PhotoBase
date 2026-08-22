import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { scanLibrary } from './scan'
import { readMeta, TRASH_DIR } from './meta'

const GB = 1024 ** 3
/* Walking a large library is expensive, and the quota pill asks for the
   figure on every mount. A short cache keeps that honest without turning
   the UI into a disk crawler. */
const CACHE_TTL_MS = 30_000

let cached = { at: 0, bytes: 0, path: null }
let inFlight = null

async function directorySize(path) {
  let total = 0

  let entries
  try {
    entries = await readdir(path, { withFileTypes: true })
  } catch {
    /* An unreadable or missing folder contributes nothing rather than
       failing the whole measurement. */
    return 0
  }

  for (const entry of entries) {
    const child = join(path, entry.name)
    if (entry.isDirectory()) {
      total += await directorySize(child)
    } else if (entry.isFile()) {
      try {
        total += (await stat(child)).size
      } catch {
        /* File vanished mid-walk; skip it. */
      }
    }
  }

  return total
}

export async function libraryUsage(libraryPath) {
  if (!libraryPath) return { usedBytes: 0, usedGB: 0 }

  const fresh = cached.path === libraryPath && Date.now() - cached.at < CACHE_TTL_MS
  if (fresh) return { usedBytes: cached.bytes, usedGB: cached.bytes / GB }

  inFlight ??= directorySize(libraryPath)
    .then((bytes) => {
      cached = { at: Date.now(), bytes, path: libraryPath }
      return bytes
    })
    .finally(() => {
      inFlight = null
    })

  const bytes = await inFlight
  return { usedBytes: bytes, usedGB: bytes / GB }
}

/* What the quota is actually being spent on. Derived from the same scan
   the gallery reads, so the figures here can never disagree with the ones
   on the Fotos screen. */
export async function libraryBreakdown(libraryPath) {
  if (!libraryPath) return { usedBytes: 0, entries: [] }

  const { groups } = await scanLibrary(libraryPath)

  const byCategory = new Map()
  let countedBytes = 0

  for (const group of groups) {
    for (const photo of group.photos) {
      const current = byCategory.get(photo.category) ?? { bytes: 0, count: 0 }
      current.bytes += photo.size
      current.count += 1
      byCategory.set(photo.category, current)
      countedBytes += photo.size
    }
  }

  const { usedBytes } = await libraryUsage(libraryPath)
  const trashBytes = await directorySize(join(libraryPath, TRASH_DIR))

  const entries = [...byCategory.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.bytes - a.bytes)

  if (trashBytes > 0) {
    entries.push({
      label: 'Papelera',
      bytes: trashBytes,
      count: readMeta(libraryPath).trash.length,
    })
  }

  /* Whatever the walk found that the gallery does not show: the index,
     the metadata file, and any stray file dropped into the folder. The
     usage figure is cached, so a small negative here is staleness rather
     than an error. */
  const other = usedBytes - countedBytes - trashBytes
  if (other > 1024) entries.push({ label: 'Otros archivos', bytes: other, count: 0 })

  return { usedBytes, entries }
}

/* Copying must stop at the cap rather than overrun it, so callers ask
   before writing rather than apologising afterwards. */
export function quotaState({ usedGB, quotaGB, warnAt = 0.9 }) {
  if (!quotaGB) return { ratio: 0, warning: false, full: false }
  const ratio = usedGB / quotaGB
  return { ratio, warning: ratio >= warnAt && ratio < 1, full: ratio >= 1 }
}
