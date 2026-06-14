import 'server-only'
import crypto from 'crypto'

// AES-256-GCM für Strava-Tokens. Key liegt getrennt von der DB in der
// Vercel-Env STRAVA_TOKEN_KEY (32-Byte hex). Format: base64(iv|tag|ciphertext).

function getKey(): Buffer {
  const hex = process.env.STRAVA_TOKEN_KEY
  if (!hex || hex.length < 64) {
    throw new Error('STRAVA_TOKEN_KEY fehlt oder ist zu kurz (32-Byte hex erwartet).')
  }
  return Buffer.from(hex.slice(0, 64), 'hex')
}

export function encryptToken(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptToken(payload: string): string {
  const buf = Buffer.from(payload, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}
