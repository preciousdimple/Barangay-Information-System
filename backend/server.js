const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 8080;
const DB_NAME = process.env.DB_NAME || "bis_db";
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
};

app.use(cors());
app.use(express.json({ limit: "1mb" }));

let pool;

const RESOURCES = {
  residents: {
    table: "residents",
    search: ["firstName", "lastName", "address", "purok", "contactNumber"],
    fields: {
      firstName: { type: "string", required: true },
      middleName: { type: "string", default: "" },
      lastName: { type: "string", required: true },
      suffix: { type: "string", default: "" },
      birthdate: { type: "date", required: true },
      sex: { type: "enum", values: ["Male", "Female"], required: true },
      civilStatus: { type: "enum", values: ["Single", "Married", "Widowed", "Separated"], default: "Single" },
      address: { type: "string", required: true },
      purok: { type: "string", default: "" },
      contactNumber: { type: "string", default: "" },
      occupation: { type: "string", default: "" },
      voterStatus: { type: "enum", values: ["Registered", "Not Registered"], default: "Not Registered" },
      householdId: { type: "int", nullable: true },
      status: { type: "enum", values: ["Active", "Transferred", "Deceased"], default: "Active" },
    },
  },
  households: {
    table: "households",
    search: ["householdNo", "headName", "address", "purok"],
    fields: {
      householdNo: { type: "string", required: true, unique: true },
      headName: { type: "string", required: true },
      address: { type: "string", required: true },
      purok: { type: "string", default: "" },
      memberCount: { type: "int", default: 1 },
      status: { type: "enum", values: ["Active", "Inactive"], default: "Active" },
    },
  },
  officials: {
    table: "officials",
    search: ["fullName", "position"],
    fields: {
      fullName: { type: "string", required: true },
      position: { type: "string", required: true },
      termStart: { type: "date", nullable: true },
      termEnd: { type: "date", nullable: true },
      contactNumber: { type: "string", default: "" },
      status: { type: "enum", values: ["Active", "Inactive"], default: "Active" },
    },
  },
  blotter: {
    table: "blotter",
    search: ["caseNo", "complainant", "respondent", "location"],
    fields: {
      caseNo: { type: "string", unique: true, auto: true },
      complainant: { type: "string", required: true },
      respondent: { type: "string", required: true },
      incidentDate: { type: "date", required: true },
      location: { type: "string", default: "" },
      description: { type: "text", required: true },
      status: { type: "enum", values: ["Open", "Under Mediation", "Settled", "Escalated"], default: "Open" },
    },
  },
  certificates: {
    table: "certificates",
    search: ["controlNo", "residentName", "type", "purpose"],
    fields: {
      controlNo: { type: "string", unique: true, auto: true },
      residentId: { type: "int", nullable: true },
      residentName: { type: "string", required: true },
      type: {
        type: "enum",
        values: ["Barangay Clearance", "Certificate of Residency", "Certificate of Indigency", "Business Clearance", "Barangay ID"],
        required: true,
      },
      purpose: { type: "string", default: "" },
      fee: { type: "money", default: 0 },
      status: { type: "enum", values: ["Pending", "Approved", "Released", "Rejected"], default: "Pending" },
    },
  },
  announcements: {
    table: "announcements",
    search: ["title", "body"],
    fields: {
      title: { type: "string", required: true },
      body: { type: "text", required: true },
      postedBy: { type: "string", default: "Admin" },
      status: { type: "enum", values: ["Draft", "Published", "Archived"], default: "Published" },
    },
  },
};

function sqlType(def) {
  switch (def.type) {
    case "string": return "VARCHAR(255)";
    case "text": return "TEXT";
    case "date": return "DATE";
    case "int": return "INT";
    case "money": return "DECIMAL(10,2)";
    case "enum": return `VARCHAR(50)`;
    default: return "VARCHAR(255)";
  }
}

function columnSql(name, def) {
  let sql = `\`${name}\` ${sqlType(def)}`;
  const nullable = def.nullable || def.type === "text" || def.auto;
  sql += nullable ? " NULL" : " NOT NULL";
  if (def.default !== undefined && def.type !== "text") {
    sql += typeof def.default === "number" ? ` DEFAULT ${def.default}` : ` DEFAULT '${def.default}'`;
  }
  return sql;
}

async function ensureTable(res) {
  const cols = Object.entries(res.fields).map(([n, d]) => columnSql(n, d));
  const uniques = Object.entries(res.fields)
    .filter(([, d]) => d.unique)
    .map(([n]) => `UNIQUE KEY \`uq_${res.table}_${n}\` (\`${n}\`)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`${res.table}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ${[...cols, ...uniques].join(",\n      ")},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);

  const [existing] = await pool.query(`SHOW COLUMNS FROM \`${res.table}\``);
  const have = new Set(existing.map((c) => c.Field));
  for (const [name, def] of Object.entries(res.fields)) {
    if (!have.has(name)) {
      try {
        await pool.query(`ALTER TABLE \`${res.table}\` ADD COLUMN ${columnSql(name, def)}`);
      } catch (e) {
        console.warn(`Could not add column ${res.table}.${name}:`, e.message);
      }
    }
  }
}

