// Local-only HCP fixture. No live credentials or provider connections.
import { createServer } from "node:http";
let fail = false;
const receipts = [];
createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  let body;
  try {
    body = JSON.parse(raw || "{}");
  } catch {
    body = {};
  }
  res.setHeader("content-type", "application/json");
  if (req.url === "/receipts") return res.end(JSON.stringify(receipts));
  if (req.url === "/mode" && req.method === "POST") {
    fail = Boolean(body.fail);
    return res.end(JSON.stringify({ fail }));
  }
  receipts.push({ method: req.method, path: req.url, body });
  if (fail) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: "Local test failure" }));
  }
  res.end(
    JSON.stringify({
      id: req.url?.startsWith("/customers")
        ? "local-test-customer"
        : "local-test-lead",
    }),
  );
}).listen(4174, "127.0.0.1", () =>
  console.log(
    "Local preview provider at 127.0.0.1:4174; receipts at /receipts",
  ),
);
