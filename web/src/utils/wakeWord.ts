import { normalizeSpeech } from './voiceCommands';

const WAKE_WORDS = [
  'алан',
  'алам',
  'ален',
  'алян',
  'алын',
  'алаң',
  'аллан',
  'алана',
  'алане',
  'алон',
  'олан',
  'улан',
  'alan',
  'allen',
  'allan',
  'alen',
  'alyan',
  'alon',
  'allon',
  'ellen',
  'alyn',
  'ulan',
];

export function containsWakeWord(transcript: string) {
  const text = normalizeSpeech(transcript);
  if (!text) {
    return false;
  }

  const tokens = text.split(' ');
  const compact = tokens.join('');

  return WAKE_WORDS.some((word) => tokens.includes(word) || compact.includes(word));
}
