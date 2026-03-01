/**
 * Античит: проверка на спуфинг GPS и нереалистичную скорость.
 */

const MAX_SPEED_KMH = Number(process.env.MAX_REASONABLE_SPEED_KMH) || 200;
const EARTH_RADIUS_KM = 6371;

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Проверка: если игрок "переместился" быстрее чем MAX_SPEED_KMH за время deltaMinutes — подозрительно.
 * @param {{ lat, lon }} prev - предыдущая точка
 * @param {{ lat, lon }} next - текущая точка
 * @param deltaMinutes - время в минутах между обновлениями
 * @returns {{ ok: boolean, speedKmh?: number, reason?: string }}
 */
function checkSpeed(prev, next, deltaMinutes) {
  if (!prev?.lat || !prev?.lon || !next?.lat || !next?.lon) return { ok: true };
  if (deltaMinutes <= 0) return { ok: true };

  const distKm = haversineDistanceKm(prev.lat, prev.lon, next.lat, next.lon);
  const hours = deltaMinutes / 60;
  const speedKmh = hours > 0 ? distKm / hours : 0;

  if (speedKmh > MAX_SPEED_KMH) {
    return {
      ok: false,
      speedKmh,
      reason: `Speed too high: ${speedKmh.toFixed(0)} km/h (max ${MAX_SPEED_KMH})`,
    };
  }
  return { ok: true, speedKmh };
}

/**
 * Базовая проверка координат (не за пределами планеты).
 */
function validateCoords(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return false;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
  if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
  return true;
}

module.exports = {
  checkSpeed,
  validateCoords,
  haversineDistanceKm,
};
