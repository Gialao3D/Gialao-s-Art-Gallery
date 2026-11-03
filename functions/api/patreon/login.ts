import { PATREON_AUTHORIZE_URL, PATREON_SCOPES } from '../../../server/patreon'
import {
  STATE_COOKIE,
  STATE_TTL_SECONDS,
  missingConfig,
  randomToken,
  redirect,
  safeReturnPath,
  serializeCookie,
  type Env,
} from '../../../server/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (missingConfig(env).length > 0) return redirect('/login?error=config')

  const state = randomToken()
  const returnTo = safeReturnPath(new URL(request.url).searchParams.get('returnTo'))

  const authorize = new URL(PATREON_AUTHORIZE_URL)
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('client_id', env.PATREON_CLIENT_ID)
  authorize.searchParams.set('redirect_uri', env.PATREON_REDIRECT_URI)
  authorize.searchParams.set('scope', PATREON_SCOPES)
  authorize.searchParams.set('state', state)

  return redirect(authorize.toString(), [
    serializeCookie(
      STATE_COOKIE,
      `${state}.${encodeURIComponent(returnTo)}`,
      STATE_TTL_SECONDS,
    ),
  ])
}
