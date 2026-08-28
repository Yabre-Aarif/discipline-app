const Module = require("module");
const path = require("path");

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "airtable") return path.join(__dirname, "fakeAirtable.js");
  return originalResolve.call(this, request, ...args);
};

process.env.AIRTABLE_API_KEY = "test-key";
process.env.AIRTABLE_BASE_ID = "appTEST";
process.env.JWT_SECRET = "test-secret-not-for-prod";

const fakeAirtable = require("./fakeAirtable");
const { handler } = require("../api");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed += 1;
  } else {
    failed += 1;
    console.error("FAIL:", msg);
  }
}

function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return handler({
    httpMethod: method,
    path: `/api${path}`,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then((res) => ({ ...res, json: JSON.parse(res.body) }));
}

async function main() {
  // --- signup ---
  let res = await call("POST", "/auth/signup", {
    body: {
      name: "Youssef",
      email: "Youssef@Mail.com",
      password: "secret123",
      dailies: [{ label: "Prière du Fajr", target: "avant 6:00" }, { label: "Sport" }],
      goals: [{ label: "Lire 10 livres", target: "10 livres" }],
    },
  });
  assert(res.statusCode === 201, "signup returns 201, got " + res.statusCode + " " + res.body);
  assert(!!res.json.token, "signup returns a token");
  assert(res.json.user.email === "youssef@mail.com", "email normalized to lowercase");
  assert(res.json.dailies.length === 2, "both dailies created");
  assert(res.json.goals.length === 1, "goal created");
  assert(res.json.sworn === true, "sworn true after signup");
  assert(!!res.json.cycleStartDate, "cycleStartDate set");
  const token = res.json.token;
  const dailyId = res.json.dailies[0].id;
  const goalId = res.json.goals[0].id;

  // duplicate signup should fail
  res = await call("POST", "/auth/signup", { body: { name: "X", email: "youssef@mail.com", password: "secret123" } });
  assert(res.statusCode === 409, "duplicate signup rejected, got " + res.statusCode);

  // weak password rejected
  res = await call("POST", "/auth/signup", { body: { name: "X", email: "new@mail.com", password: "abc" } });
  assert(res.statusCode === 400, "short password rejected");

  // --- login ---
  res = await call("POST", "/auth/login", { body: { email: "youssef@mail.com", password: "wrong" } });
  assert(res.statusCode === 401, "wrong password rejected");

  res = await call("POST", "/auth/login", { body: { email: "YOUSSEF@mail.com", password: "secret123" } });
  assert(res.statusCode === 200, "login ok, got " + res.statusCode + " " + res.body);
  assert(res.json.dailies.length === 2, "login returns dailies");
  assert(res.json.history && typeof res.json.history === "object", "login returns history object");

  // --- auth required ---
  res = await call("GET", "/me", {});
  assert(res.statusCode === 401, "me without token rejected");

  res = await call("GET", "/me", { token });
  assert(res.statusCode === 200, "me with token ok");

  // --- daily CRUD ---
  res = await call("POST", "/dailies", { token, body: { label: "Lecture", target: "20 pages" } });
  assert(res.statusCode === 201, "create daily ok");
  const newDailyId = res.json.id;

  res = await call("PATCH", `/dailies/${newDailyId}`, { token, body: { label: "Lecture du soir" } });
  assert(res.statusCode === 200 && res.json.label === "Lecture du soir", "rename daily ok");

  // ownership check: a different (fake) token/user cannot touch this record
  const otherSignup = await call("POST", "/auth/signup", { body: { name: "Autre", email: "autre@mail.com", password: "secret123" } });
  res = await call("PATCH", `/dailies/${newDailyId}`, { token: otherSignup.json.token, body: { label: "hack" } });
  assert(res.statusCode === 403, "cross-user daily edit rejected, got " + res.statusCode);

  res = await call("DELETE", `/dailies/${newDailyId}`, { token });
  assert(res.statusCode === 200, "delete daily ok");

  // --- goal CRUD ---
  res = await call("PATCH", `/goals/${goalId}`, { token, body: { target: "10 livres · 3 lus" } });
  assert(res.statusCode === 200 && res.json.target === "10 livres · 3 lus", "update goal ok");

  // --- checkins ---
  res = await call("PUT", "/checkins", { token, body: { dailyId, date: "2026-08-28", done: true } });
  assert(res.statusCode === 200, "checkin upsert ok");

  res = await call("GET", "/me", { token });
  assert(res.json.history["2026-08-28"]?.[dailyId] === true, "checkin reflected in /me history");

  // toggle off (upsert should update, not duplicate)
  res = await call("PUT", "/checkins", { token, body: { dailyId, date: "2026-08-28", done: false } });
  res = await call("GET", "/me", { token });
  assert(res.json.history["2026-08-28"]?.[dailyId] === false, "checkin toggle-off reflected, no dupe row");

  // checking a daily that isn't yours
  res = await call("PUT", "/checkins", { token: otherSignup.json.token, body: { dailyId, date: "2026-08-28", done: true } });
  assert(res.statusCode === 403, "cross-user checkin rejected, got " + res.statusCode);

  // --- profile update ---
  res = await call("PATCH", "/user", { token, body: { name: "Youssef B." } });
  assert(res.statusCode === 200 && res.json.name === "Youssef B.", "profile name update ok");

  res = await call("PATCH", "/user", { token, body: { email: "autre@mail.com" } });
  assert(res.statusCode === 409, "profile email collision rejected, got " + res.statusCode);

  // --- reset + restart cycle ---
  res = await call("POST", "/reset", { token });
  assert(res.statusCode === 200, "reset ok");

  res = await call("GET", "/me", { token });
  assert(res.json.dailies.length === 0 && res.json.goals.length === 0, "reset cleared dailies/goals");
  assert(res.json.cycleStartDate === null, "reset cleared cycleStartDate");
  assert(Object.keys(res.json.history).length === 0, "reset cleared checkins");

  res = await call("POST", "/cycle/start", {
    token,
    body: { dailies: [{ label: "Nouveau départ" }], goals: [{ label: "Nouvel objectif" }] },
  });
  assert(res.statusCode === 200, "cycle/start ok, got " + res.statusCode + " " + res.body);
  assert(res.json.dailies.length === 1 && res.json.goals.length === 1, "cycle/start created fresh records");
  assert(!!res.json.cycleStartDate, "cycle/start set cycleStartDate");

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("CRASH:", e);
  process.exit(1);
});
