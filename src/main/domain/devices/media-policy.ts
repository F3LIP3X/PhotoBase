/* Where Android actually keeps pictures.
 *
 * Grounded in a real Pixel 10 rather than assumed. Its internal storage
 * reported:
 *   DCIM/     Camera, Screenshots, Restored, WhatsApp, Twitch,
 *             PhotosEditor, Google Photos
 *   Pictures/ Screenshots, Raw, WhatsApp, Instagram, Twitter, Wallpapers,
 *             Walli Artworks, Photoshop Express, Photo Editor,
 *             .thumbnails, .gs, .gs_fs0
 *   Movies/   Instagram, PhotosEditor, .thumbnails
 *
 * DCIM ("Digital Camera IMages") is the cross-vendor standard for whatever
 * the device itself captured; everything else is convention.
 *
 * Zero imports on purpose: this is domain policy about what a phone's
 * media layout means, and it must stay true regardless of whether the
 * device is reached over MTP, a mounted volume, or anything else. */

/* The whole of the phone's storage, walked to the bottom.
 *
 * Naming folders meant guessing which ones "count" — DCIM but not
 * Movies, Camera but not WhatsApp — and every guess left pictures
 * behind on somebody's phone. The empty string is the storage root. */
export const DEFAULT_SOURCES: readonly string[] = ['']

/* App sandboxes, skipped by path rather than by name so that
   Android/media — where messaging apps keep the pictures you actually
   received — is still walked. These two are usually not even readable
   over MTP. */
export const EXCLUDED_PATHS: readonly string[] = ['Android/data', 'Android/obb']

/* Chat assets rather than photographs: a sticker pack is clip art someone
   else drew, sent through the app, and WhatsApp keeps them in a folder
   named exactly this — whether that folder ends up under
   Android/media/com.whatsapp/... or the older Pictures/WhatsApp/... does
   not matter, so this matches by name rather than by path. Voice notes
   need no rule at all: they are .opus/.m4a, and MEDIA_EXTENSIONS below
   was always images and video, never audio. */
export const EXCLUDED_FOLDER_NAMES: ReadonlySet<string> = new Set(
  ['WhatsApp Stickers', 'WhatsApp Business Stickers'].map((name) => name.toLowerCase()),
)

/* A leading dot means a cache, not a photo album: .thumbnails alone can
   hold thousands of derived files that would burn quota for nothing. */
export function isExcludedFolder(name: unknown): boolean {
  const clean = String(name ?? '')
  return clean.startsWith('.') || EXCLUDED_FOLDER_NAMES.has(clean.toLowerCase())
}

export function isExcludedPath(path: unknown): boolean {
  const clean = String(path ?? '')
  if (clean.split('/').some(isExcludedFolder)) return true
  return EXCLUDED_PATHS.some((skip) => clean === skip || clean.startsWith(`${skip}/`))
}

/* HEIC is the Pixel/iPhone default and DNG the raw format. */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'dng', 'raw', 'gif']

/* MP4 and MOV come off the camera; MKV and WEBM arrive from screen
   recorders and downloads, and a backup that skipped them would leave
   holes the user cannot see until the phone is gone. */
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', '3gp', 'mkv', 'webm']

/* Exported so the device scan can reject a file by name before paying
   for a round trip to ask MTP how big it is. */
export const MEDIA_EXTENSIONS: readonly string[] = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]

const MEDIA = new Set(MEDIA_EXTENSIONS)
const VIDEO = new Set(VIDEO_EXTENSIONS)

export function extensionOf(name: unknown): string {
  const value = String(name ?? '')
  const dot = value.lastIndexOf('.')
  return dot < 1 ? '' : value.slice(dot + 1).toLowerCase()
}

export const isMediaFile = (name: unknown): boolean => MEDIA.has(extensionOf(name))

/* The single answer to "is this a video", so the grid, the viewer and
   the facets cannot drift apart on it. */
export const isVideoFile = (name: unknown): boolean => VIDEO.has(extensionOf(name))
