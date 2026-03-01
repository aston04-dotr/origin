const { pool } = require('../db');
const { v4: uuidv4 } = require('uuid');

async function recordPurchase(playerId, productId, productType, platform, externalId, payload = {}) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO purchases (id, player_id, product_id, product_type, platform, external_id, payload)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, playerId, productId, productType, platform, externalId || null, JSON.stringify(payload)]
  );
  const r = await pool.query('SELECT * FROM purchases WHERE id = $1', [id]);
  return r.rows[0];
}

async function addToInventory(playerId, productId, productType, expiresAt = null) {
  const id = uuidv4();
  await pool.query(
    `INSERT INTO inventory (id, player_id, product_id, product_type, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (player_id, product_id, product_type) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
    [id, playerId, productId, productType, expiresAt]
  );
  const r = await pool.query('SELECT * FROM inventory WHERE player_id = $1 AND product_id = $2 AND product_type = $3', [
    playerId,
    productId,
    productType,
  ]);
  return r.rows[0];
}

async function getInventory(playerId) {
  const r = await pool.query(
    `SELECT * FROM inventory WHERE player_id = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
    [playerId]
  );
  return r.rows;
}

async function findByExternalId(platform, externalId) {
  const r = await pool.query('SELECT * FROM purchases WHERE platform = $1 AND external_id = $2', [
    platform,
    externalId,
  ]);
  return r.rows[0] || null;
}

module.exports = {
  recordPurchase,
  addToInventory,
  getInventory,
  findByExternalId,
};
