/* Channel names shared between the IPC handlers that emit them and the
   preload bridge that forwards them to the renderer. Centralised so a
   typo in one place cannot silently desync a sender from its listener. */
export const DEVICES_CHANNEL = 'devices:changed'
export const BACKUP_CHANNEL = 'backup:progress'
export const BACKUP_STATE_CHANNEL = 'backup:state'
