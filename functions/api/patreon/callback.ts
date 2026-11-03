import {
  exchangeCodeForToken,
  fetchIdentity,
  hasGalleryAccess,
  toPatreonUser,
} from '../../../server/patreon'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  STATE_COOKIE,
  clearCookie,
  createSessionToken,
  missingConfig,
  parseCookies,
  redirect,
  safeReturnPath,
  serializeCookie,
  signingSecret,
  type Env,
} from '../../../server/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const clearState = clearCookie(STATE_COOKIE)
  const fail = (reason: string) => redirect(`/login?error=${reason}`, [clearState])

  if (missingConfig(env).length > 0) return fail('config')

  const params = new URL(request.url).searchParams
  if (params.get('error')) return fail('denied')

  const code = params.get('code')
  const state = params.get('state')
  const storedState = parseCookies(request.headers.get('Cookie'))[STATE_COOKIE]
  const separator = storedState?.indexOf('.') ?? -1
  const expectedState = separator > 0 ? storedState!.slice(0, separator) : undefined

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail('state')
  }

  let returnTo = '/gallery'
  try {
    returnTo = safeReturnPath(decodeURIComponent(storedState!.slice(separator + 1)))
  } catch {
    // Malformed return path: keep the default.
  }

  try {
    const accessToken = await exchangeCodeForToken(code, env)
    const identity = await fetchIdentity(accessToken)

    if (!hasGalleryAccess(identity, env.PATREON_CAMPAIGN_ID)) {
      return fail('not_patron')
    }

    const user = toPatreonUser(identity)
    const token = await createSessionToken(
      {
        sub: user.id,
        name: user.name,
        handle: user.handle,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
      },
      signingSecret(env),
    )

    return redirect(returnTo, [
      clearState,
      serializeCookie(SESSION_COOKIE, token, SESSION_TTL_SECONDS),
    ])
  } catch (error) {
    console.error('Patreon OAuth callback failed:', error instanceof Error ? error.message : error)
    return fail('patreon')
  }
}
