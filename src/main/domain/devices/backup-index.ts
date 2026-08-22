import { join } from 'path'

/* IMG_0001.jpg lives in more than one folder on a phone, and a recursive
   walk finds every one of them. They all want the same YYYY/MM slot, so
   the later ones take a suffix rather than quietly landing on top of the
   first and destroying it. */
export function withSuffix(relative: string, attempt: number): string {
  const dot = relative.lastIndexOf('.')
  return dot < 1
    ? `${relative}-${attempt}`
    : `${relative.slice(0, dot)}-${attempt}${relative.slice(dot)}`
}

const MAX_ATTEMPTS = 100

export interface BackupIndexEntries {
  [key: string]: { path: string; at: string } | undefined
}

export interface BackupIndex {
  version: number
  entries: BackupIndexEntries
}

export interface DeviceItem {
  name: string
  size?: number
}

export interface PlanDestinationInput {
  index: BackupIndex
  libraryPath: string
  item: DeviceItem
  relative: string
  claimed: Set<string>
  /* The port: asks how big the file at this absolute path is on disk,
     -1 if it does not exist. Domain never touches the filesystem itself
     — the caller (index-store.js) supplies the real fs.statSync-backed
     implementation. */
  getSize: (path: string) => number
  mediaKey: (item: DeviceItem) => string
}

/* Where one file from the device should land, or null to leave it where
   it is. The disk outranks the index, because the index records an
   intention and the disk records the result — but only for files this
   backup put there. Anything else under that name belongs to someone
   else and is never overwritten. */
export function planDestination({
  index,
  libraryPath,
  item,
  relative,
  claimed,
  getSize,
  mediaKey,
}: PlanDestinationInput): string | null {
  const expected = Number(item.size) || 0
  const recorded = index.entries[mediaKey(item)]

  let candidate = relative

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    if (!claimed.has(candidate)) {
      const onDisk = getSize(join(libraryPath, candidate))

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
