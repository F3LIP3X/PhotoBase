import { ipcMain, BrowserWindow } from 'electron'
import { createDeviceWatcher } from '../devices/watcher'
import { guarded } from './shared'
import { DEVICES_CHANNEL } from './channels'

/* Returns the watcher instance so index.js can hold it for
   app.on('before-quit') and hand it to backup.ipc.js, which needs to
   pause/resume it around a copy — one shared instance, no DI container
   for a single reference. */
export function registerDeviceHandlers() {
  const watcher = createDeviceWatcher({
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

  return watcher
}
