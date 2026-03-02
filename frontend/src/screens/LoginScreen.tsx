import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export function LoginScreen() {
  const { login, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'cop' | 'bandit'>('bandit');

  const handleSubmit = async () => {
    try {
      await login(username.trim() || 'Игрок', role);
    } catch (e: any) {
      Alert.alert('Ошибка входа', e?.message || 'Не удалось войти');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Shadow Run</Text>
      <Text style={styles.subtitle}>Копы vs Бандиты</Text>
      <TextInput
        style={styles.input}
        placeholder="Никнейм"
        placeholderTextColor="#666"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'cop' && styles.roleBtnActive]}
          onPress={() => setRole('cop')}
        >
          <Text style={[styles.roleBtnText, role === 'cop' && styles.roleBtnTextActive]}>Коп</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleBtn, role === 'bandit' && styles.roleBtnActive]}
          onPress={() => setRole('bandit')}
        >
          <Text style={[styles.roleBtnText, role === 'bandit' && styles.roleBtnTextActive]}>Бандит</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Войти</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f0f1a',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: '#3b82f6',
  },
  roleBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  roleBtnTextActive: {
    color: '#fff',
  },
  error: {
    color: '#f87171',
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
