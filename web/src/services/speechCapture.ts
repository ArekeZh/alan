import type { Language } from '../types';
import {
  hasBrowserSpeechRecognition,
  hasVoiceActivity,
  listenDurations,
  recognizeWithBrowser,
  recordCommand,
  recordWakeChunk,
} from './audioSession';
import { hasEnglishSttCredentials, transcribeEnglish, usesEnglishVoice } from './englishSpeech';
import { hasYandexCredentials, recognizeSpeech } from './yandexSpeech';

export function canRecognizeSpeech(language: Language) {
  if (usesEnglishVoice(language)) {
    return hasEnglishSttCredentials() || hasBrowserSpeechRecognition();
  }

  return hasYandexCredentials();
}

export async function listenForCommand(language: Language, forLanguagePick = false) {
  return transcribeListening(language, listenDurations.command, forLanguagePick, false);
}

export async function listenForWake(language: Language) {
  return transcribeListening(language, listenDurations.wake, false, true);
}

async function transcribeListening(
  language: Language,
  durationMs: number,
  forLanguagePick: boolean,
  skipSilentCloud: boolean,
) {
  const useEnglishCloud = usesEnglishVoice(language) && hasEnglishSttCredentials();
  const useYandexCloud = !usesEnglishVoice(language) && hasYandexCredentials();

  if (useEnglishCloud || useYandexCloud) {
    const recording =
      durationMs === listenDurations.command ? await recordCommand() : await recordWakeChunk();

    if (!recording) {
      return null;
    }

    if (skipSilentCloud && !hasVoiceActivity(recording.bytes)) {
      return '';
    }

    if (useEnglishCloud) {
      return transcribeEnglish(recording, { detectLanguage: forLanguagePick });
    }

    return recognizeSpeech(recording, language, forLanguagePick);
  }

  if (usesEnglishVoice(language) && hasBrowserSpeechRecognition()) {
    return recognizeWithBrowser(language, durationMs, forLanguagePick);
  }

  return '';
}
