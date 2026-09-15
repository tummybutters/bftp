// Public links contain only an opaque random token, never customer information.
const TOKEN = /^[A-Za-z0-9_-]{32}$/;
const BACKEND = "https://bftp.teamqortana.com/api/review-links/";
const HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function reviewRedirect(request: Request, token: string, fetcher: typeof fetch = fetch) {
  if (!TOKEN.test(token)) return new Response(null, { status: 404, headers: HEADERS });
  try {
    const upstream = await fetcher(BACKEND + token, {
      method: request.method === "HEAD" ? "HEAD" : "GET",
      headers: {
        "user-agent": request.headers.get("user-agent") || "",
        "purpose": request.headers.get("purpose") || "",
        "sec-purpose": request.headers.get("sec-purpose") || "",
      },
      redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(5000),
    });
    if (upstream.status === 404) return new Response(null, { status: 404, headers: HEADERS });
    if (upstream.status !== 200) throw new Error("Tracking unavailable");
    const destination = upstream.headers.get("location");
    if (!destination) throw new Error("Missing destination");
    const url = new URL(destination);
    if (url.protocol !== "https:" || url.hostname !== "www.google.com" || url.port || url.username || url.password
      || !(url.pathname.startsWith("/maps/place/") || url.pathname === "/search")) {
      throw new Error("Invalid review destination");
    }
    // Await the durable write before redirecting: never silently lose a click.
    return new Response(null, { status: 302, headers: { ...HEADERS, Location: url.href } });
  } catch {
    // No guessed region, generic review link, or unrecorded successful redirect.
    return new Response(request.method === "HEAD" ? null : "This review link is temporarily unavailable. Please try again shortly.", {
      status: 503, headers: { ...HEADERS, "Retry-After": "30" },
    });
  }
}
