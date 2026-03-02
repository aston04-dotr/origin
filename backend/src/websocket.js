const WebSocket = require('ws');
const sessionsModel = require('./models/sessions');
const playersModel = require('./models/players');
const { checkSpeed, validateCoords } = require('./anticheat');
const { getVisiblePlayers } = require('./geolocation');
const activityStore = require('./activity/activityEngine');

const clients = new Map(); // sessionId -> { ws, playerId, role }

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/' });

  wss.on('connection', (ws) => {
    let sessionId = null;
    let playerId = null;
    let role = null;

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'auth' && msg.session_id && msg.player_id) {
          const session = await sessionsModel.getSession(msg.session_id);
          if (!session || session.player_id !== msg.player_id) {
            ws.send(JSON.stringify({ type: 'error', error: 'invalid session' }));
            return;
          }
          sessionId = msg.session_id;
          playerId = msg.player_id;
          const player = await playersModel.findById(playerId);
          role = player?.role || 'bandit';
          clients.set(sessionId, { ws, playerId, role });
          ws.send(JSON.stringify({ type: 'auth_ok', role }));
          return;
        }

        if (msg.type === 'location' && sessionId && playerId) {
          const { lat, lon, heading, speed_kmh } = msg;
          if (!validateCoords(lat, lon)) {
            ws.send(JSON.stringify({ type: 'error', error: 'invalid coords' }));
            return;
          }
          const session = await sessionsModel.getSession(sessionId);
          const prev = session ? { lat: session.last_lat, lon: session.last_lon } : null;
          const deltaMinutes = session?.last_seen_at
            ? (Date.now() - new Date(session.last_seen_at).getTime()) / 60000
            : 1;
          const speedCheck = checkSpeed(prev, { lat, lon }, deltaMinutes);
          if (!speedCheck.ok) {
            ws.send(JSON.stringify({ type: 'anticheat', reason: speedCheck.reason }));
            return;
          }
          await sessionsModel.updateSessionLocation(sessionId, playerId, {
            lat,
            lon,
            heading,
            speed_kmh,
          });
          broadcastNearbyUpdates();
          return;
        }

        if (msg.type === 'get_nearby' && sessionId && playerId && role) {
          const session = await sessionsModel.getSession(sessionId);
          if (!session?.last_lat) {
            ws.send(JSON.stringify({ type: 'nearby', visible: [] }));
            return;
          }
          const targetRole = role === 'cop' ? 'bandit' : 'cop';
          const others = await sessionsModel.getPlayersWithLocation(targetRole);
          const withCoords = others.map((o) => ({
            ...o,
            lat: o.last_lat,
            lon: o.last_lon,
          }));
          const visible = getVisiblePlayers(role, session.last_lat, session.last_lon, withCoords);
          ws.send(JSON.stringify({ type: 'nearby', visible }));
          const activityZones = activityStore.getNearby(session.last_lat, session.last_lon);
          ws.send(JSON.stringify({ type: 'activity_zones', zones: activityZones }));
          return;
        }
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', error: e.message }));
      }
    });

    ws.on('close', () => {
      if (sessionId) clients.delete(sessionId);
    });
  });
}

async function broadcastNearbyUpdates() {
  for (const [sid, { ws, playerId, role }] of clients) {
    if (ws.readyState !== 1) continue;
    try {
      const session = await sessionsModel.getSession(sid);
      if (!session?.last_lat) continue;
      const targetRole = role === 'cop' ? 'bandit' : 'cop';
      const others = await sessionsModel.getPlayersWithLocation(targetRole);
      const withCoords = others.map((o) => ({
        ...o,
        lat: o.last_lat,
        lon: o.last_lon,
      }));
      const visible = getVisiblePlayers(role, session.last_lat, session.last_lon, withCoords);
      ws.send(JSON.stringify({ type: 'nearby', visible }));
      const activityZones = activityStore.getNearby(session.last_lat, session.last_lon);
      ws.send(JSON.stringify({ type: 'activity_zones', zones: activityZones }));
    } catch (_) {}
  }
}

module.exports = { setupWebSocket };
