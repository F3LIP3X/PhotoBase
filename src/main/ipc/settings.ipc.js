import { ipcMain, BrowserWindow } from 'electron'
import { handled, log } from '../infrastructure/logging/file-logger'
import { guarded } from './shared'
import { isUnlocked } from '../auth'
import {
  readSettings,
  writeSettings,
  isConfigured,
  pickLibraryFolder,
  ensureLibraryFolder,
  suggestedLibraryPath,
} from '../settings'
import { resetConfiguration, wipeLibrary } from '../library/reset'

export function registerSettingsHandlers(watcher) {
  /* The only handler that answers while locked, because the renderer has
     to know there is a lock before it can show one. The stored hash never
     crosses the bridge. */
  ipcMain.handle(
    'settings:get',
    handled('settings:get', () => {
      const { passwordHash, ...rest } = readSettings()
      return {
        ...rest,
        configured: isConfigured(),
        suggestedPath: suggestedLibraryPath(),
        hasPassword: Boolean(passwordHash),
        unlocked: isUnlocked(),
      }
    }),
  )

  ipcMain.handle(
    'settings:save',
    guarded('settings:save', (_event, patch) => {
      /* Only ever accept the two fields this app owns, and validate the
         quota here rather than trusting whatever the renderer sent. */
      const next = {}

      if (typeof patch?.libraryPath === 'string' && patch.libraryPath.trim()) {
        const wanted = patch.libraryPath.trim()
        log('creating library folder', wanted)
        next.libraryPath = ensureLibraryFolder(wanted)
      }

      const quota = Number(patch?.quotaGB)
      if (Number.isFinite(quota) && quota > 0) {
        next.quotaGB = quota
      }

      const saved = writeSettings(next)
      log('settings saved', saved)
      return { ...saved, configured: isConfigured() }
    }),
  )

  ipcMain.handle(
    'settings:pickFolder',
    guarded('settings:pickFolder', async (event) => {
      /* The native folder dialog is a shell COM client, and so is the
         device probe. Running both at once can hang the main process, so
         the probe stands down for as long as the dialog is up. */
      watcher?.pause()
      try {
        return await pickLibraryFolder(BrowserWindow.fromWebContents(event.sender))
      } finally {
        watcher?.resume()
      }
    }),
  )

  /* Both of these end with the app unconfigured, so the renderer sends
     the user back to first-run setup afterwards. */
  ipcMain.handle(
    'settings:reset',
    guarded('settings:reset', () => resetConfiguration()),
  )

  ipcMain.handle(
    'settings:wipe',
    guarded('settings:wipe', () => wipeLibrary()),
  )
}
