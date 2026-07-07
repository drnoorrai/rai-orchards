# Rai Orchards CMS Setup

The site uses Decap CMS at `/admin` and stores editable homepage copy in `_data/site.yml`.

## Editor Flow

1. Visit `https://raiorchards.ca/admin/`.
2. Log in with GitHub.
3. Open `Website Text` -> `Homepage`.
4. Edit the fields and save the draft.
5. Move the draft to ready for review.
6. Decap opens a GitHub pull request.
7. A maintainer reviews and merges the pull request to publish the change.

## Approval Flow

The `main` branch is protected on GitHub:

- Pull requests are required before merge.
- One approval is required.
- Stale approvals are dismissed after new commits.
- Code owner review is required.
- Force pushes and branch deletion are disabled.

`.github/CODEOWNERS` marks `@drnoorrai` as the code owner for all files.

## Required Auth Step

Decap's GitHub backend needs a server-side OAuth proxy when hosted on GitHub Pages. The repo cannot safely store the GitHub OAuth client secret.

This repo includes a Vercel-ready proxy in `.github/decap-oauth-proxy`.

To finish login:

1. Deploy `.github/decap-oauth-proxy` to Vercel.
2. Create a GitHub OAuth app.
3. Set the GitHub OAuth callback URL to the proxy callback: `https://rai-orchards-decap-oauth-proxy.vercel.app/callback?provider=github`.
4. Store the GitHub OAuth client ID and secret as Vercel environment variables.
5. Confirm `base_url` and `auth_endpoint` in `admin/config.yml`:

   ```yaml
   backend:
     base_url: https://rai-orchards-decap-oauth-proxy.vercel.app
     auth_endpoint: auth
   ```

### Vercel Proxy Environment

Set these in the Vercel project:

```text
GITHUB_OAUTH_ID=<GitHub OAuth App Client ID>
GITHUB_OAUTH_SECRET=<GitHub OAuth App Client Secret>
CMS_ORIGIN=https://raiorchards.ca
GITHUB_REPO_PRIVATE=0
```

The proxy source lives in `.github/decap-oauth-proxy` so GitHub Pages does not publish it as part of the website.
