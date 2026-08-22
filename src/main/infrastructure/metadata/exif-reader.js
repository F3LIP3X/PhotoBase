import exifr from 'exifr'
import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'fs'
import { join } from 'path'
import { scanLibrary } from '../../library/scan'
import { log, logError } from '../logging/file-logger'

const CACHE_FILE = 'metadata.json'
const VERSION = 1

/* Reading EXIF off every file is the expensive part, so it happens once
   per file and the answer is kept. Keyed by mtime as well as path, the
   way thumbnails are: replacing a file invalidates its entry without
   anything having to remember to clear the cache. */
const cachePath = () => join(app.getPath('userData'), CACHE_FILE)

let store = null
let dirty = false

function loadStore() {
  if (store) return store

  try {
    const raw = JSON.parse(readFileSync(cachePath(), 'utf8'))
    if (raw?.version === VERSION && raw.entries) {
      store = raw
      return store
    }
  } catch {
    /* No cache yet, or one from an older shape: build a fresh one rather
       than refusing to read metadata at all. */
  }

  store = { version: VERSION, entries: {} }
  return store
}

function saveStore() {
  if (!dirty) return
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(cachePath(), JSON.stringify(store), 'utf8')
    dirty = false
  } catch (error) {
    logError('metadata cache write', error)
  }
}

const clean = (value) => {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || null
}

/* Makers write the brand into the model on some bodies and not others,
   so "Google Pixel 10" does not come back as "Google Google Pixel 10". */
function cameraName(make, model) {
  const brand = clean(make)
  const body = clean(model)
  if (!body) return brand
  if (!brand) return body
  return body.toLowerCase().startsWith(brand.toLowerCase()) ? body : `${brand} ${body}`
}

/* EXIF stores exposure in seconds; photographers read it as a fraction. */
function shutterOf(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null
  if (seconds >= 1) return `${Number(seconds.toFixed(1))} s`
  return `1/${Math.round(1 / seconds)} s`
}

function dateOf(value) {
  const date = value instanceof Date ? value : value ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : null
}

function normalize(raw) {
  if (!raw) return {}

  return {
    camera: cameraName(raw.Make, raw.Model),
    lens: clean(raw.LensModel),
    aperture: Number.isFinite(raw.FNumber) ? Number(raw.FNumber.toFixed(1)) : null,
    focal: Number.isFinite(raw.FocalLength) ? Number(raw.FocalLength.toFixed(1)) : null,
    iso: Number.isFinite(raw.ISO) ? raw.ISO : null,
    shutter: shutterOf(raw.ExposureTime),
    width: raw.ExifImageWidth ?? raw.ImageWidth ?? null,
    height: raw.ExifImageHeight ?? raw.ImageHeight ?? null,
    takenAt: dateOf(raw.DateTimeOriginal ?? raw.CreateDate),
    lat: Number.isFinite(raw.latitude) ? raw.latitude : null,
    lon: Number.isFinite(raw.longitude) ? raw.longitude : null,
  }
}

const PARSE_OPTIONS = { tiff: true, ifd0: true, exif: true, gps: true }

async function readFile(fullPath) {
  try {
    return normalize(await exifr.parse(fullPath, PARSE_OPTIONS))
  } catch {
    /* A file with no EXIF, or one we cannot parse, is not an error: most
       screenshots have none at all. */
    return {}
  }
}

function mtimeOf(fullPath) {
  try {
    return statSync(fullPath).mtimeMs
  } catch {
    return null
  }
}

/* One photo, read now if it has not been read before. */
export async function metadataFor(libraryPath, relative, kind = 'image') {
  if (!libraryPath || !relative) return null

  const entries = loadStore().entries
  const fullPath = join(libraryPath, relative)
  const mtime = mtimeOf(fullPath)
  if (mtime === null) return null

  const cached = entries[relative]
  if (cached && cached.mtime === mtime) return cached

  /* Containers exifr does not read. Recorded as such so a library full of
     clips is not re-attempted on every pass. */
  const data = kind === 'video' ? {} : await readFile(fullPath)

  entries[relative] = { mtime, ...data }
  dirty = true
  saveStore()

  return entries[relative]
}

const BATCH = 8

/* Fills the cache for the whole library. Runs in the background: nothing
   waits on it, and a partial index is still a useful one because every
   entry it did finish is already saved. */
export async function indexLibrary(libraryPath) {
  if (!libraryPath) return { indexed: 0, total: 0 }

  const { groups } = await scanLibrary(libraryPath)
  const entries = loadStore().entries

  const pending = []
  let total = 0

  for (const group of groups) {
    for (const photo of group.photos) {
      total += 1
      const mtime = mtimeOf(join(libraryPath, photo.path))
      if (mtime === null) continue
      if (entries[photo.path]?.mtime === mtime) continue
      pending.push({ ...photo, mtime })
    }
  }

  for (let at = 0; at < pending.length; at += BATCH) {
    const slice = pending.slice(at, at + BATCH)
    const read = await Promise.all(
      slice.map((photo) =>
        photo.kind === 'video' ? Promise.resolve({}) : readFile(join(libraryPath, photo.path)),
      ),
    )

    slice.forEach((photo, offset) => {
      entries[photo.path] = { mtime: photo.mtime, ...read[offset] }
    })
    dirty = true
  }

  saveStore()
  log('metadata indexed', { indexed: pending.length, total })
  return { indexed: pending.length, total }
}

/* Whatever is already known, for callers that must not wait: search reads
   this and the background pass fills it in. */
export const knownMetadata = () => loadStore().entries
