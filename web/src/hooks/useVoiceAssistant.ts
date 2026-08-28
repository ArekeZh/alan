import { useLocation } from 'react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getLesson, getLessonsForSection, getModule, getSection, getSectionsForModule, modules } from '../data/content';
import { useLanguage } from '../i18n/LanguageContext';
import { delay, playAudioBytes, requestMicPermission, stopAllAudio } from '../services/audioSession';
import { usesEnglishVoice } from '../services/englishSpeech';
import { playConfirmSound } from '../services/feedbackSound';
import { canRecognizeSpeech, listenForCommand, stopActiveListening } from '../services/speechCapture';
import { hasYandexCredentials, synthesizeSpeech } from '../services/yandexSpeech';
import type { Language } from '../types';
import { buildExerciseAnnouncement, spokenNumber } from '../utils/exerciseSpeech';
import { getModuleIdFromPath, getPageTitleAfterGoingBack, getSectionIdFromPath, pathId } from '../utils/pageTitle';
import {
  getHoverEpoch,
  isHoverSpeechBlockingCommands,
  shouldIgnoreMicFromHover,
  speakTextAsync,
  stopSpeaking,
} from '../utils/speech';
import {
  interpretLessonCommand,
  interpretSectionCommand,
  interpretExerciseAnswer,
  parseSpokenLanguage,
  wantsChangeLanguage,
  wantsGoBack,
  wantsInformation,
  wantsOpenFirstModule,
  wantsRepeat,
  wantsRetryLesson,
  wantsReturnToLessons,
} from '../utils/voiceCommands';
import { useVoiceListening } from './useVoiceListening';

export type VoiceStatus = 'idle' | 'waiting' | 'speaking' | 'listening' | 'thinking' | 'error';

export type ExerciseVoiceBridge = {
  lessonId: string;
  exerciseIndex: number;
  options: number[];
  correctAnswer: number;
  showResult: boolean;
  isFinished: boolean;
  selectAnswer: (value: number) => void | Promise<void>;
  repeatExercise: () => void | Promise<void>;
  retryLesson?: () => void | Promise<void>;
  finishLesson?: () => void | Promise<void>;
};

