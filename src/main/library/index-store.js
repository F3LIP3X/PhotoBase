import { readFileSync, writeFileSync, statSync } from 'fs'
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

const sizeOf = (path) => {
  try {
    return statSync(path).size
  } catch {
    return -1
  }
}

/* IMG_0001.jpg lives in more than one folder on a phone, and a recursive
   walk finds every one of them. They all want the same YYYY/MM slot, so
   the later ones take a suffix rather than quietly landing on top of the
   first and destroying it. */
const withSuffix = (relative, attempt) => {
  const dot = relative.lastIndexOf('.')
  return dot < 1
    ? `${relative}-${attempt}`
    : `${relative.slice(0, dot)}-${attempt}${relative.slice(dot)}`
}

const MAX_ATTEMPTS = 100

/* Where one file from the device should land, or null to leave it where
   it is. The disk outranks the index, because the index records an
   intention and the disk records the result — but only for files this
   backup put there. Anything else under that name belongs to someone
   else and is never overwritten. */
export function planDestination({ index, libraryPath, item, relative, claimed }) {
  const expected = Number(item.size) || 0
  const recorded = index.entries[mediaKey(item)]

  let candidate = relative

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (!claimed.has(candidate)) {
      const onDisk = sizeOf(join(libraryPath, candidate))

      /* Nothing there. A recorded file that has since gone was deleted
         or moved on purpose, so it is not pulled off the phone again. */
      if (onDisk < 0) return recorded && candidate === relative ? null : candidate

      /* Same name and same length: it is already here. */
      if (expected > 0 && onDisk === expected) return null

      /* Our own record at the wrong length is the wreckage of a copy
         that was interrupted — a large video, most likely — and gets
         finished in place instead of duplicated beside itself. */
      if (recorded?.path === candidate) return candidate
    }

    candidate = withSuffix(relative, attempt + 1)
  }

  return null
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
