/**
 * Activity Engine — типы зон активности (Dynamic Activity Zones).
 * Shadow Run / Crime-style GPS game.
 */

const ActivityType = Object.freeze({
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  SIGNAL_TRACE: 'SIGNAL_TRACE',
  OPERATION_ZONE: 'OPERATION_ZONE',
  MOVING_SIGNAL: 'MOVING_SIGNAL',
});

const ACTIVITY_TYPE_LIST = Object.values(ActivityType);

const DEFAULT_RADIUS_M = { min: 80, max: 250 };
const DEFAULT_LIFETIME_SEC = { min: 90, max: 240 };
const SPAWN_DELAY_SEC = { min: 10, max: 30 };
const MOVING_SIGNAL_STEP_M = { min: 5, max: 15 };
const MOVING_SIGNAL_INTERVAL_MS = 10 * 1000;
const NEARBY_RADIUS_M = 500;
const MAX_ZONES_PER_CITY = 50;
const SCHEDULER_INTERVAL_MS = 15 * 1000;

/** Шанс исчезновения зоны без события (анти-фейк) 0–1 */
const VANISH_WITHOUT_EVENT_CHANCE = 0.15;

/** Смещение зоны в метрах для имитации движения */
const ZONE_DRIFT_M = { min: 2, max: 12 };

/** Веса для приоритетных направлений (центр, парки, ТЦ) */
const WEIGHTED_OFFSET_WEIGHTS = [1.2, 1.0, 1.1, 0.9, 1.0, 0.8, 1.15, 0.95];

module.exports = {
  ActivityType,
  ACTIVITY_TYPE_LIST,
  DEFAULT_RADIUS_M,
  DEFAULT_LIFETIME_SEC,
  SPAWN_DELAY_SEC,
  MOVING_SIGNAL_STEP_M,
  MOVING_SIGNAL_INTERVAL_MS,
  NEARBY_RADIUS_M,
  MAX_ZONES_PER_CITY,
  SCHEDULER_INTERVAL_MS,
  VANISH_WITHOUT_EVENT_CHANCE,
  ZONE_DRIFT_M,
  WEIGHTED_OFFSET_WEIGHTS,
};