async function initializeDatabase() {
  const connection = await mysql.createConnection(DB_CONFIG);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.end();

  pool = mysql.createPool({
    ...DB_CONFIG,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
  });

  for (const res of Object.values(RESOURCES)) await ensureTable(res);
  console.log(`Database '${DB_NAME}' and all BIS tables are ready!`);
}

function cleanValue(name, def, raw) {
  const empty = raw === undefined || raw === null || (typeof raw === "string" && raw.trim() === "");
  if (empty) {
    if (def.required) throw new Error(`${name} is required.`);
    if (def.nullable) return null;
    return def.default !== undefined ? def.default : null;
  }
  switch (def.type) {
    case "string":
    case "text": {
      const v = String(raw).trim();
      if (def.type === "string" && v.length > 255) throw new Error(`${name} is too long (max 255).`);
      return v;
    }
    case "date": {
      const v = String(raw).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) throw new Error(`${name} must be a valid date (YYYY-MM-DD).`);
      return v;
    }
    case "int": {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a non-negative whole number.`);
      return n;
    }
    case "money": {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) throw new Error(`${name} must be a valid non-negative number.`);
      return n;
    }
    case "enum": {
      if (!def.values.includes(raw)) throw new Error(`${name} must be one of: ${def.values.join(", ")}.`);
      return raw;
    }
    default:
      return raw;
  }
}

function buildData(res, body, partial) {
  const data = {};
  for (const [name, def] of Object.entries(res.fields)) {
    if (def.auto) continue;
    if (partial && !(name in body)) continue;
    data[name] = cleanValue(name, def, body[name]);
  }
  return data;
}

async function nextCode(table, column, prefix) {
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-%`;
  const [[row]] = await pool.query(
    `SELECT COUNT(*) AS n FROM \`${table}\` WHERE \`${column}\` LIKE ?`, [like]);
  return `${prefix}-${year}-${String(row.n + 1).padStart(4, "0")}`;
}
const AUTO_PREFIX = { blotter: ["caseNo", "BL"], certificates: ["controlNo", "CERT"] };

app.get("/api/test", async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ message: "Database pool not initialized." });
    await pool.query("SELECT 1");
    res.json({ message: "BIS API and MySQL are connected." });
  } catch (error) {
    console.error("Database connection error:", error.message);
    res.status(500).json({ message: "Database connection failed." });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ message: "Database pool not initialized." });
    const one = async (sql) => (await pool.query(sql))[0][0].n;
    const [byPurok] = await pool.query(
      "SELECT IF(purok='', 'Unassigned', purok) AS purok, COUNT(*) AS total FROM residents WHERE status='Active' GROUP BY purok ORDER BY purok");
    const [bySex] = await pool.query("SELECT sex, COUNT(*) AS total FROM residents WHERE status='Active' GROUP BY sex");
    res.json({
      residents: await one("SELECT COUNT(*) AS n FROM residents WHERE status='Active'"),
      households: await one("SELECT COUNT(*) AS n FROM households WHERE status='Active'"),
      officials: await one("SELECT COUNT(*) AS n FROM officials WHERE status='Active'"),
      openBlotter: await one("SELECT COUNT(*) AS n FROM blotter WHERE status IN ('Open','Under Mediation')"),
      pendingCertificates: await one("SELECT COUNT(*) AS n FROM certificates WHERE status='Pending'"),
      publishedAnnouncements: await one("SELECT COUNT(*) AS n FROM announcements WHERE status='Published'"),
      seniorCitizens: await one("SELECT COUNT(*) AS n FROM residents WHERE status='Active' AND TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) >= 60"),
      registeredVoters: await one("SELECT COUNT(*) AS n FROM residents WHERE status='Active' AND voterStatus='Registered'"),
      residentsByPurok: byPurok,
      residentsBySex: bySex,
    });
  } catch (error) {
    console.error("Stats error:", error.message);
    res.status(500).json({ message: "Failed to load statistics." });
  }
});

