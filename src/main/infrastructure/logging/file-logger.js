import { app } from 'electron'
import { appendFileSync, mkdirSync } from 'fs'
import { join } from 'path'

/* A packaged app has no console to read, so failures have to leave a
   trace on disk or they are invisible. The log lives next to the
   settings, in userData. */
const logPath = () => join(app.getPath('userData'), 'photobase.log')

export function log(...parts) {
  const line = `${new Date().toISOString()} ${parts
    .map((part) => (typeof part === 'string' ? part : JSON.stringify(part)))
    .join(' ')}\n`

  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    appendFileSync(logPath(), line, 'utf8')
  } catch {
    /* Logging must never be the thing that breaks the app. */
  }
}

export function logError(context, error) {
  log('ERROR', context, error?.stack ?? error?.message ?? String(error))
}

/* Without these, an async throw in main takes the process down with no
   explanation at all. */
export function installCrashHandlers() {
  process.on('uncaughtException', (error) => logError('uncaughtException', error))
  process.on('unhandledRejection', (reason) => logError('unhandledRejection', reason))
}

/* Wraps an IPC handler so every call and every failure is recorded, and
   so a throw crosses back to the renderer as a value it can show rather
   than an unhandled rejection. */
export function handled(channel, fn) {
  return async (...args) => {
    log('ipc', channel)
    try {
      return { ok: true, value: await fn(...args) }
    } catch (error) {
      logError(channel, error)
      return { ok: false, error: error?.message ?? String(error) }
    }
  }
}
