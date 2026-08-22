import { protocol, net } from 'electron'
import { join, resolve, sep } from 'path'
import { pathToFileURL } from 'url'
import { readSettings } from '../settings'
import { logError } from '../log'
import { thumbnailFor } from './thumbnails'

export const MEDIA_SCHEME = 'photobase'

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
        if (thumb) return net.fetch(pathToFileURL(thumb).toString())
      }

      return net.fetch(pathToFileURL(target).toString())
    } catch (error) {
      logError('media protocol', error)
      return new Response('Error', { status: 500 })
    }
  })
}

export const mediaUrl = (relativePath) =>
  `${MEDIA_SCHEME}://media/${relativePath.split('/').map(encodeURIComponent).join('/')}`
