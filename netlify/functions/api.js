const bcrypt = require("bcryptjs");
const { getBase, HttpError, json, escapeFormulaString, signToken, requireAuth, subpath, readBody } = require("./lib");

const TABLES = { USERS: "Users", DAILIES: "Dailies", GOALS: "Goals", CHECKINS: "Checkins" };
const SALT_ROUNDS = 10;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function serializeUser(record) {
  return { name: record.get("Name") || "", email: record.get("Email") || "" };
}

function serializeDaily(record) {
  return {
    id: record.id,
    label: record.get("Label") || "",
    target: record.get("Target") || "à définir",
    createdDate: record.get("CreatedDate") || todayKey(),
  };
}

function serializeGoal(record) {
  return {
    id: record.id,
    label: record.get("Label") || "",
    target: record.get("Target") || "cible à chiffrer",
    pct: record.get("Pct") || 0,
  };
}

function buildHistory(checkinRecords) {
  const history = {};
  for (const rec of checkinRecords) {
    const date = rec.get("Date");
    const dailyId = rec.get("DailyId");
    const done = !!rec.get("Done");
    if (!date || !dailyId) continue;
    if (!history[date]) history[date] = {};
    history[date][dailyId] = done;
  }
  return history;
}

async function findUserByEmail(base, email) {
  const records = await base(TABLES.USERS)
    .select({ filterByFormula: `LOWER({Email}) = "${escapeFormulaString(email.toLowerCase())}"`, maxRecords: 1 })
    .firstPage();
  return records[0] || null;
}

async function findRecordOwnedByUser(base, table, recordId, uid, errorMessage) {
  let record;
  try {
    record = await base(table).find(recordId);
  } catch {
    throw new HttpError(404, "Introuvable.");
  }
  if (record.get("UserId") !== uid) throw new HttpError(403, errorMessage || "Accès refusé.");
  return record;
}

async function fetchFullState(base, uid) {
  const [userRecord, dailyRecords, goalRecords, checkinRecords] = await Promise.all([
    base(TABLES.USERS).find(uid),
    base(TABLES.DAILIES).select({ filterByFormula: `{UserId} = "${uid}"` }).all(),
    base(TABLES.GOALS).select({ filterByFormula: `{UserId} = "${uid}"` }).all(),
    base(TABLES.CHECKINS).select({ filterByFormula: `{UserId} = "${uid}"` }).all(),
  ]);
  return {
    user: serializeUser(userRecord),
    cycleStartDate: userRecord.get("CycleStartDate") || null,
    sworn: !!userRecord.get("Sworn"),
    dailies: dailyRecords.map(serializeDaily),
    goals: goalRecords.map(serializeGoal),
    history: buildHistory(checkinRecords),
  };
}

// Airtable's create()/destroy() accept at most 10 records per call.
async function createInChunks(table, rows) {
  const out = [];
  for (let i = 0; i < rows.length; i += 10) {
    const chunk = await table.create(rows.slice(i, i + 10));
    out.push(...chunk);
  }
  return out;
}

async function destroyInChunks(table, ids) {
  for (let i = 0; i < ids.length; i += 10) {
    await table.destroy(ids.slice(i, i + 10));
  }
}

async function handleSignup(base, event) {
  const body = await readBody(event);
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const dailies = Array.isArray(body.dailies) ? body.dailies : [];
  const goals = Array.isArray(body.goals) ? body.goals : [];

  if (!name) throw new HttpError(400, "Le nom est requis.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Adresse e-mail invalide.");
  if (password.length < 6) throw new HttpError(400, "Le mot de passe doit contenir au moins 6 caractères.");

  const existing = await findUserByEmail(base, email);
  if (existing) throw new HttpError(409, "Un compte existe déjà avec cette adresse e-mail.");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const today = todayKey();

  const [userRecord] = await base(TABLES.USERS).create([
    { fields: { Email: email, Name: name, PasswordHash: passwordHash, CycleStartDate: today, Sworn: true } },
  ]);
  const uid = userRecord.id;

  const dailyRecords = dailies.length
    ? await createInChunks(
        base(TABLES.DAILIES),
        dailies
          .filter((d) => d && String(d.label || "").trim())
          .map((d) => ({
            fields: {
              Label: String(d.label).trim(),
              Target: String(d.target || "à définir").trim(),
              CreatedDate: today,
              User: [uid],
              UserId: uid,
            },
          }))
      )
    : [];

  const goalRecords = goals.length
    ? await createInChunks(
        base(TABLES.GOALS),
        goals
          .filter((g) => g && String(g.label || "").trim())
          .map((g) => ({
            fields: {
              Label: String(g.label).trim(),
              Target: String(g.target || "cible à chiffrer").trim(),
              Pct: 0,
              User: [uid],
              UserId: uid,
            },
          }))
      )
    : [];

  return json(201, {
    token: signToken(uid),
    user: { name, email },
    cycleStartDate: today,
    sworn: true,
    dailies: dailyRecords.map(serializeDaily),
    goals: goalRecords.map(serializeGoal),
    history: {},
  });
}

