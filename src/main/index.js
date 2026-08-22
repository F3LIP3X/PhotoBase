import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
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
import { libraryUsage } from './library/usage'
import { runBackup } from './devices/backup'
import { log, logError, installCrashHandlers, handled } from './log'

const DEVICES_CHANNEL = 'devices:changed'
const BACKUP_CHANNEL = 'backup:progress'

let watcher = null

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
    handled('devices:list', () => watcher.current()),
  )

  ipcMain.handle(
    'devices:refresh',
    handled('devices:refresh', () => watcher.refresh()),
  )

  /* Polling only runs while a screen is actually showing devices. */
  ipcMain.handle(
    'devices:subscribe',
    handled('devices:subscribe', () => {
      watcher.acquire()
      return true
    }),
  )

  ipcMain.handle(
    'devices:unsubscribe',
    handled('devices:unsubscribe', () => {
      watcher.release()
      return true
    }),
  )
}

function registerSettingsHandlers() {
  ipcMain.handle(
    'settings:get',
    handled('settings:get', () => ({
      ...readSettings(),
      configured: isConfigured(),
      suggestedPath: suggestedLibraryPath(),
    })),
  )

  ipcMain.handle(
    'settings:save',
    handled('settings:save', (_event, patch) => {
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
    handled('settings:pickFolder', async (event) => {
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
    handled('backup:start', async (event, deviceName) => {
      const { libraryPath, quotaGB } = readSettings()
      if (!libraryPath || !quotaGB) {
        throw new Error('Configura primero la carpeta y el límite de la biblioteca.')
      }

      const { usedGB } = await libraryUsage(libraryPath)
      const sender = event.sender

      /* The device probe and the copy both drive the Windows shell;
         running them together is what froze the app before. */
      watcher?.pause()
      try {
        return await runBackup({
          deviceName,
          libraryPath,
          quotaGB,
          usedGB,
          onProgress(progress) {
            if (!sender.isDestroyed()) sender.send(BACKUP_CHANNEL, progress)
          },
        })
      } finally {
        watcher?.resume()
      }
    }),
  )

  ipcMain.handle(
    'library:usage',
    handled('library:usage', async () => {
      const { libraryPath, quotaGB } = readSettings()
      const { usedGB } = await libraryUsage(libraryPath)
      return { usedGB, quotaGB }
    }),
  )
}

app.whenReady().then(() => {
  installCrashHandlers()
  log('app ready', { version: app.getVersion(), platform: process.platform })

  electronApp.setAppUserModelId('com.photobase.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerSettingsHandlers()
  registerDeviceHandlers()
  createWindow()

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
