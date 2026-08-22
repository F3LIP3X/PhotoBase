import { readSettings } from '../../settings'
import { isUnlocked } from '../../auth'
import { indexLibrary } from '../../infrastructure/metadata/exif-reader'
import { logError } from '../../infrastructure/logging/file-logger'

/* Reading EXIF off a whole library takes a while, so nothing waits on it:
   the index fills in behind the UI, and every file it finishes is saved as
   it goes. A partial index is still a useful one. */
export function indexMetadataInBackground() {
  if (!isUnlocked()) return

  const { libraryPath } = readSettings()
  if (!libraryPath) return

  indexLibrary(libraryPath).catch((error) => logError('metadata index', error))
}
