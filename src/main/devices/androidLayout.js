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

/* What a backup walks: the three roots Android puts media under, all the
   way down. Naming exact leaf folders instead missed anything a vendor
   or a camera app invented — DCIM/100ANDRO, Movies/Camera — and Movies
   was not listed at all, which is how videos went missing. */
export const DEFAULT_SOURCES = ['DCIM', 'Pictures', 'Movies']

/* Media that arrived from an app rather than from the camera. Usually
   the bulk of a phone's storage and rarely what someone means by "my
   photos", so it is skipped wherever in the tree it turns up. */
const APP_FOLDERS = [
  'WhatsApp',
  'Telegram',
  'Instagram',
  'Twitter',
  'Messenger',
  'Snapchat',
  'Facebook',
  'Signal',
]

/* Never copied. Leading-dot folders are caches — .thumbnails alone can
   hold thousands of tiny files that would burn quota for nothing — and
   wallpapers are not photographs the user took. */
export const EXCLUDED_FOLDERS = ['Wallpapers', 'Walli Artworks', ...APP_FOLDERS]

export const isExcludedFolder = (name) =>
  name.startsWith('.') || EXCLUDED_FOLDERS.includes(name)

/* The walk already skips these, but a source path is checked again on
   this side so the rule holds even if the device listing ever arrives
   from somewhere else. */
export const isExcludedPath = (path) =>
  String(path ?? '').split('/').some(isExcludedFolder)

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
