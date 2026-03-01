import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MapScreen } from '../components/MapScreen';
import * as api from '../services/api';
import { COP_VISION_RADIUS_M } from '../config';

export function CopScreen() {
  const { player, sessionId, refreshPlayer } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [visible, setVisible] = useState<api.VisiblePlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const sendLocation = useCallback(
    async (coords: { lat: number; lon: number }) => {
      if (!sessionId || !player?.id) return;
      setLocation(coords);
      try {
        await api.updateLocation(sessionId, player.id, coords);
      } catch (_) {}
    },
    [sessionId, player?.id]
  );

  const fetchNearby = useCallback(async () => {
    if (!player?.id || !location) return;
    try {
      const { visible: list } = await api.getNearby(player.id, location.lat, location.lon, 'cop');
      setVisible(list);
    } catch (_) {
      setVisible([]);
    }
  }, [player?.id, location?.lat, location?.lon]);

  useEffect(() => {
    if (!location) return;
    const t = setInterval(fetchNearby, 5000);
    fetchNearby();
    return () => clearInterval(t);
  }, [location, fetchNearby]);

  const handlePatrol = async () => {
    if (!sessionId || !player?.id || !location) return;
    setLoading(true);
    try {
      const res = await api.sendAction(sessionId, player.id, 'patrol', undefined, location.lat, location.lon);
      await refreshPlayer();
      Alert.alert('Патруль', `+${res.xp_gained ?? 0} XP`);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось');
    } finally {
      setLoading(false);
    }
  };

  const handleCatch = async (targetId: string) => {
    if (!sessionId || !player?.id || !location) return;
    setLoading(true);
    try {
      const res = await api.sendAction(sessionId, player.id, 'catch', targetId, location.lat, location.lon);
      await refreshPlayer();
      setVisible((prev) => prev.filter((v) => v.player_id !== targetId));
      Alert.alert('Пойман!', `+${res.xp_gained ?? 0} XP`);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не в радиусе поимки');
    } finally {
      setLoading(false);
    }
  };

  const markers = visible.map((v) => ({
    id: v.player_id,
    lat: v.lat,
    lon: v.lon,
    label: v.username,
    role: 'bandit',
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapScreen onLocation={sendLocation} visibleMarkers={markers} center={location || undefined}>
        <View style={styles.overlay}>
          <Text style={styles.zoneInfo}>Зона видимости: {COP_VISION_RADIUS_M} м (бандиты)</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnPatrol} onPress={handlePatrol} disabled={loading}>
              <Text style={styles.btnText}>Патруль</Text>
            </TouchableOpacity>
            {visible.map((v) => (
              <TouchableOpacity
                key={v.player_id}
                style={styles.btnCatch}
                onPress={() => handleCatch(v.player_id)}
                disabled={loading}
              >
                <Text style={styles.btnText}>Поймать {v.username}</Text>
                <Text style={styles.distance}>{Math.round(v.distanceM)} м</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </MapScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
    paddingBottom: 32,
  },
  zoneInfo: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 12,
  },
  buttons: {
    gap: 8,
  },
  btnPatrol: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCatch: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  distance: {
    color: '#fca5a5',
    fontSize: 12,
  },
});
