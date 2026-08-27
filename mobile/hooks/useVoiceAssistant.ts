import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

import { useLanguage } from '../i18n/LanguageContext';
import {
  deleteRecording,
  hasVoiceActivity,
  playMp3Bytes,
  readPcmFromRecording,
  recordCommand,
  recordWakeChunk,
  requestMicPermission,
  setSpeakerMode,
  stopAllAudio,
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
import { speakTextAsync, stopSpeaking } from '../utils/speech';
import { wantsGoBack, wantsOpenFirstModule } from '../utils/voiceCommands';
import { containsWakeWord } from '../utils/wakeWord';

export type VoiceStatus = 'idle' | 'waiting' | 'speaking' | 'listening' | 'thinking' | 'error';

type UseVoiceAssistantOptions = {
  greeting: string;
  onOpenFirstModule: () => void;
  onGoBack: () => boolean;
  enabled: boolean;
};

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

export function useVoiceAssistant({
  greeting,
  onOpenFirstModule,
  onGoBack,
  enabled,
}: UseVoiceAssistantOptions) {
  const { language, t } = useLanguage();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const yandexReady = hasYandexCredentials();
  const englishSttReady = hasEnglishSttCredentials();
  const englishVoice = usesEnglishVoice(language);

  const greetingRef = useRef(greeting);
  const languageRef = useRef(language);
  const openModuleRef = useRef(onOpenFirstModule);
  const goBackRef = useRef(onGoBack);
  const tRef = useRef(t);
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
  goBackRef.current = onGoBack;
  tRef.current = t;

  const isCurrent = useCallback((session: number) => session === sessionRef.current, []);

  const speak = useCallback(
    async (text: string, languageToUse: Language, allowNativeFallback = true) => {
      if (usesEnglishVoice(languageToUse)) {
        await setSpeakerMode();
        await speakTextAsync(text, languageToUse);
        return;
      }

      try {
        const audio = await synthesizeSpeech(text, languageToUse);
        await playMp3Bytes(audio);
      } catch {
        if (!allowNativeFallback) {
          throw new Error('Yandex TTS unavailable after microphone');
        }
        await speakTextAsync(text, languageToUse);
      }
    },
    [],
  );

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

  actOnCommandRef.current = async (spoken: string, session: number) => {
    if (wantsOpenFirstModule(spoken)) {
      setTranscript(spoken);
      wakeEnabledRef.current = false;
      setStatus('speaking');
      await speak(tRef.current('voice.openingModule'), languageRef.current, false);
      if (isCurrent(session)) {
        openModuleRef.current();
        resumeWakeListening(session);
      }
      return true;
    }

    if (!wantsGoBack(spoken)) {
      return false;
    }

    setTranscript(spoken);
    wakeEnabledRef.current = false;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const didGoBack = goBackRef.current();
    if (!isCurrent(session)) {
      return true;
    }

    if (didGoBack) {
      resumeWakeListening(session);
      return true;
    }

    setStatus('speaking');
    await speak(tRef.current('voice.onHomePage'), languageRef.current, false);
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
        const recordingUri = await recordWakeChunk();
        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }
        if (!recordingUri) {
          await delay(150);
          continue;
        }

        const recording = await readPcmFromRecording(recordingUri);

        if (!wakeEnabledRef.current || !isCurrent(session)) {
          void deleteRecording(recordingUri);
          return;
        }

        if (!hasVoiceActivity(recording.bytes)) {
          void deleteRecording(recordingUri);
          continue;
        }

        const spoken = await transcribeUtterance(
          recording,
          recordingUri,
          languageRef.current,
        );
        void deleteRecording(recordingUri);

        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }

        if (await actOnCommandRef.current(spoken, session)) {
          return;
        }

        if (!containsWakeWord(spoken)) {
          continue;
        }

        setTranscript(spoken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        wakeEnabledRef.current = false;
        await startListeningRef.current();
        return;
      } catch (error) {
        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }
        if (__DEV__) {
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const recordingUri = await recordCommand();
      if (!isCurrent(session)) {
        return;
      }
      if (!recordingUri) {
        resumeWakeListening(session);
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

      if (await actOnCommandRef.current(spoken, session)) {
        return;
      }

      if (containsWakeWord(spoken)) {
        await startListeningRef.current();
        return;
      }

      setTranscript(spoken);
      setStatus('speaking');
      await speak(tRef.current('voice.didNotUnderstand'), languageRef.current, false);
      resumeWakeListening(session);
    } catch (error) {
      if (!isCurrent(session)) {
        return;
      }

      if (__DEV__) {
        console.warn('Voice command failed', error);
      }

      setStatus('error');
      try {
        await speak(tRef.current('voice.error'), languageRef.current, false);
      } catch {
        // Native iOS TTS after the mic session plays through the earpiece.
      }
      resumeWakeListening(session);
    }
  }, [isCurrent, resumeWakeListening, speak]);

  startListeningRef.current = startListening;

  useEffect(() => {
    if (status === 'waiting' || status === 'listening') {
      const announcement = status === 'waiting' ? t('voice.waiting') : t('voice.listening');
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [status, t]);

  const speakGreeting = useCallback(async () => {
    wakeEnabledRef.current = false;
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
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(nextState === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const engineReady = englishVoice || yandexReady;
    const canRun = enabled && engineReady && appActive;

    if (!canRun) {
      wakeEnabledRef.current = false;
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
      resumeWakeRef.current(sessionRef.current);
    }

    return () => {
      wakeEnabledRef.current = false;
      sessionRef.current += 1;
      stopAllAudio();
    };
  }, [appActive, enabled, englishVoice, language, yandexReady]);

  useEffect(() => {
    return () => {
      wakeEnabledRef.current = false;
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
  };
}
