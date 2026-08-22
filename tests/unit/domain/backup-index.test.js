import { describe, it, expect } from 'vitest'
import { planDestination, withSuffix } from '../../../src/main/domain/devices/backup-index'

/* Characterization tests: they freeze what src/main/domain/devices/backup-index.ts
   does today, so it can move and be wrapped without silently changing
   behaviour. They are not a statement that every rule here is the
   intended final design — see the coordinator's report for two rules
   flagged as worth revisiting later (device-gone and missing-date are a
   different file, but the same caution applies to anything below that
   reads as a judgement call rather than an obvious invariant). */

const mediaKey = ({ name, size }) => `${String(name).toLowerCase()}|${size}`

/* An in-memory stand-in for the disk, not a mock of PowerShell/MTP: this
   is exactly the port the domain function already declares
   (`getSize: (path: string) => number`), fed a fake instead of
   fs.statSync. */
function fakeDisk(entries = {}) {
  return (path) => (path in entries ? entries[path] : -1)
}

describe('withSuffix', () => {
  it('inserts the attempt number before the extension', () => {
    expect(withSuffix('2026/08/IMG_0001.jpg', 2)).toBe('2026/08/IMG_0001-2.jpg')
  })

  it('appends the attempt number when there is no extension', () => {
    expect(withSuffix('2026/08/IMG_0001', 2)).toBe('2026/08/IMG_0001-2')
  })

  it('treats a dot at position 0 as not an extension (dotfile-shaped name)', () => {
    // relative.lastIndexOf('.') === 0 fails the `dot < 1` guard at
    // backup-index.ts:9, so a bare dotfile name is treated as having no
    // extension. Verified by running the real function first — a
    // directory-prefixed path like '2026/08/.hidden' does NOT hit this
    // branch, because the dot's absolute index there is 8, not 0; it
    // produces '2026/08/-2.hidden' instead, which is its own case below.
    expect(withSuffix('.hidden', 2)).toBe('.hidden-2')
  })

  it('a dotfile after a path prefix still counts as having an extension', () => {
    // The `dot < 1` check is against the dot's absolute index in the
    // whole string, not its position within the final path segment — so
    // this is NOT parallel to the bare-dotfile case above.
    expect(withSuffix('2026/08/.hidden', 2)).toBe('2026/08/-2.hidden')
  })
})

describe('planDestination', () => {
  it('returns the candidate relative path when nothing is on disk there', () => {
    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath: '/lib',
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: '2026/08/IMG_0001.jpg',
      claimed: new Set(),
      getSize: fakeDisk(),
      mediaKey,
    })
    expect(out).toBe('2026/08/IMG_0001.jpg')
  })

  it('returns null when a file of the exact same size already sits there', () => {
    const rel = '2026/08/IMG_0001.jpg'
    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath: '/lib',
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: rel,
      claimed: new Set(),
      getSize: fakeDisk({ '/lib/2026/08/IMG_0001.jpg': 100 }),
      mediaKey,
    })
    expect(out).toBeNull()
  })

  it('finishes our own truncated copy in place instead of duplicating it', () => {
    const rel = '2026/08/IMG_0001.jpg'
    const item = { name: 'IMG_0001.jpg', size: 100 }
    const index = { version: 1, entries: { [mediaKey(item)]: { path: rel, at: 'x' } } }
    const out = planDestination({
      index,
      libraryPath: '/lib',
      item,
      relative: rel,
      claimed: new Set(),
      // 40 bytes on disk, 100 expected: a partial copy, not a stranger.
      getSize: fakeDisk({ '/lib/2026/08/IMG_0001.jpg': 40 }),
      mediaKey,
    })
    expect(out).toBe(rel)
  })

  it('never overwrites a stranger file under the same name — takes the next suffix', () => {
    const rel = '2026/08/IMG_0001.jpg'
    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath: '/lib',
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: rel,
      claimed: new Set(),
      // 55 bytes on disk, 100 expected, and NOT in the index: a stranger.
      getSize: fakeDisk({ '/lib/2026/08/IMG_0001.jpg': 55 }),
      mediaKey,
    })
    expect(out).toBe('2026/08/IMG_0001-2.jpg')
  })

  it('treats a recorded-but-now-absent file as deleted on purpose, not re-fetched', () => {
    const rel = '2026/08/IMG_0001.jpg'
    const item = { name: 'IMG_0001.jpg', size: 100 }
    const index = { version: 1, entries: { [mediaKey(item)]: { path: rel, at: 'x' } } }
    const out = planDestination({
      index,
      libraryPath: '/lib',
      item,
      relative: rel,
      claimed: new Set(),
      getSize: fakeDisk(), // nothing on disk at all
      mediaKey,
    })
    expect(out).toBeNull()
  })

  it('two device items claiming the same slot in one run get consecutive suffixes', () => {
    const rel = '2026/08/IMG_0001.jpg'
    const index = { version: 1, entries: {} }
    const claimed = new Set()

    const first = planDestination({
      index,
      libraryPath: '/lib',
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: rel,
      claimed,
      getSize: fakeDisk(),
      mediaKey,
    })
    claimed.add(first)

    const second = planDestination({
      index,
      libraryPath: '/lib',
      item: { name: 'IMG_0001.jpg', size: 200 },
      relative: rel,
      claimed,
      getSize: fakeDisk(),
      mediaKey,
    })

    expect(first).toBe(rel)
    expect(second).toBe('2026/08/IMG_0001-2.jpg')
  })

  it('gives up and returns null after 100 exhausted attempts', () => {
    // Every candidate from the base name up to attempt 100 is occupied by
    // a stranger of a different size, so none of the escape branches in
    // backup-index.ts:67-77 ever fire.
    const rel = '2026/08/IMG_0001.jpg'
    const entries = { '/lib/2026/08/IMG_0001.jpg': 999 }
    for (let attempt = 2; attempt <= 100; attempt += 1) {
      entries[`/lib/2026/08/IMG_0001-${attempt}.jpg`] = 999
    }

    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath: '/lib',
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: rel,
      claimed: new Set(),
      getSize: fakeDisk(entries),
      mediaKey,
    })
    expect(out).toBeNull()
  })
})
