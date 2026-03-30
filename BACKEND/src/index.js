require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet");
const { Pool } = require("pg");
const client  = require("prom-client");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Prometheus ────────────────────────────────────────────
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "node_" });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1,2.5,5],
  registers: [register],
});
const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});
const dbQueryDuration = new client.Histogram({
  name: "db_query_duration_seconds",
  help: "PostgreSQL query duration in seconds",
  labelNames: ["query"],
  buckets: [0.001,0.005,0.01,0.05,0.1,0.5,1],
  registers: [register],
});

// ── PostgreSQL ────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
pool.on("error", err => console.error("PostgreSQL error:", err.message));

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(255) NOT NULL,
      description TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("Database initialised");
}

// ── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    const l = { method: req.method, route: req.route?.path || req.path, status: res.statusCode };
    end(l); httpRequestTotal.inc(l);
  });
  next();
});

// ── Routes ────────────────────────────────────────────────
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", uptime: process.uptime() });
  } catch (err) {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/api/items", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM items ORDER BY created_at DESC LIMIT 100"
    );
    res.json(rows);
  } catch (err) { next(err); }
});

app.post("/api/items", async (req, res, next) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const { rows } = await pool.query(
      "INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *",
      [name, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

app.delete("/api/items/:id", async (req, res, next) => {
  try {
    const { rowCount } = await pool.query(
      "DELETE FROM items WHERE id = $1", [req.params.id]
    );
    if (rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) { next(err); }
});

app.use((err, req, res, _next) => {
  console.error(err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
});

module.exports = app;