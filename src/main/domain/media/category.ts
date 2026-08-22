/* Android names its files by where they came from: PXL_ from the camera,
   Screenshot_ from the screen — the closest thing to a kind without
   opening every file. Video wins over origin, because a camera clip is a
   video first and a PXL_ capture second. Decided here so the grid, the
   facets and the filters cannot disagree about it. */

export type PhotoKind = 'video' | 'image'

export function categoryOf(name: string, kind: PhotoKind): string {
  if (kind === 'video') return 'Vídeos'
  if (/^Screenshot/i.test(name)) return 'Capturas'
  if (/^PXL_/i.test(name)) return 'Cámara'
  return 'Otras'
}
