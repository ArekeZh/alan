import type { RecordingAudio } from './audioSession';
import { Language } from '../types';

const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL = 'whisper-large-v3-turbo';
const COMMAND_HINT = 'Alan. Open module. Go back. Language.';
const LANGUAGE_HINT =
  'Kazakh. Russian. English. Қазақша. Орысша. Ағылшынша. Казахский. Русский. Английский.';

export function usesEnglishVoice(language: Language) {
  return language === 'en';
}

export function getGroqApiKey() {
  return process.env.EXPO_PUBLIC_GROQ_API_KEY ?? '';
}

export function hasEnglishSttCredentials() {
  return getGroqApiKey().length > 0;
}

type GroqTranscription = {
  text?: string;
  error?: { message?: string };
};

type TranscribeOptions = {
  detectLanguage?: boolean;
};

async function transcribeFromFile(fileUri: string, apiKey: string, options?: TranscribeOptions) {
  const form = new FormData();
  form.append('file', {
    uri: fileUri,
    name: 'speech.wav',
    type: 'audio/wav',
  } as unknown as Blob);
  form.append('model', GROQ_MODEL);
  if (!options?.detectLanguage) {
    form.append('language', 'en');
  }
  form.append('prompt', options?.detectLanguage ? LANGUAGE_HINT : COMMAND_HINT);
  form.append('response_format', 'json');
  form.append('temperature', '0');

  const response = await fetch(GROQ_STT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  return readGroqResponse(response);
}

async function transcribeFromBase64(
  wavBase64: string,
  apiKey: string,
  options?: TranscribeOptions,
) {
  const response = await fetch(GROQ_STT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      language: options?.detectLanguage ? undefined : 'en',
      prompt: options?.detectLanguage ? LANGUAGE_HINT : COMMAND_HINT,
      response_format: 'json',
      temperature: 0,
      url: `data:audio/wav;base64,${wavBase64}`,
    }),
  });

  return readGroqResponse(response);
}

async function readGroqResponse(response: Response) {
  const payload = (await response.json()) as GroqTranscription;
  if (!response.ok) {
    throw new Error(payload.error?.message || `Groq STT failed: ${response.status}`);
  }

  return (payload.text ?? '').replace(/\s+/g, ' ').trim();
}

export async function transcribeEnglish(
  recording: RecordingAudio,
  fileUri: string,
  options?: TranscribeOptions,
) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API key is missing');
  }

  try {
    return await transcribeFromFile(fileUri, apiKey, options);
  } catch (error) {
    if (__DEV__) {
      console.warn('Groq file upload failed, trying data URL', error);
    }
    return transcribeFromBase64(recording.wavBase64, apiKey, options);
  }
}
