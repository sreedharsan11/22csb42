// server.js
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const sqlite3 = require("sqlite3").verbose();
const { nanoid } = require("nanoid");

const app = express();
const PORT = 5000;

// Middlewares
app.use(bodyParser.json());
app.use(morgan("dev"));

// Database setup
const db = new sqlite3.Database(":memory:");
db.serialize(() => {
  db.run("CREATE TABLE urls (id TEXT PRIMARY KEY, original_url TEXT NOT NULL)");
});

// Route: shorten URL
app.post("/shorten", (req, res) => {
  const { original_url } = req.body;
  if (!original_url) {
    return res.status(400).json({ error: "original_url is required" });
  }

  const id = nanoid(6);
  db.run("INSERT INTO urls (id, original_url) VALUES (?, ?)", [id, original_url], (err) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json({
      id,
      original_url,
      short_url: `http://localhost:${PORT}/${id}`,
    });
  });
});

// Route: get all URLs
app.get("/api/urls", (req, res) => {
  db.all("SELECT * FROM urls", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});

// Route: redirect by ID
app.get("/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT original_url FROM urls WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Not found" });
    }
    res.redirect(row.original_url);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
