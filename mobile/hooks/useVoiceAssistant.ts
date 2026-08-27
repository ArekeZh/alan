import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AccessibilityInfo } from 'react-native';

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
} from '../services/audioSession';
import {
  hasYandexCredentials,
  recognizeSpeech,
  synthesizeSpeech,
} from '../services/yandexSpeech';
import { Language } from '../types';
import { speakTextAsync, stopSpeaking } from '../utils/speech';
import { wantsOpenFirstModule } from '../utils/voiceCommands';
import { containsWakeWord } from '../utils/wakeWord';

export type VoiceStatus = 'idle' | 'waiting' | 'speaking' | 'listening' | 'thinking' | 'error';

type UseVoiceAssistantOptions = {
  greeting: string;
  onOpenFirstModule: () => void;
  enabled: boolean;
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useVoiceAssistant({
  greeting,
  onOpenFirstModule,
  enabled,
}: UseVoiceAssistantOptions) {
  const { language, t } = useLanguage();
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const credentialsReady = hasYandexCredentials();

  const greetingRef = useRef(greeting);
  const languageRef = useRef(language);
  const openModuleRef = useRef(onOpenFirstModule);
  const tRef = useRef(t);
  const sessionRef = useRef(0);
  const wakeEnabledRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const previousLanguageRef = useRef<Language | null>(null);
  const startListeningRef = useRef<() => Promise<void>>(async () => {});
  const runWakeLoopRef = useRef<(session: number) => Promise<void>>(async () => {});

  greetingRef.current = greeting;
  languageRef.current = language;
  openModuleRef.current = onOpenFirstModule;
  tRef.current = t;

  const isCurrent = useCallback((session: number) => session === sessionRef.current, []);

  const speak = useCallback(
    async (text: string, languageToUse: Language, allowNativeFallback = true) => {
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
        void deleteRecording(recordingUri);

        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }

        if (!hasVoiceActivity(recording.bytes)) {
          continue;
        }

        const spoken = await recognizeSpeech(recording, languageRef.current);
        if (!wakeEnabledRef.current || !isCurrent(session)) {
          return;
        }

        if (!containsWakeWord(spoken)) {
          continue;
        }

        setTranscript(spoken);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        wakeEnabledRef.current = false;

        if (wantsOpenFirstModule(spoken)) {
          setStatus('speaking');
          await speak(tRef.current('voice.openingModule'), languageRef.current, false);
          if (isCurrent(session)) {
            openModuleRef.current();
          }
          return;
        }

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
      void deleteRecording(recordingUri);
      const spoken = await recognizeSpeech(recording, languageRef.current);

      if (!isCurrent(session)) {
        return;
      }

      setTranscript(spoken);

      if (wantsOpenFirstModule(spoken)) {
        setStatus('speaking');
        await speak(tRef.current('voice.openingModule'), languageRef.current, false);
        if (isCurrent(session)) {
          openModuleRef.current();
        }
        return;
      }

      if (containsWakeWord(spoken)) {
        await startListeningRef.current();
        return;
      }

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
    const canRun = enabled && credentialsReady && appActive;

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
  }, [appActive, credentialsReady, enabled, language]);

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
    recognitionAvailable: credentialsReady,
    repeatGreeting,
    startListening,
  };
}
