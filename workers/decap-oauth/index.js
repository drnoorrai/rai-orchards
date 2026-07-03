/**
 * Decap CMS GitHub OAuth proxy for raiorchards.ca
 *
 * Endpoints:
 *   GET /auth      – redirect to GitHub OAuth consent screen
 *   GET /callback  – exchange code for token, return via postMessage to CMS
 *
 * Required Worker secrets (set with `wrangler secret put`):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 */

const ALLOWED_ORIGIN = 'https://raiorchards.ca';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth')     return handleAuth(url, env);
    if (url.pathname === '/callback') return handleCallback(url, env);

    return new Response('Not Found', { status: 404 });
  },
};

// ── /auth ──────────────────────────────────────────────────────────────────
// Redirect the browser to GitHub's OAuth consent screen.
function handleAuth(url, env) {
  const params = new URLSearchParams({
    client_id:    env.GITHUB_CLIENT_ID,
    redirect_uri: new URL('/callback', url.origin).href,
    scope:        'repo,user',
  });
  return Response.redirect(
    'https://github.com/login/oauth/authorize?' + params,
    302
  );
}

// ── /callback ──────────────────────────────────────────────────────────────
// GitHub redirects here with ?code=. Exchange it for a token and send it
// back to the CMS popup via postMessage.
async function handleCallback(url, env) {
  const code = url.searchParams.get('code');
  if (!code) {
    return postMessagePage('error', 'No authorization code received from GitHub.');
  }

  let data;
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id:     env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    if (!res.ok) throw new Error('GitHub token endpoint returned ' + res.status);
    data = await res.json();
  } catch (err) {
    return postMessagePage('error', 'Token exchange failed: ' + err.message);
  }

  if (!data.access_token) {
    const reason = data.error_description || data.error || 'No access token in response';
    return postMessagePage('error', reason);
  }

  return postMessagePage('success', JSON.stringify({
    token:    data.access_token,
    provider: 'github',
  }));
}

// ── helpers ────────────────────────────────────────────────────────────────
// Serve an HTML page that immediately sends a postMessage to the CMS window
// and then closes itself. The message format is what Decap CMS expects.
function postMessagePage(status, content) {
  // Full message string: "authorization:github:success:{...}" or ":error:..."
  const message = 'authorization:github:' + status + ':' + content;

  const html = '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head><meta charset="utf-8"><title>Authorizing…</title></head>\n' +
    '<body>\n' +
    '<p>Authorizing, please wait…</p>\n' +
    '<script>\n' +
    '(function () {\n' +
    '  var msg = ' + JSON.stringify(message) + ';\n' +
    '  var target = ' + JSON.stringify(ALLOWED_ORIGIN) + ';\n' +
    '  if (window.opener) {\n' +
    '    window.opener.postMessage(msg, target);\n' +
    '  }\n' +
    '  window.close();\n' +
    '}());\n' +
    '</script>\n' +
    '</body>\n' +
    '</html>';

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
