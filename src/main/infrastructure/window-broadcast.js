import { BrowserWindow } from 'electron'

/* Progress goes to every window, not just the one that asked. The user
   can navigate anywhere while a copy runs and the copy keeps reporting. */
export function broadcast(channel, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload)
  }
}
