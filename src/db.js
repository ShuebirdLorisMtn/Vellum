const { Pool } = require('pg');

// NETLIFY_DATABASE_URL is set automatically when using Netlify DB (Neon).
const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
if (!DATABASE_URL) {
  console.warn('DATABASE_URL is not set — DB functions will fail until configured');
}

// Hosted Postgres (Neon, RDS, etc.) requires TLS; local dev does not.
const useSSL = /sslmode=require/.test(DATABASE_URL || '') || process.env.DATABASE_SSL === 'true';
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

async function ensureSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        free_docs_remaining INTEGER NOT NULL DEFAULT 1,
        subscription_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        payload JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);
  } finally {
    client.release();
  }
}

// Run schema creation on import (best-effort)
ensureSchema().catch((err) => {
  console.error('Error ensuring DB schema:', err?.message || err);
});

async function createUser(email) {
  const res = await pool.query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, free_docs_remaining, subscription_active, created_at`,
    [email]
  );
  return res.rows[0];
}

async function findUserByEmail(email) {
  const res = await pool.query(`SELECT id, email, free_docs_remaining, subscription_active, created_at FROM users WHERE email = $1`, [email]);
  return res.rows[0] || null;
}

async function getUserById(id) {
  const res = await pool.query(`SELECT id, email, free_docs_remaining, subscription_active, created_at FROM users WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function decrementFreeDoc(userId) {
  const res = await pool.query(
    `UPDATE users SET free_docs_remaining = GREATEST(free_docs_remaining - 1, 0) WHERE id = $1 RETURNING free_docs_remaining`,
    [userId]
  );
  return res.rows[0] || null;
}

async function saveDocument(userId, title, content) {
  const res = await pool.query(
    `INSERT INTO documents (user_id, title, content) VALUES ($1, $2, $3) RETURNING id, user_id, title, content, created_at`,
    [userId, title, content]
  );
  return res.rows[0];
}

async function listDocuments(userId) {
  const res = await pool.query(
    `SELECT id, title, content, created_at FROM documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  );
  return res.rows;
}

async function storeWebhookEvent(eventId, payload) {
  if (!eventId) return null;
  await pool.query(`INSERT INTO webhook_events (id, payload) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`, [eventId, payload]);
  return eventId;
}

async function setSubscriptionActive(userId, active = true) {
  const res = await pool.query(`UPDATE users SET subscription_active = $2 WHERE id = $1 RETURNING id, email, subscription_active`, [userId, active]);
  return res.rows[0] || null;
}

module.exports = {
  pool,
  createUser,
  findUserByEmail,
  getUserById,
  decrementFreeDoc,
  saveDocument,
  listDocuments,
  storeWebhookEvent,
  setSubscriptionActive,
};
