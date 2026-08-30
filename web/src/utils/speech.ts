import { playAudioBytes, playHoverAudioBytes, stopPlayback } from '../services/audioSession';
import { unlockAudio } from '../services/feedbackSound';
import { usesEnglishVoice } from '../services/englishSpeech';
import { hasYandexCredentials, synthesizeSpeech } from '../services/yandexSpeech';
import type { Language } from '../types';

const SPEECH_LOCALES: Record<Language, string[]> = {
  kk: ['kk-KZ', 'kk_KZ', 'kk'],
  ru: ['ru-RU', 'ru_RU', 'ru'],
  en: ['en-US', 'en_US', 'en-GB', 'en'],
};

function localePrefix(code: string) {
  return code.toLowerCase().replace('_', '-').split('-')[0];
}

export function speechLocale(language: Language) {
  return SPEECH_LOCALES[language][0];
}

function pickVoice(language: Language) {
  const voices = window.speechSynthesis.getVoices();
  const preferred = SPEECH_LOCALES[language];

  const exactMatch = voices.find((voice) =>
    preferred.some((code) => voice.lang.replace('_', '-') === code),
  );
  if (exactMatch) {
    return exactMatch;
  }

  return voices.find((voice) => localePrefix(voice.lang) === localePrefix(preferred[0])) ?? null;
}

let speakGeneration = 0;
let hoverEpoch = 0;
let hoverIsSpeaking = false;
let hoverQuietUntil = 0;
let mainSpeechDepth = 0;
let hoverAbortController: AbortController | null = null;

const HOVER_ECHO_MS = 1500;
const MAIN_SPEECH_WAIT_MS = 30_000;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function markHoverFinished() {
  hoverIsSpeaking = false;
  hoverQuietUntil = Date.now() + HOVER_ECHO_MS;
}

export function getHoverEpoch() {
  return hoverEpoch;
}

export function isMainSpeechActive() {
  return mainSpeechDepth > 0;
}

export function isHoverSpeechBlockingCommands() {
  return hoverIsSpeaking || Date.now() < hoverQuietUntil;
}

export function shouldIgnoreMicFromHover(epochBefore: number) {
  const capturedHoverAudio = hoverEpoch !== epochBefore;
  return capturedHoverAudio || isHoverSpeechBlockingCommands();
}

export async function runMainSpeech<T>(action: () => Promise<T>) {
  mainSpeechDepth += 1;
  stopHoverSpeech();
  try {
    return await action();
  } finally {
    mainSpeechDepth -= 1;
  }
}

export function stopSpeaking() {
  speakGeneration += 1;
  window.speechSynthesis.cancel();
}

export function stopHoverSpeech() {
  if (hoverAbortController) {
    hoverAbortController.abort();
    hoverAbortController = null;
  }

  if (!hoverIsSpeaking) {
    return;
  }

  hoverEpoch += 1;
  markHoverFinished();
  window.speechSynthesis.cancel();
  void stopPlayback();
}

async function waitForMainSpeechToFinish(signal: AbortSignal) {
  const startedAt = Date.now();

  while (isMainSpeechActive()) {
    if (signal.aborted || Date.now() - startedAt > MAIN_SPEECH_WAIT_MS) {
      return false;
    }

    await delay(50);
  }

  return !signal.aborted;
}

function speakBrowserText(
  text: string,
  language: Language,
  generation: number,
  rate: number,
  onFinished: () => void,
) {
  const finishIfCurrent = () => {
    if (generation === speakGeneration) {
      onFinished();
    }
  };

  const speakNow = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(language);
    utterance.lang = voice?.lang ?? speechLocale(language);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = finishIfCurrent;
    utterance.onerror = finishIfCurrent;
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    let started = false;
    const startOnce = () => {
      if (started || generation !== speakGeneration) {
        return;
      }
      started = true;
      speakNow();
    };
    window.speechSynthesis.addEventListener('voiceschanged', startOnce, { once: true });
    window.setTimeout(startOnce, 400);
    return;
  }

  speakNow();
}

function speakBrowserTextAsync(
  text: string,
  language: Language,
  rate: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }

    const finish = () => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    };

    const onAbort = () => {
      window.speechSynthesis.cancel();
      finish();
    };

    signal.addEventListener('abort', onAbort);

    const speakNow = () => {
      if (signal.aborted) {
        finish();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(language);
      utterance.lang = voice?.lang ?? speechLocale(language);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      let started = false;
      const startOnce = () => {
        if (started || signal.aborted) {
          return;
        }
        started = true;
        speakNow();
      };
      window.speechSynthesis.addEventListener('voiceschanged', startOnce, { once: true });
      window.setTimeout(startOnce, 400);
      return;
    }

    speakNow();
  });
}

async function speakAssistantVoice(
  text: string,
  language: Language,
  signal: AbortSignal,
  playback: 'main' | 'hover',
) {
  if (signal.aborted) {
    return;
  }

  await unlockAudio();

  if (signal.aborted) {
    return;
  }

  const useYandex = !usesEnglishVoice(language) && hasYandexCredentials();

  if (useYandex) {
    const audio = await synthesizeSpeech(text, language);
    if (signal.aborted) {
      return;
    }

    if (playback === 'main') {
      await playAudioBytes(audio);
      return;
    }

    await playHoverAudioBytes(audio);
    return;
  }

  await speakBrowserTextAsync(text, language, 0.9, signal);
}

export async function speakMainVoice(text: string, language: Language) {
  await stopSpeaking();
  await runMainSpeech(async () => {
    const signal = new AbortController().signal;
    await speakAssistantVoice(text, language, signal, 'main');
  });
}

export function speakHover(text: string, language: Language) {
  void speakHoverAsync(text, language);
}

async function speakHoverAsync(text: string, language: Language) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return;
  }

  stopHoverSpeech();

  const controller = new AbortController();
  hoverAbortController = controller;
  hoverEpoch += 1;
  hoverIsSpeaking = true;
  hoverQuietUntil = Number.POSITIVE_INFINITY;

  try {
    const canSpeak = await waitForMainSpeechToFinish(controller.signal);
    if (!canSpeak || controller.signal.aborted) {
      return;
    }

    await speakAssistantVoice(trimmed, language, controller.signal, 'hover');
  } finally {
    if (hoverAbortController === controller) {
      hoverAbortController = null;
    }
    markHoverFinished();
  }
}

export function speakTextAsync(text: string, language: Language) {
  return new Promise<void>((resolve) => {
    const generation = ++speakGeneration;
    window.speechSynthesis.cancel();
    speakBrowserText(text, language, generation, 0.9, resolve);
  });
}