function registerCrud(path, res) {
  const base = `/api/${path}`;
  const T = `\`${res.table}\``;

  app.get(base, async (req, rsp) => {
    try {
      if (!pool) return rsp.status(500).json({ message: "Database pool not initialized." });
      const where = [];
      const params = [];

      if (req.query.q) {
        where.push(`(${res.search.map((c) => `\`${c}\` LIKE ?`).join(" OR ")})`);
        res.search.forEach(() => params.push(`%${req.query.q}%`));
      }
      for (const name of Object.keys(res.fields)) {
        if (req.query[name] !== undefined && req.query[name] !== "") {
          where.push(`\`${name}\` = ?`);
          params.push(req.query[name]);
        }
      }
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 500, 1), 1000);
      const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
      const clause = where.length ? ` WHERE ${where.join(" AND ")}` : "";

      const [rows] = await pool.query(`SELECT * FROM ${T}${clause} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ${T}${clause}`, params);
      rsp.set("X-Total-Count", String(total));
      rsp.json(rows);
    } catch (error) {
      console.error(`Fetch ${path} error:`, error.message);
      rsp.status(500).json({ message: `Failed to fetch ${path}.` });
    }
  });

  app.get(`${base}/:id`, async (req, rsp) => {
    try {
      if (!pool) return rsp.status(500).json({ message: "Database pool not initialized." });
      const [rows] = await pool.query(`SELECT * FROM ${T} WHERE id = ?`, [req.params.id]);
      if (!rows.length) return rsp.status(404).json({ message: "Record not found." });
      rsp.json(rows[0]);
    } catch (error) {
      console.error(`Get ${path} error:`, error.message);
      rsp.status(500).json({ message: "Failed to fetch record." });
    }
  });

  app.post(base, async (req, rsp) => {
    if (!pool) return rsp.status(500).json({ message: "Database pool not initialized." });
    let data;
    try { data = buildData(res, req.body || {}, false); }
    catch (e) { return rsp.status(400).json({ message: e.message }); }

    try {
      if (AUTO_PREFIX[path]) {
        const [col, prefix] = AUTO_PREFIX[path];
        data[col] = await nextCode(res.table, col, prefix);
      }
      const cols = Object.keys(data);
      const [result] = await pool.query(
        `INSERT INTO ${T} (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
        cols.map((c) => data[c]));
      const [rows] = await pool.query(`SELECT * FROM ${T} WHERE id = ?`, [result.insertId]);
      rsp.status(201).json(rows[0]);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return rsp.status(409).json({ message: "A record with that unique value already exists." });
      console.error(`Add ${path} error:`, error);
      rsp.status(500).json({ message: "Failed to save record.", error: error.message });
    }
  });

  app.put(`${base}/:id`, async (req, rsp) => {
    if (!pool) return rsp.status(500).json({ message: "Database pool not initialized." });
    let data;
    try { data = buildData(res, req.body || {}, true); }
    catch (e) { return rsp.status(400).json({ message: e.message }); }

    const cols = Object.keys(data);
    if (!cols.length) return rsp.status(400).json({ message: "No fields to update." });

    try {
      const [result] = await pool.query(
        `UPDATE ${T} SET ${cols.map((c) => `\`${c}\` = ?`).join(", ")} WHERE id = ?`,
        [...cols.map((c) => data[c]), req.params.id]);
      if (!result.affectedRows) return rsp.status(404).json({ message: "Record not found." });
      const [rows] = await pool.query(`SELECT * FROM ${T} WHERE id = ?`, [req.params.id]);
      rsp.json(rows[0]);
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return rsp.status(409).json({ message: "A record with that unique value already exists." });
      console.error(`Update ${path} error:`, error.message);
      rsp.status(500).json({ message: "Failed to update record." });
    }
  });

  app.delete(`${base}/:id`, async (req, rsp) => {
    try {
      if (!pool) return rsp.status(500).json({ message: "Database pool not initialized." });
      const [result] = await pool.query(`DELETE FROM ${T} WHERE id = ?`, [req.params.id]);
      if (!result.affectedRows) return rsp.status(404).json({ message: "Record not found." });
      rsp.json({ message: "Record deleted.", id: Number(req.params.id) });
    } catch (error) {
      console.error(`Delete ${path} error:`, error.message);
      rsp.status(500).json({ message: "Failed to delete record." });
    }
  });
}

for (const [path, res] of Object.entries(RESOURCES)) registerCrud(path, res);

app.use("/api", (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

async function startServer() {
  try {
    // Sinusubukan munang ikonekta ang database kung may environment variables na
    await initializeDatabase();
  } catch (error) {
    console.warn("⚠️ Warning: Database initialization skipped or failed for initial deployment:", error.message);
    console.log("Server is running without an active database connection.");
  }

  app.listen(PORT, () => {
    console.log("===================================");
    console.log("Barangay Information System server is running!");
    console.log(`Server URL: http://localhost:${PORT}`);
    console.log(`Test API:   http://localhost:${PORT}/api/test`);
    console.log(`Stats API:  http://localhost:${PORT}/api/stats`);
    console.log(`Endpoints:  /api/${Object.keys(RESOURCES).join(", /api/")}`);
    console.log(`MySQL database: ${DB_NAME}`);
    console.log("===================================");
  });
}

startServer();