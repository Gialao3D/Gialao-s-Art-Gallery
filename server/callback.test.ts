// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { onRequestGet as callback } from '../functions/api/patreon/callback'
import { onRequestGet as login } from '../functions/api/patreon/login'
import { onRequestGet as me } from '../functions/api/patreon/me'
import { SESSION_COOKIE, STATE_COOKIE, type Env } from './session'

const env: Env = {
  PATREON_CLIENT_ID: 'client-id',
  PATREON_CLIENT_SECRET: 'client-secret',
  PATREON_REDIRECT_URI: 'https://gallery.example/api/patreon/callback',
  PATREON_CAMPAIGN_ID: '555',
}

type Handler = (context: { request: Request; env: Env }) => Promise<Response>
const run = (handler: unknown, request: Request) =>
  (handler as Handler)({ request, env })

const identity = (patronStatus: string | null, campaignId = '555') => ({
  data: {
    id: '42',
    type: 'user',
    attributes: { full_name: 'Robin Vale', vanity: 'robinvale' },
    relationships: { memberships: { data: [{ id: 'm1', type: 'member' }] } },
  },
  included: [
    {
      id: 'm1',
      type: 'member',
      attributes: { patron_status: patronStatus },
      relationships: { campaign: { data: { id: campaignId, type: 'campaign' } } },
    },
  ],
})

function mockPatreon(identityBody: unknown) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.startsWith('https://www.patreon.com/api/oauth2/token')) {
      return Response.json({ access_token: 'patreon-token', token_type: 'Bearer' })
    }
    if (url.startsWith('https://www.patreon.com/api/oauth2/v2/identity')) {
      return Response.json(identityBody)
    }
    return new Response('unexpected', { status: 500 })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const cookieValue = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split(';')[0]
    .slice(name.length + 1)

async function startLogin() {
  const response = await run(
    login,
    new Request('https://gallery.example/api/patreon/login?returnTo=/gallery/render-02'),
  )
  const location = new URL(response.headers.get('Location')!)
  return { state: location.searchParams.get('state')!, cookie: cookieValue(response, STATE_COOKIE)! }
}

const callbackRequest = (query: string, stateCookie?: string) =>
  new Request(`https://gallery.example/api/patreon/callback?${query}`, {
    headers: stateCookie ? { Cookie: `${STATE_COOKIE}=${stateCookie}` } : {},
  })

afterEach(() => vi.unstubAllGlobals())

describe('Patreon OAuth', () => {
  it('login redirects to Patreon with state and required scopes', async () => {
    const response = await run(login, new Request('https://gallery.example/api/patreon/login'))
    const location = new URL(response.headers.get('Location')!)
    expect(location.origin + location.pathname).toBe('https://www.patreon.com/oauth2/authorize')
    expect(location.searchParams.get('scope')).toBe('identity identity.memberships')
    expect(location.searchParams.get('redirect_uri')).toBe(env.PATREON_REDIRECT_URI)
    expect(response.headers.get('Set-Cookie')).toMatch(/HttpOnly; Secure; SameSite=Lax/)
  })

  it('grants an HttpOnly session to an active patron', async () => {
    const fetchMock = mockPatreon(identity('active_patron'))
    const { state, cookie } = await startLogin()

    const response = await run(callback, callbackRequest(`code=abc&state=${state}`, cookie))

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe('/gallery/render-02')
    const sessionCookie = response.headers
      .getSetCookie()
      .find((c) => c.startsWith(`${SESSION_COOKIE}=`))!
    expect(sessionCookie).toMatch(/HttpOnly; Secure; SameSite=Lax/)

    const tokenRequest = fetchMock.mock.calls[0]![1] as RequestInit
    const body = new URLSearchParams(String(tokenRequest.body))
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('client_secret')).toBe('client-secret')

    const session = await run(
      me,
      new Request('https://gallery.example/api/patreon/me', {
        headers: { Cookie: sessionCookie.split(';')[0]! },
      }),
    )
    expect(await session.json()).toEqual({
      patron: { id: '42', name: 'Robin Vale', handle: 'robinvale' },
    })
  })

  it.each([
    ['a former patron', identity('former_patron')],
    ['a patron of another campaign', identity('active_patron', '999')],
  ])('rejects %s', async (_label, body) => {
    mockPatreon(body)
    const { state, cookie } = await startLogin()
    const response = await run(callback, callbackRequest(`code=abc&state=${state}`, cookie))
    expect(response.headers.get('Location')).toBe('/login?error=not_patron')
    expect(cookieValue(response, SESSION_COOKIE)).toBeUndefined()
  })

  it('rejects a mismatched state without calling Patreon', async () => {
    const fetchMock = mockPatreon(identity('active_patron'))
    const { cookie } = await startLogin()
    const response = await run(callback, callbackRequest('code=abc&state=forged', cookie))
    expect(response.headers.get('Location')).toBe('/login?error=state')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a tampered session cookie', async () => {
    const response = await run(
      me,
      new Request('https://gallery.example/api/patreon/me', {
        headers: { Cookie: `${SESSION_COOKIE}=eyJzdWIiOiI0MiJ9.forged` },
      }),
    )
    expect(response.status).toBe(401)
  })
})
