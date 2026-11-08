// Vercel serverless relay for IntaSend API calls
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  if (!process.env.RELAY_SECRET || req.headers["x-relay-secret"] !== process.env.RELAY_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { path, body } = req.body || {};
  const allowed = [
    "/api/v1/payment/mpesa-stk-push/",
    "/api/v1/payment/status/",
  ];
  if (!allowed.includes(path)) return res.status(400).json({ error: "Path not allowed" });

  const secret = process.env.INTASEND_SECRET_KEY;
  if (!secret) return res.status(500).json({ error: "INTASEND_SECRET_KEY not set on relay" });

  const base = String(process.env.INTASEND_ENVIRONMENT || "").toLowerCase() === "production"
    ? "https://payment.intasend.com"
    : "https://sandbox.intasend.com";

  try {
    const r = await fetch(base + path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    const raw = await r.text();
    res.status(r.status).setHeader("Content-Type", "application/json").send(raw);
  } catch (e) {
    res.status(502).json({ error: "Relay failed: " + (e?.message || e) });
  }
}
