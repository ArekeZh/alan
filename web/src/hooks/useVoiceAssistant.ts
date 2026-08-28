import { useLocation } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getModule, getSection, getSectionsForModule, modules } from '../data/content';
import { useLanguage } from '../i18n/LanguageContext';
import { delay, playAudioBytes, requestMicPermission, stopAllAudio } from '../services/audioSession';
import { usesEnglishVoice } from '../services/englishSpeech';
import { playConfirmSound } from '../services/feedbackSound';
import { canRecognizeSpeech, listenForCommand, listenForWake } from '../services/speechCapture';
import { hasYandexCredentials, synthesizeSpeech } from '../services/yandexSpeech';
import type { Language } from '../types';
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
import { containsWakeWord } from '../utils/wakeWord';
import { useVoiceListening } from './useVoiceListening';

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

export function useVoiceAssistant({
  greeting,
  onOpenFirstModule,
  onOpenSection,
  onGoBack,
  enabled,
}: UseVoiceAssistantOptions) {
  const { language, setLanguage, t } = useLanguage();
  const { setIsListening } = useVoiceListening();
  const location = useLocation();
  const pathname = location.pathname;
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [appActive, setAppActive] = useState(
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  );

  const englishVoice = usesEnglishVoice(language);
  const recognitionAvailable = canRecognizeSpeech(language);

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
  const wakeEnabledRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const previousLanguageRef = useRef<Language | null>(null);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  const runWakeLoopRef = useRef<(session: number) => Promise<void>>(async () => {});
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
      await speakTextAsync(text, languageToUse);
      return;
    }

    const audio = await synthesizeSpeech(text, languageToUse);
    await playAudioBytes(audio);
  }, []);

  const resumeWakeListening = useCallback(
    (session: number) => {
      if (!isCurrent(session)) {
        return;
      }

      wakeEnabledRef.current = true;
      setStatus('waiting');
      void runWakeLoopRef.current(session);
    },
    [isCurrent],
  );

  const listenFollowUpRef = useRef<
    (session: number, forLanguagePick: boolean) => Promise<string | null>
  >(async () => null);

  listenFollowUpRef.current = async (session, forLanguagePick) => {
    setStatus('listening');
    const spoken = await listenForCommand(languageRef.current, forLanguagePick);
    if (!isCurrent(session)) {
      return null;
    }

    setStatus('thinking');
    return spoken ?? '';
  };

  actOnCommandRef.current = async (spoken: string, session: number) => {
    if (wantsChangeLanguage(spoken)) {
      setTranscript(spoken);
      wakeEnabledRef.current = false;
      playConfirmSound();

      const applyLanguageChoice = async (nextLanguage: Language) => {
        const isSameLanguage = nextLanguage === languageRef.current;
        if (isSameLanguage) {
          setStatus('speaking');
          await speak(tRef.current('voice.alreadyThisLanguage'), languageRef.current);
          resumeWakeListening(session);
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
        await speak(tRef.current('voice.didNotUnderstandLanguage'), languageRef.current);
        resumeWakeListening(session);
        return true;
      }

      return applyLanguageChoice(chosenLanguage);
    }

    if (wantsOpenFirstModule(spoken)) {
      setTranscript(spoken);
      wakeEnabledRef.current = false;
      playConfirmSound();
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
        resumeWakeListening(session);
      }
      return true;
    }

    const currentModuleId = getModuleIdFromPath(pathnameRef.current);

    if (wantsInformation(spoken) && currentModuleId) {
      setTranscript(spoken);
      wakeEnabledRef.current = false;
      playConfirmSound();
      setStatus('speaking');
      await speak(buildSectionListSpeech(currentModuleId, tRef.current), languageRef.current);
      if (isCurrent(session)) {
        resumeWakeListening(session);
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
        wakeEnabledRef.current = false;
        playConfirmSound();
        setStatus('speaking');
        await speak(
          tRef.current('voice.openingSection', { section: sectionTitle }),
          languageRef.current,
        );
        if (isCurrent(session)) {
          openSectionRef.current(sectionCommand.id);
          resumeWakeListening(session);
        }
        return true;
      }

      if (sectionCommand.kind === 'unknown') {
        setTranscript(spoken);
        wakeEnabledRef.current = false;
        setStatus('speaking');
        await speak(tRef.current('voice.unknownSection'), languageRef.current);
        if (isCurrent(session)) {
          resumeWakeListening(session);
        }
        return true;
      }
    }

    if (!wantsGoBack(spoken)) {
      return false;
    }

    setTranscript(spoken);
    wakeEnabledRef.current = false;
    playConfirmSound();

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
      resumeWakeListening(session);
      return true;
    }

    const announcedPage = didGoBack ? pageTitle : tRef.current('voice.homePageName');
    await speak(tRef.current('voice.nowOnPage', { page: announcedPage }), languageRef.current);
    resumeWakeListening(session);
    return true;
  };

  runWakeLoopRef.current = async (session: number) => {
    const micGranted = await requestMicPermission();
    if (!isCurrent(session) || !wakeEnabledRef.current) {
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

    setStatus('waiting');

    while (wakeEnabledRef.current && isCurrent(session)) {
      try {
        const spoken = await listenForWake(languageRef.current);
        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }
        if (spoken === null) {
          await delay(150);
          continue;
        }
        if (!spoken) {
          continue;
        }

        if (await actOnCommandRef.current(spoken, session)) {
          return;
        }

        if (!containsWakeWord(spoken)) {
          continue;
        }

        setTranscript(spoken);
        playConfirmSound();
        wakeEnabledRef.current = false;
        await startListeningRef.current();
        return;
      } catch (error) {
        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }
        if (import.meta.env.DEV) {
          console.warn('Wake word listen failed', error);
        }
        await delay(500);
      }
    }
  };

  const startListening = useCallback(async () => {
    wakeEnabledRef.current = false;
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
    playConfirmSound();

    try {
      const spoken = await listenForCommand(languageRef.current);
      if (!isCurrent(session)) {
        return;
      }
      if (spoken === null) {
        resumeWakeListening(session);
        return;
      }

      setStatus('thinking');

      if (await actOnCommandRef.current(spoken, session)) {
        return;
      }

      if (containsWakeWord(spoken)) {
        await startListeningRef.current();
        return;
      }

      setTranscript(spoken);
      setStatus('speaking');
      const notUnderstoodKey = getModuleIdFromPath(pathnameRef.current)
        ? 'voice.didNotUnderstandOnModule'
        : 'voice.didNotUnderstand';
      await speak(tRef.current(notUnderstoodKey), languageRef.current);
      resumeWakeListening(session);
    } catch (error) {
      if (!isCurrent(session)) {
        return;
      }

      if (import.meta.env.DEV) {
        console.warn('Voice command failed', error);
      }

      setStatus('error');
      try {
        await speak(tRef.current('voice.error'), languageRef.current);
      } catch {
        // Browser may block speech after a mic error.
      }
      resumeWakeListening(session);
    }
  }, [isCurrent, resumeWakeListening, speak]);

  startListeningRef.current = startListening;

  useEffect(() => {
    const micIsOn = status === 'listening';
    setIsListening(micIsOn);
  }, [setIsListening, status]);

  useEffect(() => {
    return () => setIsListening(false);
  }, [setIsListening]);

  const speakGreeting = useCallback(async () => {
    wakeEnabledRef.current = false;
    const session = ++sessionRef.current;
    await stopAllAudio();
    setStatus('speaking');
    setTranscript('');

    try {
      await speak(greetingRef.current, languageRef.current);
      if (!isCurrent(session)) {
        return;
      }

      if (!canRecognizeSpeech(languageRef.current)) {
        setStatus('idle');
        return;
      }

      await delay(400);
      await startListening();
    } catch {
      if (isCurrent(session)) {
        setStatus('error');
      }
    }
  }, [isCurrent, speak, startListening]);

  const speakGreetingRef = useRef(speakGreeting);
  const resumeWakeRef = useRef(resumeWakeListening);
  speakGreetingRef.current = speakGreeting;
  resumeWakeRef.current = resumeWakeListening;

  useEffect(() => {
    const onVisibility = () => {
      setAppActive(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const engineReady = englishVoice || hasYandexCredentials() || recognitionAvailable;
    const canRun = enabled && engineReady && appActive;

    if (!canRun) {
      wakeEnabledRef.current = false;
      sessionRef.current += 1;
      void stopAllAudio();
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
      resumeWakeRef.current(sessionRef.current);
    }

    return () => {
      wakeEnabledRef.current = false;
      sessionRef.current += 1;
      void stopAllAudio();
    };
  }, [appActive, enabled, englishVoice, language, recognitionAvailable]);

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

    const session = ++sessionRef.current;
    wakeEnabledRef.current = false;
    statusRef.current = 'speaking';

    void (async () => {
      setStatus('speaking');
      await speak(enteredSpeech, languageRef.current);
      if (isCurrent(session)) {
        resumeWakeListening(session);
      }
    })();
  }, [isCurrent, pathname, resumeWakeListening, speak]);

  useEffect(() => {
    return () => {
      wakeEnabledRef.current = false;
      sessionRef.current += 1;
      void stopAllAudio();
    };
  }, []);

  const repeatGreeting = useCallback(() => {
    speakGreeting();
  }, [speakGreeting]);

  return {
    status,
    transcript,
    recognitionAvailable,
    repeatGreeting,
    startListening,
  };
}