async function handleLogin(base, event) {
  const body = await readBody(event);
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  const userRecord = await findUserByEmail(base, email);
  if (!userRecord) throw new HttpError(401, "E-mail ou mot de passe incorrect.");

  const match = await bcrypt.compare(password, userRecord.get("PasswordHash") || "");
  if (!match) throw new HttpError(401, "E-mail ou mot de passe incorrect.");

  const state = await fetchFullState(base, userRecord.id);
  return json(200, { token: signToken(userRecord.id), ...state });
}

async function handleMe(base, event) {
  const uid = requireAuth(event);
  const state = await fetchFullState(base, uid);
  return json(200, state);
}

async function handleCreateDaily(base, event) {
  const uid = requireAuth(event);
  const body = await readBody(event);
  const label = String(body.label || "").trim();
  if (!label) throw new HttpError(400, "Le libellé est requis.");
  const [record] = await base(TABLES.DAILIES).create([
    {
      fields: {
        Label: label,
        Target: String(body.target || "à définir").trim(),
        CreatedDate: todayKey(),
        User: [uid],
        UserId: uid,
      },
    },
  ]);
  return json(201, serializeDaily(record));
}

async function handleUpdateDaily(base, event, id) {
  const uid = requireAuth(event);
  await findRecordOwnedByUser(base, TABLES.DAILIES, id, uid);
  const body = await readBody(event);
  const fields = {};
  if (typeof body.label === "string") fields.Label = body.label;
  if (typeof body.target === "string") fields.Target = body.target;
  const [record] = await base(TABLES.DAILIES).update([{ id, fields }]);
  return json(200, serializeDaily(record));
}

async function handleDeleteDaily(base, event, id) {
  const uid = requireAuth(event);
  await findRecordOwnedByUser(base, TABLES.DAILIES, id, uid);
  await base(TABLES.DAILIES).destroy([id]);
  return json(200, { ok: true });
}

async function handleCreateGoal(base, event) {
  const uid = requireAuth(event);
  const body = await readBody(event);
  const label = String(body.label || "").trim();
  if (!label) throw new HttpError(400, "Le libellé est requis.");
  const [record] = await base(TABLES.GOALS).create([
    {
      fields: {
        Label: label,
        Target: String(body.target || "cible à chiffrer").trim(),
        Pct: 0,
        User: [uid],
        UserId: uid,
      },
    },
  ]);
  return json(201, serializeGoal(record));
}

async function handleUpdateGoal(base, event, id) {
  const uid = requireAuth(event);
  await findRecordOwnedByUser(base, TABLES.GOALS, id, uid);
  const body = await readBody(event);
  const fields = {};
  if (typeof body.label === "string") fields.Label = body.label;
  if (typeof body.target === "string") fields.Target = body.target;
  if (typeof body.pct === "number") fields.Pct = body.pct;
  const [record] = await base(TABLES.GOALS).update([{ id, fields }]);
  return json(200, serializeGoal(record));
}

async function handleDeleteGoal(base, event, id) {
  const uid = requireAuth(event);
  await findRecordOwnedByUser(base, TABLES.GOALS, id, uid);
  await base(TABLES.GOALS).destroy([id]);
  return json(200, { ok: true });
}

async function handleUpsertCheckin(base, event) {
  const uid = requireAuth(event);
  const body = await readBody(event);
  const dailyId = String(body.dailyId || "");
  const date = String(body.date || "");
  const done = !!body.done;
  if (!dailyId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, "dailyId et date (YYYY-MM-DD) requis.");

  await findRecordOwnedByUser(base, TABLES.DAILIES, dailyId, uid, "Cet objectif ne t'appartient pas.");

  const existing = await base(TABLES.CHECKINS)
    .select({
      filterByFormula: `AND({UserId} = "${uid}", {DailyId} = "${dailyId}", {Date} = "${date}")`,
      maxRecords: 1,
    })
    .firstPage();

  if (existing[0]) {
    await base(TABLES.CHECKINS).update([{ id: existing[0].id, fields: { Done: done } }]);
  } else {
    await base(TABLES.CHECKINS).create([
      { fields: { Date: date, Done: done, User: [uid], UserId: uid, Daily: [dailyId], DailyId: dailyId } },
    ]);
  }
  return json(200, { ok: true });
}

