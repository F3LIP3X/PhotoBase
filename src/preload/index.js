import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const DEVICES_CHANNEL = 'devices:changed'

/* A narrow surface on purpose: the renderer gets these calls and nothing
   else, never a raw ipcRenderer it could send arbitrary channels on. */
const api = {
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (patch) => ipcRenderer.invoke('settings:save', patch),
    pickFolder: () => ipcRenderer.invoke('settings:pickFolder'),
  },

  library: {
    usage: () => ipcRenderer.invoke('library:usage'),
  },

  devices: {
    list: () => ipcRenderer.invoke('devices:list'),
    refresh: () => ipcRenderer.invoke('devices:refresh'),
    subscribe: () => ipcRenderer.invoke('devices:subscribe'),
    unsubscribe: () => ipcRenderer.invoke('devices:unsubscribe'),

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
