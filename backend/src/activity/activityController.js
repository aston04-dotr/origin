/**
 * REST API: GET /api/activity/nearby?lat=&lng=
 * Возвращает зоны в радиусе 500м.
 */

const express = require('express');
const router = express.Router();
const activityStore = require('./activityEngine');
const { NEARBY_RADIUS_M } = require('./activityTypes');
const { validateCoords } = require('../anticheat');

router.get('/nearby', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusM = req.query.radius != null ? Math.min(Number(req.query.radius) || NEARBY_RADIUS_M, 1000) : NEARBY_RADIUS_M;

  if (!validateCoords(lat, lng)) {
    return res.status(400).json({ error: 'Invalid lat/lng' });
  }

  const zones = activityStore.getNearby(lat, lng, radiusM);
  res.json({ zones });
});

module.exports = router;
