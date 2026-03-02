/**
 * Scheduler: цикл каждые 15 сек — онлайн, генерация/удаление зон, оптимизация памяти.
 */

const sessionsModel = require('../models/sessions');
const { generateZone, adaptiveSpawnChance } = require('./zoneGenerator');
const activityStore = require('./activityEngine');
const { SCHEDULER_INTERVAL_MS, MAX_ZONES_PER_CITY } = require('./activityTypes');

let schedulerTimer = null;
let lastSpawnTime = 0;
const MIN_SPAWN_INTERVAL_MS = 8000;

function getOnlinePlayersWithLocation() {
  return Promise.all([
    sessionsModel.getPlayersWithLocation('cop'),
    sessionsModel.getPlayersWithLocation('bandit'),
  ])
    .then(([cops, bandits]) => [...cops, ...bandits])
    .catch(() => []);
}

async function runCycle() {
  try {
    const players = await getOnlinePlayersWithLocation();
    const onlineCount = players.length;

    activityStore.cleanupExpired();
    activityStore.tickMovingSignals();

    const spawnChance = adaptiveSpawnChance(onlineCount);
    const now = Date.now();
    const canSpawn =
      activityStore.size() < MAX_ZONES_PER_CITY &&
      now - lastSpawnTime >= MIN_SPAWN_INTERVAL_MS &&
      Math.random() < spawnChance;

    if (canSpawn && players.length > 0) {
      const seed = players[Math.floor(Math.random() * players.length)];
      const zone = generateZone(
        { lat: seed.last_lat, lon: seed.last_lon },
        players,
        60
      );
      if (zone && zone.spawnAt <= now + SCHEDULER_INTERVAL_MS) {
        zone.spawnAt = now;
      }
      if (zone && activityStore.addZone(zone)) {
        lastSpawnTime = now;
        console.log('[ActivityEngine] Zone spawned', zone.id, zone.type, `(${zone.lat.toFixed(5)}, ${zone.lng.toFixed(5)})`);
      }
    }

    const expired = activityStore.cleanupExpired();
    if (expired > 0) {
      console.log('[ActivityEngine] Zone expired', expired, 'zones removed');
    }
  } catch (e) {
    console.error('[ActivityEngine] Scheduler error:', e.message);
  }
}

function start(serverContext) {
  if (schedulerTimer) return;
  runCycle();
  schedulerTimer = setInterval(runCycle, SCHEDULER_INTERVAL_MS);
  console.log('[ActivityEngine] Scheduler started, interval', SCHEDULER_INTERVAL_MS / 1000, 's');
}

function stop() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[ActivityEngine] Scheduler stopped');
  }
}

module.exports = { start, stop, runCycle, getOnlinePlayersWithLocation };
