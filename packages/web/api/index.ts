// @ts-nocheck
process.env.NODE_ENV = process.env.NODE_ENV || "production";

export default async function handler(req, res) {
  try {
    const { default: app } = await import("../src/api/index.js");

    const host = req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = new URL(req.url, `${proto}://${host}`);

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val) headers.set(key, Array.isArray(val) ? val.join(", ") : val);
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let body = undefined;
    if (hasBody) {
      body = await new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(data));
      });
    }

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body: hasBody && body ? body : undefined,
    });

    const response = await app.fetch(request);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await response.text());
  } catch (err) {
    console.error("API Error:", err?.message, err?.stack);
    res.status(500).json({ 
      error: "Internal server error", 
      message: err?.message,
      env_check: {
        has_db_url: !!process.env.DATABASE_URL,
        has_db_token: !!process.env.DATABASE_AUTH_TOKEN,
        has_steam_key: !!process.env.STEAM_API_KEY,
        has_invite_code: !!process.env.INVITE_CODE,
      }
    });
  }
}
