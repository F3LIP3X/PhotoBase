import { ipcMain } from 'electron'
import { guarded } from './shared'
import { handled } from '../infrastructure/logging/file-logger'
import { runDeviceBackup } from '../application/devices/run-device-backup'
import { currentBackupDevice } from '../backup-session'

export function registerBackupHandlers(watcher) {
  ipcMain.handle(
    'backup:start',
    guarded('backup:start', (event, deviceName) => runDeviceBackup({ deviceName, watcher })),
  )

  /* A window that opens or reloads while a copy is running has to be
     able to find out, or it shows a calm library over a busy phone. */
  ipcMain.handle(
    'backup:status',
    handled('backup:status', () => ({
      running: Boolean(currentBackupDevice()),
      deviceName: currentBackupDevice(),
    })),
  )
}
