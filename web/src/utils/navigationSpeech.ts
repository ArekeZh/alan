import { stopAllAudio } from '../services/audioSession';
import { stopHoverSpeech } from './speech';

let navigationInterruptHandler: (() => void) | null = null;

export function registerNavigationInterrupt(handler: () => void) {
  navigationInterruptHandler = handler;
}

export function interruptSpeechForNavigation() {
  stopHoverSpeech();
  void stopAllAudio();
  navigationInterruptHandler?.();
}
