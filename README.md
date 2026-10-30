# Stampcheck

Free email HTML checker: https://getstampcheck.com

Paste an email's HTML and see what breaks in Gmail, Outlook, Apple Mail and on phones before you send. Checks run in the browser; nothing is uploaded.

Paid automatic fixes are sold through Polar. Simple fixes run in the browser; the rest are made by Claude through `src/fix.js`. Hosting and secrets: see [CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md).

## Files

- `index.html` – the whole app in one file (editor, checks, previews, fonts)
- `og.png` – social sharing image
- `robots.txt`, `sitemap.xml` – search engine files
- `src/` – Cloudflare Worker: `worker.js` (routes), `claim.js` (license key after checkout), `fix.js` (AI fixes)
- `wrangler.toml`, `.assetsignore` – Cloudflare Worker settings
- `CNAME` – custom domain for GitHub Pages (remove after moving to Cloudflare)
