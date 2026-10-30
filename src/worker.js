// Cloudflare Worker: serves the static site and the two API routes.
// Static files come from the repo root (see wrangler.toml and .assetsignore); only /api/* runs this code first.
import * as claim from "./claim.js";
import * as fix from "./fix.js";

const routes = {
  "/api/claim": { POST: (req, env) => claim.handlePost(req, env) },
  "/api/fix": { GET: (req, env) => fix.handleGet(env), POST: (req, env) => fix.handlePost(req, env) },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = routes[url.pathname];
    if (route) {
      const handler = route[request.method];
      if (handler) return handler(request, env);
      return new Response("Method not allowed", { status: 405, headers: { Allow: Object.keys(route).join(", ") } });
    }
    if (url.pathname.startsWith("/api/")) return new Response("Not found", { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
