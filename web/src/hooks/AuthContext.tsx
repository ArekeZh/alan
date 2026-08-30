import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  fetchMe,
  fetchProgress,
  login as loginRequest,
  logout as logoutRequest,
  saveLessonProgress,
  updatePreferences,
} from '../api/auth';
import { getAuthToken } from '../api/client';
import type { LessonProgress, User, UserPreferences } from '../types';

type AuthContextValue = {
  isReady: boolean;
  user: User | null;
  preferences: UserPreferences | null;
  login: (nickname: string) => Promise<void>;
  logout: () => void;
  updateUserPreferences: (next: Partial<UserPreferences>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  useEffect(() => {
    async function restoreSession() {
      if (!getAuthToken()) {
        setIsReady(true);
        return;
      }

      try {
        const data = await fetchMe();
        setUser(data.user);
        setPreferences(data.preferences);
      } catch {
        logoutRequest();
        setUser(null);
        setPreferences(null);
      } finally {
        setIsReady(true);
      }
    }

    void restoreSession();
  }, []);

  const login = useCallback(async (nickname: string) => {
    const data = await loginRequest(nickname);
    setUser(data.user);
    const me = await fetchMe();
    setPreferences(me.preferences);
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setUser(null);
    setPreferences(null);
  }, []);

  const updateUserPreferences = useCallback(async (next: Partial<UserPreferences>) => {
    const updated = await updatePreferences(next);
    setPreferences(updated);
  }, []);

  const value = useMemo(
    () => ({
      isReady,
      user,
      preferences,
      login,
      logout,
      updateUserPreferences,
    }),
    [isReady, login, logout, preferences, updateUserPreferences, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export type ProgressContextBridge = {
  progress: LessonProgress;
  syncProgress: (lessonId: string, completed: boolean, score: number) => Promise<void>;
  reloadProgress: () => Promise<void>;
};

const ProgressSyncContext = createContext<ProgressContextBridge | null>(null);

export function ProgressSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LessonProgress>({});

  const reloadProgress = useCallback(async () => {
    if (!user) {
      setProgress({});
      return;
    }

    const remoteProgress = await fetchProgress();
    setProgress(remoteProgress);
  }, [user]);

  useEffect(() => {
    void reloadProgress();
  }, [reloadProgress]);

  const syncProgress = useCallback(
    async (lessonId: string, completed: boolean, score: number) => {
      setProgress((current) => ({
        ...current,
        [lessonId]: { completed, score },
      }));

      if (user) {
        await saveLessonProgress(lessonId, completed, score);
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({
      progress,
      syncProgress,
      reloadProgress,
    }),
    [progress, reloadProgress, syncProgress],
  );

  return <ProgressSyncContext.Provider value={value}>{children}</ProgressSyncContext.Provider>;
}

export function useProgressSync() {
  const context = useContext(ProgressSyncContext);
  if (!context) {
    throw new Error('useProgressSync must be used within ProgressSyncProvider');
  }
  return context;
}
