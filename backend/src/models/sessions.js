const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function createSession(playerId, deviceId) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO player_sessions (id, player_id, device_id) VALUES ($1, $2, $3)`,
    [id, playerId, deviceId || null]
  );
  const r = await pool.query('SELECT * FROM player_sessions WHERE id = $1', [id]);
  return r.rows[0];
}

async function getSession(sessionId) {
  const r = await pool.query('SELECT * FROM player_sessions WHERE id = $1', [sessionId]);
  return r.rows[0] || null;
}

async function updateSessionLocation(sessionId, playerId, { lat, lon, heading, speed_kmh }) {
  await pool.query(
    `UPDATE player_sessions SET last_lat = $1, last_lon = $2, last_heading = $3, last_speed_kmh = $4, last_seen_at = NOW() WHERE id = $5 AND player_id = $6`,
    [lat, lon, heading ?? null, speed_kmh ?? null, sessionId, playerId]
  );
}

async function getPlayersWithLocation(role) {
  const r = await pool.query(
    `SELECT s.id as session_id, s.player_id, s.last_lat, s.last_lon, s.last_seen_at, p.username, p.role
     FROM player_sessions s
     JOIN players p ON p.id = s.player_id
     WHERE p.role = $1 AND s.last_lat IS NOT NULL AND s.last_lon IS NOT NULL
     AND s.last_seen_at > NOW() - INTERVAL '5 minutes'`,
    [role]
  );
  return r.rows;
}

module.exports = {
  createSession,
  getSession,
  updateSessionLocation,
  getPlayersWithLocation,
};
