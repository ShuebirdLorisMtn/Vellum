const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createUser(email) {
  const res = await pool.query(
    `INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET updated_at = now() RETURNING *`,
    [email]
  );
  return res.rows[0];
}

async function findUserByEmail(email) {
  const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return res.rows[0];
}

async function getUserById(id) {
  const res = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return res.rows[0];
}

async function decrementFreeDoc(userId) {
  const res = await pool.query(`
    UPDATE users SET free_docs_remaining = free_docs_remaining - 1, updated_at = now()
    WHERE id = $1 AND free_docs_remaining > 0
    RETURNING *
  `, [userId]);
  return res.rows[0];
}

async function setSubscriptionActive(userId, active = true) {
  const res = await pool.query(`UPDATE users SET subscription_active = $2, updated_at = now() WHERE id = $1 RETURNING *`, [userId, active]);
  return res.rows[0];
}

async function saveDocument(userId, title, content) {
  const res = await pool.query(`INSERT INTO documents (user_id, title, content) VALUES ($1,$2,$3) RETURNING *`, [userId, title, content]);
  return res.rows[0];
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
  setSubscriptionActive,
  saveDocument,
  storeWebhookEvent
  saveDocument,
  storeWebhookEvent,
  setSubscriptionActive,
};
