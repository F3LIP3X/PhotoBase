import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { planDestination } from '../../../src/main/library/index-store'

/* Not a PowerShell/MTP mock — this exercises the exported wrapper against
   a real temporary directory on the real filesystem, confirming it wires
   fs.statSync into the domain port correctly. The domain logic itself is
   already covered in isolation by tests/unit/domain/backup-index.test.js;
   this test's only job is the wiring. */

let libraryPath

beforeEach(() => {
  libraryPath = mkdtempSync(join(tmpdir(), 'photobase-test-'))
})

afterEach(() => {
  rmSync(libraryPath, { recursive: true, force: true })
})

describe('planDestination (index-store.js wrapper, real filesystem)', () => {
  it('returns the relative path when the destination folder does not exist yet', () => {
    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath,
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: '2026/08/IMG_0001.jpg',
      claimed: new Set(),
    })
    expect(out).toBe('2026/08/IMG_0001.jpg')
  })

  it('returns null when a real file of the exact same size already exists there', () => {
    mkdirSync(join(libraryPath, '2026', '08'), { recursive: true })
    writeFileSync(join(libraryPath, '2026', '08', 'IMG_0001.jpg'), Buffer.alloc(100))

    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath,
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: '2026/08/IMG_0001.jpg',
      claimed: new Set(),
    })
    expect(out).toBeNull()
  })

  it('suffixes when a real stranger file of a different size sits there', () => {
    mkdirSync(join(libraryPath, '2026', '08'), { recursive: true })
    writeFileSync(join(libraryPath, '2026', '08', 'IMG_0001.jpg'), Buffer.alloc(55))

    const out = planDestination({
      index: { version: 1, entries: {} },
      libraryPath,
      item: { name: 'IMG_0001.jpg', size: 100 },
      relative: '2026/08/IMG_0001.jpg',
      claimed: new Set(),
    })
    expect(out).toBe('2026/08/IMG_0001-2.jpg')
  })
})
