import { readSession, type Env } from '../../server/session'

const PUBLIC_IMAGES = new Set(['/img/landing.png'])

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const { pathname } = new URL(request.url)
  if (PUBLIC_IMAGES.has(pathname)) return next()

  if (!(await readSession(request, env))) {
    return new Response('Patrons only', {
      status: 403,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const asset = await next()
  const response = new Response(asset.body, asset)
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}
