import { readSession, type Env } from '../../../server/session'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const session = await readSession(request, env)
  const headers = { 'Cache-Control': 'no-store' }

  if (!session) return Response.json({ patron: null }, { status: 401, headers })

  return Response.json(
    { patron: { id: session.sub, name: session.name, handle: session.handle } },
    { headers },
  )
}
