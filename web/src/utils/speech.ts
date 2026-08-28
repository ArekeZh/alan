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
let hoverGeneration = 0;
let hoverEpoch = 0;
let hoverIsSpeaking = false;
let hoverQuietUntil = 0;

const HOVER_ECHO_MS = 1500;

function markHoverFinished() {
  hoverIsSpeaking = false;
  hoverQuietUntil = Date.now() + HOVER_ECHO_MS;
}

export function getHoverEpoch() {
  return hoverEpoch;
}

export function isHoverSpeechBlockingCommands() {
  return hoverIsSpeaking || Date.now() < hoverQuietUntil;
}

export function shouldIgnoreMicFromHover(epochBefore: number) {
  const capturedHoverAudio = hoverEpoch !== epochBefore;
  return capturedHoverAudio || isHoverSpeechBlockingCommands();
}

export function stopSpeaking() {
  speakGeneration += 1;
  hoverGeneration += 1;
  if (hoverIsSpeaking) {
    hoverEpoch += 1;
    markHoverFinished();
  } else {
    hoverIsSpeaking = false;
  }
  window.speechSynthesis.cancel();
}

export function stopHoverSpeech() {
  hoverGeneration += 1;
  if (!hoverIsSpeaking) {
    return;
  }

  hoverEpoch += 1;
  markHoverFinished();
  window.speechSynthesis.cancel();
}

function speakUtterance(text: string, language: Language, generation: number, isCurrent: () => boolean) {
  const speakNow = () => {
    if (!isCurrent()) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickVoice(language) ?? (language === 'kk' ? pickVoice('ru') : null);
    utterance.lang = voice?.lang ?? speechLocale(language);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      if (isCurrent()) {
        markHoverFinished();
      }
    };
    utterance.onerror = () => {
      if (isCurrent()) {
        markHoverFinished();
      }
    };
    window.speechSynthesis.speak(utterance);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    let started = false;
    const startOnce = () => {
      if (started || generation !== hoverGeneration) {
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

export function speakHover(text: string, language: Language) {
  const trimmed = text.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return;
  }

  const generation = ++hoverGeneration;
  hoverEpoch += 1;
  hoverIsSpeaking = true;
  hoverQuietUntil = Number.POSITIVE_INFINITY;
  window.speechSynthesis.cancel();

  // Chrome drops speak() if it runs in the same tick as cancel().
  window.setTimeout(() => {
    if (generation !== hoverGeneration) {
      return;
    }
    speakUtterance(trimmed, language, generation, () => generation === hoverGeneration);
  }, 50);
}

export function speakTextAsync(text: string, language: Language) {
  return new Promise<void>((resolve) => {
    const generation = ++speakGeneration;
    if (hoverIsSpeaking) {
      hoverEpoch += 1;
      markHoverFinished();
    }
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
