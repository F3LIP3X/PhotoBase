import { app, dialog } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

/* Settings live beside the app's own data, never inside the library
   folder: the library is the user's, and moving it must not lose the
   configuration that points at it. */
const settingsPath = () => join(app.getPath('userData'), 'settings.json')

/* The suggested library, prefilled but editable at first run. */
export const suggestedLibraryPath = () => join(app.getPath('pictures'), 'PhotoBase')

const DEFAULTS = {
  libraryPath: null,
  /* Null means the user has not chosen a cap yet, which is what sends
     them to first-run setup. Zero would be a real (impossible) quota. */
  quotaGB: null,
}

let cache = null

export function readSettings() {
  if (cache) return cache

  try {
    cache = { ...DEFAULTS, ...JSON.parse(readFileSync(settingsPath(), 'utf8')) }
  } catch {
    /* Missing or corrupt settings are not fatal: fall back to defaults
       and let first-run setup write a fresh file. */
    cache = { ...DEFAULTS }
  }

  return cache
}

export function writeSettings(patch) {
  const next = { ...readSettings(), ...patch }
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(settingsPath(), JSON.stringify(next, null, 2), 'utf8')
  cache = next
  return next
}

/* Configuration is only complete once we know both where the library
   lives and how much of the disk it may use. */
export const isConfigured = () => {
  const { libraryPath, quotaGB } = readSettings()
  return Boolean(libraryPath) && Number.isFinite(quotaGB) && quotaGB > 0
}

export async function pickLibraryFolder(parentWindow) {
  const { libraryPath } = readSettings()

  const result = await dialog.showOpenDialog(parentWindow, {
    title: 'Elige dónde guardar tu biblioteca',
    defaultPath: libraryPath ?? suggestedLibraryPath(),
    properties: ['openDirectory', 'createDirectory'],
    buttonLabel: 'Usar esta carpeta',
  })

  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
}

/* Called once the user commits to a library location. */
export function ensureLibraryFolder(path) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true })
  return path
}
