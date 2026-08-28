import type { Language } from '../types';
import { speechLocale, stopSpeaking } from '../utils/speech';
import { getAudioContext } from './feedbackSound';

export type RecordingAudio = {
  wavBase64: string;
  bytes: Uint8Array;
  sampleRate: number;
  wavBlob: Blob;
};

const LISTEN_MS = 5500;
const WAKE_MS = 2500;
const TARGET_SAMPLE_RATE = 16000;
const SUPPORTED_STT_RATES = new Set([8000, 16000, 48000]);
const VOICE_PEAK_THRESHOLD = 1800;
const VOICE_RMS_THRESHOLD = 350;

let mediaStream: MediaStream | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let recordGeneration = 0;

export function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function requestMicPermission() {
  try {
    const stream = await getMicStream();
    return Boolean(stream);
  } catch {
    return false;
  }
}

async function getMicStream() {
  const liveTrack = mediaStream?.getAudioTracks()[0];
  if (mediaStream && liveTrack && liveTrack.readyState === 'live') {
    return mediaStream;
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      channelCount: 1,
    },
  });

  return mediaStream;
}

export async function stopPlayback() {
  if (currentSource) {
    const source = currentSource;
    currentSource = null;
    try {
      source.stop();
    } catch {
      // Already stopped.
    }
  }

  if (!currentAudio) {
    return;
  }

  const audio = currentAudio;
  currentAudio = null;
  audio.pause();
  audio.src = '';
}

let recordWait: { resolve: () => void; timeoutId: number } | null = null;
let keepRecordingOnStop = false;

function endRecordWait() {
  if (!recordWait) {
    return;
  }

  window.clearTimeout(recordWait.timeoutId);
  const resolve = recordWait.resolve;
  recordWait = null;
  resolve();
}

export function cancelRecording() {
  keepRecordingOnStop = false;
  recordGeneration += 1;
  endRecordWait();
}

export function finishRecording() {
  keepRecordingOnStop = true;
  endRecordWait();
}

function waitForRecordEnd(durationMs: number) {
  return new Promise<void>((resolve) => {
    const timeoutId = window.setTimeout(() => {
      if (recordWait?.resolve === resolve) {
        recordWait = null;
      }
      resolve();
    }, durationMs);
    recordWait = { resolve, timeoutId };
  });
}

export async function stopAllAudio() {
  cancelRecording();
  stopBrowserRecognition();
  await stopPlayback();
  stopSpeaking();
}

function isWav(bytes: ArrayBuffer) {
  const header = new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength));
  return header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
}

export async function playAudioBytes(bytes: ArrayBuffer) {
  stopSpeaking();
  await stopPlayback();

  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }

  try {
    const audioBuffer = await context.decodeAudioData(bytes.slice(0));
    await new Promise<void>((resolve, reject) => {
      const source = context.createBufferSource();
      currentSource = source;
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.onended = () => {
        if (currentSource === source) {
          currentSource = null;
        }
        resolve();
      };
      try {
        source.start();
      } catch (error) {
        reject(error);
      }
    });
    return;
  } catch {
    // Some browsers decode MP3 more reliably through HTMLAudioElement.
  }

  const mime = isWav(bytes) ? 'audio/wav' : 'audio/mpeg';
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  currentAudio = audio;
  audio.volume = 1;

  try {
    await new Promise<void>((resolve, reject) => {
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Playback failed'));
      void audio.play().catch(reject);
    });
  } finally {
    URL.revokeObjectURL(url);
    if (currentAudio === audio) {
      currentAudio = null;
    }
  }
}

export async function recordCommand() {
  return recordPcm(LISTEN_MS);
}

export async function recordWakeChunk() {
  return recordPcm(WAKE_MS);
}

export async function recordPcm(durationMs: number): Promise<RecordingAudio | null> {
  keepRecordingOnStop = false;
  const generation = ++recordGeneration;
  stopSpeaking();
  await stopPlayback();

  const stream = await getMicStream();
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4096, 1, 1);
  const mute = context.createGain();
  mute.gain.value = 0;

  const chunks: Float32Array[] = [];
  processor.onaudioprocess = (event) => {
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };

  source.connect(processor);
  processor.connect(mute);
  mute.connect(context.destination);

  await waitForRecordEnd(durationMs);

  source.disconnect();
  processor.disconnect();
  mute.disconnect();
  const sampleRate = context.sampleRate;
  await context.close();

  const wasCancelled = generation !== recordGeneration && !keepRecordingOnStop;
  if (wasCancelled) {
    return null;
  }

  const merged = mergeFloat32(chunks);
  const pcm = floatToInt16(merged);
  const resampled = resampleIfNeeded(pcm, sampleRate);
  const wavBuffer = encodeWav(resampled.bytes, resampled.sampleRate);

  return {
    wavBase64: arrayBufferToBase64(wavBuffer),
    bytes: resampled.bytes,
    sampleRate: resampled.sampleRate,
    wavBlob: new Blob([wavBuffer], { type: 'audio/wav' }),
  };
}

