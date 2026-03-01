// В проде подставьте переменные окружения (react-native-dotenv или build-time)
export const API_URL = process.env.API_URL || 'http://localhost:3000';
export const WS_URL = process.env.WS_URL || 'ws://localhost:3000';
export const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

// Радиусы видимости (м) — должны совпадать с backend
export const COP_VISION_RADIUS_M = 200;
export const BANDIT_VISION_RADIUS_M = 50;
