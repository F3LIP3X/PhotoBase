import { resolve, join, sep } from 'path'
import { readSettings } from '../settings'
import { isUnlocked } from '../auth'
import { handled } from '../infrastructure/logging/file-logger'

/* A locked window must not be able to drive the library, or the lock
   screen would be a picture of a lock rather than one. */
export function guarded(channel, fn) {
  return handled(channel, async (...args) => {
    if (!isUnlocked()) throw new Error('PhotoBase está bloqueado.')
    return fn(...args)
  })
}

/* Every handler that touches a file by its relative path repeats this
   same check, so a stray path segment cannot walk out of the library
   through `..`. Centralised once here rather than four times. */
export function resolveInLibrary(relative) {
  const { libraryPath } = readSettings()
  if (!libraryPath || !relative) return null

  const root = resolve(libraryPath)
  const target = resolve(join(root, relative))
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error('Ese archivo no está en tu biblioteca.')
  }
  return target
}
