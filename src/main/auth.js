import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { readSettings, writeSettings } from './settings'
import { log } from './log'

/* What this lock is, and what it is not.
 *
 * It stops someone opening PhotoBase on this machine. It does NOT hide
 * the photos: the library stays a normal folder of normal files, exactly
 * as decided when the YYYY/MM layout was chosen, so anyone with access to
 * the disk can still open them in any other program. Encrypting the files
 * would change that, and would also mean a forgotten password costs the
 * user every photo they own.
 *
 * The password itself is never stored — only a scrypt hash of it, with a
 * random per-install salt. */
const KEY_LENGTH = 64
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
const MIN_LENGTH = 4

let unlocked = false

const derive = (password, salt) => scryptSync(String(password ?? ''), salt, KEY_LENGTH, SCRYPT)

export const hasPassword = () => Boolean(readSettings().passwordHash)

function verify(password) {
  const stored = readSettings().passwordHash
  if (!stored?.salt || !stored?.hash) return false

  const expected = Buffer.from(stored.hash, 'hex')
  const actual = derive(password, Buffer.from(stored.salt, 'hex'))

  /* timingSafeEqual throws on a length mismatch, so that is checked
     first — and a wrong length is a wrong password anyway. */
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function setPassword(next, current) {
  if (hasPassword() && !verify(current)) {
    throw new Error('La contraseña actual no es correcta.')
  }

  const text = String(next ?? '')
  if (text.length < MIN_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`)
  }

  const salt = randomBytes(16)
  writeSettings({
    passwordHash: { salt: salt.toString('hex'), hash: derive(text, salt).toString('hex') },
  })

  unlocked = true
  log('password set')
  return true
}

export function clearPassword(current) {
  if (!hasPassword()) return true
  if (!verify(current)) throw new Error('La contraseña actual no es correcta.')

  writeSettings({ passwordHash: null })
  unlocked = true
  log('password cleared')
  return true
}

export function unlock(password) {
  if (!hasPassword()) {
    unlocked = true
    return true
  }

  if (!verify(password)) return false

  unlocked = true
  log('unlocked')
  return true
}

/* An app with no password set is never locked. */
export const isUnlocked = () => !hasPassword() || unlocked

export function lock() {
  unlocked = false
  return true
}
