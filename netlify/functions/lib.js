const Airtable = require("airtable");
const jwt = require("jsonwebtoken");

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const JWT_SECRET = process.env.JWT_SECRET;

function getBase() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new HttpError(500, "Le serveur n'est pas configuré (AIRTABLE_API_KEY / AIRTABLE_BASE_ID manquants).");
  }
  return new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(status, body) {
  return {
    statusCode: status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function escapeFormulaString(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function signToken(userId) {
  if (!JWT_SECRET) throw new HttpError(500, "Le serveur n'est pas configuré (JWT_SECRET manquant).");
  return jwt.sign({ uid: userId }, JWT_SECRET, { expiresIn: "180d" });
}

function requireAuth(event) {
  const header = event.headers.authorization || event.headers.Authorization || "";
  const match = /^Bearer (.+)$/.exec(header);
  if (!match) throw new HttpError(401, "Authentification requise.");
  if (!JWT_SECRET) throw new HttpError(500, "Le serveur n'est pas configuré (JWT_SECRET manquant).");
  try {
    return jwt.verify(match[1], JWT_SECRET).uid;
  } catch {
    throw new HttpError(401, "Session invalide ou expirée.");
  }
}

function subpath(event) {
  const p = event.path.replace(/^\/(\.netlify\/functions\/api|api)/, "");
  return p === "" ? "/" : p;
}

async function readBody(event) {
  if (!event.body) return {};
  try {
    return JSON.parse(event.body);
  } catch {
    throw new HttpError(400, "Corps de requête JSON invalide.");
  }
}

module.exports = {
  getBase,
  HttpError,
  json,
  escapeFormulaString,
  signToken,
  requireAuth,
  subpath,
  readBody,
};
