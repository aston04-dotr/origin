const express = require('express');
const router = express.Router();
const playersModel = require('../models/players');
const sessionsModel = require('../models/sessions');
const { getVisiblePlayers, isInCatchRadius } = require('../geolocation');
const { checkSpeed, validateCoords } = require('../anticheat');

// Регистрация / получение игрока (упрощённо — без JWT для теста)
router.post('/players/register', async (req, res) => {
  try {
    const { username, email, role } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });
    const existing = await playersModel.findByUsername(username);
    if (existing) return res.status(409).json({ error: 'username taken' });
    const player = await playersModel.createPlayer({
      username,
      email,
      role: role === 'cop' ? 'cop' : 'bandit',
    });
    const session = await sessionsModel.createSession(player.id, req.body.device_id);
    res.json({ player, session_id: session.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/players/:id', async (req, res) => {
  try {
    const player = await playersModel.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'not found' });
    res.json(player);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Обновление геолокации (REST, дублируется в WebSocket для надёжности)
router.post('/location', async (req, res) => {
  try {
    const { session_id, player_id, lat, lon, heading, speed_kmh } = req.body;
    if (!session_id || !player_id || lat == null || lon == null) {
      return res.status(400).json({ error: 'session_id, player_id, lat, lon required' });
    }
    if (!validateCoords(lat, lon)) {
      return res.status(400).json({ error: 'invalid coordinates' });
    }
    const session = await sessionsModel.getSession(session_id);
    if (!session || session.player_id !== player_id) {
      return res.status(403).json({ error: 'invalid session' });
    }
    const prev = { lat: session.last_lat, lon: session.last_lon };
    const deltaMinutes = session.last_seen_at ? (Date.now() - new Date(session.last_seen_at).getTime()) / 60000 : 1;
    const speedCheck = checkSpeed(prev, { lat, lon }, deltaMinutes);
    if (!speedCheck.ok) {
      return res.status(400).json({ error: 'anticheat', reason: speedCheck.reason });
    }
    await sessionsModel.updateSessionLocation(session_id, player_id, {
      lat,
      lon,
      heading,
      speed_kmh,
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Кто виден с моей позиции (копы видят бандитов 200м, бандиты копов 50м)
router.post('/nearby', async (req, res) => {
  try {
    const { player_id, lat, lon, my_role } = req.body;
    if (!player_id || lat == null || lon == null || !my_role) {
      return res.status(400).json({ error: 'player_id, lat, lon, my_role required' });
    }
    const targetRole = my_role === 'cop' ? 'bandit' : 'cop';
    const others = await sessionsModel.getPlayersWithLocation(targetRole);
    const withCoords = others.map((o) => ({
      ...o,
      lat: o.last_lat,
      lon: o.last_lon,
    }));
    const visible = getVisiblePlayers(my_role, lat, lon, withCoords);
    res.json({ visible });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Действия: патруль, поимка, побег, скрытие
router.post('/action', async (req, res) => {
  try {
    const { session_id, player_id, action_type, target_id, lat, lon } = req.body;
    if (!session_id || !player_id || !action_type) {
      return res.status(400).json({ error: 'session_id, player_id, action_type required' });
    }
    const session = await sessionsModel.getSession(session_id);
    if (!session || session.player_id !== player_id) {
      return res.status(403).json({ error: 'invalid session' });
    }
    const player = await playersModel.findById(player_id);
    if (!player) return res.status(404).json({ error: 'player not found' });

    if (action_type === 'catch' && target_id) {
      const bandits = await sessionsModel.getPlayersWithLocation('bandit');
      const target = bandits.find((b) => b.player_id === target_id);
      if (!target || !isInCatchRadius(session.last_lat, session.last_lon, target.last_lat, target.last_lon)) {
        return res.status(400).json({ error: 'target not in catch radius' });
      }
      await playersModel.addXp(player_id, 50);
      await playersModel.logAction(player_id, target_id, 'catch', lat, lon);
      return res.json({ ok: true, xp_gained: 50 });
    }

    if (action_type === 'escape' || action_type === 'hide') {
      await playersModel.addXp(player_id, 10);
      await playersModel.logAction(player_id, null, action_type, lat, lon);
      return res.json({ ok: true, xp_gained: 10 });
    }

    if (action_type === 'patrol') {
      await playersModel.addXp(player_id, 5);
      await playersModel.logAction(player_id, null, 'patrol', lat, lon);
      return res.json({ ok: true, xp_gained: 5 });
    }

    res.status(400).json({ error: 'unknown action_type' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { apiRouter: router };
