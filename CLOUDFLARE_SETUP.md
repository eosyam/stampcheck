# Hosting on Cloudflare Pages

The site is static (`index.html`) plus two small server functions in `functions/api/`:

- `POST /api/claim` – after Polar checkout, looks up the buyer's license key so they don't have to copy it.
- `GET|POST /api/fix` – fixes what the browser can't, using Claude, and charges one fix from the license.

## 1. Create the Pages project

Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `eosyam/stampcheck`.

- Production branch: `main`
- Framework preset: None, build command: empty, output directory: `.` (also set in `wrangler.toml`)

Every push to `main` deploys, like GitHub Pages did.

## 2. Secrets

Project → Settings → Variables and Secrets → Production → add as **Secret** (type them in the dashboard; never commit them):

| Name | Where to get it |
|---|---|
| `POLAR_ACCESS_TOKEN` | Polar → Settings → Developers → New token. Scopes: `checkouts:read`, `customers:read`, `license_keys:read` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys. Set a monthly spend limit there too. |

Plain variables (`POLAR_ORG_ID`, `POLAR_SERVER`, `ANTHROPIC_MODEL`) live in `wrangler.toml`. Redeploy after adding secrets.

Check: `https://<project>.pages.dev/api/fix` should return `{"ai":true}`.

## 3. Move the domain

1. Pages project → Custom domains → add `getstampcheck.com` (and `www` if used). For the apex domain Cloudflare needs to manage the DNS: add the site to Cloudflare and switch the nameservers at your registrar when asked.
2. Once `https://getstampcheck.com/api/fix` returns `{"ai":true}`, turn off GitHub Pages: repo Settings → Pages → Unpublish. The `CNAME` file can then be deleted.

## 4. Test a purchase

Polar's success URL points at `getstampcheck.com`, so test after step 3. Create a 100% discount code in Polar, buy the fix pack with it, and check that you land back on the site, the key is picked up by itself and the fix runs.

## Notes

- If `/api` isn't reachable (e.g. plain static hosting), the page falls back to browser-only fixes and asks buyers to paste their key.
- Email HTML sent to `/api/fix` is used for that request only and isn't stored or logged by the function.
