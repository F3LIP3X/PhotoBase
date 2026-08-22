import { app } from 'electron'
import { rmSync } from 'fs'
import { join, resolve } from 'path'
import { readSettings, clearSettings } from '../settings'
import { clearIndex } from './index-store'
import { readMeta, writeMeta } from './meta'
import { log } from '../infrastructure/logging/file-logger'
import { OWNED_BY_SYSTEM, isDriveRoot } from '../domain/settings/protected-paths'

/* Two levels, deliberately far apart.
 *
 * A reset puts the app back to first run: settings, the backup index and
 * its history, and the derived caches. It never touches a photo.
 *
 * A wipe is the other one, and it is the only call in this app that can
 * destroy the user's pictures. Nothing calls it without the user having
 * typed a confirmation first. */

const thumbsCache = () => join(app.getPath('userData'), 'thumbs')

export function resetConfiguration() {
  const { libraryPath } = readSettings()

  if (libraryPath) {
    clearIndex(libraryPath)

    /* Favourites and the trash survive: they describe photos that are
       still there, and dropping the trash list would orphan every file
       sitting in .trash with no way back to where it came from. */
    const meta = readMeta(libraryPath)
    meta.backups = []
    writeMeta(libraryPath, meta)
  }

  rmSync(thumbsCache(), { recursive: true, force: true })
  clearSettings()

  log('configuration reset', { libraryPath })
  return true
}

/* OWNED_BY_SYSTEM and the drive-root check now live in
   ../domain/settings/protected-paths.ts — pure, no Electron dependency. */

/* The library folder is whatever the user picked in a native dialog, so
   it could be a drive root or their home directory — where a recursive
   delete takes far more than a photo library. */
function assertSafeToWipe(target) {
  if (isDriveRoot(target)) {
    throw new Error(
      `«${target}» es la raíz de una unidad, no una carpeta de biblioteca. ` +
        'PhotoBase no va a borrar eso.',
    )
  }

  const owned = OWNED_BY_SYSTEM.map((name) => {
    try {
      return resolve(app.getPath(name))
    } catch {
      return null
    }
  })

  if (owned.includes(target)) {
    throw new Error(
      `«${target}» es una carpeta del sistema, no una carpeta de biblioteca. ` +
        'PhotoBase no va a borrar eso.',
    )
  }
}

export function wipeLibrary() {
  const { libraryPath } = readSettings()

  if (libraryPath) {
    const target = resolve(libraryPath)
    assertSafeToWipe(target)
    rmSync(target, { recursive: true, force: true })
  }

  rmSync(thumbsCache(), { recursive: true, force: true })
  clearSettings()

  log('library wiped', { libraryPath })
  return true
}
