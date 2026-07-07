const crypto = require("node:crypto");

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

function getCallbackUrl(req) {
  return `${getOrigin(req)}/callback?provider=github`;
}

function getCmsOrigin() {
  return process.env.CMS_ORIGIN || "https://raiorchards.ca";
}

function getRepoScope() {
  const repoIsPrivate =
    process.env.GITHUB_REPO_PRIVATE &&
    process.env.GITHUB_REPO_PRIVATE !== "0" &&
    process.env.GITHUB_REPO_PRIVATE !== "false";

  return repoIsPrivate ? "repo,user" : "public_repo,user";
}

function createState() {
  return crypto.randomBytes(16).toString("hex");
}

function setStateCookie(res, state) {
  res.setHeader(
    "Set-Cookie",
    [
      `decap_oauth_state=${state}`,
      "Max-Age=600",
      "Path=/callback",
      "HttpOnly",
      "Secure",
      "SameSite=Lax"
    ].join("; ")
  );
}

function readCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const parts = cookie.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function clearStateCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "decap_oauth_state=; Max-Age=0; Path=/callback; HttpOnly; Secure; SameSite=Lax"
  );
}

function sendText(res, statusCode, message) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(message);
}

function sendCallbackHtml(res, status, tokenOrMessage) {
  const tokenPayload =
    status === "success" ? { token: tokenOrMessage } : { error: tokenOrMessage };
  const message = `authorization:github:${status}:${JSON.stringify(tokenPayload)}`;
  const cmsOrigin = getCmsOrigin();

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Authorizing Decap</title>
  <script>
    (function () {
      var message = ${JSON.stringify(message)};
      var cmsOrigin = ${JSON.stringify(cmsOrigin)};

      function receiveMessage() {
        if (window.opener) {
          window.opener.postMessage(message, cmsOrigin);
        }
        window.removeEventListener("message", receiveMessage, false);
      }

      window.addEventListener("message", receiveMessage, false);
      if (window.opener) {
        window.opener.postMessage("authorizing:github", cmsOrigin);
      }
    })();
  </script>
</head>
<body>
  <p>Authorizing Decap...</p>
</body>
</html>`);
}

async function exchangeCodeForToken(code, redirectUri) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: requiredEnv("GITHUB_OAUTH_ID"),
      client_secret: requiredEnv("GITHUB_OAUTH_SECRET"),
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    const description = payload.error_description || payload.error || "GitHub did not return an access token.";
    throw new Error(description);
  }

  return payload.access_token;
}

module.exports = {
  GITHUB_AUTHORIZE_URL,
  clearStateCookie,
  createState,
  exchangeCodeForToken,
  getCallbackUrl,
  getRepoScope,
  readCookie,
  requiredEnv,
  sendCallbackHtml,
  sendText,
  setStateCookie
};
