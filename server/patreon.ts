import type { Env } from './session'

export const PATREON_AUTHORIZE_URL = 'https://www.patreon.com/oauth2/authorize'
export const PATREON_TOKEN_URL = 'https://www.patreon.com/api/oauth2/token'
export const PATREON_IDENTITY_URL = 'https://www.patreon.com/api/oauth2/v2/identity'
export const PATREON_SCOPES = 'identity identity.memberships'

const USER_AGENT = 'Gialao-Gallery (Cloudflare Pages)'

interface ResourceRef {
  id: string
  type: string
}

interface JsonApiResource {
  id: string
  type: string
  attributes?: Record<string, unknown>
  relationships?: Record<string, { data?: ResourceRef | Array<ResourceRef> | null }>
}

interface IdentityDocument {
  data: JsonApiResource
  included?: Array<JsonApiResource>
}

export interface PatreonUser {
  id: string
  name: string
  handle: string
}

export async function exchangeCodeForToken(code: string, env: Env): Promise<string> {
  const response = await fetch(PATREON_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: env.PATREON_CLIENT_ID,
      client_secret: env.PATREON_CLIENT_SECRET,
      redirect_uri: env.PATREON_REDIRECT_URI,
    }),
  })

  if (!response.ok) {
    throw new Error(`Patreon token exchange failed with status ${response.status}`)
  }

  const token = (await response.json()) as { access_token?: unknown }
  if (typeof token.access_token !== 'string' || !token.access_token) {
    throw new Error('Patreon token response did not include an access token')
  }
  return token.access_token
}

export async function fetchIdentity(accessToken: string): Promise<IdentityDocument> {
  const url = new URL(PATREON_IDENTITY_URL)
  url.searchParams.set('include', 'memberships.campaign,campaign')
  url.searchParams.set('fields[user]', 'full_name,vanity')
  url.searchParams.set('fields[member]', 'patron_status')

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'User-Agent': USER_AGENT,
    },
  })

  if (!response.ok) {
    throw new Error(`Patreon identity request failed with status ${response.status}`)
  }
  return (await response.json()) as IdentityDocument
}

const relatedId = (resource: JsonApiResource, name: string) => {
  const data = resource.relationships?.[name]?.data
  return data && !Array.isArray(data) ? data.id : undefined
}

/**
 * The campaign owner always has access; everyone else needs an
 * `active_patron` membership on the configured campaign.
 */
export function hasGalleryAccess(identity: IdentityDocument, campaignId: string): boolean {
  if (relatedId(identity.data, 'campaign') === campaignId) return true

  return (identity.included ?? []).some(
    (resource) =>
      resource.type === 'member' &&
      relatedId(resource, 'campaign') === campaignId &&
      resource.attributes?.patron_status === 'active_patron',
  )
}

export function toPatreonUser(identity: IdentityDocument): PatreonUser {
  const attributes = identity.data.attributes ?? {}
  const name =
    typeof attributes.full_name === 'string' && attributes.full_name.trim()
      ? attributes.full_name.trim()
      : 'Patron'
  const handle =
    typeof attributes.vanity === 'string' && attributes.vanity
      ? attributes.vanity
      : `patron${identity.data.id}`
  return { id: identity.data.id, name, handle }
}
