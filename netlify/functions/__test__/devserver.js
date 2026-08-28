// Local dev server for end-to-end testing: serves the Expo web export from
// dist/ and proxies /api/* to the real netlify/functions/api.js handler,
// backed by the in-memory fake Airtable (see fakeAirtable.js) since no live
// Airtable credentials are available in this sandbox.
const http = require("http");
const fs = require("fs");
const path = require("path");
const Module = require("module");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "airtable") return path.join(__dirname, "fakeAirtable.js");
  return originalResolve.call(this, request, ...args);
};

process.env.AIRTABLE_API_KEY = "test-key";
process.env.AIRTABLE_BASE_ID = "appTEST";
process.env.JWT_SECRET = "test-secret-not-for-prod";

const { handler } = require("../api");

const DIST = path.join(__dirname, "../../../dist");
const PORT = process.argv[2] ? Number(process.argv[2]) : 8095;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".json": "application/json",
};

function serveStatic(req, res) {
  let filePath = path.join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (req.url === "/" || !path.extname(filePath)) filePath = path.join(DIST, "index.html");
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      const body = chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined;
      const event = { httpMethod: req.method, path: req.url.split("?")[0], headers: req.headers, body };
      try {
        const result = await handler(event);
        res.writeHead(result.statusCode, result.headers || {});
        res.end(result.body || "");
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: String(e) }));
      }
    });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, () => console.log(`dev server on http://localhost:${PORT}`));
