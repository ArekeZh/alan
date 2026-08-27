import { Language } from '../types';
import type { RecordingAudio } from './audioSession';

const TTS_V3_URL = 'https://tts.api.ml.yandexcloud.kz/tts/v3/utteranceSynthesis';
const TTS_V1_URL = 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize';
const STT_V3_RECOGNIZE_URL = 'https://stt.api.ml.yandexcloud.kz/stt/v3/recognizeFileAsync';
const STT_V3_RESULT_URL = 'https://stt.api.ml.yandexcloud.kz/stt/v3/getRecognition';

const TTS_VOICES: Record<Language, { lang: string; voice: string }> = {
  kk: { lang: 'kk-KZ', voice: 'madi' },
  ru: { lang: 'ru-RU', voice: 'filipp' },
  en: { lang: 'en-US', voice: 'john' },
};

const STT_LANG: Record<Language, string> = {
  kk: 'kk-KZ',
  ru: 'ru-RU',
  en: 'en-US',
};

export function getYandexCredentials() {
  const folderId = process.env.EXPO_PUBLIC_YANDEX_FOLDER_ID ?? '';
  const apiKey = process.env.EXPO_PUBLIC_YANDEX_API_KEY ?? '';
  return { folderId, apiKey };
}

export function hasYandexCredentials() {
  const { folderId, apiKey } = getYandexCredentials();
  return folderId.length > 0 && apiKey.length > 0;
}

function authHeaders() {
  const { apiKey, folderId } = getYandexCredentials();
  return {
    Authorization: `Api-Key ${apiKey}`,
    'x-folder-id': folderId,
  };
}

function prepareTtsText(text: string, language: Language) {
  const withPauses = text
    .replace(/[—–]/g, ',')
    .replace(/([.!?])\s+/g, '$1 sil<[80]> ')
    .replace(/\s+/g, ' ')
    .trim();

  if (language !== 'kk') {
    return withPauses;
  }

  // Phonemes from SpeechKit TTS markup (kz-KZ): https://yandex.cloud/ru-kz/docs/speechkit/tts/markup/tts-supported-phonemes
  return withPauses
    .replace(/Сәлем/gi, '[[s æ l e m]]')
    .replace(/досым/gi, '[[d o s ə m]]')
    .replace(/көш/gi, '<[accented]> [[k ɵ ʃ]]');
}

function concatBase64Chunks(chunks: string[]) {
  const binary = chunks.map((chunk) => globalThis.atob(chunk)).join('');
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function parseJsonObjects(payloadText: string) {
  const objects: Record<string, unknown>[] = [];
  const trimmed = payloadText.trim();
  if (!trimmed) {
    return objects;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      parsed.forEach((item) => {
        if (item && typeof item === 'object') {
          objects.push(item as Record<string, unknown>);
        }
      });
      return objects;
    }
    if (parsed && typeof parsed === 'object') {
      objects.push(parsed as Record<string, unknown>);
      return objects;
    }
  } catch {
    // Fall through to NDJSON.
  }

  for (const line of trimmed.split('\n')) {
    const item = line.trim();
    if (!item) {
      continue;
    }
    try {
      const parsed = JSON.parse(item) as unknown;
      if (parsed && typeof parsed === 'object') {
        objects.push(parsed as Record<string, unknown>);
      }
    } catch {
      // Ignore keep-alive lines.
    }
  }

  return objects;
}

function collectAudioChunks(payloadText: string) {
  const chunks: string[] = [];

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;
    const audioChunk = record.audioChunk;
    if (audioChunk && typeof audioChunk === 'object') {
      const data = (audioChunk as { data?: string }).data;
      if (data) {
        chunks.push(data);
      }
    }

    Object.values(record).forEach(visit);
  };

  parseJsonObjects(payloadText).forEach(visit);

  if (chunks.length === 0) {
    const matches = payloadText.matchAll(/"data"\s*:\s*"([A-Za-z0-9+/]+={0,2})"/g);
    for (const match of matches) {
      chunks.push(match[1]);
    }
  }

  return chunks;
}

