/**
 * Радиусы видимости: коп 200м, бандит 50м.
 * Расчёт расстояния и фильтрация видимых игроков.
 */

const { haversineDistanceKm } = require('./anticheat');

const COP_VISION_RADIUS_M = Number(process.env.COP_VISION_RADIUS_M) || 200;
const BANDIT_VISION_RADIUS_M = Number(process.env.BANDIT_VISION_RADIUS_M) || 50;

function distanceMeters(lat1, lon1, lat2, lon2) {
  return haversineDistanceKm(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Фильтрует игроков в радиусе видимости в зависимости от роли наблюдателя.
 * @param observerRole 'cop' | 'bandit'
 * @param observerLat number
 * @param observerLon number
 * @param players Array<{ lat, lon, role, ... }>
 */
function getVisiblePlayers(observerRole, observerLat, observerLon, players) {
  const radiusM = observerRole === 'cop' ? COP_VISION_RADIUS_M : BANDIT_VISION_RADIUS_M;
  return players
    .filter((p) => p.lat != null && p.lon != null)
    .map((p) => ({
      ...p,
      distanceM: distanceMeters(observerLat, observerLon, p.lat, p.lon),
    }))
    .filter((p) => p.distanceM <= radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);
}

function isInCatchRadius(copLat, copLon, banditLat, banditLon, radiusM = 30) {
  return distanceMeters(copLat, copLon, banditLat, banditLon) <= radiusM;
}

module.exports = {
  COP_VISION_RADIUS_M,
  BANDIT_VISION_RADIUS_M,
  distanceMeters,
  getVisiblePlayers,
  isInCatchRadius,
};
