import { app, shell, dialog, BrowserWindow, ipcMain, Notification } from 'electron'
import { join, resolve, sep } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createDeviceWatcher } from './devices/watcher'
import {
  readSettings,
  writeSettings,
  isConfigured,
  pickLibraryFolder,
  ensureLibraryFolder,
  suggestedLibraryPath,
} from './settings'
import { libraryUsage, libraryBreakdown } from './library/usage'
import { runBackup } from './devices/backup'
import { resetConfiguration, wipeLibrary } from './library/reset'
import { metadataFor, indexLibrary, knownMetadata } from './library/metadata'
import { scanLibrary, buildFacets } from './library/scan'
import {
  readMeta,
  toggleFavorite,
  moveToTrash,
  moveManyToTrash,
  restoreFromTrash,
  emptyTrash,
  trashWithCountdown,
  recordBackup,
} from './library/meta'
import { registerMediaScheme, handleMediaRequests } from './library/protocol'
import { log, logError, installCrashHandlers, handled } from './log'
import { isUnlocked, unlock, lock, setPassword, clearPassword } from './auth'

const DEVICES_CHANNEL = 'devices:changed'
const BACKUP_CHANNEL = 'backup:progress'
const BACKUP_STATE_CHANNEL = 'backup:state'

let watcher = null

/* Which device is being copied right now, or null. Lives here rather
   than in a window, because the copy outlives any screen the user
   happens to be looking at — and closing the window must not silently
   cut it short. */
let backupRunning = null

function notify(title, body) {
  if (!Notification.isSupported()) return
  try {
    new Notification({ title, body }).show()
  } catch (error) {
    logError('notification', error)
  }
}

/* Progress goes to every window, not just the one that asked. The user
   can navigate anywhere while a copy runs and the copy keeps reporting. */
