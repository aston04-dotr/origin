import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MapScreen } from '../components/MapScreen';
import * as api from '../services/api';
import { BANDIT_VISION_RADIUS_M } from '../config';

export function BanditScreen() {
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
      const { visible: list } = await api.getNearby(player.id, location.lat, location.lon, 'bandit');
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

  const handleEscape = async () => {
    if (!sessionId || !player?.id || !location) return;
    setLoading(true);
    try {
      const res = await api.sendAction(sessionId, player.id, 'escape', undefined, location.lat, location.lon);
      await refreshPlayer();
      Alert.alert('Побег', `+${res.xp_gained ?? 0} XP`);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось');
    } finally {
      setLoading(false);
    }
  };

  const handleHide = async () => {
    if (!sessionId || !player?.id || !location) return;
    setLoading(true);
    try {
      const res = await api.sendAction(sessionId, player.id, 'hide', undefined, location.lat, location.lon);
      await refreshPlayer();
      Alert.alert('Скрытие', `+${res.xp_gained ?? 0} XP`);
    } catch (e: any) {
      Alert.alert('Ошибка', e?.message || 'Не удалось');
    } finally {
      setLoading(false);
    }
  };

  const markers = visible.map((v) => ({
    id: v.player_id,
    lat: v.lat,
    lon: v.lon,
    label: v.username,
    role: 'cop',
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapScreen onLocation={sendLocation} visibleMarkers={markers} center={location || undefined}>
        <View style={styles.overlay}>
          <Text style={styles.zoneInfo}>Зона видимости: {BANDIT_VISION_RADIUS_M} м (копы)</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.btnEscape} onPress={handleEscape} disabled={loading}>
              <Text style={styles.btnText}>Побег</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnHide} onPress={handleHide} disabled={loading}>
              <Text style={styles.btnText}>Скрыться</Text>
            </TouchableOpacity>
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
  btnEscape: {
    backgroundColor: '#ea580c',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnHide: {
    backgroundColor: '#4b5563',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