type UseVoiceAssistantOptions = {
  greeting: string;
  onOpenFirstModule: () => void;
  onOpenSection: (sectionId: string) => void;
  onOpenLesson: (lessonId: string) => void;
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

function getSectionEnteredSpeech(pathname: string, t: Translate) {
  const sectionId = getSectionIdFromPath(pathname);
  const section = sectionId ? getSection(sectionId) : undefined;
  if (!section) {
    return null;
  }

  return t('voice.enteredSection', {
    section: t(`${section.translationKey}.title`),
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

function getSpokenLessonOptions(sectionId: string, t: Translate) {
  return getLessonsForSection(sectionId).map((lesson) => ({
    id: lesson.id,
    names: [t(`${lesson.translationKey}.title`)],
  }));
}

function buildLessonListSpeech(sectionId: string, t: Translate) {
  return getLessonsForSection(sectionId)
    .map((lesson, index) =>
      t('voice.lessonListItem', {
        ordinal: t(`voice.ordinal.${index + 1}`),
        name: t(`${lesson.translationKey}.title`),
      }),
    )
    .join(', ');
}

function getNotUnderstoodKey(pathname: string) {
  if (pathId(pathname, 'lesson')) {
    return 'voice.didNotUnderstandOnLesson';
  }

  if (getSectionIdFromPath(pathname)) {
    return 'voice.didNotUnderstandOnSection';
  }

  if (getModuleIdFromPath(pathname)) {
    return 'voice.didNotUnderstandOnModule';
  }

  return 'voice.didNotUnderstand';
}

export function useVoiceAssistant({
  greeting,
  onOpenFirstModule,
  onOpenSection,
  onOpenLesson,
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
  const openLessonRef = useRef(onOpenLesson);
  const goBackRef = useRef(onGoBack);
  const tRef = useRef(t);
  const pathnameRef = useRef(pathname);
  const setLanguageRef = useRef(setLanguage);
  const statusRef = useRef<VoiceStatus>('idle');
  const previousPathnameRef = useRef<string | null>(null);
  const sessionRef = useRef(0);
  const hasGreetedRef = useRef(false);
  const previousLanguageRef = useRef<Language | null>(null);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  const toggleTalkRef = useRef<() => void>(() => {});
  const followUpWaitRef = useRef<((started: boolean) => void) | null>(null);
  const actOnCommandRef = useRef<(spoken: string, session: number) => Promise<boolean>>(
    async () => false,
  );
  const exerciseBridgeRef = useRef<ExerciseVoiceBridge | null>(null);

  greetingRef.current = greeting;
  languageRef.current = language;
  openModuleRef.current = onOpenFirstModule;
  openSectionRef.current = onOpenSection;
  openLessonRef.current = onOpenLesson;
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

  const announceExercise = useCallback(
    async (lessonId: string, exerciseIndex: number) => {
      const lesson = getLesson(lessonId);
      if (!lesson) {
        return;
      }

      const text = buildExerciseAnnouncement(lesson, exerciseIndex, tRef.current);
      if (!text) {
        return;
      }

      await speak(text, languageRef.current);
    },
    [speak],
  );

  const speakFeedback = useCallback(
    async (text: string) => {
      await speak(text, languageRef.current);
    },
    [speak],
  );

  const registerExerciseBridge = useCallback((bridge: ExerciseVoiceBridge | null) => {
    exerciseBridgeRef.current = bridge;
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
    playConfirmSound();
    const hoverEpochBefore = getHoverEpoch();
    const spoken = await listenForCommand(languageRef.current, forLanguagePick);
    if (!isCurrent(session)) {
      return null;
    }

    if (shouldIgnoreMicFromHover(hoverEpochBefore)) {
      return '';
    }

    setStatus('thinking');
    return spoken ?? '';
  };

  actOnCommandRef.current = async (spoken: string, session: number) => {
    if (isHoverSpeechBlockingCommands()) {
      return false;
    }

    if (wantsChangeLanguage(spoken)) {
      setTranscript(spoken);
      playConfirmSound();

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
        await speak(tRef.current('voice.didNotUnderstandLanguage'), languageRef.current);
        resumeWaiting(session);
        return true;
      }

      return applyLanguageChoice(chosenLanguage);
    }

    if (wantsOpenFirstModule(spoken)) {
      setTranscript(spoken);
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
        resumeWaiting(session);
      }
      return true;
    }

    const currentModuleId = getModuleIdFromPath(pathnameRef.current);

    if (wantsInformation(spoken) && currentModuleId) {
      setTranscript(spoken);
      playConfirmSound();
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
        setTranscript(spoken);
        playConfirmSound();
        statusRef.current = 'idle';
        setStatus('idle');
        openSectionRef.current(sectionCommand.id);
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

    const currentSectionId = getSectionIdFromPath(pathnameRef.current);

    if (wantsInformation(spoken) && currentSectionId) {
      setTranscript(spoken);
      playConfirmSound();
      setStatus('speaking');
      await speak(buildLessonListSpeech(currentSectionId, tRef.current), languageRef.current);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
      return true;
    }

    if (currentSectionId) {
      const lessonCommand = interpretLessonCommand(
        spoken,
        getSpokenLessonOptions(currentSectionId, tRef.current),
      );

      if (lessonCommand.kind === 'match') {
        setTranscript(spoken);
        playConfirmSound();
        statusRef.current = 'speaking';
        setStatus('speaking');
        openLessonRef.current(lessonCommand.id);
        await delay(400);
        if (!isCurrent(session)) {
          return true;
        }

        await announceExercise(lessonCommand.id, 0);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (lessonCommand.kind === 'unknown') {
        setTranscript(spoken);
        setStatus('speaking');
        await speak(tRef.current('voice.unknownLesson'), languageRef.current);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }
    }

    const lessonId = pathId(pathnameRef.current, 'lesson');
    const exerciseBridge = exerciseBridgeRef.current;

    if (lessonId && exerciseBridge && exerciseBridge.lessonId === lessonId && exerciseBridge.isFinished) {
      setTranscript(spoken);

      if (wantsRetryLesson(spoken) && exerciseBridge.retryLesson) {
        playConfirmSound();
        setStatus('speaking');
        await exerciseBridge.retryLesson();
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if ((wantsReturnToLessons(spoken) || wantsGoBack(spoken)) && exerciseBridge.finishLesson) {
        playConfirmSound();
        statusRef.current = 'idle';
        setStatus('idle');
        exerciseBridge.finishLesson();
        return true;
      }

      setStatus('speaking');
      await speak(tRef.current('voice.didNotUnderstandOnLessonComplete'), languageRef.current);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
      return true;
    }

    if (
      lessonId &&
      exerciseBridge &&
      exerciseBridge.lessonId === lessonId &&
      !exerciseBridge.isFinished &&
      !wantsGoBack(spoken)
    ) {
      if (wantsInformation(spoken) || wantsRepeat(spoken)) {
        setTranscript(spoken);
        playConfirmSound();
        setStatus('speaking');
        await exerciseBridge.repeatExercise();
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (exerciseBridge.showResult) {
        return false;
      }

      setTranscript(spoken);

      const parsedAnswer = interpretExerciseAnswer(spoken);
      const answerLabel =
        parsedAnswer !== null
          ? spokenNumber(parsedAnswer, tRef.current)
          : spoken.trim();

      const isCorrect =
        parsedAnswer !== null &&
        exerciseBridge.options.includes(parsedAnswer) &&
        parsedAnswer === exerciseBridge.correctAnswer;

      if (!isCorrect) {
        setStatus('speaking');
        await speak(
          tRef.current('voice.incorrectAnswerRetry', { answer: answerLabel }),
          languageRef.current,
        );
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      playConfirmSound();
      setStatus('speaking');
      await exerciseBridge.selectAnswer(parsedAnswer);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
      return true;
    }

    if (!wantsGoBack(spoken)) {
      return false;
    }

    setTranscript(spoken);
    playConfirmSound();

    const leavingLessonId = pathId(pathnameRef.current, 'lesson');
    const leavingLesson = leavingLessonId ? getLesson(leavingLessonId) : undefined;
    const sectionAfterBack = leavingLesson ? getSection(leavingLesson.sectionId) : undefined;

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

    const shouldAnnounceSection = didGoBack && sectionAfterBack;
    if (shouldAnnounceSection) {
      await delay(300);
      await speak(
        tRef.current('voice.enteredSection', {
          section: tRef.current(`${sectionAfterBack.translationKey}.title`),
        }),
        languageRef.current,
      );
      resumeWaiting(session);
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
    playConfirmSound();

    try {
      const hoverEpochBefore = getHoverEpoch();
      const spoken = await listenForCommand(languageRef.current);
      if (!isCurrent(session)) {
        return;
      }
      if (spoken === null || shouldIgnoreMicFromHover(hoverEpochBefore)) {
        resumeWaiting(session);
        return;
      }

      const spokenText = spoken.trim();
      if (!spokenText) {
        resumeWaiting(session);
        return;
      }

      setStatus('thinking');

      if (await actOnCommandRef.current(spokenText, session)) {
        return;
      }

      setTranscript(spoken);
      setStatus('speaking');
      const notUnderstoodKey = getNotUnderstoodKey(pathnameRef.current);
      await speak(tRef.current(notUnderstoodKey), languageRef.current);
      resumeWaiting(session);
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
      resumeWaiting(session);
    }
  }, [isCurrent, resumeWaiting, speak]);

  startListeningRef.current = startListening;

  const toggleTalk = useCallback(() => {
    if (statusRef.current === 'thinking') {
      return;
    }

    if (statusRef.current === 'listening') {
      playConfirmSound();
      stopActiveListening();
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
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) {
        return;
      }

      const isSpace = event.code === 'Space' || event.key === ' ';
      if (!isSpace) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      toggleTalkRef.current();
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [enabled]);

  const speakGreeting = useCallback(async () => {
    followUpWaitRef.current?.(false);
    followUpWaitRef.current = null;
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

      resumeWaiting(session);
    } catch {
      if (isCurrent(session)) {
        setStatus('error');
      }
    }
  }, [isCurrent, resumeWaiting, speak]);

  const speakGreetingRef = useRef(speakGreeting);
  const resumeWakeRef = useRef(resumeWaiting);
  speakGreetingRef.current = speakGreeting;
  resumeWakeRef.current = resumeWaiting;

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
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
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
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
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

    const isVoiceNavigating =
      statusRef.current === 'speaking' || statusRef.current === 'thinking';
    if (!hasGreetedRef.current || isVoiceNavigating) {
      return;
    }

    const arrivedAtModule =
      Boolean(getModuleIdFromPath(pathname)) &&
      getModuleIdFromPath(previousPath) !== getModuleIdFromPath(pathname);

    if (arrivedAtModule) {
      const enteredSpeech = getModuleEnteredSpeech(pathname, tRef.current);
      if (!enteredSpeech) {
        return;
      }

      const session = ++sessionRef.current;
      statusRef.current = 'speaking';

      void (async () => {
        setStatus('speaking');
        await speak(enteredSpeech, languageRef.current);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
      })();
      return;
    }

    const arrivedAtSection =
      Boolean(getSectionIdFromPath(pathname)) &&
      getSectionIdFromPath(previousPath) !== getSectionIdFromPath(pathname);

    if (arrivedAtSection) {
      const enteredSpeech = getSectionEnteredSpeech(pathname, tRef.current);
      if (!enteredSpeech) {
        return;
      }

      const session = ++sessionRef.current;
      statusRef.current = 'speaking';

      void (async () => {
        setStatus('speaking');
        await speak(enteredSpeech, languageRef.current);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
      })();
      return;
    }

    const currentLessonId = pathId(pathname, 'lesson');
    const previousLessonId = pathId(previousPath, 'lesson');
    const arrivedAtLesson = Boolean(currentLessonId) && currentLessonId !== previousLessonId;

    if (!arrivedAtLesson || !currentLessonId) {
      return;
    }

    const session = ++sessionRef.current;
    statusRef.current = 'speaking';

    void (async () => {
      setStatus('speaking');
      await announceExercise(currentLessonId, 0);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
    })();
  }, [announceExercise, isCurrent, pathname, resumeWaiting, speak]);

  useEffect(() => {
    return () => {
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
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
    toggleTalk,
    registerExerciseBridge,
    announceExercise,
    speakFeedback,
  };
}
