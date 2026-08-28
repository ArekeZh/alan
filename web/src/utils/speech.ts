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

export function stopSpeaking() {
  speakGeneration += 1;
  window.speechSynthesis.cancel();
}

export function speakTextAsync(text: string, language: Language) {
  return new Promise<void>((resolve) => {
    const generation = ++speakGeneration;
    window.speechSynthesis.cancel();

    const finishIfCurrent = () => {
      if (generation === speakGeneration) {
        resolve();
      }
    };

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(language);
      utterance.lang = voice?.lang ?? speechLocale(language);
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.onend = finishIfCurrent;
      utterance.onerror = finishIfCurrent;
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      let started = false;
      const startOnce = () => {
        if (started) {
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
