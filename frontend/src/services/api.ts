import { API_URL } from '../config';

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
  const res = await fetch(`${API_URL}/api/players/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, role, email, device_id: deviceId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export async function getPlayer(id: string): Promise<Player> {
  const res = await fetch(`${API_URL}/api/players/${id}`);
  if (!res.ok) throw new Error('Player not found');
  return res.json();
}

export async function updateLocation(
  sessionId: string,
  playerId: string,
  coords: { lat: number; lon: number; heading?: number; speed_kmh?: number }
): Promise<void> {
  const res = await fetch(`${API_URL}/api/location`, {
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
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Location update failed');
  }
}

export async function getNearby(
  playerId: string,
  lat: number,
  lon: number,
  myRole: PlayerRole
): Promise<{ visible: VisiblePlayer[] }> {
  const res = await fetch(`${API_URL}/api/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player_id: playerId, lat, lon, my_role: myRole }),
  });
  if (!res.ok) throw new Error('Nearby failed');
  return res.json();
}

export async function sendAction(
  sessionId: string,
  playerId: string,
  actionType: 'patrol' | 'catch' | 'escape' | 'hide',
  targetId?: string,
  lat?: number,
  lon?: number
): Promise<{ ok: boolean; xp_gained?: number }> {
  const res = await fetch(`${API_URL}/api/action`, {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Action failed');
  }
  return res.json();
}

export async function getInventory(playerId: string): Promise<{ items: Array<{ product_id: string; product_type: string; expires_at?: string }> }> {
  const res = await fetch(`${API_URL}/api/inventory/${playerId}`);
  if (!res.ok) throw new Error('Inventory failed');
  return res.json();
}
