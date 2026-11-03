import { SESSION_COOKIE, clearCookie, type Env } from '../../../server/session'

export const onRequestPost: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Set-Cookie': clearCookie(SESSION_COOKIE),
      'Cache-Control': 'no-store',
    },
  })
