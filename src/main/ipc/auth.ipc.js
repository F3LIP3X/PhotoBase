import { ipcMain } from 'electron'
import { handled } from '../infrastructure/logging/file-logger'
import { guarded } from './shared'
import { unlock, lock, setPassword, clearPassword } from '../auth'

export function registerAuthHandlers() {
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
