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

const DEVICES_CHANNEL = 'devices:changed'

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

function startDeviceWatcher() {
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

  ipcMain.handle('devices:list', () => watcher.current())
  ipcMain.handle('devices:refresh', () => watcher.refresh())

  watcher.start()
}

function registerSettingsHandlers() {
  ipcMain.handle('settings:get', () => ({
    ...readSettings(),
    configured: isConfigured(),
    suggestedPath: suggestedLibraryPath(),
  }))

  ipcMain.handle('settings:save', (_event, patch) => {
    /* Only ever accept the two fields this app owns, and validate the
       quota here rather than trusting whatever the renderer sent. */
    const next = {}

    if (typeof patch?.libraryPath === 'string' && patch.libraryPath.trim()) {
      next.libraryPath = ensureLibraryFolder(patch.libraryPath.trim())
    }

    const quota = Number(patch?.quotaGB)
    if (Number.isFinite(quota) && quota > 0) {
      next.quotaGB = quota
    }

    const saved = writeSettings(next)
    return { ...saved, configured: isConfigured() }
  })

  ipcMain.handle('settings:pickFolder', (event) =>
    pickLibraryFolder(BrowserWindow.fromWebContents(event.sender)),
  )

  ipcMain.handle('library:usage', async () => {
    const { libraryPath, quotaGB } = readSettings()
    const { usedGB } = await libraryUsage(libraryPath)
    return { usedGB, quotaGB }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.photobase.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerSettingsHandlers()
  startDeviceWatcher()
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
