const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/", (req, res) => {
  app.get("/register", async (req, res) => {
  const { email } = req.query;
  try {
    const result = await pool.query(
      "INSERT INTO users(email) VALUES($1) RETURNING *",
      [email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(err.message);
  }
});

  res.send("SnapSell API çalışıyor 🚀");
});

app.get("/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        credits INTEGER DEFAULT 50
      );
    `);
    res.send("DB hazır 👍");
  } catch (err) {
    res.send(err.message);
  }
});

app.post("/register", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users(email) VALUES($1) RETURNING *",
      [email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users");
  res.json(result.rows);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server başladı"));
