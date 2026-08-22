import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const DEVICES_CHANNEL = 'devices:changed'

/* Main wraps every handler's result as {ok, value, error} so a failure
   travels as data instead of dying as an unhandled rejection. Unwrap it
   here, so the renderer just gets a value or a real Error to catch. */
async function call(channel, ...args) {
  const result = await ipcRenderer.invoke(channel, ...args)
  if (result && typeof result === 'object' && 'ok' in result) {
    if (!result.ok) throw new Error(result.error)
    return result.value
  }
  return result
}

/* A narrow surface on purpose: the renderer gets these calls and nothing
   else, never a raw ipcRenderer it could send arbitrary channels on. */
const api = {
  settings: {
    get: () => call('settings:get'),
    save: (patch) => call('settings:save', patch),
    pickFolder: () => call('settings:pickFolder'),

    /* Reset leaves the photos alone; wipe is the one that does not. */
    reset: () => call('settings:reset'),
    wipe: () => call('settings:wipe'),
  },

  auth: {
    unlock: (password) => call('auth:unlock', password),
    set: (next, current) => call('auth:set', next, current),
    clear: (current) => call('auth:clear', current),
    lock: () => call('auth:lock'),
  },

  library: {
    usage: () => call('library:usage'),
    breakdown: () => call('library:breakdown'),
    metadata: (path, kind) => call('library:metadata', path, kind),
    photos: () => call('library:photos'),
    facets: () => call('library:facets'),
    toggleFavorite: (path) => call('library:toggleFavorite', path),
    remove: (path) => call('library:delete', path),
    trash: () => call('library:trash'),
    restore: (stored) => call('library:restore', stored),
    emptyTrash: () => call('library:emptyTrash'),
    backups: () => call('library:backups'),
    open: (path) => call('library:open', path),

    /* Photos are served through a scheme that only reaches inside the
       library, so the renderer never handles filesystem paths. */
    url: (relativePath) =>
      `photobase://media/${relativePath.split('/').map(encodeURIComponent).join('/')}`,

    /* The grid uses this; only the open photo loads the original. */
    thumbUrl: (relativePath) =>
      `photobase://thumb/${relativePath.split('/').map(encodeURIComponent).join('/')}`,
  },

  backup: {
    start: (deviceName) => call('backup:start', deviceName),
    status: () => call('backup:status'),

    /* Whether a copy is running at all, as opposed to how far along it
       is: a window that just mounted needs the first before the second. */
    onState(callback) {
      const handler = (_event, state) => callback(state)
      ipcRenderer.on('backup:state', handler)
      return () => ipcRenderer.removeListener('backup:state', handler)
    },

    onProgress(callback) {
      const handler = (_event, progress) => callback(progress)
      ipcRenderer.on('backup:progress', handler)
      return () => ipcRenderer.removeListener('backup:progress', handler)
    },
  },

  devices: {
    list: () => call('devices:list'),
    refresh: () => call('devices:refresh'),
    subscribe: () => call('devices:subscribe'),
    unsubscribe: () => call('devices:unsubscribe'),

    /* Returns its own unsubscribe so callers can clean up without
       reaching for removeListener and the exact handler identity. */
    onChanged(callback) {
      const handler = (_event, devices) => callback(devices)
      ipcRenderer.on(DEVICES_CHANNEL, handler)
      return () => ipcRenderer.removeListener(DEVICES_CHANNEL, handler)
    },
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
