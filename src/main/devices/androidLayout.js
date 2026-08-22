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
 */

/* What a backup takes by default: the pictures the user took, not every
   image that ever landed on the phone. Media received through messaging
   apps is deliberately left out — it is usually the bulk of the storage
   and rarely what someone means by "my photos". */
export const DEFAULT_SOURCES = [
  'DCIM/Camera',
  'DCIM/Restored',
  'DCIM/Screenshots',
  'Pictures/Screenshots',
  'Pictures/Raw',
]

/* Offered, but off unless the user asks: other apps' media. */
export const OPTIONAL_SOURCES = [
  'DCIM/WhatsApp',
  'Pictures/WhatsApp',
  'Pictures/Instagram',
  'Pictures/Twitter',
  'Movies/Instagram',
]

/* Never copied. Leading-dot folders are caches — .thumbnails alone can
   hold thousands of tiny files that would burn quota for nothing — and
   wallpapers are not photographs the user took. */
export const EXCLUDED_FOLDERS = ['Wallpapers', 'Walli Artworks']

export const isExcludedFolder = (name) =>
  name.startsWith('.') || EXCLUDED_FOLDERS.includes(name)

/* Extensions worth backing up. HEIC is the Pixel/iPhone default, DNG the
   raw format, MP4/MOV the video companions of a camera roll. */
const MEDIA_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'heic',
  'heif',
  'webp',
  'dng',
  'raw',
  'gif',
  'mp4',
  'mov',
  'm4v',
  '3gp',
])

export function isMediaFile(name) {
  const dot = name.lastIndexOf('.')
  if (dot < 1) return false
  return MEDIA_EXTENSIONS.has(name.slice(dot + 1).toLowerCase())
}
