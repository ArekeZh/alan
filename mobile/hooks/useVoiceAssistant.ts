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
import { getLesson, getLessonsForSection, getModule, getSection, getSectionsForModule, lessonHasIntroVideo, modules } from '../data/content';
import { getModuleIdFromPath, getPageTitleAfterGoingBack, getSectionIdFromPath, pathId } from '../utils/pageTitle';
import { LESSON_VIDEO_SEEK_SECONDS } from '../utils/youtube';
import { buildExerciseAnnouncement, spokenNumber } from '../utils/exerciseSpeech';
import { speakTextAsync, stopSpeaking } from '../utils/speech';
import { registerNavigationInterrupt } from '../utils/navigationSpeech';
import {
  interpretLessonCommand,
  interpretSectionCommand,
  interpretExerciseAnswer,
  isBareLanguageName,
  looksLikeLanguagePromptEcho,
  parseLanguagePickAnswer,
  parseSpokenLanguage,
  wantsChangeLanguage,
  wantsGoBack,
  wantsInformation,
  wantsOpenFirstModule,
  wantsRepeat,
  wantsRetryLesson,
  wantsReturnToLessons,
  wantsSeekBack,
  wantsSeekForward,
  wantsSkipToExercises,
  wantsStopVideo,
  wantsResumeVideo,
} from '../utils/voiceCommands';

export type VoiceStatus = 'idle' | 'waiting' | 'speaking' | 'listening' | 'thinking' | 'error';

export type ExerciseVoiceBridge = {
  lessonId: string;
  exerciseIndex: number;
  correctAnswer: number;
  showResult: boolean;
  isFinished: boolean;
  selectAnswer: (value: number) => void | Promise<void>;
  repeatExercise: () => void | Promise<void>;
  retryLesson?: () => void | Promise<void>;
  finishLesson?: () => void | Promise<void>;
  isWatchingIntro?: boolean;
  skipIntro?: () => void | Promise<void>;
  pauseIntro?: () => void;
  resumeIntro?: () => void;
  seekIntroBy?: (seconds: number) => void;
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
    module: module.title,
  });
}

function getSectionEnteredSpeech(pathname: string, t: Translate) {
  const sectionId = getSectionIdFromPath(pathname);
  const section = sectionId ? getSection(sectionId) : undefined;
  if (!section) {
    return null;
  }

  return t('voice.enteredSection', {
    section: section.title,
  });
}

function getSpokenSectionOptions(moduleId: string, _t: Translate) {
  return getSectionsForModule(moduleId).map((section) => ({
    id: section.id,
    names: [section.title, ...section.voiceAliases],
  }));
}

function buildSectionListSpeech(moduleId: string, t: Translate) {
  return getSectionsForModule(moduleId)
    .map((section, index) =>
      t('voice.sectionListItem', {
        ordinal: t(`voice.ordinal.${index + 1}`),
        name: section.title,
      }),
    )
    .join(', ');
}

function getSpokenLessonOptions(sectionId: string, _t: Translate) {
  return getLessonsForSection(sectionId).map((lesson) => ({
    id: lesson.id,
    names: [lesson.title],
  }));
}

function buildLessonListSpeech(sectionId: string, t: Translate) {
  return getLessonsForSection(sectionId)
    .map((lesson, index) =>
      t('voice.lessonListItem', {
        ordinal: t(`voice.ordinal.${index + 1}`),
        name: lesson.title,
      }),
    )
    .join(', ');
}

