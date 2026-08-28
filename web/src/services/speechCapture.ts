import type { Language } from '../types';
import {
  finishRecording,
  hasBrowserSpeechRecognition,
  hasVoiceActivity,
  listenDurations,
  recognizeWithBrowser,
  recordCommand,
  stopBrowserRecognition,
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

export function stopActiveListening() {
  finishRecording();
  stopBrowserRecognition();
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
    const recording = await recordCommand();

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
