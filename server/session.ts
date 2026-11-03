export interface Env {
  PATREON_CLIENT_ID: string
  PATREON_CLIENT_SECRET: string
  PATREON_REDIRECT_URI: string
  /** Numeric ID of the campaign whose active patrons may view the gallery. */
  PATREON_CAMPAIGN_ID: string
  /** Optional dedicated signing key; falls back to PATREON_CLIENT_SECRET. */
  SESSION_SECRET?: string
}

export interface SessionPayload {
  sub: string
  name: string
  handle: string
  exp: number
}

export const SESSION_COOKIE = '__Host-gallery_session'
export const STATE_COOKIE = '__Host-patreon_oauth_state'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const STATE_TTL_SECONDS = 60 * 10

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const signingSecret = (env: Env) =>
  env.SESSION_SECRET || env.PATREON_CLIENT_SECRET

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

const hmacKey = (secret: string) =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )

export function randomToken(byteLength = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

export async function createSessionToken(
  payload: SessionPayload,
  secret: string,
): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)))
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    encoder.encode(body),
  )
  return `${body}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string,
): Promise<SessionPayload | null> {
  if (!token) return null
  const [body, signature, extra] = token.split('.')
  if (!body || !signature || extra !== undefined) return null

  try {
    const valid = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(secret),
      fromBase64Url(signature),
      encoder.encode(body),
    )
    if (!valid) return null

    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as SessionPayload
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!header) return cookies
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const name = part.slice(0, index).trim()
    if (name && !(name in cookies)) cookies[name] = part.slice(index + 1).trim()
  }
  return cookies
}

export function serializeCookie(name: string, value: string, maxAge: number) {
  return [
    `${name}=${value}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
  ].join('; ')
}

export const clearCookie = (name: string) => serializeCookie(name, '', 0)

export async function readSession(request: Request, env: Env) {
  const token = parseCookies(request.headers.get('Cookie'))[SESSION_COOKIE]
  return verifySessionToken(token, signingSecret(env))
}

/** Only same-site paths are allowed as post-login destinations. */
export function safeReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/gallery'
  }
  return value
}

export function redirect(location: string, cookies: Array<string> = []) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' })
  for (const cookie of cookies) headers.append('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
}

export function missingConfig(env: Env): Array<string> {
  const required = [
    'PATREON_CLIENT_ID',
    'PATREON_CLIENT_SECRET',
    'PATREON_REDIRECT_URI',
    'PATREON_CAMPAIGN_ID',
  ] as const
  return required.filter((key) => !env[key])
}
