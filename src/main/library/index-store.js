import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

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

/* Two independent guards, because the index is a convenience and must
   never be the only thing standing between the user and a duplicate:
   the recorded key, and the file already sitting at the destination. */
export function alreadyCopied(index, libraryPath, item, destinationRelative) {
  if (index.entries[mediaKey(item)]) return true
  return existsSync(join(libraryPath, destinationRelative))
}

export function recordCopy(index, item, destinationRelative) {
  index.entries[mediaKey(item)] = {
    path: destinationRelative,
    at: new Date().toISOString(),
  }
  return index
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
