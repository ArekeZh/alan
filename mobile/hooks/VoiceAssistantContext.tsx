import { router, usePathname } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { getModule, modules } from '../data/content';
import { useLanguage } from '../i18n/LanguageContext';
import { useLessonProgress } from './useLessonProgress';
import { useVoiceAssistant, type ExerciseVoiceBridge, type VoiceStatus } from './useVoiceAssistant';

type VoiceAssistantContextValue = {
  status: VoiceStatus;
  transcript: string;
  recognitionAvailable: boolean;
  repeatGreeting: () => void;
  startListening: () => Promise<void>;
  toggleTalk: () => void;
  registerExerciseBridge: (bridge: ExerciseVoiceBridge | null) => void;
  announceExercise: (lessonId: string, exerciseIndex: number) => Promise<void>;
  speakFeedback: (text: string) => Promise<void>;
};

const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

export function VoiceAssistantProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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
    router.push(`/module/${firstModule.id}`);
  }, [firstModule.id]);

  const onOpenSection = useCallback((sectionId: string) => {
    router.push(`/section/${sectionId}`);
  }, []);

  const onOpenLesson = useCallback((lessonId: string) => {
    router.push(`/lesson/${lessonId}`);
  }, []);

  const onGoBack = useCallback(() => {
    if (pathname === '/' || !router.canGoBack()) {
      return false;
    }
    router.back();
    return true;
  }, [pathname]);

  const voice = useVoiceAssistant({
    greeting,
    onOpenFirstModule,
    onOpenSection,
    onOpenLesson,
    onGoBack,
    enabled: isReady,
  });

  const value = useMemo(
    () => ({
      status: voice.status,
      transcript: voice.transcript,
      recognitionAvailable: voice.recognitionAvailable,
      repeatGreeting: voice.repeatGreeting,
      startListening: voice.startListening,
      toggleTalk: voice.toggleTalk,
      registerExerciseBridge: voice.registerExerciseBridge,
      announceExercise: voice.announceExercise,
      speakFeedback: voice.speakFeedback,
    }),
    [
      voice.announceExercise,
      voice.recognitionAvailable,
      voice.registerExerciseBridge,
      voice.repeatGreeting,
      voice.speakFeedback,
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
