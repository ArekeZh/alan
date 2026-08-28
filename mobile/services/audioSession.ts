import {
  AudioQuality,
  IOSOutputFormat,
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioPlayer,
  type RecordingOptions,
} from 'expo-audio';
import AudioNativeModule from 'expo-audio/build/AudioModule';
import * as FileSystem from 'expo-file-system/legacy';

import { stopSpeaking } from '../utils/speech';

const LISTEN_MS = 5500;
const WAKE_MS = 2500;
const TARGET_SAMPLE_RATE = 16000;
const SUPPORTED_STT_RATES = new Set([8000, 16000, 48000]);
const VOICE_PEAK_THRESHOLD = 1800;
const VOICE_RMS_THRESHOLD = 350;

const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 256000,
  android: {
    extension: '.wav',
    outputFormat: 'default',
    audioEncoder: 'default',
    sampleRate: 16000,
    audioSource: 'voice_recognition',
  },
  ios: {
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    sampleRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/wav',
    bitsPerSecond: 128000,
  },
};

export type RecordingAudio = {
  wavBase64: string;
  bytes: Uint8Array;
  sampleRate: number;
};

let currentPlayer: AudioPlayer | null = null;
let currentRecorder: InstanceType<typeof AudioNativeModule.AudioRecorder> | null = null;
let recordGate: { resolve: (uri: string | null) => void; settled: boolean } | null = null;

function settleRecordGate(uri: string | null) {
  if (!recordGate || recordGate.settled) {
    return;
  }

  recordGate.settled = true;
  recordGate.resolve(uri);
}

export async function requestMicPermission() {
  const permission = await requestRecordingPermissionsAsync();
  return permission.granted;
}

export async function stopPlayback() {
  if (!currentPlayer) {
    return;
  }

  const player = currentPlayer;
  currentPlayer = null;

  try {
    player.pause();
    player.remove();
  } catch {
    // Already released.
  }
}

async function stopRecorder() {
  const recorder = currentRecorder;
  currentRecorder = null;
  if (!recorder) {
    return null;
  }

  try {
    if (recorder.isRecording) {
      await recorder.stop();
    }
    return recorder.uri;
  } catch {
    return recorder.uri;
  }
}

export async function stopRecording() {
  const uri = await stopRecorder();
  settleRecordGate(uri);
  return uri;
}

export async function finishRecording() {
  return stopRecording();
}

export async function cancelRecording() {
  const uri = await stopRecorder();
  if (uri) {
    void deleteRecording(uri);
  }
  settleRecordGate(null);
}

export async function stopAllAudio() {
  await stopPlayback();
  await cancelRecording();
}

export async function setSpeakerMode() {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: false,
    shouldRouteThroughEarpiece: false,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  });
  await setIsAudioActiveAsync(false);
  await delay(200);
  await setIsAudioActiveAsync(true);
}

async function setRecordingMode() {
  await setAudioModeAsync({
    playsInSilentMode: true,
    allowsRecording: true,
    shouldRouteThroughEarpiece: false,
    shouldPlayInBackground: false,
    interruptionMode: 'doNotMix',
  });
  await setIsAudioActiveAsync(true);
}

function audioExtension(bytes: ArrayBuffer) {
  const header = new Uint8Array(bytes, 0, Math.min(4, bytes.byteLength));
  const isWav = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46;
  return isWav ? 'wav' : 'mp3';
}

export async function playMp3Bytes(bytes: ArrayBuffer) {
  await stopSpeaking();
  await stopPlayback();
  await setSpeakerMode();

  const cacheDir = FileSystem.cacheDirectory;
  if (!cacheDir) {
    throw new Error('No cache directory');
  }

  const extension = audioExtension(bytes);
  const fileUri = `${cacheDir}yandex-tts-${Date.now()}.${extension}`;
  await FileSystem.writeAsStringAsync(fileUri, arrayBufferToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });

  const player = createAudioPlayer({ uri: fileUri }, { updateInterval: 80 });
  currentPlayer = player;
  player.volume = 1;

  await waitForPlayback(player);

  if (currentPlayer === player) {
    try {
      player.remove();
    } catch {
      // Already released.
    }
    currentPlayer = null;
  }
}