function broadcast(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      /* The preload is emitted as .mjs because the package is ESM. Pointing
         at .js silently loads nothing and the bridge never appears. */
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  /* Closing mid-copy leaves a half-transferred file behind and the rest
     of the phone unread, so it takes a deliberate answer. */
  mainWindow.on('close', (event) => {
    if (!backupRunning) return

    event.preventDefault()
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      buttons: ['Seguir copiando', 'Cerrar de todos modos'],
      defaultId: 0,
      cancelId: 0,
      title: 'Copia en curso',
      message: `PhotoBase está copiando desde ${backupRunning}.`,
      detail:
        'Si cierras ahora, la copia se interrumpe. Lo que ya se haya copiado se ' +
        'conserva, y la próxima vez continuará donde lo dejó.',
    })

    if (choice === 1) {
      backupRunning = null
      mainWindow.destroy()
    }
  })

  /* A renderer that dies leaves a blank window and no clue why. */
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    logError('render-process-gone', new Error(JSON.stringify(details)))
  })

  mainWindow.webContents.on('preload-error', (_event, preloadPath, error) => {
    logError(`preload-error ${preloadPath}`, error)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

function registerDeviceHandlers() {
  watcher = createDeviceWatcher({
    onChange(devices) {
      /* A window can be gone or still loading by the time a poll lands. */
      for (const window of BrowserWindow.getAllWindows()) {
        if (!window.isDestroyed()) {
          window.webContents.send(DEVICES_CHANNEL, devices)
        }
      }
    },
  })

  ipcMain.handle(
    'devices:list',
    guarded('devices:list', () => watcher.current()),
  )

  ipcMain.handle(
    'devices:refresh',
    guarded('devices:refresh', () => watcher.refresh()),
  )

  /* Polling only runs while a screen is actually showing devices. */
  ipcMain.handle(
    'devices:subscribe',
    guarded('devices:subscribe', () => {
      watcher.acquire()
      return true
    }),
  )

  ipcMain.handle(
    'devices:unsubscribe',
    guarded('devices:unsubscribe', () => {
      watcher.release()
      return true
    }),
  )
}

/* Reading EXIF off a whole library takes a while, so nothing waits on it:
   the index fills in behind the UI, and every file it finishes is saved as
   it goes. A partial index is still a useful one. */
function indexMetadataInBackground() {
  if (!isUnlocked()) return

  const { libraryPath } = readSettings()
  if (!libraryPath) return

  indexLibrary(libraryPath).catch((error) => logError('metadata index', error))
}

/* A locked window must not be able to drive the library, or the lock
   screen would be a picture of a lock rather than one. */
function guarded(channel, fn) {
  return handled(channel, async (...args) => {
    if (!isUnlocked()) throw new Error('PhotoBase está bloqueado.')
    return fn(...args)
  })
}

function registerAuthHandlers() {
  ipcMain.handle(
    'auth:unlock',
    handled('auth:unlock', (_event, password) => unlock(password)),
  )

  ipcMain.handle(
    'auth:set',
    guarded('auth:set', (_event, next, current) => setPassword(next, current)),
  )

  ipcMain.handle(
    'auth:clear',
    guarded('auth:clear', (_event, current) => clearPassword(current)),
  )

  ipcMain.handle(
    'auth:lock',
    handled('auth:lock', () => lock()),
  )
}

function registerSettingsHandlers() {
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

  ipcMain.handle(
    'backup:start',
    guarded('backup:start', async (event, deviceName) => {
      const { libraryPath, quotaGB } = readSettings()
      if (!libraryPath || !quotaGB) {
        throw new Error('Configura primero la carpeta y el límite de la biblioteca.')
      }

      const { usedGB } = await libraryUsage(libraryPath)

      backupRunning = deviceName
      broadcast(BACKUP_STATE_CHANNEL, { running: true, deviceName })
      notify(
        'PhotoBase está copiando',
        `No desconectes ${deviceName} ni cierres la aplicación hasta que termine.`,
      )

      /* The device probe and the copy both drive the Windows shell;
         running them together is what froze the app before. */
      watcher?.pause()
      try {
        const outcome = await runBackup({
          deviceName,
          libraryPath,
          quotaGB,
          usedGB,
          onProgress(progress) {
            broadcast(BACKUP_CHANNEL, progress)
          },
        })

        /* Every run is recorded, including the ones that copied nothing:
           "we checked and there was nothing new" is useful history. */
        if (!outcome.blocked) {
          recordBackup(libraryPath, {
            deviceName,
            copied: outcome.copied,
            skipped: outcome.skipped,
          })
        }

        /* Newly copied files have no metadata read yet, and search is
           only as good as the index behind it. */
        if (outcome.copied > 0) indexMetadataInBackground()

        notify(
          outcome.blocked ? 'Copia detenida' : 'Copia terminada',
          outcome.blocked
            ? outcome.message
            : outcome.copied > 0
              ? `${outcome.copied} elementos nuevos en tu biblioteca.`
              : 'Ya tenías todo copiado.',
        )

        return outcome
      } finally {
        backupRunning = null
        broadcast(BACKUP_STATE_CHANNEL, { running: false, deviceName: null })
        watcher?.resume()
      }
    }),
  )

  /* A window that opens or reloads while a copy is running has to be
     able to find out, or it shows a calm library over a busy phone. */
  ipcMain.handle(
    'backup:status',
    handled('backup:status', () => ({
      running: Boolean(backupRunning),
      deviceName: backupRunning,
    })),
  )

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
  ipcMain.handle(
    'library:open',
    guarded('library:open', async (_event, path) => {
      const { libraryPath } = readSettings()
      if (!libraryPath || !path) return false

      const root = resolve(libraryPath)
      const target = resolve(join(root, path))
      if (target !== root && !target.startsWith(root + sep)) {
        throw new Error('Ese archivo no está en tu biblioteca.')
      }

      const failure = await shell.openPath(target)
      if (failure) throw new Error(failure)
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

  ipcMain.handle(
    'library:usage',
    guarded('library:usage', async () => {
      const { libraryPath, quotaGB } = readSettings()
      const { usedGB } = await libraryUsage(libraryPath)
      return { usedGB, quotaGB }
    }),
  )
}

/* Privileged schemes must be declared before the app is ready. */
registerMediaScheme()

app.whenReady().then(() => {
  installCrashHandlers()
  handleMediaRequests()
  log('app ready', { version: app.getVersion(), platform: process.platform })

  electronApp.setAppUserModelId('com.photobase.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerAuthHandlers()
  registerSettingsHandlers()
  registerDeviceHandlers()
  createWindow()
  indexMetadataInBackground()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  watcher?.stop()
})
