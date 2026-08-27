import type { RecordingAudio } from './audioSession';
import { Language } from '../types';

const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const GROQ_MODEL = 'whisper-large-v3-turbo';
const COMMAND_HINT = 'Alan. Open module. Go back.';

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

async function transcribeFromFile(fileUri: string, apiKey: string) {
  const form = new FormData();
  form.append('file', {
    uri: fileUri,
    name: 'speech.wav',
    type: 'audio/wav',
  } as unknown as Blob);
  form.append('model', GROQ_MODEL);
  form.append('language', 'en');
  form.append('prompt', COMMAND_HINT);
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

async function transcribeFromBase64(wavBase64: string, apiKey: string) {
  const response = await fetch(GROQ_STT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      language: 'en',
      prompt: COMMAND_HINT,
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

export async function transcribeEnglish(recording: RecordingAudio, fileUri: string) {
  const apiKey = getGroqApiKey();
  if (!apiKey) {
    throw new Error('Groq API key is missing');
  }

  try {
    return await transcribeFromFile(fileUri, apiKey);
  } catch (error) {
    if (__DEV__) {
      console.warn('Groq file upload failed, trying data URL', error);
    }
    return transcribeFromBase64(recording.wavBase64, apiKey);
  }
}
