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

/* HEIC is the Pixel/iPhone default and DNG the raw format. */
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'dng', 'raw', 'gif']

/* MP4 and MOV come off the camera; MKV and WEBM arrive from screen
   recorders and downloads, and a backup that skipped them would leave
   holes the user cannot see until the phone is gone. */
const VIDEO_EXTENSIONS = ['mp4', 'mov', 'm4v', '3gp', 'mkv', 'webm']

const MEDIA = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS])
const VIDEO = new Set(VIDEO_EXTENSIONS)

export function extensionOf(name) {
  const dot = String(name ?? '').lastIndexOf('.')
  return dot < 1 ? '' : name.slice(dot + 1).toLowerCase()
}

export const isMediaFile = (name) => MEDIA.has(extensionOf(name))

/* The single answer to "is this a video", so the grid, the viewer and
   the facets cannot drift apart on it. */
export const isVideoFile = (name) => VIDEO.has(extensionOf(name))