function collectTranscript(payloadText: string) {
  const texts: string[] = [];

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const record = value as Record<string, unknown>;
    const normalized = record.normalizedText as { alternatives?: { text?: string }[] } | undefined;
    const alternatives = record.alternatives as { text?: string; words?: unknown[] }[] | undefined;
    const preferred =
      normalized?.alternatives?.[0]?.text ??
      (Array.isArray(alternatives) && Array.isArray(alternatives[0]?.words)
        ? alternatives[0]?.text
        : undefined);

    if (preferred) {
      texts.push(preferred);
    }

    Object.values(record).forEach(visit);
  };

  parseJsonObjects(payloadText).forEach(visit);
  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function synthesizeSpeechV3(text: string, language: Language) {
  const voice = TTS_VOICES[language];
  const response = await fetch(TTS_V3_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: prepareTtsText(text, language),
      hints: [
        { voice: voice.voice },
        { speed: 1.05 },
        { volume: 0 },
        { pitchShift: 90 },
      ],
      outputAudioSpec: {
        containerAudio: {
          containerAudioType: 'WAV',
        },
      },
      loudnessNormalizationType: 'LUFS',
      unsafeMode: true,
    }),
  });

  const payloadText = await response.text();
  if (!response.ok) {
    throw new Error(payloadText || `TTS v3 failed: ${response.status}`);
  }

  const chunks = collectAudioChunks(payloadText);
  if (chunks.length === 0) {
    throw new Error('TTS v3 returned no audio');
  }

  return concatBase64Chunks(chunks);
}

async function synthesizeSpeechV1(text: string, language: Language) {
  const voice = TTS_VOICES[language];
  const body = new URLSearchParams({
    text: prepareTtsText(text, language),
    lang: voice.lang,
    voice: voice.voice,
    format: 'mp3',
    speed: '1.05',
  });

  const response = await fetch(TTS_V1_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok || contentType.includes('json')) {
    const details = await response.text();
    throw new Error(details || `TTS v1 failed: ${response.status}`);
  }

  return response.arrayBuffer();
}

export async function synthesizeSpeech(text: string, language: Language) {
  try {
    return await synthesizeSpeechV3(text, language);
  } catch (error) {
    if (__DEV__) {
      console.warn('TTS v3 failed, using v1', error);
    }
    return synthesizeSpeechV1(text, language);
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return globalThis.btoa(binary);
}

function isWavRecording(recording: RecordingAudio) {
  return recording.wavBase64.startsWith('UklGR');
}

async function startRecognitionV3(recording: RecordingAudio, language: Language) {
  const useWav = isWavRecording(recording);
  const response = await fetch(STT_V3_RECOGNIZE_URL, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: useWav ? recording.wavBase64 : bytesToBase64(recording.bytes),
      recognitionModel: {
        model: 'general',
        audioFormat: useWav
          ? {
              containerAudio: {
                containerAudioType: 'WAV',
              },
            }
          : {
              rawAudio: {
                audioEncoding: 'LINEAR16_PCM',
                sampleRateHertz: String(recording.sampleRate),
                audioChannelCount: '1',
              },
            },
        languageRestriction: {
          restrictionType: 'WHITELIST',
          languageCode: [STT_LANG[language]],
        },
        audioProcessingType: 'FULL_DATA',
      },
    }),
  });

  const payloadText = await response.text();
  if (!response.ok) {
    throw new Error(payloadText || `STT v3 failed: ${response.status}`);
  }

  const payload = JSON.parse(payloadText) as { id?: string };
  if (!payload.id) {
    throw new Error('STT v3 returned no operation id');
  }

  return payload.id;
}

async function readRecognitionV3(operationId: string) {
  const response = await fetch(
    `${STT_V3_RESULT_URL}?operation_id=${encodeURIComponent(operationId)}`,
    {
      method: 'GET',
      headers: authHeaders(),
    },
  );

  const payloadText = await response.text();
  if (response.status === 404 || response.status === 400) {
    return '';
  }

  if (!response.ok) {
    throw new Error(payloadText || `STT v3 result failed: ${response.status}`);
  }

  return collectTranscript(payloadText);
}

async function recognizeSpeechV3(recording: RecordingAudio, language: Language) {
  if (recording.wavBase64.length < 100) {
    return '';
  }

  const operationId = await startRecognitionV3(recording, language);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    await delay(400);
    const transcript = await readRecognitionV3(operationId);
    if (transcript) {
      return transcript;
    }
  }

  throw new Error('STT v3 timed out');
}

export async function recognizeSpeech(recording: RecordingAudio, language: Language) {
  return recognizeSpeechV3(recording, language);
}
