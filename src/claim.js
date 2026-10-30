// POST /api/claim  { checkout_id }  ->  { key, usage, limit_usage }
// Called right after Polar redirects a buyer back, so they get their license key without copying it from an email.
// Only the buyer has the checkout id (it's in their redirect URL), so it works as a one-time claim ticket.

const polarApi = (env) => (env.POLAR_SERVER === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh");
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function handlePost(request, env) {
  if (!env.POLAR_ACCESS_TOKEN) return json({ error: "not_configured" }, 503);
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: "bad_request" }, 400); }
  const id = String((body && body.checkout_id) || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return json({ error: "bad_request" }, 400);

  const headers = { Authorization: `Bearer ${env.POLAR_ACCESS_TOKEN}`, Accept: "application/json" };
  const get = async (path) => {
    const r = await fetch(polarApi(env) + path, { headers });
    if (!r.ok) { const e = new Error(path); e.status = r.status; throw e; }
    return r.json();
  };

  try {
    const checkout = await get(`/v1/checkouts/${id}`);
    // Payment can take a few seconds to settle after the redirect; the page polls until it does.
    if (checkout.status !== "succeeded" || !checkout.customer_id) return json({ pending: true, status: checkout.status }, 202);

    const customer = await get(`/v1/customers/${checkout.customer_id}/state`);
    const grants = (customer.granted_benefits || []).filter((g) => g.benefit_type === "license_keys" && g.properties && g.properties.license_key_id);
    if (!grants.length) return json({ pending: true, status: "granting" }, 202);

    // Prefer the key that belongs to the product just bought, then the newest one.
    const bought = new Set(((checkout.product && checkout.product.benefits) || []).map((b) => b.id));
    const time = (g) => Date.parse(g.granted_at || g.created_at || 0) || 0;
    grants.sort((a, b) => (bought.has(b.benefit_id) - bought.has(a.benefit_id)) || time(b) - time(a));

    const lk = await get(`/v1/license-keys/${grants[0].properties.license_key_id}`);
    return json({ key: lk.key, usage: lk.usage, limit_usage: lk.limit_usage });
  } catch (e) {
    if (e.status === 404) return json({ error: "not_found" }, 404);
    return json({ error: "upstream", status: e.status || 0 }, 502);
  }
}
