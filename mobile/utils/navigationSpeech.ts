import { stopAllAudio } from '../services/audioSession';
import { stopSpeaking } from './speech';

let navigationInterruptHandler: (() => void) | null = null;

export function registerNavigationInterrupt(handler: () => void) {
  navigationInterruptHandler = handler;
}

export async function interruptSpeechForNavigation() {
  await stopSpeaking();
  await stopAllAudio();
  navigationInterruptHandler?.();
}
