import type { Language } from '../types';
import {
  delay,
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

export async function listenForCommand(
  language: Language,
  forLanguagePick = false,
  forExerciseAnswer = false,
) {
  if (forLanguagePick) {
    return listenForLanguageChoice(language);
  }

  return transcribeListening(language, listenDurations.command, false, false, forExerciseAnswer);
}

export async function listenForLanguageChoice(language: Language) {
  if (usesEnglishVoice(language) && hasBrowserSpeechRecognition()) {
    await delay(700);
    try {
      const transcript = await recognizeWithBrowser(language, 5000, true);
      if (transcript.trim()) {
        return transcript;
      }
    } catch {
      // Fall through to cloud STT.
    }
  }

  return transcribeListening(language, listenDurations.command, true, false);
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
  forExerciseAnswer = false,
) {
  const useEnglishCloud = usesEnglishVoice(language) && hasEnglishSttCredentials();
  const useYandexCloud = !usesEnglishVoice(language) && hasYandexCredentials();

  if (useEnglishCloud || useYandexCloud) {
    if (forLanguagePick) {
      await delay(900);
    }

    const recording = await recordCommand();

    if (!recording) {
      return null;
    }

    if (skipSilentCloud && !hasVoiceActivity(recording.bytes)) {
      return '';
    }

    if (useEnglishCloud) {
      return transcribeEnglish(recording, {
        detectLanguage: forLanguagePick,
        forExerciseAnswer,
      });
    }

    return recognizeSpeech(recording, language, forLanguagePick || forExerciseAnswer);
  }

  if (usesEnglishVoice(language) && hasBrowserSpeechRecognition()) {
    return recognizeWithBrowser(language, durationMs, forLanguagePick);
  }

  return '';
}
