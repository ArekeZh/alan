import { usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { useLanguage } from '../i18n/LanguageContext';
import { useVoiceListening } from './useVoiceListening';
import {
  deleteRecording,
  playMp3Bytes,
  readPcmFromRecording,
  recordCommand,
  requestMicPermission,
  setSpeakerMode,
  stopAllAudio,
  finishRecording,
  type RecordingAudio,
} from '../services/audioSession';
import {
  hasEnglishSttCredentials,
  transcribeEnglish,
  usesEnglishVoice,
} from '../services/englishSpeech';
import {
  hasYandexCredentials,
  recognizeSpeech,
  synthesizeSpeech,
} from '../services/yandexSpeech';
import { Language } from '../types';
import { getModule, getSection, getSectionsForModule, modules } from '../data/content';
import { getModuleIdFromPath, getPageTitleAfterGoingBack, pathId } from '../utils/pageTitle';
import { speakTextAsync, stopSpeaking } from '../utils/speech';
import {
  interpretSectionCommand,
  parseSpokenLanguage,
  wantsChangeLanguage,
  wantsGoBack,
  wantsInformation,
  wantsOpenFirstModule,
} from '../utils/voiceCommands';

export type VoiceStatus = 'idle' | 'waiting' | 'speaking' | 'listening' | 'thinking' | 'error';

type UseVoiceAssistantOptions = {
  greeting: string;
  onOpenFirstModule: () => void;
  onOpenSection: (sectionId: string) => void;
  onGoBack: () => boolean;
  enabled: boolean;
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

function getModuleEnteredSpeech(pathname: string, t: Translate) {
  const moduleId = getModuleIdFromPath(pathname);
  const module = moduleId ? getModule(moduleId) : undefined;
  if (!module) {
    return null;
  }

  return t('voice.enteredModule', {
    module: t(`${module.translationKey}.title`),
  });
}

function getSpokenSectionOptions(moduleId: string, t: Translate) {
  return getSectionsForModule(moduleId).map((section) => ({
    id: section.id,
    names: [t(`${section.translationKey}.title`), ...section.voiceAliases],
  }));
}

function buildSectionListSpeech(moduleId: string, t: Translate) {
  return getSectionsForModule(moduleId)
    .map((section, index) =>
      t('voice.sectionListItem', {
        ordinal: t(`voice.ordinal.${index + 1}`),
        name: t(`${section.translationKey}.title`),
      }),
    )
    .join(', ');
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function transcribeUtterance(
  recording: RecordingAudio,
  fileUri: string,
  language: Language,
) {
  if (usesEnglishVoice(language)) {
    return transcribeEnglish(recording, fileUri);
  }

  return recognizeSpeech(recording, language);
}

async function transcribeLanguageChoice(
  recording: RecordingAudio,
  fileUri: string,
  language: Language,
) {
  if (hasEnglishSttCredentials()) {
    return transcribeEnglish(recording, fileUri, { detectLanguage: true });
  }

  return recognizeSpeech(recording, language, true);
}

export function useVoiceAssistant({
  greeting,
  onOpenFirstModule,
  onOpenSection,
  onGoBack,
  enabled,
}: UseVoiceAssistantOptions) {
  const { language, setLanguage, t } = useLanguage();
  const { setIsListening } = useVoiceListening();
  const pathname = usePathname();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const yandexReady = hasYandexCredentials();
  const englishSttReady = hasEnglishSttCredentials();
  const englishVoice = usesEnglishVoice(language);

  const greetingRef = useRef(greeting);
  const languageRef = useRef(language);
  const openModuleRef = useRef(onOpenFirstModule);
  const openSectionRef = useRef(onOpenSection);
  const goBackRef = useRef(onGoBack);
  const tRef = useRef(t);
  const pathnameRef = useRef(pathname);
  const setLanguageRef = useRef(setLanguage);
  const statusRef = useRef<VoiceStatus>('idle');
  const previousPathnameRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const hasGreetedRef = useRef(false);
  const previousLanguageRef = useRef<Language | null>(null);
  const startListeningRef = useRef<() => Promise<void>>(async () => { });
  const toggleTalkRef = useRef<() => void>(() => {});
  const followUpWaitRef = useRef<((started: boolean) => void) | null>(null);
  const actOnCommandRef = useRef<(spoken: string, session: number) => Promise<boolean>>(
    async () => false,
  );

  greetingRef.current = greeting;
  languageRef.current = language;
  openModuleRef.current = onOpenFirstModule;
  openSectionRef.current = onOpenSection;
  goBackRef.current = onGoBack;
  tRef.current = t;
  pathnameRef.current = pathname;
  setLanguageRef.current = setLanguage;
  statusRef.current = status;

  const isCurrent = useCallback((session: number) => session === sessionRef.current, []);

  const speak = useCallback(async (text: string, languageToUse: Language) => {
    await stopSpeaking();

    if (usesEnglishVoice(languageToUse)) {
      await setSpeakerMode();
      await delay(250);
      await speakTextAsync(text, languageToUse);
      return;
    }

    const audio = await synthesizeSpeech(text, languageToUse);
    await playMp3Bytes(audio);
  }, []);

  const resumeWaiting = useCallback(
    (session: number) => {
      if (!isCurrent(session)) {
        return;
      }

      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
      setStatus('waiting');
    },
    [isCurrent],
  );

  const listenFollowUpRef = useRef<
    (session: number, forLanguagePick: boolean) => Promise<string | null>
  >(async () => null);

  listenFollowUpRef.current = async (session, forLanguagePick) => {
    setStatus('waiting');
    const started = await new Promise<boolean>((resolve) => {
      followUpWaitRef.current = (value) => {
        followUpWaitRef.current = null;
        resolve(value);
      };
    });
    if (!started || !isCurrent(session)) {
      return null;
    }

    setStatus('listening');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const recordingUri = await recordCommand();
    if (!isCurrent(session)) {
      return null;
    }
    if (!recordingUri) {
      return '';
    }

    setStatus('thinking');
    await setSpeakerMode();
    const recording = await readPcmFromRecording(recordingUri);
    const spoken = forLanguagePick
      ? await transcribeLanguageChoice(recording, recordingUri, languageRef.current)
      : await transcribeUtterance(recording, recordingUri, languageRef.current);
    void deleteRecording(recordingUri);

    if (!isCurrent(session)) {
      return null;
    }

    return spoken;
  };

  actOnCommandRef.current = async (spoken: string, session: number) => {
    if (wantsChangeLanguage(spoken)) {
      setTranscript(spoken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const applyLanguageChoice = async (nextLanguage: Language) => {
        const isSameLanguage = nextLanguage === languageRef.current;
        if (isSameLanguage) {
          setStatus('speaking');
          await speak(tRef.current('voice.alreadyThisLanguage'), languageRef.current);
          resumeWaiting(session);
          return true;
        }

        setLanguageRef.current(nextLanguage);
        return true;
      };

      const namedInCommand = parseSpokenLanguage(spoken);
      if (namedInCommand) {
        return applyLanguageChoice(namedInCommand);
      }

      setStatus('speaking');
      await speak(tRef.current('voice.askWhichLanguage'), languageRef.current);
      if (!isCurrent(session)) {
        return true;
      }

      await delay(400);
      const answer = await listenFollowUpRef.current(session, true);
      if (answer === null || !isCurrent(session)) {
        return true;
      }

      setTranscript(answer);
      const chosenLanguage = parseSpokenLanguage(answer);
      if (!chosenLanguage) {
        setStatus('speaking');
        await speak(
          tRef.current('voice.didNotUnderstandLanguage'),
          languageRef.current,
        );
        resumeWaiting(session);
        return true;
      }

      return applyLanguageChoice(chosenLanguage);
    }

    if (wantsOpenFirstModule(spoken)) {
      setTranscript(spoken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      statusRef.current = 'speaking';
      setStatus('speaking');
      openModuleRef.current();
      await delay(400);
      if (!isCurrent(session)) {
        return true;
      }

      const firstModule = modules[0];
      const enteredSpeech = firstModule
        ? tRef.current('voice.enteredModule', {
            module: tRef.current(`${firstModule.translationKey}.title`),
          })
        : tRef.current('voice.openingModule');
      await speak(enteredSpeech, languageRef.current);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
      return true;
    }

    const currentModuleId = getModuleIdFromPath(pathnameRef.current);

    if (wantsInformation(spoken) && currentModuleId) {
      setTranscript(spoken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('speaking');
      await speak(buildSectionListSpeech(currentModuleId, tRef.current), languageRef.current);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
      return true;
    }

    if (currentModuleId) {
      const sectionCommand = interpretSectionCommand(
        spoken,
        getSpokenSectionOptions(currentModuleId, tRef.current),
      );

      if (sectionCommand.kind === 'match') {
        const section = getSection(sectionCommand.id);
        const sectionTitle = section
          ? tRef.current(`${section.translationKey}.title`)
          : '';

        setTranscript(spoken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus('speaking');
        await speak(
          tRef.current('voice.openingSection', { section: sectionTitle }),
          languageRef.current,
        );
        if (isCurrent(session)) {
          openSectionRef.current(sectionCommand.id);
          resumeWaiting(session);
        }
        return true;
      }

      if (sectionCommand.kind === 'unknown') {
        setTranscript(spoken);
        setStatus('speaking');
        await speak(tRef.current('voice.unknownSection'), languageRef.current);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }
    }

    if (!wantsGoBack(spoken)) {
      return false;
    }

    setTranscript(spoken);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const leavingSectionId = pathId(pathnameRef.current, 'section');
    const leavingSection = leavingSectionId ? getSection(leavingSectionId) : undefined;
    const moduleAfterBack = leavingSection ? getModule(leavingSection.moduleId) : undefined;

    const pageTitle = getPageTitleAfterGoingBack(pathnameRef.current, tRef.current);
    statusRef.current = 'speaking';
    setStatus('speaking');
    const didGoBack = goBackRef.current();
    if (!isCurrent(session)) {
      return true;
    }

    const shouldAnnounceModule = didGoBack && moduleAfterBack;
    if (shouldAnnounceModule) {
      await delay(300);
      await speak(
        tRef.current('voice.enteredModule', {
          module: tRef.current(`${moduleAfterBack.translationKey}.title`),
        }),
        languageRef.current,
      );
      resumeWaiting(session);
      return true;
    }

    const announcedPage = didGoBack ? pageTitle : tRef.current('voice.homePageName');
    await speak(tRef.current('voice.nowOnPage', { page: announcedPage }), languageRef.current);
    resumeWaiting(session);
    return true;
  };

  const startListening = useCallback(async () => {
    followUpWaitRef.current?.(false);
    followUpWaitRef.current = null;
    const session = ++sessionRef.current;
    setTranscript('');

    const micGranted = await requestMicPermission();
    if (!isCurrent(session)) {
      return;
    }

    if (!micGranted) {
      setStatus('error');
      await speak(tRef.current('voice.micDenied'), languageRef.current);
      if (isCurrent(session)) {
        setStatus('idle');
      }
      return;
    }

    setStatus('listening');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const recordingUri = await recordCommand();
      if (!isCurrent(session)) {
        return;
      }
      if (!recordingUri) {
        resumeWaiting(session);
        return;
      }

      setStatus('thinking');
      await setSpeakerMode();
      const recording = await readPcmFromRecording(recordingUri);
      const spoken = await transcribeUtterance(
        recording,
        recordingUri,
        languageRef.current,
      );
      void deleteRecording(recordingUri);

      if (!isCurrent(session)) {
        return;
      }

      const spokenText = spoken.trim();
      if (!spokenText) {
        resumeWaiting(session);
        return;
      }

      if (await actOnCommandRef.current(spokenText, session)) {
        return;
      }

      setTranscript(spoken);
      setStatus('speaking');
      const notUnderstoodKey = getModuleIdFromPath(pathnameRef.current)
        ? 'voice.didNotUnderstandOnModule'
        : 'voice.didNotUnderstand';
      await speak(tRef.current(notUnderstoodKey), languageRef.current);
      resumeWaiting(session);
    } catch (error) {
      if (!isCurrent(session)) {
        return;
      }

      if (__DEV__) {
        console.warn('Voice command failed', error);
      }

      setStatus('error');
      try {
        await speak(tRef.current('voice.error'), languageRef.current);
      } catch {
        // Native iOS TTS after the mic session plays through the earpiece.
      }
      resumeWaiting(session);
    }
  }, [isCurrent, resumeWaiting, speak]);

  startListeningRef.current = startListening;

  const toggleTalk = useCallback(() => {
    if (statusRef.current === 'thinking') {
      return;
    }

    if (statusRef.current === 'listening') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void finishRecording();
      return;
    }

    if (followUpWaitRef.current) {
      followUpWaitRef.current(true);
      return;
    }

    void startListeningRef.current();
  }, []);

  toggleTalkRef.current = toggleTalk;

  useEffect(() => {
    const micIsOn = status === 'listening';
    setIsListening(micIsOn);
  }, [setIsListening, status]);

  useEffect(() => {
    return () => setIsListening(false);
  }, [setIsListening]);

  useEffect(() => {
    if (status === 'waiting' || status === 'listening') {
      const announcement = status === 'waiting' ? t('voice.waiting') : t('voice.listening');
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [status, t]);

  const speakGreeting = useCallback(async () => {
    followUpWaitRef.current?.(false);
    followUpWaitRef.current = null;
    const session = ++sessionRef.current;
    await stopAllAudio();
    await stopSpeaking();
    setStatus('speaking');
    setTranscript('');

    try {
      await speak(greetingRef.current, languageRef.current);
      if (!isCurrent(session)) {
        return;
      }

      const canListen = usesEnglishVoice(languageRef.current)
        ? hasEnglishSttCredentials()
        : hasYandexCredentials();

      if (!canListen) {
        setStatus('idle');
        return;
      }

      resumeWaiting(session);
    } catch {
      if (isCurrent(session)) {
        setStatus('error');
      }
    }
  }, [isCurrent, resumeWaiting, speak]);

  const speakGreetingRef = useRef(speakGreeting);
  const resumeWaitingRef = useRef(resumeWaiting);
  speakGreetingRef.current = speakGreeting;
  resumeWaitingRef.current = resumeWaiting;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const engineReady = englishVoice || yandexReady;
    const canRun = enabled && engineReady && appActive;

    if (!canRun) {
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
      sessionRef.current += 1;
      stopAllAudio();
      stopSpeaking();
      setStatus('idle');
      return;
    }

    const languageChanged =
      previousLanguageRef.current !== null && previousLanguageRef.current !== language;

    if (!hasGreetedRef.current || languageChanged) {
      hasGreetedRef.current = true;
      previousLanguageRef.current = language;
      speakGreetingRef.current();
    } else {
      resumeWaitingRef.current(sessionRef.current);
    }

    return () => {
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
      sessionRef.current += 1;
      stopAllAudio();
    };
  }, [appActive, enabled, englishVoice, language, yandexReady]);

  useEffect(() => {
    const previousPath = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (previousPath === null) {
      return;
    }

    const arrivedAtModule =
      Boolean(getModuleIdFromPath(pathname)) &&
      getModuleIdFromPath(previousPath) !== getModuleIdFromPath(pathname);

    if (!arrivedAtModule || !hasGreetedRef.current) {
      return;
    }

    const isVoiceNavigating =
      statusRef.current === 'speaking' || statusRef.current === 'thinking';
    if (isVoiceNavigating) {
      return;
    }

    const enteredSpeech = getModuleEnteredSpeech(pathname, tRef.current);
    if (!enteredSpeech) {
      return;
    }

    followUpWaitRef.current?.(false);
    followUpWaitRef.current = null;
    const session = ++sessionRef.current;
    statusRef.current = 'speaking';

    void (async () => {
      setStatus('speaking');
      await speak(enteredSpeech, languageRef.current);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
    })();
  }, [isCurrent, pathname, resumeWaiting, speak]);

  useEffect(() => {
    return () => {
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
      sessionRef.current += 1;
      stopAllAudio();
      stopSpeaking();
    };
  }, []);

  const repeatGreeting = useCallback(() => {
    speakGreeting();
  }, [speakGreeting]);

  return {
    status,
    transcript,
    recognitionAvailable: englishVoice ? englishSttReady : yandexReady,
    repeatGreeting,
    startListening,
    toggleTalk,
  };
}
