/* Copying must stop at the cap rather than overrun it, so callers ask
   before writing rather than apologising afterwards. Pure arithmetic on
   numbers the caller already measured — no filesystem access here. */

export interface QuotaInput {
  usedGB: number
  quotaGB: number
  warnAt?: number
}

export interface QuotaState {
  ratio: number
  warning: boolean
  full: boolean
}

export function quotaState({ usedGB, quotaGB, warnAt = 0.9 }: QuotaInput): QuotaState {
  if (!quotaGB) return { ratio: 0, warning: false, full: false }
  const ratio = usedGB / quotaGB
  return { ratio, warning: ratio >= warnAt && ratio < 1, full: ratio >= 1 }
}
