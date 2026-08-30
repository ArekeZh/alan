import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { LessonProgress } from '../types';
import { useAuth, useProgressSync } from './AuthContext';

const STORAGE_KEY = 'lesson_progress';
const LAST_MODULE_KEY = 'last_opened_module';

type ProgressContextValue = {
  isReady: boolean;
  lastOpenedModuleId: string | null;
  markLessonComplete: (lessonId: string, score: number, total: number) => Promise<void>;
  setLastOpenedModule: (moduleId: string) => Promise<void>;
  getLessonStatus: (lessonId: string) => LessonProgress[string] | undefined;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user, preferences, updateUserPreferences } = useAuth();
  const { progress: remoteProgress, syncProgress } = useProgressSync();
  const [localProgress, setLocalProgress] = useState<LessonProgress>({});
  const [lastOpenedModuleId, setLastOpenedModuleId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(LAST_MODULE_KEY),
    ])
      .then(([storedProgress, storedModule]) => {
        if (storedProgress) {
          setLocalProgress(JSON.parse(storedProgress) as LessonProgress);
        }
        if (storedModule) {
          setLastOpenedModuleId(storedModule);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (preferences?.last_opened_module_id) {
      setLastOpenedModuleId(preferences.last_opened_module_id);
    }
  }, [preferences?.last_opened_module_id]);

  const progress = user ? remoteProgress : localProgress;

  const markLessonComplete = useCallback(
    async (lessonId: string, score: number, total: number) => {
      const completed = score === total;
      const entry = { completed, score };

      if (user) {
        await syncProgress(lessonId, completed, score);
        return;
      }

      setLocalProgress((current) => {
        const nextProgress = {
          ...current,
          [lessonId]: entry,
        };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
        return nextProgress;
      });
    },
    [syncProgress, user],
  );

  const getLessonStatus = useCallback(
    (lessonId: string) => progress[lessonId],
    [progress],
  );

  const setLastOpenedModule = useCallback(
    async (moduleId: string) => {
      setLastOpenedModuleId(moduleId);
      await AsyncStorage.setItem(LAST_MODULE_KEY, moduleId);

      if (user) {
        await updateUserPreferences({ last_opened_module_id: moduleId });
      }
    },
    [updateUserPreferences, user],
  );

  const value = useMemo(
    () => ({
      isReady,
      lastOpenedModuleId,
      markLessonComplete,
      setLastOpenedModule,
      getLessonStatus,
    }),
    [isReady, lastOpenedModuleId, markLessonComplete, setLastOpenedModule, getLessonStatus],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useLessonProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useLessonProgress must be used within ProgressProvider');
  }
  return context;
}
