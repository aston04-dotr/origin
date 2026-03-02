import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

// Внутриигровые покупки: скины, Battle Pass, усилители.
// Android: Google Play Billing (в проде — нативное API).
// iOS: внешние ссылки на ЮKassa.

const PRODUCTS = [
  { id: 'skin_classic', type: 'skin', name: 'Классический скин', price: '99 ₽' },
  { id: 'skin_gold', type: 'skin', name: 'Золотой скин', price: '299 ₽' },
  { id: 'battle_pass_season1', type: 'battle_pass', name: 'Battle Pass Сезон 1', price: '449 ₽' },
  { id: 'booster_xp_1h', type: 'booster', name: 'Усилитель XP 1 ч', price: '49 ₽' },
];

export function ShopScreen() {
  const { player } = useAuth();

  const handlePurchase = (productId: string, productType: string) => {
    if (!player?.id) return;
    if (Platform.OS === 'ios') {
      // iOS: открыть внешнюю ссылку на оплату (ЮKassa или ваш сайт с формой)
      const yookassaUrl = `https://yookassa.ru/checkout?product=${productId}&user=${player.id}`;
      Linking.openURL(yookassaUrl).catch(() => {});
      return;
    }
    // Android: в проде здесь вызов Google Play Billing (react-native-iap)
    // Для теста — эмуляция через backend
    fetch(`${API_URL}/api/purchases/android/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: player.id,
        product_id: productId,
        product_type: productType,
        order_id: `test_${Date.now()}`,
      }),
    })
      .then(async (r) => {
        const text =
          typeof r.text === 'function'
            ? await r.text()
            : (r as any)._bodyText ?? '';
        return text ? JSON.parse(text) : {};
      })
      .then((data) => {
        if (data && data.ok) alert('Покупка зачислена (тест)');
      })
      .catch(() => alert('Ошибка сервера'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Магазин</Text>
      <Text style={styles.subtitle}>Скины, Battle Pass, усилители</Text>
      {PRODUCTS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={styles.card}
          onPress={() => handlePurchase(p.id, p.type)}
        >
          <Text style={styles.productName}>{p.name}</Text>
          <Text style={styles.productPrice}>{p.price}</Text>
        </TouchableOpacity>
      ))}
      {Platform.OS === 'ios' && (
        <Text style={styles.hint}>На iOS покупки открываются во внешнем браузере (ЮKassa).</Text>
      )}
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
    marginBottom: 4,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productPrice: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 16,
  },
});
