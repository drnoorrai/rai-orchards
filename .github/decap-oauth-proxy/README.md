# Decap OAuth Proxy

This folder is a tiny Vercel Serverless Function app for Decap CMS GitHub login.

GitHub Pages can host the `/admin` UI, but it cannot store the GitHub OAuth client secret. This proxy stores that secret as a Vercel environment variable and handles:

- `/auth`: redirects the Decap popup to GitHub OAuth
- `/callback`: exchanges GitHub's code for an access token and posts it back to Decap

## Required Environment Variables

Set these in the Vercel project:

```text
GITHUB_OAUTH_ID=<GitHub OAuth App Client ID>
GITHUB_OAUTH_SECRET=<GitHub OAuth App Client Secret>
CMS_ORIGIN=https://raiorchards.ca
GITHUB_REPO_PRIVATE=0
```

Use `GITHUB_REPO_PRIVATE=1` only if the website repo becomes private.

## Deploy

From this folder:

```sh
vercel login
vercel link
vercel env add GITHUB_OAUTH_ID production
vercel env add GITHUB_OAUTH_SECRET production
vercel env add CMS_ORIGIN production
vercel env add GITHUB_REPO_PRIVATE production
vercel --prod
```

## GitHub OAuth App Settings

Create the OAuth app at:

```text
https://github.com/settings/developers
```

Use:

```text
Application name: Rai Orchards Decap CMS
Homepage URL: https://rai-orchards-decap-oauth-proxy.vercel.app
Authorization callback URL: https://rai-orchards-decap-oauth-proxy.vercel.app/callback?provider=github
```

After deployment, update `admin/config.yml`:

```yaml
backend:
  base_url: https://rai-orchards-decap-oauth-proxy.vercel.app
  auth_endpoint: auth
```
