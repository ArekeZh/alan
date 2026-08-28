import { useLocation, useNavigate } from 'react-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { getModule, modules } from '../data/content';
import { useLanguage } from '../i18n/LanguageContext';
import { requestMicPermission } from '../services/audioSession';
import { unlockAudio } from '../services/feedbackSound';
import { useLessonProgress } from './useLessonProgress';
import { useVoiceAssistant, type VoiceStatus } from './useVoiceAssistant';

type VoiceAssistantContextValue = {
  status: VoiceStatus;
  transcript: string;
  recognitionAvailable: boolean;
  repeatGreeting: () => void;
  startListening: () => Promise<void>;
  toggleTalk: () => void;
  audioUnlocked: boolean;
  unlockAudioSession: () => Promise<void>;
};

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { isReady, lastOpenedModuleId } = useLessonProgress();

  const firstModule = modules[0];
  const lastModule = lastOpenedModuleId ? getModule(lastOpenedModuleId) : undefined;
  const progressModule = lastModule ?? firstModule;
  const progressModuleTitle = t(`${progressModule.translationKey}.title`);

  const greeting = useMemo(() => {
    const progressLine = lastModule
      ? t('voice.progressAtModule', { module: progressModuleTitle })
      : t('voice.progressNotStarted', { module: progressModuleTitle });

    return `${t('voice.greeting')} ${progressLine} ${t('voice.askCommand')}`;
  }, [lastModule, progressModuleTitle, t]);

  const onOpenFirstModule = useCallback(() => {
    navigate(`/module/${firstModule.id}`);
  }, [firstModule.id, navigate]);

  const onOpenSection = useCallback(
    (sectionId: string) => {
      navigate(`/section/${sectionId}`);
    },
    [navigate],
  );

  const onOpenLesson = useCallback(
    (lessonId: string) => {
      navigate(`/lesson/${lessonId}`);
    },
    [navigate],
  );

  const onGoBack = useCallback(() => {
    if (location.pathname === '/') {
      return false;
    }
    void navigate(-1);
    return true;
  }, [location.pathname, navigate]);

  const unlockAudioSession = useCallback(async () => {
    await unlockAudio();
    await requestMicPermission();
    setAudioUnlocked(true);
  }, []);

  const voice = useVoiceAssistant({
    greeting,
    onOpenFirstModule,
    onOpenSection,
    onOpenLesson,
    onGoBack,
    enabled: isReady && audioUnlocked,
  });

  const value = useMemo(
    () => ({
      status: voice.status,
      transcript: voice.transcript,
      recognitionAvailable: voice.recognitionAvailable,
      repeatGreeting: voice.repeatGreeting,
      startListening: voice.startListening,
      toggleTalk: voice.toggleTalk,
      audioUnlocked,
      unlockAudioSession,
    }),
    [
      audioUnlocked,
      unlockAudioSession,
      voice.recognitionAvailable,
      voice.repeatGreeting,
      voice.startListening,
      voice.status,
      voice.transcript,
      voice.toggleTalk,
    ],
  );

  return (
    <VoiceAssistantContext.Provider value={value}>{children}</VoiceAssistantContext.Provider>
  );
}

export function useVoiceAssistantState() {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistantState must be used within VoiceAssistantProvider');
  }
  return context;
}
