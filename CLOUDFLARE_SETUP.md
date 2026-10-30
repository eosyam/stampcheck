# Hosting on Cloudflare Workers

The site is static (`index.html` and friends in the repo root) served by a Cloudflare Worker with static assets. The Worker (`src/worker.js`) only runs for `/api/*`:

- `POST /api/claim` (`src/claim.js`) – after Polar checkout, looks up the buyer's license key so they don't have to copy it.
- `GET|POST /api/fix` (`src/fix.js`) – fixes what the browser can't, using Claude, and charges one fix from the license.

Config is in `wrangler.toml`; `.assetsignore` keeps source and config files off the website.

## 1. Connect the Worker to GitHub

Cloudflare dashboard → Workers & Pages → `stampcheck` → Settings → Builds → Connect → GitHub → `eosyam/stampcheck`, branch `main`. Leave the build command empty and the deploy command as `npx wrangler deploy`. Every push to `main` deploys.

## 2. Secrets

`stampcheck` → Settings → Variables and Secrets → Add → type **Secret** (enter the values in the dashboard; never commit them):

| Name | Where to get it |
|---|---|
| `POLAR_ACCESS_TOKEN` | Polar → Settings → Developers → New token. Scopes: `checkouts:read`, `customers:read`, `license_keys:read` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys. Set a monthly spend limit there too. |

Plain variables (`POLAR_ORG_ID`, `POLAR_SERVER`, `ANTHROPIC_MODEL`) live in `wrangler.toml`; don't add them in the dashboard (plain dashboard values are replaced on every deploy, and a secret with one of these names breaks the setting).

Check: `https://stampcheck.<your-subdomain>.workers.dev/api/fix` should return `{"ai":true}`.

## 3. Move the domain

1. `stampcheck` → Settings → Domains & Routes → Add → Custom domain → `getstampcheck.com` (and `www.getstampcheck.com` if used). The domain's DNS must be on Cloudflare: add the site to Cloudflare and switch the nameservers at your registrar when asked.
2. Once `https://getstampcheck.com/api/fix` returns `{"ai":true}`, turn off GitHub Pages: repo Settings → Pages → Unpublish. The `CNAME` file can then be deleted.

## 4. Test a purchase

Polar's success URL points at `getstampcheck.com`, so test after step 3. Create a 100% discount code in Polar, buy the fix pack with it, and check that you land back on the site, the key is picked up by itself and the fix runs.

## Local development

`npx wrangler dev` serves the site and API on http://localhost:8787. Put local secrets in `.dev.vars` (git-ignored).

## Notes

- If `/api` isn't reachable (e.g. plain static hosting), the page falls back to browser-only fixes and asks buyers to paste their key.
- Email HTML sent to `/api/fix` is used for that request only and isn't stored or logged.
