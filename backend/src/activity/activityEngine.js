/**
 * Activity Engine — хранилище зон, получение nearby, обновление MOVING_SIGNAL.
 * Map-based store, auto-cleanup expired, max 50 zones.
 */

const { haversineDistanceKm } = require('../anticheat');
const { ActivityType, NEARBY_RADIUS_M, MAX_ZONES_PER_CITY } = require('./activityTypes');
const { offsetPoint } = require('./zoneGenerator');
const { MOVING_SIGNAL_STEP_M, MOVING_SIGNAL_INTERVAL_MS } = require('./activityTypes');

const zones = new Map();
let lastMovingSignalTick = Date.now();

function distanceM(lat1, lon1, lat2, lon2) {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

function addZone(zone) {
  if (zones.size >= MAX_ZONES_PER_CITY) return false;
  zones.set(zone.id, zone);
  return true;
}

function removeZone(id) {
  return zones.delete(id);
}

function getZone(id) {
  return zones.get(id) || null;
}

function getAllZones() {
  return Array.from(zones.values());
}

/**
 * Зоны в радиусе radiusM от (lat, lon). По умолчанию 500м.
 */
function getNearby(lat, lon, radiusM = NEARBY_RADIUS_M) {
  const now = Date.now();
  const result = [];
  for (const zone of zones.values()) {
    if (zone.expiresAt <= now) continue;
    if (zone.spawnAt > now) continue;
    const d = distanceM(lat, lon, zone.lat, zone.lng);
    if (d <= radiusM) {
      result.push({
        id: zone.id,
        type: zone.type,
        lat: zone.lat,
        lng: zone.lng,
        radius: zone.radius,
        expiresAt: zone.expiresAt,
        intensity: zone.intensity,
      });
    }
  }
  return result;
}

/**
 * Удалить все истёкшие зоны. Возвращает количество удалённых.
 */
function cleanupExpired() {
  const now = Date.now();
  let removed = 0;
  for (const [id, zone] of zones.entries()) {
    if (zone.expiresAt <= now) {
      zones.delete(id);
      removed++;
    }
  }
  return removed;
}

/**
 * Обновить позицию MOVING_SIGNAL: сдвиг 5–15м каждые 10 сек, случайное направление.
 */
function tickMovingSignals() {
  const now = Date.now();
  if (now - lastMovingSignalTick < MOVING_SIGNAL_INTERVAL_MS) return;
  lastMovingSignalTick = now;

  const METERS_TO_DEG_LAT = 1 / 111320;
  const METERS_TO_DEG_LON_AT = (lat) => 1 / (111320 * Math.cos((lat * Math.PI) / 180));
  let updated = 0;

  for (const zone of zones.values()) {
    if (zone.type !== ActivityType.MOVING_SIGNAL || zone.expiresAt <= now) continue;

    const stepM = MOVING_SIGNAL_STEP_M.min + Math.random() * (MOVING_SIGNAL_STEP_M.max - MOVING_SIGNAL_STEP_M.min);
    const driftAngle = (zone.heading || 0) + (Math.random() - 0.5) * 60;
    const rad = (driftAngle * Math.PI) / 180;
    const dLat = (stepM * Math.cos(rad)) * METERS_TO_DEG_LAT;
    const dLon = (stepM * Math.sin(rad)) * METERS_TO_DEG_LON_AT(zone.lat);

    zone.lat += dLat;
    zone.lng += dLon;
    zone.heading = (driftAngle + 360) % 360;
    updated++;
  }
  if (updated > 0) {
    console.log('[ActivityEngine] Moving signal updated', updated, 'zones');
  }
}

function size() {
  return zones.size;
}

module.exports = {
  addZone,
  removeZone,
  getZone,
  getAllZones,
  getNearby,
  cleanupExpired,
  tickMovingSignals,
  size,
  distanceM,
};
