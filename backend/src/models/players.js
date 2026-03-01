const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createPlayer({ username, email, role = 'bandit' }) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO players (id, username, email, role) VALUES ($1, $2, $3, $4)`,
    [id, username, email || null, role]
  );
  return findById(id);
}

async function findById(id) {
  const r = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
  return r.rows[0] || null;
}

async function findByUsername(username) {
  const r = await pool.query('SELECT * FROM players WHERE username = $1', [username]);
  return r.rows[0] || null;
}

async function updateLocation(sessionId, playerId, { lat, lon, heading, speed_kmh }) {
  await pool.query(
    `UPDATE player_sessions SET last_lat = $1, last_lon = $2, last_heading = $3, last_speed_kmh = $4, last_seen_at = NOW() WHERE id = $5 AND player_id = $6`,
    [lat, lon, heading ?? null, speed_kmh ?? null, sessionId, playerId]
  );
}

async function addXp(playerId, amount) {
  const client = await pool.connect();
  try {
    await client.query('UPDATE players SET xp = xp + $1, updated_at = NOW() WHERE id = $2', [amount, playerId]);
    const r = await client.query(
      `SELECT p.*, COALESCE((SELECT xp_required FROM level_thresholds lt WHERE lt.level = p.level + 1), 999999) AS next_level_xp FROM players p WHERE p.id = $1`,
      [playerId]
    );
    const row = r.rows[0];
    if (row && row.xp >= row.next_level_xp) {
      await client.query('UPDATE players SET level = level + 1, updated_at = NOW() WHERE id = $1', [playerId]);
    }
    return findById(playerId);
  } finally {
    client.release();
  }
}

async function logAction(actorId, targetId, actionType, lat, lon) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO action_log (id, actor_id, target_id, action_type, lat, lon) VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, actorId, targetId || null, actionType, lat ?? null, lon ?? null]
  );
  return id;
}

module.exports = {
  createPlayer,
  findById,
  findByUsername,
  updateLocation,
  addXp,
  logAction,
};
