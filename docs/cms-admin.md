# CMS Administration Guide

This document covers the full editorial workflow, how to review changes, how to add a new editable field, and how to rotate OAuth secrets.

---

## How the approval flow works

1. Your sister logs into `/admin` and edits a field
2. She clicks **Save** — Decap CMS creates a branch named `cms/<section>-<timestamp>` and opens a **draft pull request** on GitHub
3. You receive a GitHub notification (email or mobile)
4. You review the PR, see a Cloudflare Pages preview link in the PR description, and visually confirm the change looks right
5. You click **Merge** — Cloudflare Pages builds and deploys automatically within ~30 seconds
6. Nothing can reach `main` without your merge

Your sister cannot merge her own PRs because she has `write` access (can push branches and open PRs) but not `admin` access. Add a branch protection rule on `main` (see below) to make this airtight.

---

## Reviewing from the GitHub mobile app

1. Open the **Pull requests** tab on the `drnoorrai/rai-orchards` repo
2. Tap the PR — you'll see the diff of which JSON file changed and what the new text is
3. Tap the **Cloudflare Pages preview** link in the PR checks — this opens the full site with the change applied, so you can read it in context
4. Tap **Merge pull request** → **Confirm merge**

The live site updates automatically after merge.

---

## Setting up the OAuth Worker (one-time)

### 1 — Create a GitHub OAuth App

Go to [GitHub Settings → Developer settings → OAuth Apps → New OAuth App](https://github.com/settings/applications/new):

| Field | Value |
|---|---|
| Application name | Rai Orchards CMS |
| Homepage URL | `https://raiorchards.ca` |
| Authorization callback URL | `https://<your-worker>.workers.dev/callback` |

Copy the **Client ID** and generate a **Client Secret**.

### 2 — Deploy the Worker

```bash
cd workers/decap-oauth
npm install
wrangler secret put GITHUB_CLIENT_ID      # paste the Client ID when prompted
wrangler secret put GITHUB_CLIENT_SECRET  # paste the Client Secret when prompted
npm run deploy
```

Wrangler will print the Worker URL, e.g. `https://rai-orchards-cms-auth.yourname.workers.dev`.

### 3 — Update the CMS config

Open `admin/config.yml` and replace the placeholder on the `base_url` line:

```yaml
base_url: https://rai-orchards-cms-auth.yourname.workers.dev
```

Commit and push — the site rebuilds and `/admin` will now be able to authenticate.

---

## Adding a new editable field

Say you want to add a `footer_note` field to the bottom of the page.

1. **Add the field to a content file** (e.g. `content/site.json`):
   ```json
   { "open_label": "Soft open", "open_date": "August 2026", "footer_note": "Your new text here." }
   ```

2. **Add a placeholder to `src/index.html`** where the text should appear:
   ```html
   <p class="footer-note">{{site_footer_note}}</p>
   ```

3. **Register the replacement in `build.js`**:
   ```js
   '{{site_footer_note}}': esc(site.footer_note),
   ```

4. **Add the field to `admin/config.yml`** under the right collection:
   ```yaml
   - label: Footer note
     name: footer_note
     widget: string
     hint: "Short note at the very bottom of the page."
   ```

5. Run `node build.js` locally to confirm the build succeeds and the text appears correctly.

6. Commit and push.

---

## Rotating OAuth secrets

If the GitHub Client Secret is ever compromised:

1. Go to GitHub → Settings → Developer settings → OAuth Apps → Rai Orchards CMS → **Generate a new client secret**
2. Copy the new secret
3. Run `wrangler secret put GITHUB_CLIENT_SECRET` and paste the new value
4. The old secret is immediately invalid — no redeployment needed

To rotate the Client ID (rare), you'd need to create a new OAuth App and update `base_url` in `admin/config.yml`.

---

## Two things to do that only you can do

> **Before giving your sister access to `/admin`, complete both of these steps:**

### 1 — Invite your sister as a collaborator with Write access

Go to the repo on GitHub → **Settings → Collaborators → Add people**.  
Search for her GitHub username. Set the role to **Write**.

Write access lets her create branches and open pull requests (needed for editorial workflow) but does **not** let her push to `main` or merge her own PRs.

### 2 — Add a branch protection rule on `main`

Go to the repo → **Settings → Branches → Add branch ruleset** (or classic Branch protection rules):

- Branch name pattern: `main`
- Enable **Require a pull request before merging**
- Enable **Require approvals** (set to 1)
- Enable **Dismiss stale pull request approvals when new commits are pushed**

This ensures no one can bypass the review gate — not even your sister if she were upgraded to admin by mistake.