async function recordForDuration(durationMs: number): Promise<string | null> {
  await stopSpeaking();
  await stopPlayback();
  await cancelRecording();
  await setRecordingMode();

  const recorder = new AudioNativeModule.AudioRecorder(RECORDING_OPTIONS);
  currentRecorder = recorder;
  await recorder.prepareToRecordAsync(RECORDING_OPTIONS);
  recorder.record();

  const uri = await new Promise<string | null>((resolve) => {
    recordGate = { resolve, settled: false };
    setTimeout(() => {
      if (!recordGate?.settled) {
        void finishRecording();
      }
    }, durationMs);
  });

  recordGate = null;
  return uri;
}

export async function recordCommand(): Promise<string | null> {
  const uri = await recordForDuration(LISTEN_MS);
  await setSpeakerMode();
  return uri;
}

export async function recordWakeChunk(): Promise<string | null> {
  return recordForDuration(WAKE_MS);
}

export async function deleteRecording(uri: string) {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Temporary cache file may already be gone.
  }
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

export async function readPcmFromRecording(uri: string): Promise<RecordingAudio> {
  const wavBase64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const parsed = parseWavOrPcm(base64ToBytes(wavBase64));
  const resampled = resampleIfNeeded(parsed.bytes, parsed.sampleRate);

  return {
    wavBase64,
    bytes: resampled.bytes,
    sampleRate: resampled.sampleRate,
  };
}

function waitForPlayback(player: AudioPlayer) {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      subscription.remove();
      reject(new Error('Playback timed out'));
    }, 30000);

    const finish = () => {
      clearTimeout(timeout);
      subscription.remove();
      resolve();
    };

    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.didJustFinish) {
        finish();
      }
    });

    try {
      player.play();
    } catch (error) {
      clearTimeout(timeout);
      subscription.remove();
      reject(error);
    }
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readUint16(bytes: Uint8Array, offset: number) {
  return bytes[offset] + (bytes[offset + 1] << 8);
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (
    (bytes[offset] +
      (bytes[offset + 1] << 8) +
      (bytes[offset + 2] << 16) +
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function parseWavOrPcm(bytes: Uint8Array): { bytes: Uint8Array; sampleRate: number } {
  const isRiff =
    bytes.length > 44 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46;

  if (!isRiff) {
    return { bytes, sampleRate: TARGET_SAMPLE_RATE };
  }

  let sampleRate = TARGET_SAMPLE_RATE;
  let channels = 1;
  let dataStart = 44;
  let dataSize = bytes.length - 44;
  let index = 12;

  while (index + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(
      bytes[index],
      bytes[index + 1],
      bytes[index + 2],
      bytes[index + 3],
    );
    const chunkSize = readUint32(bytes, index + 4);

    if (chunkId === 'fmt ' && chunkSize >= 16) {
      channels = readUint16(bytes, index + 10);
      sampleRate = readUint32(bytes, index + 12);
    }

    if (chunkId === 'data') {
      dataStart = index + 8;
      dataSize = chunkSize;
      break;
    }

    index += 8 + chunkSize + (chunkSize % 2);
  }

  let pcm = bytes.slice(dataStart, dataStart + dataSize);
  if (channels > 1) {
    pcm = downmixToMono(pcm, channels);
  }

  return { bytes: pcm, sampleRate };
}

function downmixToMono(bytes: Uint8Array, channels: number) {
  const frameCount = Math.floor(bytes.length / (2 * channels));
  const mono = new Uint8Array(frameCount * 2);
  const input = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const output = new DataView(mono.buffer);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let sum = 0;
    for (let channel = 0; channel < channels; channel += 1) {
      sum += input.getInt16((frame * channels + channel) * 2, true);
    }
    output.setInt16(frame * 2, Math.round(sum / channels), true);
  }

  return mono;
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

function base64ToBytes(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return globalThis.btoa(binary);
}
