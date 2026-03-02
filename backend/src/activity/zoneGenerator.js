/**
 * Генерация координат и параметров зон активности.
 * Weighted coordinates, drift, anti-water/empty checks.
 */

const { v4: uuidv4 } = require('uuid');
const { haversineDistanceKm } = require('../anticheat');
const {
  ActivityType,
  ACTIVITY_TYPE_LIST,
  DEFAULT_RADIUS_M,
  DEFAULT_LIFETIME_SEC,
  SPAWN_DELAY_SEC,
  ZONE_DRIFT_M,
  WEIGHTED_OFFSET_WEIGHTS,
  VANISH_WITHOUT_EVENT_CHANCE,
} = require('./activityTypes');

const METERS_TO_DEG_LAT = 1 / 111320;
const METERS_TO_DEG_LON_AT = (lat) => 1 / (111320 * Math.cos((lat * Math.PI) / 180));

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function offsetPoint(lat, lon, distanceM, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  const dLat = (distanceM * Math.cos(rad)) * METERS_TO_DEG_LAT;
  const dLon = (distanceM * Math.sin(rad)) * METERS_TO_DEG_LON_AT(lat);
  return { lat: lat + dLat, lon: lon + dLon };
}

function weightedOffset(lat, lon, maxMeters) {
  const angleIndex = Math.floor(Math.random() * 8);
  const angleDeg = angleIndex * 45 + randomBetween(0, 45);
  const weight = WEIGHTED_OFFSET_WEIGHTS[angleIndex] || 1;
  const distanceM = randomBetween(maxMeters * 0.3, maxMeters) * weight;
  return offsetPoint(lat, lon, Math.min(distanceM, maxMeters * 1.2), angleDeg);
}

function driftOffset(lat, lon) {
  const distanceM = randomBetween(ZONE_DRIFT_M.min, ZONE_DRIFT_M.max);
  const angleDeg = Math.random() * 360;
  return offsetPoint(lat, lon, distanceM, angleDeg);
}

function isValidLocation(lat, lon) {
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  return true;
}

function distanceToPlayerM(lat, lon, playerLat, playerLon) {
  return haversineDistanceKm(lat, lon, playerLat, playerLon) * 1000;
}

function generateZone(seed, realPlayers = [], minDistanceFromRealM = 60) {
  const { lat: baseLat, lon: baseLon } = seed;
  if (!isValidLocation(baseLat, baseLon)) return null;

  const radiusM = Math.round(randomBetween(DEFAULT_RADIUS_M.min, DEFAULT_RADIUS_M.max));
  const lifetimeSec = Math.round(randomBetween(DEFAULT_LIFETIME_SEC.min, DEFAULT_LIFETIME_SEC.max));
  const spawnDelaySec = Math.round(randomBetween(SPAWN_DELAY_SEC.min, SPAWN_DELAY_SEC.max));
  const type = pickRandom(ACTIVITY_TYPE_LIST);
  const intensity = Math.round(randomBetween(0.3, 1) * 100) / 100;

  let { lat, lon } = weightedOffset(baseLat, baseLon, 150);
  const drifted = driftOffset(lat, lon);
  lat = drifted.lat;
  lon = drifted.lon;

  if (!isValidLocation(lat, lon)) return null;

  for (const p of realPlayers) {
    if (p.last_lat == null || p.last_lon == null) continue;
    const d = distanceToPlayerM(lat, lon, p.last_lat, p.last_lon);
    if (d < minDistanceFromRealM) return null;
  }

  const id = uuidv4();
  const now = Date.now();
  const expiresAt = new Date(now + (spawnDelaySec + lifetimeSec) * 1000);

  const zone = {
    id,
    type,
    lat,
    lng: lon,
    radius: radiusM,
    expiresAt: expiresAt.getTime(),
    intensity,
    createdAt: now,
    spawnAt: now + spawnDelaySec * 1000,
    vanishWithoutEvent: Math.random() < VANISH_WITHOUT_EVENT_CHANCE,
    isMoving: type === ActivityType.MOVING_SIGNAL,
    heading: type === ActivityType.MOVING_SIGNAL ? Math.random() * 360 : null,
  };

  return zone;
}

function adaptiveSpawnChance(onlineCount) {
  if (onlineCount < 20) return 0.7;
  if (onlineCount <= 100) return 0.4;
  return 0.1;
}

module.exports = {
  generateZone,
  adaptiveSpawnChance,
  driftOffset,
  offsetPoint,
  distanceToPlayerM,
  isValidLocation,
  randomBetween,
  pickRandom,
  METERS_TO_DEG_LAT,
  METERS_TO_DEG_LON_AT,
};
