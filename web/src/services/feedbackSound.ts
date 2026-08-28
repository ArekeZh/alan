let audioContext: AudioContext | null = null;

export function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export async function unlockAudio() {
  const context = getAudioContext();
  if (context.state === 'suspended') {
    await context.resume();
  }
}

function playTone(
  frequency: number,
  startAt: number,
  duration: number,
  type: OscillatorType = 'sine',
) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
}

export function playSuccessSound() {
  const context = getAudioContext();
  const now = context.currentTime;
  playTone(523.25, now, 0.14);
  playTone(783.99, now + 0.12, 0.22);
}

export function playErrorSound() {
  const context = getAudioContext();
  const now = context.currentTime;
  playTone(311.13, now, 0.16, 'square');
  playTone(233.08, now + 0.14, 0.26, 'square');
}

export function playConfirmSound() {
  const context = getAudioContext();
  playTone(880, context.currentTime, 0.1);
}
