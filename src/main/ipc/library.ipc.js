import { ipcMain, shell, clipboard, nativeImage } from 'electron'
import { join, resolve, sep, basename } from 'path'
import { guarded, resolveInLibrary } from './shared'
import { readSettings } from '../settings'
import { scanLibrary, buildFacets } from '../library/scan'
import {
  readMeta,
  toggleFavorite,
  moveToTrash,
  moveManyToTrash,
  restoreFromTrash,
  emptyTrash,
  trashWithCountdown,
} from '../library/meta'
import { metadataFor, knownMetadata } from '../library/metadata'
import { playableFor, videoToolsReady } from '../library/video'
import { libraryUsage, libraryBreakdown } from '../library/usage'

export function registerLibraryHandlers() {
  ipcMain.handle(
    'library:photos',
    guarded('library:photos', async () => {
      const { libraryPath } = readSettings()
      const { groups, total } = await scanLibrary(libraryPath)
      const meta = readMeta(libraryPath)
      const exif = knownMetadata()

      /* Camera and lens ride along with the photo so the search box can
         match on them without a round trip per keystroke. Whatever the
         background pass has not reached yet simply comes back null. */
      const withExif = groups.map((group) => ({
        ...group,
        photos: group.photos.map((photo) => ({
          ...photo,
          camera: exif[photo.path]?.camera ?? null,
          lens: exif[photo.path]?.lens ?? null,
        })),
      }))

      return { groups: withExif, total, favorites: meta.favorites }
    }),
  )

  ipcMain.handle(
    'library:facets',
    guarded('library:facets', async () => {
      const { libraryPath } = readSettings()
      const { groups, total } = await scanLibrary(libraryPath)
      return { ...buildFacets(groups), total }
    }),
  )

  /* Codecs the app cannot decode are still perfectly good files, so the
     viewer can hand one to whatever the system uses instead. Confined to
     the library, like every other path this app accepts. */
  /* Slow by nature — it re-encodes the whole video — so the renderer
     shows a wait while this runs rather than pretending it is instant. */
  ipcMain.handle(
    'library:playable',
    guarded('library:playable', async (_event, path) => {
      if (!videoToolsReady()) return null

      const { libraryPath } = readSettings()
      if (!libraryPath || !path) return null

      const root = resolve(libraryPath)
      const target = resolve(join(root, path))
      if (target !== root && !target.startsWith(root + sep)) return null

      const made = await playableFor(target)
      return made ? basename(made) : null
    }),
  )

  ipcMain.handle(
    'library:open',
    guarded('library:open', async (_event, path) => {
      const target = resolveInLibrary(path)
      if (!target) return false

      const failure = await shell.openPath(target)
      if (failure) throw new Error(failure)
      return true
    }),
  )

  /* Selects the file in Explorer/Finder/the file manager rather than
     opening it, so the user lands exactly where the file lives instead
     of in whatever program owns the extension. */
  ipcMain.handle(
    'library:reveal',
    guarded('library:reveal', (_event, path) => {
      const target = resolveInLibrary(path)
      if (!target) return false
      shell.showItemInFolder(target)
      return true
    }),
  )

  /* Pixel data on the clipboard, the way a browser's own "copy image"
     works — paste into Word, Discord, anywhere that accepts an image.
     nativeImage does not decode HEIC, so that case fails with a message
     rather than silently copying nothing. A real "copy as a file you can
     paste into Explorer" would mean writing a Windows-specific CF_HDROP
     clipboard format by hand; revealing the file and copying it there,
     with the OS's own Ctrl+C, is the reliable version of that. */
  ipcMain.handle(
    'library:copyImage',
    guarded('library:copyImage', (_event, path) => {
      const target = resolveInLibrary(path)
      if (!target) return false

      const image = nativeImage.createFromPath(target)
      if (image.isEmpty()) {
        throw new Error('Este formato de imagen no se puede copiar directamente.')
      }

      clipboard.writeImage(image)
      return true
    }),
  )

  ipcMain.handle(
    'library:copyPath',
    guarded('library:copyPath', (_event, path) => {
      const target = resolveInLibrary(path)
      if (!target) return false
      clipboard.writeText(target)
      return true
    }),
  )

  ipcMain.handle(
    'library:toggleFavorite',
    guarded('library:toggleFavorite', (_event, path) => {
      const { libraryPath } = readSettings()
      return toggleFavorite(libraryPath, path)
    }),
  )

  ipcMain.handle(
    'library:delete',
    guarded('library:delete', (_event, path) => {
      const { libraryPath } = readSettings()
      return moveToTrash(libraryPath, path)
    }),
  )

  ipcMain.handle(
    'library:deleteMany',
    guarded('library:deleteMany', (_event, paths) => {
      const { libraryPath } = readSettings()
      return moveManyToTrash(libraryPath, paths)
    }),
  )

  ipcMain.handle(
    'library:trash',
    guarded('library:trash', () => trashWithCountdown(readSettings().libraryPath)),
  )

  ipcMain.handle(
    'library:restore',
    guarded('library:restore', (_event, stored) =>
      restoreFromTrash(readSettings().libraryPath, stored),
    ),
  )

  ipcMain.handle(
    'library:emptyTrash',
    guarded('library:emptyTrash', () => emptyTrash(readSettings().libraryPath)),
  )

  ipcMain.handle(
    'library:backups',
    guarded('library:backups', () => readMeta(readSettings().libraryPath).backups),
  )

  ipcMain.handle(
    'library:metadata',
    guarded('library:metadata', (_event, path, kind) => {
      const { libraryPath } = readSettings()
      return metadataFor(libraryPath, path, kind)
    }),
  )

  ipcMain.handle(
    'library:breakdown',
    guarded('library:breakdown', async () => {
      const { libraryPath, quotaGB } = readSettings()
      const { usedBytes, entries } = await libraryBreakdown(libraryPath)
      return { usedBytes, entries, quotaGB }
    }),
  )

  ipcMain.handle(
    'library:usage',
    guarded('library:usage', async () => {
      const { libraryPath, quotaGB } = readSettings()
      const { usedGB } = await libraryUsage(libraryPath)
      return { usedGB, quotaGB }
    }),
  )
}
