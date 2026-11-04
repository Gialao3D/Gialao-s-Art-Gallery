export const onRequestGet: PagesFunction<{
  PATREON_CLIENT_ID: string;
  PATREON_REDIRECT_URI: string;
}> = async ({ request, env }) => {
  const clientId = env.PATREON_CLIENT_ID;
  const redirectUri = env.PATREON_REDIRECT_URI;

  // Fallback check if environment variables are missing
  if (!clientId || !redirectUri) {
    return new Response("Missing PATREON_CLIENT_ID or PATREON_REDIRECT_URI in Cloudflare settings.", { status: 500 });
  }

  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/gallery";

  // Build official Patreon OAuth redirect URL
  const authorizeUrl = new URL("https://www.patreon.com/oauth2/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", "identity identity.memberships");
  authorizeUrl.searchParams.set("state", encodeURIComponent(returnTo));

  // Redirect user to Patreon login
  return Response.redirect(authorizeUrl.toString(), 302);
};
