import { readFileSync, writeFileSync, statSync, rmSync } from 'fs'
import { join } from 'path'
import { planDestination as planDestinationPure } from '../domain/devices/backup-index'

const INDEX_FILE = '.photobase-index.json'
const VERSION = 1

/* What makes two files "the same photo".
 *
 * A content hash would be the rigorous answer, but reading the bytes of
 * every file on the phone over MTP costs as much as copying it — which
 * defeats the point of skipping it. Name plus byte size is cheap, comes
 * straight from the device listing, and is decisive in practice: camera
 * filenames already carry a timestamp, and two different photos sharing
 * both a name and an exact byte count does not happen in a camera roll.
 */
export const mediaKey = ({ name, size }) => `${String(name).toLowerCase()}|${size}`

const indexPath = (libraryPath) => join(libraryPath, INDEX_FILE)

export function loadIndex(libraryPath) {
  try {
    const raw = JSON.parse(readFileSync(indexPath(libraryPath), 'utf8'))
    if (raw?.version === VERSION && raw.entries) return raw
  } catch {
    /* No index yet, or one we cannot read: start a fresh one rather than
       refusing to back up. The destination check below still protects
       against duplicates. */
  }
  return { version: VERSION, entries: {} }
}

export function saveIndex(libraryPath, index) {
  writeFileSync(indexPath(libraryPath), JSON.stringify(index), 'utf8')
}

const sizeOf = (path) => {
  try {
    return statSync(path).size
  } catch {
    return -1
  }
}

/* The suffix-collision naming and the recorded-vs-stranger decision now
   live in ../domain/devices/backup-index.ts as pure logic. This wrapper
   supplies the one thing domain cannot do itself — asking the real
   filesystem how big a file is — so every existing caller of
   planDestination keeps its original signature unchanged. */
export function planDestination({ index, libraryPath, item, relative, claimed }) {
  return planDestinationPure({
    index,
    libraryPath,
    item,
    relative,
    claimed,
    getSize: sizeOf,
    mediaKey,
  })
}

export function recordCopy(index, item, destinationRelative) {
  index.entries[mediaKey(item)] = {
    path: destinationRelative,
    at: new Date().toISOString(),
  }
  return index
}

/* Forgetting what was copied is not the same as deleting it: the files
   stay, and the next backup re-derives the truth from the disk. */
export function clearIndex(libraryPath) {
  rmSync(indexPath(libraryPath), { force: true })
}

/* Destination layout: YYYY/MM taken from the capture date, so the library
   stays navigable in a file manager without PhotoBase running. */
export function destinationFor(item) {
  const taken = item.takenAt ? new Date(item.takenAt) : null
  const valid = taken && !Number.isNaN(taken.getTime())
  const date = valid ? taken : new Date()

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}/${month}/${item.name}`
}
