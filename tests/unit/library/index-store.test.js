import { describe, it, expect } from 'vitest'
import { mediaKey, destinationFor } from '../../../src/main/library/index-store'

describe('mediaKey', () => {
  it('lowercases the name and pairs it with the exact size', () => {
    expect(mediaKey({ name: 'IMG_0001.JPG', size: 100 })).toBe('img_0001.jpg|100')
  })

  it('treats two different-cased names of the same size as the same key', () => {
    const a = mediaKey({ name: 'PXL_1.jpg', size: 500 })
    const b = mediaKey({ name: 'pxl_1.JPG', size: 500 })
    expect(a).toBe(b)
  })

  it('treats the same name at a different size as a different key', () => {
    const a = mediaKey({ name: 'PXL_1.jpg', size: 500 })
    const b = mediaKey({ name: 'PXL_1.jpg', size: 501 })
    expect(a).not.toBe(b)
  })
})

describe('destinationFor', () => {
  it('uses the year and zero-padded month from takenAt', () => {
    const out = destinationFor({ name: 'PXL_20260806_214636611.jpg', takenAt: new Date('2026-08-06') })
    expect(out).toBe('2026/08/PXL_20260806_214636611.jpg')
  })

  it('pads a single-digit month to two digits', () => {
    const out = destinationFor({ name: 'x.jpg', takenAt: new Date('2026-01-15') })
    expect(out).toBe('2026/01/x.jpg')
  })

  it("falls back to today's date when takenAt is missing", () => {
    // index-store.js:79-81: `taken` is null, `valid` is false, so `date`
    // becomes `new Date()`. Characterizing this exactly as it behaves
    // today — see the coordinator's note: this is a candidate the user
    // flagged as possibly worth revisiting, not a confirmed-correct design.
    const now = new Date()
    const out = destinationFor({ name: 'x.jpg', takenAt: undefined })
    const expectedYear = String(now.getFullYear())
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0')
    expect(out).toBe(`${expectedYear}/${expectedMonth}/x.jpg`)
  })

  it('falls back to today when takenAt is an invalid date', () => {
    const now = new Date()
    const out = destinationFor({ name: 'x.jpg', takenAt: 'not-a-real-date' })
    const expectedYear = String(now.getFullYear())
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0')
    expect(out).toBe(`${expectedYear}/${expectedMonth}/x.jpg`)
  })
})
