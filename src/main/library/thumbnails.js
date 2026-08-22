import { app, nativeImage } from 'electron'
import { createHash } from 'crypto'
import { existsSync, mkdirSync, writeFileSync, statSync } from 'fs'
import { join } from 'path'

const THUMB_WIDTH = 400
const THUMB_QUALITY = 72

/* Cached beside the app's data, never inside the library: thumbnails are
   derived, disposable, and must not count against the user's quota. */
const cacheDir = () => join(app.getPath('userData'), 'thumbs')

/* Keyed by path and mtime, so replacing a file invalidates its
   thumbnail without anything having to remember to clear the cache. */
function cacheKey(fullPath) {
  let stamp = ''
  try {
    stamp = String(statSync(fullPath).mtimeMs)
  } catch {
    /* Missing file falls through to a miss below. */
  }
  return createHash('sha1').update(`${fullPath}|${stamp}`).digest('hex')
}

/* A video has no still to resize without a decoder, so it never gets a
   thumbnail at all: the grid draws its own tile for those rather than
   asking for one. */
const isResizable = (name) => /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(name)

export function thumbnailFor(fullPath, name) {
  if (!isResizable(name)) return null

  const dir = cacheDir()
  const target = join(dir, `${cacheKey(fullPath)}.jpg`)
  if (existsSync(target)) return target

  try {
    const image = nativeImage.createFromPath(fullPath)
    if (image.isEmpty()) return null

    const { width } = image.getSize()
    /* Never upscale: a small image is already its own thumbnail. */
    const resized = width > THUMB_WIDTH ? image.resize({ width: THUMB_WIDTH }) : image

    mkdirSync(dir, { recursive: true })
    writeFileSync(target, resized.toJPEG(THUMB_QUALITY))
    return target
  } catch {
    /* A file we cannot decode falls back to the original. */
    return null
  }
}
