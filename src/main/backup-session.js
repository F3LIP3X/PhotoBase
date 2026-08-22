/* Which device is being copied right now, or null.
 *
 * Lives in its own module rather than inside the backup IPC handler,
 * because the window's close handler needs to read it too — closing
 * mid-copy has to ask for confirmation, and that check happens in
 * bootstrap, not inside ipc/backup.ipc.js. */
let deviceName = null

export const currentBackupDevice = () => deviceName
export const setBackupDevice = (name) => {
  deviceName = name
}
