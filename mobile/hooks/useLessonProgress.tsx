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

const STORAGE_KEY = 'lesson_progress';

type ProgressContextValue = {
  isReady: boolean;
  markLessonComplete: (lessonId: string, score: number, total: number) => Promise<void>;
  getLessonStatus: (lessonId: string) => LessonProgress[string] | undefined;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<LessonProgress>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          setProgress(JSON.parse(stored) as LessonProgress);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const markLessonComplete = useCallback(
    async (lessonId: string, score: number, total: number) => {
      setProgress((current) => {
        const nextProgress = {
          ...current,
          [lessonId]: { completed: score === total, score },
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
        return nextProgress;
      });
    },
    [],
  );

  const getLessonStatus = useCallback(
    (lessonId: string) => progress[lessonId],
    [progress],
  );

  const value = useMemo(
    () => ({ isReady, markLessonComplete, getLessonStatus }),
    [isReady, markLessonComplete, getLessonStatus],
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