function getNotUnderstoodKey(pathname: string, isWatchingIntro: boolean) {
  if (pathId(pathname, 'lesson') && isWatchingIntro) {
    return 'voice.didNotUnderstandOnLessonVideo';
  }

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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isListeningForExerciseAnswer(
  pathname: string,
  bridge: ExerciseVoiceBridge | null,
) {
  const lessonId = pathId(pathname, 'lesson');
  return Boolean(
    lessonId &&
      bridge &&
      bridge.lessonId === lessonId &&
      !bridge.isFinished &&
      !bridge.showResult &&
      !bridge.isWatchingIntro,
  );
}

async function transcribeUtterance(
  recording: RecordingAudio,
  fileUri: string,
  language: Language,
  forExerciseAnswer = false,
) {
  if (usesEnglishVoice(language)) {
    return transcribeEnglish(recording, fileUri, { forExerciseAnswer });
  }

  return recognizeSpeech(recording, language, forExerciseAnswer);
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
  onOpenLesson,
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
  const startListeningRef = useRef<() => Promise<void>>(async () => { });
  const toggleTalkRef = useRef<() => void>(() => {});
  const followUpWaitRef = useRef<((started: boolean) => void) | null>(null);
  const awaitingLanguagePickRef = useRef(false);
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
      await setSpeakerMode();
      await delay(250);
      await speakTextAsync(text, languageToUse);
      return;
    }

    const audio = await synthesizeSpeech(text, languageToUse);
    await playMp3Bytes(audio);
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

  const applyLanguageFromVoice = async (nextLanguage: Language, session: number) => {
    awaitingLanguagePickRef.current = false;

    const isSameLanguage = nextLanguage === languageRef.current;
    if (isSameLanguage) {
      setStatus('speaking');
      await speak(tRef.current('voice.alreadyThisLanguage'), languageRef.current);
      resumeWaiting(session);
      return true;
    }

    setLanguageRef.current(nextLanguage);
    setStatus('speaking');
    return true;
  };

  const listenFollowUpRef = useRef<
    (session: number, forLanguagePick: boolean) => Promise<string | null>
  >(async () => null);

  listenFollowUpRef.current = async (session, forLanguagePick) => {
    if (!forLanguagePick) {
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
    }

    setStatus('listening');
    if (!forLanguagePick) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    if (forLanguagePick) {
      await delay(900);
    }

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
    const forExerciseAnswer = isListeningForExerciseAnswer(
      pathnameRef.current,
      exerciseBridgeRef.current,
    );
    const spoken = forLanguagePick
      ? await transcribeLanguageChoice(recording, recordingUri, languageRef.current)
      : await transcribeUtterance(
          recording,
          recordingUri,
          languageRef.current,
          forExerciseAnswer,
        );
    void deleteRecording(recordingUri);

    if (!isCurrent(session)) {
      return null;
    }

    return spoken;
  };

  actOnCommandRef.current = async (spoken: string, session: number) => {
    if (awaitingLanguagePickRef.current || isBareLanguageName(spoken)) {
      setTranscript(spoken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const chosenLanguage = parseLanguagePickAnswer(spoken);
      if (chosenLanguage) {
        return applyLanguageFromVoice(chosenLanguage, session);
      }

      if (awaitingLanguagePickRef.current) {
        awaitingLanguagePickRef.current = true;
        setStatus('speaking');
        await speak(
          tRef.current('voice.didNotUnderstandLanguage'),
          languageRef.current,
        );
        resumeWaiting(session);
        return true;
      }
    }

    if (wantsChangeLanguage(spoken)) {
      setTranscript(spoken);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const namedInCommand = parseSpokenLanguage(spoken);
      if (namedInCommand) {
        return applyLanguageFromVoice(namedInCommand, session);
      }

      setStatus('speaking');
      awaitingLanguagePickRef.current = true;
      await speak(tRef.current('voice.askWhichLanguage'), languageRef.current);
      if (!isCurrent(session)) {
        awaitingLanguagePickRef.current = false;
        return true;
      }

      await delay(800);
      let answer = await listenFollowUpRef.current(session, true);
      if (answer === null || !isCurrent(session)) {
        awaitingLanguagePickRef.current = false;
        return true;
      }

      let chosenLanguage = answer.trim() ? parseLanguagePickAnswer(answer) : null;
      const shouldRetryLanguagePick =
        answer.trim() &&
        !chosenLanguage &&
        (looksLikeLanguagePromptEcho(answer) || answer.trim().split(/\s+/).length <= 2);

      if (shouldRetryLanguagePick && isCurrent(session)) {
        await delay(500);
        const retryAnswer = await listenFollowUpRef.current(session, true);
        if (retryAnswer && isCurrent(session)) {
          answer = retryAnswer;
          chosenLanguage = parseLanguagePickAnswer(retryAnswer);
        }
      }

      if (!answer.trim()) {
        awaitingLanguagePickRef.current = true;
        resumeWaiting(session);
        return true;
      }

      setTranscript(answer);
      if (!chosenLanguage) {
        awaitingLanguagePickRef.current = true;
        setStatus('speaking');
        await speak(
          tRef.current('voice.didNotUnderstandLanguage'),
          languageRef.current,
        );
        resumeWaiting(session);
        return true;
      }

      return applyLanguageFromVoice(chosenLanguage, session);
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
            module: firstModule.title,
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
        setTranscript(spoken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        openLessonRef.current(lessonCommand.id);

        if (lessonHasIntroVideo(getLesson(lessonCommand.id))) {
          if (isCurrent(session)) {
            resumeWaiting(session);
          }
          return true;
        }

        statusRef.current = 'speaking';
        setStatus('speaking');
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

    if (lessonId && exerciseBridge && exerciseBridge.lessonId === lessonId && exerciseBridge.isWatchingIntro) {
      setTranscript(spoken);

      if (wantsStopVideo(spoken) && exerciseBridge.pauseIntro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        exerciseBridge.pauseIntro();
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (wantsResumeVideo(spoken) && exerciseBridge.resumeIntro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        exerciseBridge.resumeIntro();
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (wantsSeekForward(spoken) && exerciseBridge.seekIntroBy) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        exerciseBridge.seekIntroBy(LESSON_VIDEO_SEEK_SECONDS);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (wantsSeekBack(spoken) && exerciseBridge.seekIntroBy) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        exerciseBridge.seekIntroBy(-LESSON_VIDEO_SEEK_SECONDS);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (wantsSkipToExercises(spoken) && exerciseBridge.skipIntro) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus('speaking');
        await exerciseBridge.skipIntro();
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if (wantsGoBack(spoken)) {
        return false;
      }

      setStatus('speaking');
      await speak(tRef.current('voice.didNotUnderstandOnLessonVideo'), languageRef.current);
      if (isCurrent(session)) {
        resumeWaiting(session);
      }
      return true;
    }

    if (lessonId && exerciseBridge && exerciseBridge.lessonId === lessonId && exerciseBridge.isFinished) {
      setTranscript(spoken);

      if (wantsRetryLesson(spoken) && exerciseBridge.retryLesson) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStatus('speaking');
        await exerciseBridge.retryLesson();
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
        return true;
      }

      if ((wantsReturnToLessons(spoken) || wantsGoBack(spoken)) && exerciseBridge.finishLesson) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

      const isCorrect = parsedAnswer !== null && parsedAnswer === exerciseBridge.correctAnswer;

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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
          section: sectionAfterBack.title,
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
          module: moduleAfterBack.title,
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
    if (!awaitingLanguagePickRef.current) {
      setTranscript('');
    }

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
      const forExerciseAnswer = isListeningForExerciseAnswer(
        pathnameRef.current,
        exerciseBridgeRef.current,
      );
      const spoken = await transcribeUtterance(
        recording,
        recordingUri,
        languageRef.current,
        forExerciseAnswer,
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
      const notUnderstoodKey = getNotUnderstoodKey(
        pathnameRef.current,
        Boolean(exerciseBridgeRef.current?.isWatchingIntro),
      );
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
    registerNavigationInterrupt(() => {
      followUpWaitRef.current?.(false);
      followUpWaitRef.current = null;
      sessionRef.current += 1;
      stopSpeaking();
    });

    return () => {
      registerNavigationInterrupt(() => {});
    };
  }, []);

  useEffect(() => {
    const previousPath = previousPathnameRef.current;
    previousPathnameRef.current = pathname;

    if (previousPath === null || previousPath === pathname) {
      return;
    }

    if (!hasGreetedRef.current) {
      return;
    }

    followUpWaitRef.current?.(false);
    followUpWaitRef.current = null;
    const session = ++sessionRef.current;
    void stopAllAudio();
    stopSpeaking();

    const arrivedAtHome = pathname === '/' && previousPath !== '/';
    if (arrivedAtHome) {
      const homeSpeech = tRef.current('voice.nowOnPage', {
        page: tRef.current('voice.homePageName'),
      });

      void (async () => {
        setStatus('speaking');
        await speak(homeSpeech, languageRef.current);
        if (isCurrent(session)) {
          resumeWaiting(session);
        }
      })();
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

    if (lessonHasIntroVideo(getLesson(currentLessonId))) {
      resumeWaiting(session);
      return;
    }

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
    registerExerciseBridge,
    announceExercise,
    speakFeedback,
  };
}
