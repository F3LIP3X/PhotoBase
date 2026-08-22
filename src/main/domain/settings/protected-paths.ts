import { parse } from 'path'

/* Folders the system owns. Depth is not the test — D:\PhotoBase is one
   segment deep and perfectly reasonable, while /home is one segment deep
   and must never be handed to a recursive delete. The actual paths these
   names resolve to depend on Electron's app.getPath(), which is not
   domain's business — the caller resolves them and passes the results
   back in for isProtected() to compare against. */
export const OWNED_BY_SYSTEM: readonly string[] = [
  'home',
  'appData',
  'userData',
  'documents',
  'downloads',
  'desktop',
  'music',
  'pictures',
  'videos',
]

/* path.parse is string manipulation, not I/O: no filesystem access
   happens here, only a comparison against what a resolved path's own
   root segment would be. */
export function isDriveRoot(target: string): boolean {
  return target === parse(target).root
}
