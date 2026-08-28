import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { LessonProgress } from '../types';

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
  const [progress, setProgress] = useState<LessonProgress>({});
  const [lastOpenedModuleId, setLastOpenedModuleId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedProgress = window.localStorage.getItem(STORAGE_KEY);
      const storedModule = window.localStorage.getItem(LAST_MODULE_KEY);
      if (storedProgress) {
        setProgress(JSON.parse(storedProgress) as LessonProgress);
      }
      if (storedModule) {
        setLastOpenedModuleId(storedModule);
      }
    } catch {
      // Ignore broken localStorage.
    } finally {
      setIsReady(true);
    }
  }, []);

  const markLessonComplete = useCallback(
    async (lessonId: string, score: number, total: number) => {
      setProgress((current) => {
        const nextProgress = {
          ...current,
          [lessonId]: { completed: score === total, score },
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
        return nextProgress;
      });
    },
    [],
  );

  const getLessonStatus = useCallback(
    (lessonId: string) => progress[lessonId],
    [progress],
  );

  const setLastOpenedModule = useCallback(async (moduleId: string) => {
    setLastOpenedModuleId(moduleId);
    window.localStorage.setItem(LAST_MODULE_KEY, moduleId);
  }, []);

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
