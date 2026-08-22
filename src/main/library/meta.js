import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, rmSync } from 'fs'
import { join, dirname, basename } from 'path'

const META_FILE = '.photobase-meta.json'
export const TRASH_DIR = '.trash'
const TRASH_DAYS = 30

const EMPTY = { favorites: [], trash: [], backups: [] }

const metaPath = (libraryPath) => join(libraryPath, META_FILE)

export function readMeta(libraryPath) {
  try {
    return { ...EMPTY, ...JSON.parse(readFileSync(metaPath(libraryPath), 'utf8')) }
  } catch {
    return { ...EMPTY }
  }
}

export function writeMeta(libraryPath, meta) {
  writeFileSync(metaPath(libraryPath), JSON.stringify(meta), 'utf8')
  return meta
}

/* Favourites are a list of paths, not a folder of moved files.
 *
 * Moving a photo would break the YYYY/MM layout the library is built on,
 * and worse, it would break the backup index — that records where each
 * copied file landed, so a moved photo reads as missing and gets pulled
 * from the phone all over again. A list costs nothing and lets a photo
 * be both favourite and in its month.
 */
export function toggleFavorite(libraryPath, path) {
  const meta = readMeta(libraryPath)
  const at = meta.favorites.indexOf(path)

  if (at >= 0) meta.favorites.splice(at, 1)
  else meta.favorites.push(path)

  writeMeta(libraryPath, meta)
  return meta.favorites.includes(path)
}

/* Deleting is a real move, because here the move is the point: the file
   leaves the month view but stays recoverable, with where it came from
   recorded so restoring puts it back exactly. */
export function moveToTrash(libraryPath, path) {
  const source = join(libraryPath, path)
  if (!existsSync(source)) return false

  const trashName = `${Date.now()}-${basename(path)}`
  const target = join(libraryPath, TRASH_DIR, trashName)

  mkdirSync(dirname(target), { recursive: true })
  renameSync(source, target)

  const meta = readMeta(libraryPath)
  meta.trash.push({ stored: trashName, originalPath: path, deletedAt: Date.now() })
  meta.favorites = meta.favorites.filter((favorite) => favorite !== path)
  writeMeta(libraryPath, meta)

  return true
}

export function restoreFromTrash(libraryPath, stored) {
  const meta = readMeta(libraryPath)
  const entry = meta.trash.find((item) => item.stored === stored)
  if (!entry) return false

  const source = join(libraryPath, TRASH_DIR, stored)
  const target = join(libraryPath, entry.originalPath)

  if (existsSync(source)) {
    mkdirSync(dirname(target), { recursive: true })
    renameSync(source, target)
  }

  meta.trash = meta.trash.filter((item) => item.stored !== stored)
  writeMeta(libraryPath, meta)
  return true
}

/* The only operation that actually frees space, and the only one that is
   irreversible — so it is never automatic. */
export function emptyTrash(libraryPath) {
  const meta = readMeta(libraryPath)

  for (const entry of meta.trash) {
    rmSync(join(libraryPath, TRASH_DIR, entry.stored), { force: true })
  }

  const removed = meta.trash.length
  meta.trash = []
  writeMeta(libraryPath, meta)
  return removed
}

export function trashWithCountdown(libraryPath) {
  const meta = readMeta(libraryPath)
  const now = Date.now()

  return meta.trash
    .map((entry) => {
      const age = (now - entry.deletedAt) / 86_400_000
      return {
        ...entry,
        name: basename(entry.originalPath),
        daysLeft: Math.max(0, Math.ceil(TRASH_DAYS - age)),
      }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
}

export function recordBackup(libraryPath, entry) {
  const meta = readMeta(libraryPath)
  meta.backups.unshift({ at: Date.now(), ...entry })
  meta.backups = meta.backups.slice(0, 50)
  writeMeta(libraryPath, meta)
  return meta.backups
}
