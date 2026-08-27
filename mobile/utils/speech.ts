import * as Speech from 'expo-speech';

import { Language } from '../types';

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

export async function pickVoice(language: Language) {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const preferred = SPEECH_LOCALES[language];

    const exactMatch = voices.find((voice) =>
      preferred.some((code) => voice.language.replace('_', '-') === code),
    );
    if (exactMatch) {
      return exactMatch;
    }

    const prefixMatch = voices.find(
      (voice) => localePrefix(voice.language) === localePrefix(preferred[0]),
    );
    if (prefixMatch) {
      return prefixMatch;
    }
  } catch {
    return null;
  }

  return null;
}

let speakGeneration = 0;

export async function speakText(
  text: string,
  language: Language,
  onFinished?: () => void,
) {
  const generation = ++speakGeneration;
  await Speech.stop();

  const voice = await pickVoice(language);
  const locale = voice?.language ?? speechLocale(language);

  const finishIfCurrent = () => {
    if (generation === speakGeneration) {
      onFinished?.();
    }
  };

  Speech.speak(text, {
    language: locale,
    voice: voice?.identifier,
    rate: 0.85,
    pitch: 1,
    onDone: finishIfCurrent,
    onStopped: finishIfCurrent,
    onError: finishIfCurrent,
  });
}

export async function speakTextAsync(text: string, language: Language) {
  await new Promise<void>((resolve) => {
    speakText(text, language, resolve);
  });
}

export async function stopSpeaking() {
  speakGeneration += 1;
  await Speech.stop();
}
