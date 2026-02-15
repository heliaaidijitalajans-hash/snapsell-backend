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

// Kredi düşerek dönüşüm simülasyonu
app.get("/convert", async (req, res) => {
  const { email } = req.query;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.send("Kullanıcı bulunamadı");
    }

    if (user.rows[0].credits < 10) {
      return res.send("Yetersiz kredi");
    }

    const updated = await pool.query(
      "UPDATE users SET credits = credits - 10 WHERE email=$1 RETURNING *",
      [email]
    );

    res.json({
      message: "Dönüşüm başarılı 🎉",
      remainingCredits: updated.rows[0].credits,
    });
  } catch (err) {
    res.send(err.message);
  }
});

// AI dönüşüm endpointi
app.get("/ai-convert", async (req, res) => {
  const { email, product } = req.query;

  try {
    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.send("Kullanıcı bulunamadı");
    }

    if (user.rows[0].credits < 10) {
      return res.send("Yetersiz kredi");
    }

    // kredi düş
    await pool.query(
      "UPDATE users SET credits = credits - 10 WHERE email=$1",
      [email]
    );

    const prompt = `
    Sen bir e-ticaret uzmanısın.
    Ürün: ${product}

    Şunları üret:
    1) SEO başlık
    2) SEO açıklama
    3) Türkiye piyasa fiyat aralığı (min-max-ortalama)
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    res.json({
      aiResult: data.candidates[0].content.parts[0].text || "AI cevap veremedi",
    });
  } catch (err) {
    res.send(err.message);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server başladı"));
