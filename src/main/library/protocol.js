import { protocol } from 'electron'
import { createReadStream, statSync } from 'fs'
import { Readable } from 'stream'
import { join, resolve, sep } from 'path'
import { readSettings } from '../settings'
import { logError } from '../log'
import { isUnlocked } from '../auth'
import { thumbnailFor } from './thumbnails'

export const MEDIA_SCHEME = 'photobase'

/* Served explicitly rather than guessed by the fetch layer: a video with
   no type on it is a video Chromium will not commit to playing. */
const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  heic: 'image/heic',
  heif: 'image/heif',
  dng: 'image/x-adobe-dng',
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  '3gp': 'video/3gpp',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
}

const contentTypeFor = (path) => {
  const dot = path.lastIndexOf('.')
  const ext = dot < 1 ? '' : path.slice(dot + 1).toLowerCase()
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

/* Chromium's media element asks for byte ranges before it will play
   anything, and an answer that ignores the ask leaves <video> sitting at
   0:00 with no duration and no error. Images never needed it, which is
   exactly why only video looked broken. */
function serveFile(target, request) {
  let size
  try {
    size = statSync(target).size
  } catch {
    return new Response('Not found', { status: 404 })
  }

  const type = contentTypeFor(target)
  const asked = request.headers.get('Range')
  const match = asked ? /^bytes=(\d*)-(\d*)$/.exec(asked.trim()) : null

  if (match) {
    const start = match[1] ? Number(match[1]) : 0
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1

    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) {
      return new Response('Range not satisfiable', {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` },
      })
    }

    return new Response(Readable.toWeb(createReadStream(target, { start, end })), {
      status: 206,
      headers: {
        'Content-Type': type,
        'Content-Length': String(end - start + 1),
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
      },
    })
  }

  return new Response(Readable.toWeb(createReadStream(target)), {
    status: 200,
    headers: {
      'Content-Type': type,
      'Content-Length': String(size),
      /* Advertised even on a full response, or the player never bothers
         asking for a range and cannot seek. */
      'Accept-Ranges': 'bytes',
    },
  })
}

/* Must run before the app is ready, or the scheme is not treated as a
   real origin and images fail to load. */
export function registerMediaScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ])
}

/* Serves files out of the library and nowhere else. The renderer only
   ever names a path relative to the library, and anything that resolves
   outside it is refused — a request for ../../ must not become a file
   read anywhere on the disk. */
export function handleMediaRequests() {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    try {
      /* The lock has to hold here too: this scheme is a second door into
         the same folder, and a locked window could otherwise still ask it
         for every photo by path. */
      if (!isUnlocked()) return new Response('Locked', { status: 403 })

      const { libraryPath } = readSettings()
      if (!libraryPath) return new Response('No library', { status: 404 })

      const url = new URL(request.url)
      const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '')
      if (!relative) return new Response('Not found', { status: 404 })

      const root = resolve(libraryPath)
      const target = resolve(join(root, relative))

      if (target !== root && !target.startsWith(root + sep)) {
        return new Response('Forbidden', { status: 403 })
      }

      /* The grid asks for thumbs, the viewer for the original. Sending
         full 3 MB frames to a wall of 112px tiles is what made scrolling
         crawl. */
      if (url.hostname === 'thumb') {
        const thumb = thumbnailFor(target, relative)
        if (thumb) return serveFile(thumb, request)
      }

      return serveFile(target, request)
    } catch (error) {
      logError('media protocol', error)
      return new Response('Error', { status: 500 })
    }
  })
}

export const mediaUrl = (relativePath) =>
  `${MEDIA_SCHEME}://media/${relativePath.split('/').map(encodeURIComponent).join('/')}`
