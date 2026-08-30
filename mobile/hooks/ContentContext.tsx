import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { fetchContent } from '../api/content';
import { clearContentBundle, getModules, setContentBundle } from '../data/content';
import { useLanguage } from '../i18n/LanguageContext';

type ContentContextValue = {
  isReady: boolean;
  error: string | null;
  modules: ReturnType<typeof getModules>;
  reload: () => Promise<void>;
};

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    setIsReady(false);
    setError(null);

    try {
      const bundle = await fetchContent(language);
      setContentBundle(bundle);
      setVersion((current) => current + 1);
    } catch (loadError) {
      clearContentBundle();
      setError(loadError instanceof Error ? loadError.message : 'Failed to load content');
    } finally {
      setIsReady(true);
    }
  }, [language]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo(
    () => ({
      isReady,
      error,
      modules: getModules(),
      reload,
    }),
    [error, isReady, reload, version],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent() {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
}
