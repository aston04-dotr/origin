import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export function ProfileScreen() {
  const { player, logout, refreshPlayer } = useAuth();
  const [inventory, setInventory] = useState<Array<{ product_id: string; product_type: string }>>([]);

  useEffect(() => {
    if (!player?.id) return;
    refreshPlayer();
    api.getInventory(player.id).then((r) => setInventory(r.items)).catch(() => setInventory([]));
  }, [player?.id, refreshPlayer]);

  if (!player) return null;

  const roleLabel = player.role === 'cop' ? 'Коп' : 'Бандит';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Профиль</Text>
      <View style={styles.card}>
        <Text style={styles.username}>{player.username}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{roleLabel}</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statLabel}>Уровень</Text>
          <Text style={styles.statValue}>{player.level}</Text>
        </View>
        <View style={styles.stats}>
          <Text style={styles.statLabel}>XP</Text>
          <Text style={styles.statValue}>{player.xp}</Text>
        </View>
      </View>
      {inventory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Инвентарь</Text>
          {inventory.map((i) => (
            <Text key={`${i.product_id}-${i.product_type}`} style={styles.invItem}>
              {i.product_type}: {i.product_id}
            </Text>
          ))}
        </View>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Выйти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 16,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  invItem: {
    color: '#e2e8f0',
    fontSize: 14,
    marginBottom: 4,
  },
  logoutBtn: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  logoutText: {
    color: '#f87171',
    fontWeight: '600',
    fontSize: 16,
  },
});
