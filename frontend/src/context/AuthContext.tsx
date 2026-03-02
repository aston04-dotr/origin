import React, { createContext, useCallback, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player } from '../services/api';
import { register as apiRegister, getPlayer } from '../services/api';

const STORAGE_KEYS = {
  player: '@shadowrun/player',
  sessionId: '@shadowrun/sessionId',
};

interface AuthState {
  player: Player | null;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, role: 'cop' | 'bandit') => Promise<void>;
  logout: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    player: null,
    sessionId: null,
    loading: true,
    error: null,
  });

  const loadStored = useCallback(async () => {
    try {
      const [playerJson, sessionId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.player),
        AsyncStorage.getItem(STORAGE_KEYS.sessionId),
      ]);
      const player = playerJson ? (JSON.parse(playerJson) as Player) : null;
      setState((s) => ({ ...s, player, sessionId, loading: false }));
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  React.useEffect(() => {
    loadStored();
  }, [loadStored]);

  const login = useCallback(async (username: string, role: 'cop' | 'bandit') => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiRegister(username, role);
      const player = data?.player;
      const sessionId = data?.session_id ?? data?.sessionId;
      if (!player || sessionId == null) {
        throw new Error('Invalid response from server');
      }
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.player, JSON.stringify(player)],
        [STORAGE_KEYS.sessionId, String(sessionId)],
      ]);
      setState({ player, sessionId: String(sessionId), loading: false, error: null });
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e?.message || 'Login failed' }));
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([STORAGE_KEYS.player, STORAGE_KEYS.sessionId]);
    setState({ player: null, sessionId: null, loading: false, error: null });
  }, []);

  const refreshPlayer = useCallback(async () => {
    if (!state.player?.id) return;
    try {
      const player = await getPlayer(state.player.id);
      await AsyncStorage.setItem(STORAGE_KEYS.player, JSON.stringify(player));
      setState((s) => ({ ...s, player }));
    } catch (_) {}
  }, [state.player?.id]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshPlayer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
