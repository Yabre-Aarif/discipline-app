// Minimal in-memory stand-in for the `airtable` npm package, matching just
// the surface api.js/lib.js use: base(table).select({filterByFormula}).all()
// /.firstPage(), .find(id), .create([...]), .update([...]), .destroy([...]).
// Good enough to exercise the real routing/validation/business logic in
// api.js without a live Airtable connection.

let counter = 0;
function makeId() {
  counter += 1;
  return "rec" + String(counter).padStart(14, "0");
}

class FakeRecord {
  constructor(id, fields) {
    this.id = id;
    this._fields = fields;
  }
  get(field) {
    return this._fields[field];
  }
}

class FakeTable {
  constructor(store) {
    this.store = store; // Map<id, fields>
  }

  select({ filterByFormula } = {}) {
    const rows = () =>
      [...this.store.entries()]
        .filter(([, fields]) => matchFormula(filterByFormula, fields))
        .map(([id, fields]) => new FakeRecord(id, fields));
    return {
      all: () => Promise.resolve(rows()),
      firstPage: () => Promise.resolve(rows()),
    };
  }

  find(id) {
    if (!this.store.has(id)) return Promise.reject(new Error("NOT_FOUND"));
    return Promise.resolve(new FakeRecord(id, this.store.get(id)));
  }

  create(records) {
    const created = records.map(({ fields }) => {
      const id = makeId();
      this.store.set(id, { ...fields });
      return new FakeRecord(id, this.store.get(id));
    });
    return Promise.resolve(created);
  }

  update(records) {
    const updated = records.map(({ id, fields }) => {
      const existing = this.store.get(id) || {};
      const merged = { ...existing, ...fields };
      this.store.set(id, merged);
      return new FakeRecord(id, merged);
    });
    return Promise.resolve(updated);
  }

  destroy(ids) {
    ids.forEach((id) => this.store.delete(id));
    return Promise.resolve(ids.map((id) => ({ id })));
  }
}

// Supports exactly the formula shapes api.js generates:
//   {Field} = "value"
//   LOWER({Field}) = "value"
//   AND({A} = "x", {B} = "y", {C} = "z")
function matchFormula(formula, fields) {
  if (!formula) return true;
  const andMatch = /^AND\((.+)\)$/.exec(formula);
  if (andMatch) {
    const parts = splitTopLevelCommas(andMatch[1]);
    return parts.every((p) => matchFormula(p.trim(), fields));
  }
  const eqMatch = /^(LOWER\()?\{([^}]+)\}\)?\s*=\s*"((?:[^"\\]|\\.)*)"$/.exec(formula.trim());
  if (eqMatch) {
    const [, lower, field, rawValue] = eqMatch;
    const value = rawValue.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const actual = fields[field];
    if (lower) return String(actual || "").toLowerCase() === value;
    return actual === value;
  }
  throw new Error("fakeAirtable: unsupported formula shape: " + formula);
}

function splitTopLevelCommas(s) {
  const out = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

const tableStores = new Map(); // tableName -> Map<id, fields>

function tableAccessor(tableName) {
  if (!tableStores.has(tableName)) tableStores.set(tableName, new Map());
  return new FakeTable(tableStores.get(tableName));
}

// Real API: new Airtable({apiKey}).base(baseId) -> function(tableName) -> Table
function Airtable() {
  return {
    base() {
      return tableAccessor;
    },
  };
}

module.exports = Airtable;
module.exports.__reset = () => tableStores.clear();