export function hasVoiceActivity(pcm: Uint8Array) {
  const sampleCount = Math.floor(pcm.length / 2);
  if (sampleCount < 160) {
    return false;
  }

  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const step = sampleCount > 4000 ? 4 : 1;
  let sumSquares = 0;
  let peak = 0;
  let counted = 0;

  for (let index = 0; index < sampleCount; index += step) {
    const sample = Math.abs(view.getInt16(index * 2, true));
    sumSquares += sample * sample;
    counted += 1;
    if (sample > peak) {
      peak = sample;
    }
  }

  const rms = Math.sqrt(sumSquares / counted);
  return peak > VOICE_PEAK_THRESHOLD && rms > VOICE_RMS_THRESHOLD;
}

function mergeFloat32(chunks: Float32Array[]) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

function floatToInt16(input: Float32Array) {
  const output = new Uint8Array(input.length * 2);
  const view = new DataView(output.buffer);
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]));
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return output;
}

function encodeWav(pcm: Uint8Array, sampleRate: number) {
  const buffer = new ArrayBuffer(44 + pcm.length);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcm.length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buffer, 44).set(pcm);

  return buffer;
}

function writeString(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function resampleIfNeeded(bytes: Uint8Array, sampleRate: number) {
  if (SUPPORTED_STT_RATES.has(sampleRate)) {
    return { bytes, sampleRate };
  }

  return {
    bytes: resamplePcm16(bytes, sampleRate, TARGET_SAMPLE_RATE),
    sampleRate: TARGET_SAMPLE_RATE,
  };
}

function resamplePcm16(input: Uint8Array, fromRate: number, toRate: number) {
  if (fromRate === toRate || fromRate <= 0) {
    return input;
  }

  const inputSamples = Math.floor(input.length / 2);
  const outputSamples = Math.max(1, Math.floor((inputSamples * toRate) / fromRate));
  const output = new Uint8Array(outputSamples * 2);
  const inputView = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const outputView = new DataView(output.buffer);

  for (let index = 0; index < outputSamples; index += 1) {
    const sourceIndex = (index * fromRate) / toRate;
    const leftIndex = Math.min(Math.floor(sourceIndex), inputSamples - 1);
    const rightIndex = Math.min(leftIndex + 1, inputSamples - 1);
    const fraction = sourceIndex - leftIndex;
    const left = inputView.getInt16(leftIndex * 2, true);
    const right = inputView.getInt16(rightIndex * 2, true);
    outputView.setInt16(index * 2, Math.round(left + (right - left) * fraction), true);
  }

  return output;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return window.btoa(binary);
}

export function getSpeechRecognitionCtor() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function hasBrowserSpeechRecognition() {
  return Boolean(getSpeechRecognitionCtor());
}

let browserRecognition: SpeechRecognition | null = null;

export function stopBrowserRecognition() {
  if (!browserRecognition) {
    return;
  }

  const recognition = browserRecognition;
  browserRecognition = null;
  try {
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    recognition.abort();
  } catch {
    // Already stopped.
  }
}

export function recognizeWithBrowser(
  language: Language,
  durationMs: number,
  detectLanguage = false,
) {
  stopBrowserRecognition();

  return new Promise<string>((resolve, reject) => {
    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
      reject(new Error('Speech recognition unavailable'));
      return;
    }

    const recognition = new Recognition();
    browserRecognition = recognition;
    recognition.lang = detectLanguage ? 'en-US' : speechLocale(language);
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.continuous = true;

    let transcript = '';
    let settled = false;

    const finish = (value: string) => {
      if (settled) {
        return;
      }
      settled = true;
      if (browserRecognition === recognition) {
        browserRecognition = null;
      }
      resolve(value);
    };

    recognition.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          transcript += ` ${result[0].transcript}`;
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        finish(transcript.trim());
        return;
      }
      if (!settled) {
        settled = true;
        reject(new Error(event.error));
      }
    };

    recognition.onend = () => {
      finish(transcript.trim());
    };

    window.setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        finish(transcript.trim());
      }
    }, durationMs);

    try {
      recognition.start();
    } catch (error) {
      reject(error);
    }
  });
}

export const listenDurations = {
  command: LISTEN_MS,
  wake: WAKE_MS,
};
