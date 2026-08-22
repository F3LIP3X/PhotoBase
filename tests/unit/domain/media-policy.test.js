import { describe, it, expect } from 'vitest'
import {
  isMediaFile,
  isVideoFile,
  isExcludedFolder,
  isExcludedPath,
  extensionOf,
  MEDIA_EXTENSIONS,
  EXCLUDED_PATHS,
  EXCLUDED_FOLDER_NAMES,
  DEFAULT_SOURCES,
} from '../../../src/main/domain/devices/media-policy'
import { isMediaFile as isMediaFileViaShim } from '../../../src/main/devices/androidLayout'

describe('extensionOf', () => {
  it('lowercases the extension', () => {
    expect(extensionOf('PXL_1.JPG')).toBe('jpg')
  })

  it('returns empty for a name with no extension', () => {
    expect(extensionOf('README')).toBe('')
  })

  it('returns empty for a bare dotfile (dot at position 0)', () => {
    // extensionOf's `dot < 1` guard rejects a leading dot the same way
    // withSuffix does — a name of just ".hidden" has no "extension".
    expect(extensionOf('.hidden')).toBe('')
  })
})

describe('isMediaFile / isVideoFile', () => {
  it('accepts every extension actually listed in MEDIA_EXTENSIONS', () => {
    for (const ext of MEDIA_EXTENSIONS) {
      expect(isMediaFile(`x.${ext}`)).toBe(true)
    }
  })

  it('rejects common non-media extensions', () => {
    for (const name of ['song.mp3', 'note.opus', 'app.apk', 'doc.pdf', 'archive.zip']) {
      expect(isMediaFile(name)).toBe(false)
    }
  })

  it('classifies mp4/mov/mkv/webm as video, jpg/png as not video', () => {
    expect(isVideoFile('clip.mp4')).toBe(true)
    expect(isVideoFile('clip.MOV')).toBe(true)
    expect(isVideoFile('clip.mkv')).toBe(true)
    expect(isVideoFile('photo.jpg')).toBe(false)
  })

  it('is case-insensitive on the extension', () => {
    expect(isMediaFile('IMG.JPG')).toBe(true)
    expect(isMediaFile('IMG.jpg')).toBe(true)
  })
})

describe('isExcludedFolder', () => {
  it('excludes any name starting with a dot', () => {
    expect(isExcludedFolder('.thumbnails')).toBe(true)
  })

  it('excludes the named sticker-pack folders, case-insensitively', () => {
    expect(isExcludedFolder('WhatsApp Stickers')).toBe(true)
    expect(isExcludedFolder('whatsapp stickers')).toBe(true)
    expect(isExcludedFolder('WhatsApp Business Stickers')).toBe(true)
  })

  it('does not exclude an ordinary folder name', () => {
    expect(isExcludedFolder('Camera')).toBe(false)
    expect(isExcludedFolder('WhatsApp')).toBe(false)
  })
})

describe('isExcludedPath', () => {
  it('excludes a path with a dot-prefixed segment anywhere in it', () => {
    expect(isExcludedPath('DCIM/.thumbnails')).toBe(true)
  })

  it('excludes a sticker-pack folder at any depth', () => {
    expect(isExcludedPath('Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Stickers')).toBe(true)
  })

  it('excludes the exact EXCLUDED_PATHS entries and their subpaths', () => {
    for (const path of EXCLUDED_PATHS) {
      expect(isExcludedPath(path)).toBe(true)
      expect(isExcludedPath(`${path}/something`)).toBe(true)
    }
  })

  it('does not exclude an ordinary media path', () => {
    expect(isExcludedPath('DCIM/Camera')).toBe(false)
    expect(isExcludedPath('Pictures/WhatsApp')).toBe(false)
  })

  it('does not false-positive on a path that merely starts with an excluded prefix', () => {
    // "Android/dataX" contains "Android/data" as a string prefix but is
    // not the same path segment — isExcludedPath compares whole
    // '/'-delimited segments, per its own split('/').some(...) check and
    // the exact-or-'/'-boundary comparison against EXCLUDED_PATHS.
    expect(isExcludedPath('Android/dataX/file.jpg')).toBe(false)
  })
})

describe('DEFAULT_SOURCES', () => {
  it('is the storage root, walked from an empty string', () => {
    expect(DEFAULT_SOURCES).toEqual([''])
  })
})

describe('androidLayout.js shim', () => {
  it('re-exports the same isMediaFile that backup.js actually imports', () => {
    expect(isMediaFileViaShim('photo.jpg')).toBe(isMediaFile('photo.jpg'))
    expect(isMediaFileViaShim('note.opus')).toBe(isMediaFile('note.opus'))
  })
})