async function handleUpdateUser(base, event) {
  const uid = requireAuth(event);
  const body = await readBody(event);
  const fields = {};
  if (typeof body.name === "string" && body.name.trim()) fields.Name = body.name.trim();
  if (typeof body.email === "string" && body.email.trim()) {
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, "Adresse e-mail invalide.");
    const existing = await findUserByEmail(base, email);
    if (existing && existing.id !== uid) throw new HttpError(409, "Cette adresse e-mail est déjà utilisée.");
    fields.Email = email;
  }
  if (Object.keys(fields).length === 0) throw new HttpError(400, "Rien à mettre à jour.");
  const [record] = await base(TABLES.USERS).update([{ id: uid, fields }]);
  return json(200, serializeUser(record));
}

async function handleStartCycle(base, event) {
  const uid = requireAuth(event);
  const body = await readBody(event);
  const dailies = Array.isArray(body.dailies) ? body.dailies : [];
  const goals = Array.isArray(body.goals) ? body.goals : [];
  const today = todayKey();

  await base(TABLES.USERS).update([{ id: uid, fields: { CycleStartDate: today, Sworn: true } }]);

  const dailyRecords = dailies.length
    ? await createInChunks(
        base(TABLES.DAILIES),
        dailies
          .filter((d) => d && String(d.label || "").trim())
          .map((d) => ({
            fields: {
              Label: String(d.label).trim(),
              Target: String(d.target || "à définir").trim(),
              CreatedDate: today,
              User: [uid],
              UserId: uid,
            },
          }))
      )
    : [];

  const goalRecords = goals.length
    ? await createInChunks(
        base(TABLES.GOALS),
        goals
          .filter((g) => g && String(g.label || "").trim())
          .map((g) => ({
            fields: { Label: String(g.label).trim(), Target: String(g.target || "cible à chiffrer").trim(), Pct: 0, User: [uid], UserId: uid },
          }))
      )
    : [];

  return json(200, {
    cycleStartDate: today,
    sworn: true,
    dailies: dailyRecords.map(serializeDaily),
    goals: goalRecords.map(serializeGoal),
    history: {},
  });
}

async function handleReset(base, event) {
  const uid = requireAuth(event);
  const [dailyIds, goalIds, checkinIds] = await Promise.all([
    base(TABLES.DAILIES).select({ filterByFormula: `{UserId} = "${uid}"`, fields: [] }).all().then((r) => r.map((x) => x.id)),
    base(TABLES.GOALS).select({ filterByFormula: `{UserId} = "${uid}"`, fields: [] }).all().then((r) => r.map((x) => x.id)),
    base(TABLES.CHECKINS).select({ filterByFormula: `{UserId} = "${uid}"`, fields: [] }).all().then((r) => r.map((x) => x.id)),
  ]);
  await Promise.all([
    destroyInChunks(base(TABLES.DAILIES), dailyIds),
    destroyInChunks(base(TABLES.GOALS), goalIds),
    destroyInChunks(base(TABLES.CHECKINS), checkinIds),
  ]);
  await base(TABLES.USERS).update([{ id: uid, fields: { CycleStartDate: null, Sworn: false } }]);
  return json(200, { ok: true });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204, {});

  const path = subpath(event);
  const method = event.httpMethod;

  try {
    const base = getBase();
    if (method === "POST" && path === "/auth/signup") return await handleSignup(base, event);
    if (method === "POST" && path === "/auth/login") return await handleLogin(base, event);
    if (method === "GET" && path === "/me") return await handleMe(base, event);
    if (method === "PATCH" && path === "/user") return await handleUpdateUser(base, event);
    if (method === "POST" && path === "/cycle/start") return await handleStartCycle(base, event);
    if (method === "POST" && path === "/reset") return await handleReset(base, event);
    if (method === "POST" && path === "/dailies") return await handleCreateDaily(base, event);
    if (method === "POST" && path === "/goals") return await handleCreateGoal(base, event);
    if (method === "PUT" && path === "/checkins") return await handleUpsertCheckin(base, event);

    const dailyMatch = /^\/dailies\/([^/]+)$/.exec(path);
    if (dailyMatch && method === "PATCH") return await handleUpdateDaily(base, event, dailyMatch[1]);
    if (dailyMatch && method === "DELETE") return await handleDeleteDaily(base, event, dailyMatch[1]);

    const goalMatch = /^\/goals\/([^/]+)$/.exec(path);
    if (goalMatch && method === "PATCH") return await handleUpdateGoal(base, event, goalMatch[1]);
    if (goalMatch && method === "DELETE") return await handleDeleteGoal(base, event, goalMatch[1]);

    return json(404, { error: "Route inconnue." });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error(err);
    return json(500, { error: "Erreur serveur inattendue." });
  }
};
