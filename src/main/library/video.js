import { app } from 'electron'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { statSync } from 'fs'
import { log, logError } from '../log'

const run = promisify(execFile)

/* Bundled per platform on purpose. ffmpeg-static's own installer only
   fetches a binary for the machine running it, so a Windows installer
   built on Linux would quietly ship a Linux executable. */
const BINARY = process.platform === 'win32' ? 'ffmpeg-win32-x64.exe' : 'ffmpeg-linux-x64'

let resolved
export function ffmpegPath() {
  if (resolved !== undefined) return resolved

  const candidates = [
    /* Packaged: dropped beside the asar by extraResources, so only the
       binary this platform can actually run gets shipped. */
    process.resourcesPath && join(process.resourcesPath, 'ffmpeg', BINARY),
    /* Development, straight out of the checkout. */
    join(app.getAppPath(), 'resources', 'ffmpeg', BINARY),
  ].filter(Boolean)

  resolved = candidates.find((candidate) => existsSync(candidate)) ?? null
  log('ffmpeg', resolved ?? 'no encontrado')
  return resolved
}

export const videoToolsReady = () => Boolean(ffmpegPath())

/* Keyed by path and mtime, like thumbnails: replacing a file invalidates
   what was derived from it without anything having to remember. */
function cacheKey(fullPath) {
  let stamp = ''
  try {
    stamp = String(statSync(fullPath).mtimeMs)
  } catch {
    /* Missing file falls through to a failed extraction below. */
  }
  return createHash('sha1').update(`${fullPath}|${stamp}`).digest('hex')
}

const cacheDir = (name) => {
  const dir = join(app.getPath('userData'), name)
  mkdirSync(dir, { recursive: true })
  return dir
}

/* One frame, scaled to the width the grid actually draws. A second in
   rather than at zero, because the first frame of a phone clip is very
   often black. */
export async function posterFor(fullPath) {
  const binary = ffmpegPath()
  if (!binary) return null

  const target = join(cacheDir('posters'), `${cacheKey(fullPath)}.jpg`)
  if (existsSync(target)) return target

  const extract = (seek) =>
    run(
      binary,
      [
        '-v', 'error',
        ...(seek ? ['-ss', String(seek)] : []),
        '-i', fullPath,
        '-frames:v', '1',
        '-vf', 'scale=400:-2',
        '-q:v', '4',
        '-y', target,
      ],
      { timeout: 30_000, windowsHide: true },
    )

  try {
    await extract(1)
  } catch {
    /* Shorter than the seek, or a stream that will not seek: take
       whatever the first frame is. */
    try {
      await extract(0)
    } catch (error) {
      logError('video poster', error)
      return null
    }
  }

  return existsSync(target) ? target : null
}

/* Chromium ships without the licence for HEVC, which is what phones
   record in by default. The file is fine; it just needs re-encoding into
   something the player will open. Cached, because doing this twice for
   the same video would be inexcusable. */
export async function playableFor(fullPath) {
  const binary = ffmpegPath()
  if (!binary) return null

  const target = join(cacheDir('playable'), `${cacheKey(fullPath)}.mp4`)
  if (existsSync(target)) return target

  try {
    await run(
      binary,
      [
        '-v', 'error',
        '-i', fullPath,
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', '23',
        '-c:a', 'aac',
        /* Moves the index to the front so the player can start before
           the whole file has been read. */
        '-movflags', '+faststart',
        '-y', target,
      ],
      { timeout: 20 * 60_000, windowsHide: true, maxBuffer: 1024 * 1024 },
    )
  } catch (error) {
    logError('video transcode', error)
    rmSync(target, { force: true })
    return null
  }

  return existsSync(target) ? target : null
}
