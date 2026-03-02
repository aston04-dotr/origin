import React, { createContext, useCallback, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Player } from '../services/api';
import { register as apiRegister, getPlayer } from '../services/api';

const STORAGE_KEYS = {
  player: '@shadowrun/player',
  sessionId: '@shadowrun/sessionId',
};

function createOfflinePlayer(username: string, role: 'cop' | 'bandit'): Player {
  const now = new Date().toISOString();
  return {
    id: 'local-' + Date.now(),
    username: username.trim() || 'Игрок',
    role,
    xp: 0,
    level: 1,
    created_at: now,
    updated_at: now,
  };
}

function createOfflineSessionId(): string {
  return 'local-session-' + Date.now();
}

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

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    if (typeof AsyncStorage?.setItem === 'function') {
      await AsyncStorage.setItem(key, value);
    }
  } catch (_) {}
}

async function safeRemoveItem(key: string): Promise<void> {
  try {
    if (typeof AsyncStorage?.removeItem === 'function') {
      await AsyncStorage.removeItem(key);
    }
  } catch (_) {}
}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    if (typeof AsyncStorage?.getItem === 'function') {
      return await AsyncStorage.getItem(key);
    }
  } catch (_) {}
  return null;
}

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
        safeGetItem(STORAGE_KEYS.player),
        safeGetItem(STORAGE_KEYS.sessionId),
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
    const name = (username || '').trim() || 'Игрок';
    let player: Player | null = null;
    let sessionId: string | null = null;

    try {
      if (typeof apiRegister === 'function') {
        const data = await apiRegister(name, role);
        player = data?.player ?? null;
        sessionId = data?.session_id ?? data?.sessionId ?? null;
      }
    } catch (_) {
      // Игнорируем ошибку API — войдём офлайн
    }

    if (!player || sessionId == null) {
      player = createOfflinePlayer(name, role);
      sessionId = createOfflineSessionId();
    }

    await safeSetItem(STORAGE_KEYS.player, JSON.stringify(player));
    await safeSetItem(STORAGE_KEYS.sessionId, String(sessionId));
    setState({ player, sessionId: String(sessionId), loading: false, error: null });
  }, []);

  const logout = useCallback(async () => {
    await safeRemoveItem(STORAGE_KEYS.player);
    await safeRemoveItem(STORAGE_KEYS.sessionId);
    setState({ player: null, sessionId: null, loading: false, error: null });
  }, []);

  const refreshPlayer = useCallback(async () => {
    if (!state.player?.id) return;
    try {
      const player = await getPlayer(state.player.id);
      await safeSetItem(STORAGE_KEYS.player, JSON.stringify(player));
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
