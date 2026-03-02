const BASE_URL = 'http://10.0.2.2:3000';

type PlayerRole = 'cop' | 'bandit';

export interface Player {
  id: string;
  username: string;
  email?: string;
  role: PlayerRole;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  player_id: string;
  device_id?: string;
}

export interface VisiblePlayer {
  player_id: string;
  username: string;
  role: string;
  lat: number;
  lon: number;
  distanceM: number;
  last_seen_at?: string;
}

export async function register(
  username: string,
  role: PlayerRole,
  email?: string,
  deviceId?: string
): Promise<{ player: Player; session_id: string }> {
  const res = await fetch(`${BASE_URL}/api/players/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role, email, device_id: deviceId }),
  });
  const raw = await res.text();
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const err = JSON.parse(raw);
      if (err && typeof err.error === 'string') errMsg = err.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data.player !== 'object' || (data.session_id == null && data.sessionId == null)) {
      throw new Error('Invalid response format');
    }
    return {
      player: data.player,
      session_id: data.session_id != null ? String(data.session_id) : String(data.sessionId),
    };
  } catch (e) {
    if (e instanceof SyntaxError) throw new Error('Invalid response from server');
    throw e;
  }
}

export async function getPlayer(id: string): Promise<Player> {
  const res = await fetch(`${BASE_URL}/api/players/${id}`);
  const text = await res.text();
  if (!res.ok) throw new Error('Player not found');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response');
  }
}

export async function updateLocation(
  sessionId: string,
  playerId: string,
  coords: { lat: number; lon: number; heading?: number; speed_kmh?: number }
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: playerId,
      lat: coords.lat,
      lon: coords.lon,
      heading: coords.heading,
      speed_kmh: coords.speed_kmh,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    let errMsg = res.statusText;
    try {
      const err = JSON.parse(errText);
      if (err && typeof err.error === 'string') errMsg = err.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
}

export async function getNearby(
  playerId: string,
  lat: number,
  lon: number,
  myRole: PlayerRole
): Promise<{ visible: VisiblePlayer[] }> {
  const res = await fetch(`${BASE_URL}/api/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId, lat, lon, my_role: myRole }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error('Nearby failed');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response');
  }
}

export async function sendAction(
  sessionId: string,
  playerId: string,
  actionType: 'patrol' | 'catch' | 'escape' | 'hide',
  targetId?: string,
  lat?: number,
  lon?: number
): Promise<{ ok: boolean; xp_gained?: number }> {
  const res = await fetch(`${BASE_URL}/api/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: playerId,
      action_type: actionType,
      target_id: targetId,
      lat,
      lon,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let errMsg = 'Action failed';
    try {
      const err = JSON.parse(text);
      if (err && typeof err.error === 'string') errMsg = err.error;
    } catch (_) {}
    throw new Error(errMsg);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response');
  }
}

export async function getInventory(playerId: string): Promise<{ items: Array<{ product_id: string; product_type: string; expires_at?: string }> }> {
  const res = await fetch(`${BASE_URL}/api/inventory/${playerId}`);
  const text = await res.text();
  if (!res.ok) throw new Error('Inventory failed');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Invalid response');
  }
}
