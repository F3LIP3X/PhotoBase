import { app, shell, dialog, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { registerMediaScheme, handleMediaRequests } from './library/protocol'
import { installCrashHandlers, log, logError } from './log'
import { registerAuthHandlers } from './ipc/auth.ipc'
import { registerSettingsHandlers } from './ipc/settings.ipc'
import { registerLibraryHandlers } from './ipc/library.ipc'
import { registerDeviceHandlers } from './ipc/devices.ipc'
import { registerBackupHandlers } from './ipc/backup.ipc'
import { indexMetadataInBackground } from './application/media/index-metadata-in-background'
import { currentBackupDevice, setBackupDevice } from './backup-session'

/* Held here so app.on('before-quit'), outside the whenReady callback,
   can still reach it to stop the polling loop on the way out. */
let watcherRef = null

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
    const running = currentBackupDevice()
    if (!running) return

    event.preventDefault()
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      buttons: ['Seguir copiando', 'Cerrar de todos modos'],
      defaultId: 0,
      cancelId: 0,
      title: 'Copia en curso',
      message: `PhotoBase está copiando desde ${running}.`,
      detail:
        'Si cierras ahora, la copia se interrumpe. Lo que ya se haya copiado se ' +
        'conserva, y la próxima vez continuará donde lo dejó.',
    })

    if (choice === 1) {
      setBackupDevice(null)
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

  /* Devices first: settings and backup both need the watcher instance
     to pause it while their own shell/COM calls run. */
  watcherRef = registerDeviceHandlers()
  registerAuthHandlers()
  registerLibraryHandlers()
  registerSettingsHandlers(watcherRef)
  registerBackupHandlers(watcherRef)

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
  watcherRef?.stop()
})
